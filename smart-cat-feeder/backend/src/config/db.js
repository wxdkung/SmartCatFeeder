const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "smart_cat_feeder",
});

db.connect(err => {
  if (err) {
    console.log("❌ DB ERROR", err);
  } else {
    console.log("✅ MySQL Connected");
  }
});

module.exports = db;
