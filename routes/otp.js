const express = require("express");
const crypto = require("crypto");

const router = express.Router();

// Temporary OTP storage
const otpStore = new Map();

// Generate OTP
router.post("/send", (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({
            success: false,
            message: "userId is required"
        });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();

    otpStore.set(String(userId), {
        otp,
        expiresAt: Date.now() + 5 * 60 * 1000
    });

    // Demo purpose only: OTP response mein dikhega
    return res.json({
        success: true,
        message: "Demo OTP generated successfully",
        demoOTP: otp,
        expiresInSeconds: 300
    });
});

// Verify OTP
router.post("/verify", (req, res) => {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
        return res.status(400).json({
            success: false,
            message: "userId and otp are required"
        });
    }

    const record = otpStore.get(String(userId));

    if (!record) {
        return res.status(400).json({
            success: false,
            message: "OTP not found. Generate a new OTP."
        });
    }

    if (Date.now() >= record.expiresAt) {
        otpStore.delete(String(userId));

        return res.status(400).json({
            success: false,
            message: "OTP expired"
        });
    }

    if (String(otp) !== record.otp) {
        return res.status(400).json({
            success: false,
            message: "Invalid OTP"
        });
    }

    otpStore.delete(String(userId));

    return res.json({
        success: true,
        message: "OTP verified successfully",
        verified: true
    });
});

module.exports = router;
