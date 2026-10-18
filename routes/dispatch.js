  const express = require("express");
const router = express.Router();

const DriverDispatchService = require("../service/DriverDispatchService");
const OfflineSyncService = require("../service/OfflineSyncService");

const dispatchService = new DriverDispatchService();
const syncService = new OfflineSyncService();

// Temporary in-memory ride storage
const rides = new Map();

// Test dispatch API
router.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Dispatch API is working"
    });
});

// Register a driver
router.post("/drivers", (req, res) => {
    const { driverId, latitude, longitude } = req.body;

    if (
        driverId === undefined ||
        latitude === undefined ||
        longitude === undefined
    ) {
        return res.status(400).json({
            success: false,
            message: "driverId, latitude and longitude are required"
        });
    }

    const added = dispatchService.addDriver(
        driverId,
        Number(latitude),
        Number(longitude)
    );

    if (!added) {
        return res.status(400).json({
            success: false,
            message: "Invalid driver details or coordinates"
        });
    }

    return res.status(201).json({
        success: true,
        message: "Driver registered successfully",
        driver: {
            driverId,
            latitude: Number(latitude),
            longitude: Number(longitude),
            available: true
        }
    });
});

// Get all available drivers
router.get("/drivers", (req, res) => {
    return res.json({
        success: true,
        drivers: dispatchService.getAvailableDrivers()
    });
});

// Driver online/offline status
router.patch("/drivers/:driverId/availability", (req, res) => {
    const { driverId } = req.params;
    const { available } = req.body;

    if (typeof available !== "boolean") {
        return res.status(400).json({
            success: false,
            message: "available must be true or false"
        });
    }

    const updated = dispatchService.setDriverAvailability(
        driverId,
        available
    );

    if (!updated) {
        return res.status(404).json({
            success: false,
            message: "Driver not found"
        });
    }

    return res.json({
        success: true,
        message: available
            ? "Driver is now online"
            : "Driver is now offline",
        driverId,
        available
    });
});

// Update driver location
router.put("/drivers/:driverId/location", (req, res) => {
    const { driverId } = req.params;
    const { latitude, longitude } = req.body;

    if (
        latitude === undefined ||
        longitude === undefined
    ) {
        return res.status(400).json({
            success: false,
            message: "latitude and longitude are required"
        });
    }

    const updated = dispatchService.updateDriverLocation(
        driverId,
        Number(latitude),
        Number(longitude)
    );

    if (!updated) {
        return res.status(400).json({
            success: false,
            message: "Driver not found or coordinates are invalid"
        });
    }

    return res.json({
        success: true,
        message: "Driver location updated successfully",
        driver: {
            driverId,
            latitude: Number(latitude),
            longitude: Number(longitude)
        }
    });
});

// Create ride request and assign a nearby available driver
router.post("/rides", (req, res) => {
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

    if (rides.has(rideId)) {
        return res.status(409).json({
            success: false,
            message: "Ride ID already exists"
        });
    }

    const pickupPoint = {
        latitude: Number(pickup.latitude),
        longitude: Number(pickup.longitude)
    };

    const dropoffPoint = {
        latitude: Number(dropoff.latitude),
        longitude: Number(dropoff.longitude)
    };

    const nearbyDrivers = dispatchService.findNearbyDrivers(
        pickupPoint.latitude,
        pickupPoint.longitude,
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

    rides.set(rideId, ride);

    syncService.addToQueue({
        type: "RIDE_REQUEST",
        ...ride
    });

    return res.status(201).json({
        success: true,
        message: ride.driverId
            ? "Ride assigned to a nearby driver"
            : "Ride saved; no nearby driver is currently available",
        ride
    });
});

// Get ride details
router.get("/rides/:rideId", (req, res) => {
    const ride = rides.get(req.params.rideId);

    if (!ride) {
        return res.status(404).json({
            success: false,
            message: "Ride not found"
        });
    }

    return res.json({
        success: true,
        ride
    });
});

// Driver accepts or rejects an assigned ride
router.patch("/rides/:rideId/respond", (req, res) => {
    const { rideId } = req.params;
    const { driverId, action } = req.body;

    const ride = rides.get(rideId);

    if (!ride) {
        return res.status(404).json({
            success: false,
            message: "Ride not found"
        });
    }

    if (ride.driverId !== driverId) {
        return res.status(403).json({
            success: false,
            message: "This ride is not assigned to this driver"
        });
    }

    if (ride.status !== "ASSIGNED") {
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

    if (action === "accept") {
        ride.status = "ACCEPTED";
    } else {
        ride.status = "REJECTED";
        ride.driverId = null;
    }

    rides.set(rideId, ride);

    return res.json({
        success: true,
        message: action === "accept"
            ? "Ride accepted successfully"
            : "Ride rejected",
        ride
    });
});

// Offline Sync API
router.post("/sync", (req, res) => {
    return res.json(syncService.syncData());
});

module.exports = router;
