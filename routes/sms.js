
const express = require("express");
const router = express.Router();
const OfflineSyncService = require("../service/OfflineSyncService");

const syncService = new OfflineSyncService();
const smsHistory = [];

// Receive and decode an SMS webhook
router.post("/webhook", (req, res) => {
    const { payload } = req.body;

    if (typeof payload !== "string" || !payload.trim()) {
        return res.status(400).json({
            success: false,
            message: "Valid Base64 SMS payload is required"
        });
    }

    const decodedBuffer = Buffer.from(payload, "base64");

    if (
        decodedBuffer.toString("base64").replace(/=+$/, "") !==
        payload.replace(/\s/g, "").replace(/=+$/, "")
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid Base64 payload"
        });
    }

    const message = decodedBuffer.toString("utf8");

    if (message.length > 160) {
        return res.status(400).json({
            success: false,
            message: "SMS length exceeds 160 characters"
        });
    }

    const item = syncService.addToQueue({
        type: "SMS",
        message
    });

    const sms = {
        id: item.id,
        message,
        status: "QUEUED",
        attempts: 0,
        createdAt: item.timestamp
    };

    smsHistory.push(sms);

    return res.status(201).json({
        success: true,
        message: "Demo SMS received and queued",
        sms
    });
});

// Simulate sending an SMS; no real SMS is sent
router.post("/send", (req, res) => {
    const { recipient, message, simulateFailure = false } = req.body;

    if (
        typeof recipient !== "string" ||
        !recipient.trim() ||
        typeof message !== "string" ||
        !message.trim()
    ) {
        return res.status(400).json({
            success: false,
            message: "Recipient and message are required"
        });
    }

    if (message.length > 160) {
        return res.status(400).json({
            success: false,
            message: "SMS length exceeds 160 characters"
        });
    }

    const item = syncService.addToQueue({
        type: "SMS",
        recipient,
        message
    });

    const sms = {
        id: item.id,
        recipient,
        message,
        status: simulateFailure === true ? "FAILED" : "SENT",
        attempts: 0,
        createdAt: item.timestamp
    };

    if (simulateFailure === true) {
        sms.error = "Simulated delivery failure";
    } else {
        sms.sentAt = new Date().toISOString();
        syncService.markAsSynced(item.id);
    }

    smsHistory.push(sms);

    return res.json({
        success: sms.status === "SENT",
        message: sms.status === "SENT"
            ? "Demo SMS sent successfully; no real SMS was sent"
            : "Demo SMS failed intentionally",
        sms
    });
});

// Get SMS history
router.get("/history", (req, res) => {
    return res.json({
        success: true,
        count: smsHistory.length,
        messages: smsHistory
    });
});

// Get SMS status
router.get("/status/:id", (req, res) => {
    const sms = smsHistory.find(
        item => item.id === Number(req.params.id)
    );

    if (!sms) {
        return res.status(404).json({
            success: false,
            message: "SMS not found"
        });
    }

    return res.json({
        success: true,
        sms
    });
});

// Retry a failed demo SMS
router.post("/retry/:id", (req, res) => {
    const sms = smsHistory.find(
        item => item.id === Number(req.params.id)
    );

    if (!sms) {
        return res.status(404).json({
            success: false,
            message: "SMS not found"
        });
    }

    if (sms.status !== "FAILED") {
        return res.status(400).json({
            success: false,
            message: "Only failed SMS can be retried"
        });
    }

    const item = syncService.getById(sms.id);

    if (!item) {
        return res.status(409).json({
            success: false,
            message: "SMS queue entry not found"
        });
    }

    syncService.retryItem(sms.id);

    sms.attempts += 1;
    sms.status = "SENT";
    sms.sentAt = new Date().toISOString();
    delete sms.error;

    syncService.markAsSynced(sms.id);

    return res.json({
        success: true,
        message: "Demo retry succeeded; no real SMS was sent",
        sms
    });
});

// Inspect the queue
router.get("/queue", (req, res) => {
    return res.json({
        success: true,
        queue: syncService.getAllData()
    });
});

// Simulate offline queue synchronization
router.post("/sync", (req, res) => {
    const result = syncService.syncData();

    for (const item of syncService.getAllData()) {
        const sms = smsHistory.find(
            record => record.id === item.id
        );

        if (sms && item.status === "SENT" && sms.status === "QUEUED") {
            sms.status = "SENT";
            sms.sentAt = item.syncedAt || new Date().toISOString();
        }
    }

    return res.json(result);
});

module.exports = router;
