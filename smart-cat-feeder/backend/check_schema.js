const mysql = require('mysql2');
require('dotenv').config({ path: 'src/.env' });

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'smart_cat_feeder'
});

db.query("DESC cat_status", (err, results) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.table(results);
    db.end();
});
