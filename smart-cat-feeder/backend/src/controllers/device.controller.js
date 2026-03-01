const db = require("../config/db");

// 1️⃣ ESP32 ขอคำสั่ง
exports.getCommand = (req, res) => {
  db.query(
    "SELECT id, amount FROM feeding_logs WHERE mode='manual' AND created_at >= NOW() - INTERVAL 1 MIN ORDER BY created_at DESC LIMIT 1",
    (err, r) => {
      if (err) return res.status(500).json(err);
      if (r.length === 0) return res.json({ command: "idle" });

      res.json({
        command: "feed",
        amount: r[0].amount
      });
    }
  );
};

// 2️⃣ ESP32 ส่ง log
exports.postLog = (req, res) => {
  const { user_id, amount, mode } = req.body;

  db.query(
    "INSERT INTO feeding_logs (user_id, amount, mode) VALUES (?,?,?)",
    [user_id, amount, mode],
    err => {
      if (err) return res.status(500).json(err);
      res.json({ status: "logged" });
    }
  );
};

// 3️⃣ ESP32 ส่งน้ำหนักจริง
exports.postWeight = (req, res) => {
  const { user_id, weight } = req.body;

  db.query(
    "UPDATE cat_status SET weight=? WHERE user_id=?",
    [weight, user_id],
    err => {
      if (err) return res.status(500).json(err);
      res.json({ status: "weight updated" });
    }
  );
};
const { publishMessage } = require("../services/mqttService");

// 4️⃣ Pairing Mode (Discovery)
exports.pairDevice = (req, res) => {
  const { chipId } = req.body;
  const userId = req.user.id; // From auth middleware

  if (!chipId) {
    return res.status(400).json({ message: "กรุณาระบุ Chip ID ของอุปกรณ์" });
  }

  const topic = "device/discovery";
  const payload = {
    chipId: String(chipId),
    userId: String(userId)
  };

  publishMessage(topic, payload);

  res.json({
    message: "ส่งคำสั่งจับคู่แล้ว กรุณารออุปกรณ์ตอบรับ",
    details: payload
  });
};
