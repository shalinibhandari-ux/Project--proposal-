const express = require("express");

const router = express.Router();

const OfflineSyncService = require("../service/OfflineSyncService");

const syncService = new OfflineSyncService();

// SMS webhook endpoint
router.post("/webhook", (req, res) => {
    const { payload } = req.body;

    if (typeof payload !== "string" || payload.length === 0) {
        return res.status(400).json({
            success: false,
            message: "SMS payload is required"
        });
    }

    // Decode Base64 SMS payload
    const decodedMessage = Buffer
        .from(payload, "base64")
        .toString("utf-8");

    // Validate SMS length before adding to queue
    if (decodedMessage.length > 160) {
        return res.status(400).json({
            success: false,
            message: "SMS length exceeds 160 characters"
        });
    }

    // Add valid SMS to offline queue
    syncService.addToQueue({
        type: "SMS",
        message: decodedMessage
    });

    return res.json({
        success: true,
        message: "SMS received and decoded",
        sms: decodedMessage
    });
});

module.exports = router;
