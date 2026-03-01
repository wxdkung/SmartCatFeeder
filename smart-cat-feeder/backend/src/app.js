const express = require("express");
const cors = require("cors");

// cron auto feeding
require("./cron/feeding.cron");

// routes
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const adminRoutes = require("./routes/admin.routes");
const deviceRoutes = require("./routes/device.routes");
const sensorRoutes = require("./routes/sensor.routes"); // ✅ เพิ่ม

const http = require("http");
const { Server } = require("socket.io");
const { connectMQTT } = require("./services/mqttService");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for now (adjust for production)
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// ... (routes remain the same)
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/device", deviceRoutes);
app.use("/api/sensor", sensorRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("Smart Cat Feeder API running");
});

// Start MQTT Connection
connectMQTT(io);

const PORT = 5000;
server.listen(PORT, () => {
  console.log("Backend running on port", PORT);
});
