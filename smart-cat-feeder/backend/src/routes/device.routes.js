const express = require("express");
const router = express.Router();
const db = require("../config/db");
const deviceAuth = require("../middleware/deviceAuth");

/**
 * 🧠 NOTE
 * demo นี้ผูก device กับ user_id = 8 (User demo)
 * วันหลังค่อยแยก table devices
 */
const DEMO_USER_ID = 8;

/**
 * 📊 GET /api/device/today
 * ESP32 ดึงยอดอาหารวันนี้
 */
router.get("/today", deviceAuth, (req, res) => {
  db.query(
    `SELECT IFNULL(SUM(amount),0) AS total
     FROM feeding_logs
     WHERE user_id=? AND DATE(created_at)=CURDATE()`,
    [DEMO_USER_ID],
    (err, r) => {
      if (err) return res.status(500).json(err);
      res.json({ total: r[0].total });
    }
  );
});

/**
 * 🍽️ GET /api/device/command
 * เช็คว่ามีคำสั่ง Feed Now ไหม
 * (ใช้ schedule table แบบ manual trigger)
 */
router.get("/command", deviceAuth, (req, res) => {
  db.query(
    `SELECT id, amount
     FROM feeding_schedule
     WHERE user_id=?
       AND active=2
     LIMIT 1`,
    [DEMO_USER_ID],
    (err, r) => {
      if (err) return res.status(500).json(err);

      if (r.length === 0) {
        return res.json({ feed: false });
      }

      const cmd = r[0];

      // ❌ ป้องกัน feed ซ้ำ → ปิด active
      db.query(
        "UPDATE feeding_schedule SET active=0 WHERE id=?",
        [cmd.id]
      );

      res.json({
        feed: true,
        amount: cmd.amount
      });
    }
  );
});

/**
 * 📝 POST /api/device/log
 * รับ log จาก ESP32
 */
router.post("/log", deviceAuth, (req, res) => {
  const { amount, mode, status } = req.body;

  if (!amount || !mode) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  db.query(
    `INSERT INTO feeding_logs (user_id, amount, mode)
     VALUES (?,?,?)`,
    [DEMO_USER_ID, amount, mode],
    err => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Log saved" });
    }
  );
});

module.exports = router;
