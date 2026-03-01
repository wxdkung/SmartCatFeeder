const express = require("express");
const router = express.Router();
const db = require("../config/db");
const auth = require("../middleware/auth"); // ✅ แก้ตรงนี้
const controller = require("../controllers/auth.controller");

// REGISTER
router.post("/register", controller.register);

// LOGIN
router.post("/login", controller.login);

// GET ME
router.get("/me", auth, controller.me);

module.exports = router;
