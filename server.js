 const express = require("express");

const app = express();

const dispatchRoutes = require("./routes/dispatch");
const smsRoutes = require("./routes/sms");
const otpRoutes = require("./routes/otp");
const paymentRoutes = require("./routes/payment");

app.use(express.json());

app.use("/api/v1/dispatch", dispatchRoutes);
app.use("/api/v1/sms", smsRoutes);
app.use("/api/v1/otp", otpRoutes);
app.use("/api/v1/payment", paymentRoutes);

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Ride Safety Backend is running"
    });
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
