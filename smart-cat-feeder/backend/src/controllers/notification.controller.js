const db = require("../config/db");

/* ===============================
 📥 ดึง notification ล่าสุด (ทั้งหมด)
 ใช้กับหน้า notification เต็ม ๆ
================================ */
exports.getNotifications = (req, res) => {
  db.query(
    `SELECT * FROM notifications
     WHERE user_id=?
     ORDER BY created_at DESC
     LIMIT 20`,
    [req.user.id],
    (err, r) => {
      if (err) return res.status(500).json(err);
      res.json(r);
    }
  );
};

/* ===============================
 🔔 ดึง notification ที่ยังไม่อ่าน
 ใช้โชว์ badge บน Navbar
================================ */
exports.getUnreadNotifications = (req, res) => {
  db.query(
    `SELECT * FROM notifications
     WHERE user_id=? AND is_read=0
     ORDER BY created_at DESC`,
    [req.user.id],
    (err, r) => {
      if (err) return res.status(500).json(err);
      res.json(r);
    }
  );
};

/* ===============================
 ➕ เพิ่ม notification (ใช้ภายในระบบ)
================================ */
exports.createNotification = (user_id, type, message) => {
  db.query(
    `INSERT INTO notifications (user_id, type, message)
     VALUES (?,?,?)`,
    [user_id, type, message],
    err => {
      if (err) console.error("Notification error:", err);
    }
  );
};

/* ===============================
 ⚠️ แจ้งเตือนอาหารใกล้หมดจาก Load Cell
 เรียกจาก sensor / feeder controller
================================ */
/* ==============================================
 🥣 [BOWL] แจ้งเตือนเมื่ออาหารในจานใกล้หมด (Weight)
 =============================================== */
exports.notifyBowlLow = (user_id, weight, onNotify) => {
  if (weight >= 5) return;

  db.query(
    `SELECT id FROM notifications 
     WHERE user_id=? AND type='BOWL_LOW' AND is_read=0 
     LIMIT 1`,
    [user_id],
    (err, r) => {
      if (err) return console.error(err);
      if (r.length === 0) {
        db.query(
          `INSERT INTO notifications (user_id, type, message) VALUES (?,?,?)`,
          [user_id, "BOWL_LOW", "⚠️ อาหารในจานใกล้หมดแล้ว (Bowl is empty)"],
          err => {
            if (err) console.error("Bowl low notify error:", err);
            else if (onNotify) onNotify();
          }
        );
      }
    }
  );
};

/* ==============================================
 🥣 [BOWL] แจ้งเตือนเมื่อเติมอาหารลงจาน (Refilled Bowl)
 =============================================== */
exports.notifyBowlFull = (user_id, weight, onNotify) => {
  if (weight < 20) return;

  db.query(
    "SELECT weight FROM cat_status WHERE user_id=?",
    [user_id],
    (err, r) => {
      if (err || r.length === 0) return;
      const prevWeight = r[0].weight;

      if (prevWeight < 5) {
        db.query(
          `INSERT INTO notifications (user_id, type, message) VALUES (?,?,?)`,
          [user_id, "BOWL_FULL", `✅ เติมอาหารลงจานเรียบร้อย! (${weight}g)`],
          err => {
            if (err) console.error("Bowl full notify error:", err);
            else if (onNotify) onNotify();
          }
        );
      }
    }
  );
};

/* ==============================================
 📦 [TANK] แจ้งเตือนเมื่ออาหารในถังใกล้หมด (Ultrasonic)
 =============================================== */
exports.notifyTankLow = (user_id, level, onNotify) => {
  if (level > 15) return;

  db.query(
    `SELECT id FROM notifications 
     WHERE user_id=? AND type='TANK_LOW' AND is_read=0 
     LIMIT 1`,
    [user_id],
    (err, r) => {
      if (err) return console.error(err);
      if (r.length === 0) {
        db.query(
          `INSERT INTO notifications (user_id, type, message) VALUES (?,?,?)`,
          [user_id, "TANK_LOW", "🚨 อาหารในถังพลาสติกใกล้หมดแล้ว! (กรุณาเติม)"],
          err => {
            if (err) console.error("Tank low notify error:", err);
            else if (onNotify) onNotify();
          }
        );
      }
    }
  );
};

/* ==============================================
 📦 [TANK] แจ้งเตือนเมื่อเติมอาหารลงถัง (Refilled Tank)
 =============================================== */
exports.notifyTankFull = (user_id, level, onNotify) => {
  if (level < 80) return;

  db.query(
    "SELECT tank_level FROM cat_status WHERE user_id=?",
    [user_id],
    (err, r) => {
      if (err || r.length === 0) return;
      const prevLevel = r[0].tank_level;

      if (prevLevel < 20) {
        db.query(
          `INSERT INTO notifications (user_id, type, message) VALUES (?,?,?)`,
          [user_id, "TANK_FULL", "✨ เติมอาหารใส่ถังเก็บเรียบร้อยแล้ว! (Tank Refilled)"],
          err => {
            if (err) console.error("Tank full notify error:", err);
            else if (onNotify) onNotify();
          }
        );
      }
    }
  );
};

/* ===============================
 🗑 ล้างการแจ้งเตือนทั้งหมด
 ================================ */
exports.clearAllNotifications = (req, res) => {
  db.query(
    "DELETE FROM notifications WHERE user_id=?",
    [req.user.id],
    err => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Notifications cleared" });
    }
  );
};

/* ===============================
 ✔ mark notification as read
================================ */
exports.markAsRead = (req, res) => {
  const { id } = req.params;

  db.query(
    `UPDATE notifications SET is_read=1
     WHERE id=? AND user_id=?`,
    [id, req.user.id],
    err => {
      if (err) return res.status(500).json(err);
      res.json({ message: "marked as read" });
    }
  );
};
