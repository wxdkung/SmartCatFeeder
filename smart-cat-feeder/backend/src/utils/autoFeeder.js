const db = require("../config/db");

module.exports = () => {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();

  db.query(
    `SELECT * FROM feeding_schedule
     WHERE hour=? AND minute=? AND active=1`,
    [hour, minute],
    (err, schedules) => {
      if (err || schedules.length === 0) return;

      schedules.forEach(s => {
        db.query(
          `INSERT INTO feeding_logs (user_id,amount,mode)
           VALUES (?,?, 'schedule')`,
          [s.user_id, s.amount]
        );
      });
    }
  );
};
