const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const userController = require("../controllers/user.controller");
const deviceController = require("../controllers/device.controller");
const notificationController = require("../controllers/notification.controller");

// 🐱 Cat profile
router.get("/cat", auth, userController.getCatProfile);
router.post("/cat", auth, userController.saveCatProfile);

// 📱 Device Pairing
router.post("/device/pair", auth, deviceController.pairDevice);

// 🍽 Feed cat (manual / auto)
router.post("/feed", auth, userController.feedCat);

// ⏰ Feeding schedule
router.post("/schedule", auth, userController.addFeedingSchedule);
router.get("/schedule", auth, userController.getFeedingSchedule);
router.delete(
  "/schedule/:id",
  auth,
  userController.deleteFeedingSchedule
);

// 📜 Feeding logs
router.get("/feed/logs", auth, userController.getFeedingLogs);

// 📊 Today summary
router.get("/feed/today", auth, userController.todaySummary);

// 🔔 notifications
router.get("/notifications", auth, notificationController.getNotifications);
router.delete(
  "/notifications",
  auth,
  notificationController.clearAllNotifications
);
router.patch(
  "/notifications/:id/read",
  auth,
  notificationController.markAsRead
);

module.exports = router;
