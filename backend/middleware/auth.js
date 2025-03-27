const jwt = require("jsonwebtoken");
const { JWT_SECRET } = process.env;

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No auth token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { _id: decoded.id };
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
