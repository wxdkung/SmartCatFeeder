const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const sensorController = require("../controllers/sensor.controller");

// ESP32 ยิงน้ำหนักอาหารมา
router.post("/food-weight", auth, sensorController.updateFoodWeight);

// ดึงน้ำหนักล่าสุด
router.get("/current", auth, sensorController.getCurrentWeight);

module.exports = router;
