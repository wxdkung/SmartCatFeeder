const mysql = require("mysql2");
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "smart_cat_feeder",
});

db.connect(err => {
    if (err) {
        console.error("❌ DB ERROR", err);
        process.exit(1);
    }
    db.query("SELECT id, name, role FROM users", (err, r) => {
        if (err) {
            console.error(err);
        } else {
            console.log(JSON.stringify(r, null, 2));
        }
        db.end();
    });
});
