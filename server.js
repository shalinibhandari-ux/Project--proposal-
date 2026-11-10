 const express = require("express");
const cors = require("cors");

const { ready } = require("./database");

const app = express();

app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://localhost:5174"
    ]
}));

app.use(express.json());

const dispatchRoutes = require("./routes/dispatch");
const smsRoutes = require("./routes/sms");
const otpRoutes = require("./routes/otp");
const paymentRoutes = require("./routes/payment");

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

async function startServer() {
    try {
        await ready;

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Server startup failed:", error);
        process.exit(1);
    }
}

startServer();
