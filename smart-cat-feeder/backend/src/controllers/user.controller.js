const db = require("../config/db");
const { calculateNutrition } = require("../utils/nutrition");
const { createNotification } = require("./notification.controller");


/* ================= CAT PROFILE ================= */

exports.getCatProfile = (req, res) => {
  db.query(
    `SELECT c.*, s.weight as bowl_weight, s.tank_level as current_tank_level 
     FROM cats c 
     LEFT JOIN cat_status s ON c.user_id = s.user_id 
     WHERE c.user_id=?`,
    [req.user.id],
    (err, r) => {
      if (err) return res.status(500).json(err);
      if (!r[0]) return res.json(null);

      const cat = r[0];
      const nutrition = calculateNutrition(cat.age_month, cat.weight);

      res.json({
        ...cat,
        nutrition,
        status: {
          weight: cat.bowl_weight,
          tank_level: cat.current_tank_level
        }
      });
    }
  );
};

exports.saveCatProfile = (req, res) => {
  const { name, age_month, weight, food_type } = req.body;

  if (!name || !age_month || !weight) {
    return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบ" });
  }

  db.query(
    "SELECT id FROM cats WHERE user_id=?",
    [req.user.id],
    (err, r) => {
      if (err) return res.status(500).json(err);

      if (r.length === 0) {
        db.query(
          `INSERT INTO cats (user_id,name,age_month,weight,food_type)
           VALUES (?,?,?,?,?)`,
          [req.user.id, name, age_month, weight, food_type],
          err => {
            if (err) return res.status(500).json(err);

            // ✅ Initialize cat_status for new user
            db.query(
              "INSERT IGNORE INTO cat_status (user_id, weight, tank_level) VALUES (?, 0, 0)",
              [req.user.id],
              (err) => {
                if (err) console.error("❌ Failed to init cat_status:", err);
                res.json({ message: "Cat profile created and status initialized" });
              }
            );
          }
        );
      } else {
        db.query(
          `UPDATE cats
           SET name=?, age_month=?, weight=?, food_type=?
           WHERE user_id=?`,
          [name, age_month, weight, food_type, req.user.id],
          err => {
            if (err) return res.status(500).json(err);
            res.json({ message: "Cat profile updated" });
          }
        );
      }
    }
  );
};

const { publishMessage } = require("../services/mqttService");

/* ================= FEED CAT ================= */

exports.feedCat = (req, res) => {
  const { amount, mode = "manual" } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "จำนวนอาหารไม่ถูกต้อง" });
  }

  // 🚀 Trigger MQTT Command for real-time feeding
  const topic = `device/command/${req.user.id}`;
  publishMessage(topic, { amount, mode });

  createNotification(
    req.user.id,
    "feed",
    mode === "auto" || mode === "schedule"
      ? `🐱 ให้อาหารอัตโนมัติ ${amount} g`
      : `🐱 ให้อาหารด้วยตนเอง ${amount} g`
  );

  res.json({ message: "ให้อาหารสำเร็จ (MQTT Triggered)" });
};

/* ================= FEEDING LOG ================= */

exports.getFeedingLogs = (req, res) => {
  db.query(
    `SELECT amount, amount_eaten, mode, created_at
     FROM feeding_logs
     WHERE user_id=?
     ORDER BY created_at DESC`,
    [req.user.id],
    (err, r) => {
      if (err) return res.status(500).json(err);
      res.json(r);
    }
  );
};

/* ================= TODAY SUMMARY ================= */

exports.todaySummary = (req, res) => {
  db.query(
    `SELECT IFNULL(SUM(amount),0) AS total_today
     FROM feeding_logs
     WHERE user_id=?
     AND DATE(created_at)=CURDATE()`,
    [req.user.id],
    (err, r) => {
      if (err) return res.status(500).json(err);
      res.json(r[0]);
    }
  );
};

/* ================= FEEDING SCHEDULE ================= */

// ➕ ADD schedule
exports.addFeedingSchedule = (req, res) => {
  const { hour, minute, amount, date } = req.body;

  if (
    hour === undefined ||
    minute === undefined ||
    !amount
  ) {
    return res.status(400).json({ message: "ข้อมูลไม่ครบ" });
  }

  db.query(
    `INSERT INTO feeding_schedule (user_id, hour, minute, amount, scheduled_date)
     VALUES (?,?,?,?,?)`,
    [req.user.id, hour, minute, amount, date || null],
    err => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Schedule added" });
    }
  );
};

// 📥 GET schedule
exports.getFeedingSchedule = (req, res) => {
  db.query(
    `SELECT id, hour, minute, amount, scheduled_date
     FROM feeding_schedule
     WHERE user_id=? AND active=1
     ORDER BY hour, minute`,
    [req.user.id],
    (err, r) => {
      if (err) return res.status(500).json(err);
      res.json(r);
    }
  );
};

// DELETE schedule
exports.deleteFeedingSchedule = (req, res) => {
  const { id } = req.params;

  db.query(
    "DELETE FROM feeding_schedule WHERE id=? AND user_id=?",
    [id, req.user.id],
    err => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Schedule deleted" });
    }
  );
};
