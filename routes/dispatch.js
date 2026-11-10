  const express = require("express");
const router = express.Router();

const DriverDispatchService = require("../service/DriverDispatchService");
const OfflineSyncService = require("../service/OfflineSyncService");
const { db, ready } = require("../database");

const dispatchService = new DriverDispatchService();
const syncService = new OfflineSyncService();

const rides = new Map();

let driversLoaded = false;

// SQLite helper functions
function dbRun(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (error) {
            if (error) {
                reject(error);
            } else {
                resolve(this);
            }
        });
    });
}

function dbAll(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (error, rows) => {
            if (error) {
                reject(error);
            } else {
                resolve(rows);
            }
        });
    });
}

// Load saved drivers into the dispatch service
async function loadDrivers() {
    await ready;

    if (driversLoaded) return;

    const rows = await dbAll("SELECT * FROM drivers");

    for (const row of rows) {
        dispatchService.addDriver(
            row.driver_id,
            row.latitude,
            row.longitude,
            {
                name: row.name,
                phone: row.phone,
                vehicleType: row.vehicle_type,
                vehicleNumber: row.vehicle_number,
                experience: row.experience
            }
        );

        dispatchService.setDriverAvailability(
            row.driver_id,
            Boolean(row.available)
        );
    }

    driversLoaded = true;
}

// Test API
router.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Dispatch API is working"
    });
});

// Get registered drivers
router.get("/drivers", async (req, res) => {
    try {
        await loadDrivers();

        res.json({
            success: true,
            drivers: Array.from(dispatchService.drivers.values())
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

 // Register a ride and save it permanently in SQLite
router.post("/rides", async (req, res) => {
    try {
        await loadDrivers();

        const { rideId, pickup, dropoff } = req.body;

        if (
            !rideId ||
            !pickup ||
            !dropoff ||
            !Number.isFinite(Number(pickup.latitude)) ||
            !Number.isFinite(Number(pickup.longitude)) ||
            !Number.isFinite(Number(dropoff.latitude)) ||
            !Number.isFinite(Number(dropoff.longitude))
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid rideId, pickup and dropoff coordinates are required"
            });
        }

        const pickupLat = Number(pickup.latitude);
        const pickupLon = Number(pickup.longitude);
        const dropoffLat = Number(dropoff.latitude);
        const dropoffLon = Number(dropoff.longitude);

        if (
            pickupLat < -90 || pickupLat > 90 ||
            dropoffLat < -90 || dropoffLat > 90 ||
            pickupLon < -180 || pickupLon > 180 ||
            dropoffLon < -180 || dropoffLon > 180
        ) {
            return res.status(400).json({
                success: false,
                message: "Coordinates are outside valid ranges"
            });
        }

        // Check duplicate ride ID in SQLite
        const existingRide = await dbAll(
            "SELECT ride_id FROM rides WHERE ride_id = ?",
            [rideId]
        );

        if (existingRide.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Ride ID already exists"
            });
        }

        const pickupPoint = {
            latitude: pickupLat,
            longitude: pickupLon
        };

        const dropoffPoint = {
            latitude: dropoffLat,
            longitude: dropoffLon
        };

        // Find nearby drivers using QuadTree
        const nearbyDrivers = dispatchService.findNearbyDrivers(
            pickupLat,
            pickupLon,
            0.05
        );

        const ride = {
            rideId,
            pickup: pickupPoint,
            dropoff: dropoffPoint,
            driverId: nearbyDrivers.length > 0
                ? nearbyDrivers[0].driverId
                : null,
            status: nearbyDrivers.length > 0
                ? "ASSIGNED"
                : "WAITING_FOR_DRIVER",
            createdAt: new Date().toISOString()
        };

        // Save ride in SQLite
        await dbRun(
            `INSERT INTO rides
            (ride_id, pickup_latitude, pickup_longitude,
             dropoff_latitude, dropoff_longitude,
             status, assigned_driver_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                rideId,
                pickupLat,
                pickupLon,
                dropoffLat,
                dropoffLon,
                ride.status,
                ride.driverId
            ]
        );

        // Keep existing in-memory functionality
        rides.set(rideId, ride);

        syncService.addToQueue({
            type: "RIDE_REQUEST",
            ...ride
        });

        return res.status(201).json({
            success: true,
            message: ride.driverId
                ? "Ride assigned and saved successfully"
                : "Ride saved; no nearby driver is currently available",
            ride
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// Get ride details from SQLite
router.get("/rides/:rideId", async (req, res) => {
    try {
        const rows = await dbAll(
            "SELECT * FROM rides WHERE ride_id = ?",
            [req.params.rideId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Ride not found"
            });
        }

        const row = rows[0];

        const ride = {
            rideId: row.ride_id,
            pickup: {
                latitude: row.pickup_latitude,
                longitude: row.pickup_longitude
            },
            dropoff: {
                latitude: row.dropoff_latitude,
                longitude: row.dropoff_longitude
            },
            driverId: row.assigned_driver_id,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };

        rides.set(ride.rideId, ride);

        return res.json({
            success: true,
            ride
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// Accept or reject a ride and update SQLite
router.patch("/rides/:rideId/respond", async (req, res) => {
    try {
        const { rideId } = req.params;
        const { driverId, action } = req.body;

        const rows = await dbAll(
            "SELECT * FROM rides WHERE ride_id = ?",
            [rideId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Ride not found"
            });
        }

        const row = rows[0];

        if (row.assigned_driver_id !== driverId) {
            return res.status(403).json({
                success: false,
                message: "This ride is not assigned to this driver"
            });
        }

        if (row.status !== "ASSIGNED") {
            return res.status(409).json({
                success: false,
                message: "Ride is no longer awaiting a response"
            });
        }

        if (action !== "accept" && action !== "reject") {
            return res.status(400).json({
                success: false,
                message: "action must be accept or reject"
            });
        }

        const newStatus = action === "accept"
            ? "ACCEPTED"
            : "REJECTED";

        const newDriverId = action === "accept"
            ? driverId
            : null;

        await dbRun(
            `UPDATE rides
             SET status = ?,
                 assigned_driver_id = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE ride_id = ?`,
            [newStatus, newDriverId, rideId]
        );

        const ride = {
            rideId,
            pickup: {
                latitude: row.pickup_latitude,
                longitude: row.pickup_longitude
            },
            dropoff: {
                latitude: row.dropoff_latitude,
                longitude: row.dropoff_longitude
            },
            driverId: newDriverId,
            status: newStatus,
            createdAt: row.created_at
        };

        rides.set(rideId, ride);

        return res.json({
            success: true,
            message: action === "accept"
                ? "Ride accepted and saved successfully"
                : "Ride rejected and saved successfully",
            ride
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Offline sync API
router.post("/sync", (req, res) => {
    return res.json(syncService.syncData());
});

module.exports = router;
