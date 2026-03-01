const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const notificationController = require("../controllers/notification.controller");

router.get("/unread", auth, notificationController.getUnreadNotifications);
router.patch("/:id/read", auth, notificationController.markAsRead);

module.exports = router;
