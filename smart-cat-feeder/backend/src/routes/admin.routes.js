const express = require("express");
const router = express.Router();
const db = require("../config/db");
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");

// 🧪 health check
router.get("/health", auth, isAdmin, (req, res) => {
  res.json({ status: "admin ok" });
});

// 👥 all users
router.get("/users", auth, isAdmin, (req, res) => {
  db.query(
    "SELECT id, name, email, role FROM users",
    (err, r) => {
      if (err) {
        console.error("Load users error:", err);
        return res.status(500).json(err);
      }
      res.json(r);
    }
  );
});

// 👤 USER DETAIL
router.get("/users/:id", auth, isAdmin, (req, res) => {
  const userId = req.params.id;
  const result = {};

  // 1️⃣ user info
  db.query(
    "SELECT id, name, email, role FROM users WHERE id=?",
    [userId],
    (err, u) => {
      if (err) {
        console.error("User query error:", err);
        return res.status(500).json(err);
      }
      if (!u[0]) {
        return res.status(404).json({ message: "User not found" });
      }

      result.user = u[0];

      // 2️⃣ cat
      db.query(
        "SELECT * FROM cats WHERE user_id=?",
        [userId],
        (err, c) => {
          if (err) {
            console.error("Cat query error:", err);
            return res.status(500).json(err);
          }
          result.cat = c[0] || null;

          // 3️⃣ today summary
          db.query(
            `SELECT IFNULL(SUM(amount),0) AS total_today
             FROM feeding_logs
             WHERE user_id=? AND DATE(created_at)=CURDATE()`,
            [userId],
            (err, t) => {
              if (err) {
                console.error("Today summary error:", err);
                return res.status(500).json(err);
              }
              result.today = t[0];

              // 4️⃣ week summary
              db.query(
                `SELECT IFNULL(SUM(amount),0) AS total_week
                 FROM feeding_logs
                 WHERE user_id=?
                 AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
                [userId],
                (err, w) => {
                  if (err) {
                    console.error("Week summary error:", err);
                    return res.status(500).json(err);
                  }
                  result.week = w[0];

                  // 5️⃣ logs
                  db.query(
                    `SELECT amount, mode, created_at
                     FROM feeding_logs
                     WHERE user_id=?
                     ORDER BY created_at DESC
                     LIMIT 50`,
                    [userId],
                    (err, l) => {
                      if (err) {
                        console.error("Logs query error:", err);
                        return res.status(500).json(err);
                      }
                      result.logs = l;

                      // 6️⃣ schedule ✅ FIXED (ตรง schema จริง)
                      db.query(
                        `SELECT hour, minute, amount
                         FROM feeding_schedule
                         WHERE user_id=?
                         ORDER BY hour, minute`,
                        [userId],
                        (err, s) => {
                          if (err) {
                            console.error("Schedule query error:", err);
                            return res.status(500).json(err);
                          }

                          result.schedule = s;
                          res.json(result);
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
});

// 🗑 delete user
router.delete("/users/:id", auth, isAdmin, (req, res) => {
  db.query(
    "DELETE FROM users WHERE id=?",
    [req.params.id],
    err => {
      if (err) {
        console.error("Delete user error:", err);
        return res.status(500).json(err);
      }
      res.json({ message: "User deleted" });
    }
  );
});

// 📝 UPDATE USER & CAT DATA (Admin)
router.patch("/users/:id", auth, isAdmin, (req, res) => {
  const userId = req.params.id;
  const { name, email, role, cat_name, age_month, weight, food_type } = req.body;

  db.beginTransaction((err) => {
    if (err) return res.status(500).json(err);

    // 1️⃣ Update User
    db.query(
      "UPDATE users SET name=?, email=?, role=? WHERE id=?",
      [name, email, role, userId],
      (err) => {
        if (err) {
          return db.rollback(() => res.status(500).json(err));
        }

        // 2️⃣ Update Cat (upsert-like logic: check then update or insert)
        db.query("SELECT id FROM cats WHERE user_id=?", [userId], (err, cats) => {
          if (err) return db.rollback(() => res.status(500).json(err));

          const catQuery = cats.length > 0
            ? "UPDATE cats SET name=?, age_month=?, weight=?, food_type=? WHERE user_id=?"
            : "INSERT INTO cats (name, age_month, weight, food_type, user_id) VALUES (?, ?, ?, ?, ?)";

          db.query(catQuery, [cat_name, age_month, weight, food_type, userId], (err) => {
            if (err) return db.rollback(() => res.status(500).json(err));

            // 3️⃣ Create Notification for user
            const msg = `ข้อมูลโปรไฟล์ของคุณถูกแก้ไขโดยผู้ดูแลระบบ`;
            db.query(
              "INSERT INTO notifications (user_id, message, type) VALUES (?, ?, 'SYSTEM_UPDATE')",
              [userId, msg],
              (err) => {
                if (err) return db.rollback(() => res.status(500).json(err));

                db.commit((err) => {
                  if (err) return db.rollback(() => res.status(500).json(err));

                  // Optional: emit socket event if io is available
                  const io = req.app.get("socketio");
                  if (io) {
                    io.to(`user:${userId}`).emit("new-notification", { message: msg });
                  }

                  res.json({ message: "User updated successfully" });
                });
              }
            );
          });
        });
      }
    );
  });
});

module.exports = router;
