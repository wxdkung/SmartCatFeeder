module.exports = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ message: "No device token" });
  }

  const token = header.split(" ")[1];

  // 🔐 demo token (วันสอบ)
  if (token !== "DEVICE_TOKEN_DEMO") {
    return res.status(401).json({ message: "Invalid device token" });
  }

  next();
};
