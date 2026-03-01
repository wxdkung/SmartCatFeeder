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
        process.exit(1);
    }

    console.log("--- Schema: cats ---");
    db.query("DESCRIBE cats", (err, r) => {
        console.table(r);

        console.log("--- Schema: cat_status ---");
        db.query("DESCRIBE cat_status", (err, r2) => {
            console.table(r2);
            db.end();
        });
    });
});
