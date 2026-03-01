const cron = require("node-cron");
const db = require("../config/db");
const { publishMessage } = require("../services/mqttService");

// เช็คทุกนาที
cron.schedule("* * * * *", () => {
  const now = new Date();
  const time = now.toTimeString().slice(0, 5); // HH:mm

  db.query(
    `SELECT * FROM feeding_schedule 
     WHERE hour=? AND minute=? AND active=1 
     AND (scheduled_date IS NULL OR scheduled_date = CURDATE())`,
    [now.getHours(), now.getMinutes()],
    (err, schedules) => {
      if (err || schedules.length === 0) return;

      schedules.forEach(s => {
        // 🚀 Trigger MQTT Command for auto feeding
        const topic = `device/command/${s.user_id}`;
        publishMessage(topic, { amount: s.amount, mode: "schedule" });

        console.log(
          `🤖 Auto feed user ${s.user_id} ${s.amount}g via cron at ${time}`
        );
      });
    }
  );
});
