const express = require("express");

const app = express();

const dispatchRoutes = require("./routes/dispatch");
const smsRoutes = require("./routes/sms");

app.use(express.json());

app.use("/api/v1/dispatch", dispatchRoutes);
app.use("/api/v1/sms", smsRoutes);

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