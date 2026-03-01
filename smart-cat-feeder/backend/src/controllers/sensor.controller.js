const db = require("../config/db");
const {
  createNotification,
} = require("./notification.controller");

/**
 * ESP32 ส่งน้ำหนักอาหารเข้ามา
 * body: { weight: number }
 */
exports.updateFoodWeight = (req, res) => {
  const { weight } = req.body;
  const userId = req.user.id;

  if (weight === undefined) {
    return res.status(400).json({ message: "weight is required" });
  }

  // 🔴 น้ำหนักอาหารต่ำกว่า 2 กรัม
  if (weight < 2) {
    // กัน spam: เช็คว่ายังมีแจ้งเตือน FOOD_LOW ที่ยังไม่อ่านไหม
    db.query(
      `SELECT id FROM notifications
       WHERE user_id=? AND type='FOOD_LOW' AND is_read=0
       LIMIT 1`,
      [userId],
      (err, r) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "db error" });
        }

        // ถ้ายังไม่เคยแจ้ง → แจ้ง
        if (r.length === 0) {
          createNotification(
            userId,
            "FOOD_LOW",
            "⚠️ อาหารแมวใกล้หมดแล้ว (ต่ำกว่า 2 กรัม)"
          );
        }
      }
    );
  }

  res.json({ success: true });
};

/**
 * ดึงน้ำหนักปัจจุบัน
 */
exports.getCurrentWeight = (req, res) => {
  const userId = req.user.id;
  db.query(
    "SELECT weight, tank_level FROM cat_status WHERE user_id=?",
    [userId],
    (err, r) => {
      if (err) return res.status(500).json(err);
      res.json({
        weight: r[0] ? r[0].weight : 0,
        level: r[0] ? r[0].tank_level : 0
      });
    }
  );
};
