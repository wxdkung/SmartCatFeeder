const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบ" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "รูปแบบอีเมลไม่ถูกต้อง" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "รหัสผ่านต้องอย่างน้อย 6 ตัว" });
  }

  const hash = await bcrypt.hash(password, 10);

  db.query(
    "INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)",
    [name, email, hash, "user"],
    err => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({ message: "อีเมลนี้ถูกใช้แล้ว" });
        }
        return res.status(500).json(err);
      }
      res.json({ message: "Register success" });
    }
  );
};

exports.login = (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email=?",
    [email],
    async (err, result) => {
      if (err) return res.status(500).json(err);
      if (result.length === 0)
        return res.status(404).json({ message: "User not found" });

      const user = result[0];
      const match = await bcrypt.compare(password, user.password);

      if (!match)
        return res.status(401).json({ message: "Wrong password" });

      const token = jwt.sign(
        { id: user.id, role: user.role },
        "secret123",
        { expiresIn: "1d" }
      );

      res.json({ token });
    }
  );
};

exports.me = (req, res) => {
  db.query(
    "SELECT id,name,email,role FROM users WHERE id=?",
    [req.user.id],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result[0]);
    }
  );
};
