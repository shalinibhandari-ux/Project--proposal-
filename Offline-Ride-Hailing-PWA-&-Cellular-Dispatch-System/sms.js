const express = require("express");
const router = express.Router();
const OfflineSyncService = require("../service/OfflineSyncService");
const syncService = new OfflineSyncService();

router.post("/webhook", function (req, res) {
    const payload = req.body.payload;

    if (!payload || typeof payload !== "string") {
        return res.status(400).json({
            success: false,
            message: "Valid SMS payload is required"
        });
    }

    const decodedMessage = Buffer.from(payload, "base64").toString("utf8");

    if (decodedMessage.length > 160) {
        return res.status(400).json({
            success: false,
            message: "SMS length exceeds 160 characters"
        });
    }

    syncService.addToQueue({
        type: "SMS",
        message: decodedMessage
    });

    return res.json({
        success: true,
        message: "SMS received, decoded and added to offline queue",
        sms: decodedMessage
    });
});

module.exports = router;
