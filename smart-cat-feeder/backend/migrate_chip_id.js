const mysql = require('mysql2');
const db = require('./src/config/db');

db.query("ALTER TABLE cat_status ADD COLUMN chip_id VARCHAR(50)", (err, results) => {
    if (err) {
        if (err.code === 'ER_DUP_COLUMN_NAME') {
            console.log("✅ Column chip_id already exists.");
            process.exit(0);
        }
        console.error(err);
        process.exit(1);
    }
    console.log("✅ Column chip_id added successfully.");
    db.end();
});
