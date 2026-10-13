 const express = require("express");

const router = express.Router();

const DriverDispatchService = require("../service/DriverDispatchService");
const OfflineSyncService = require("../service/OfflineSyncService");

const dispatchService = new DriverDispatchService();
const syncService = new OfflineSyncService();


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

    dispatchService.addDriver(
        driverId,
        latitude,
        longitude
    );

    res.json({
        success: true,
        message: "Driver added successfully",
        driver: {
            driverId,
            latitude,
            longitude
        }
    });
});


// Receive a ride request
router.post("/rides", (req, res) => {
    const { rideId, pickup, dropoff } = req.body;

    if (!rideId || !pickup || !dropoff) {
        return res.status(400).json({
            success: false,
            message: "rideId, pickup and dropoff are required"
        });
    }

    const nearbyDrivers = dispatchService.findNearbyDrivers(
        pickup.latitude,
        pickup.longitude,
        50
    );

    syncService.addToQueue({
        type: "RIDE_REQUEST",
        rideId,
        pickup,
        dropoff
    });

    res.json({
        success: true,
        message: "Ride request received",
        ride: {
            rideId,
            pickup,
            dropoff
        },
        nearbyDrivers
    });
});

module.exports = router;