const express = require("express");
const router = express.Router();

const payments = new Map();

router.post("/create", (req, res) => {
    const { rideId, userId, amount, method } = req.body;

    if (!rideId || !userId || amount == null || !method) {
        return res.status(400).json({
            success: false,
            message: "rideId, userId, amount and method are required"
        });
    }

    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
        return res.status(400).json({
            success: false,
            message: "Amount must be greater than zero"
        });
    }

    const paymentId = "PAY" + Date.now();

    const payment = {
        paymentId,
        rideId,
        userId,
        amount: Number(amount),
        method,
        status: "PENDING",
        message: "Demo payment created. No real money was transferred."
    };

    payments.set(paymentId, payment);

    return res.status(201).json({
        success: true,
        payment
    });
});

router.get("/:paymentId", (req, res) => {
    const payment = payments.get(req.params.paymentId);

    if (!payment) {
        return res.status(404).json({
            success: false,
            message: "Payment not found"
        });
    }

    return res.json({
        success: true,
        payment
    });
});

module.exports = router;
