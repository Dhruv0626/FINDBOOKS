const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Access Denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        req.userId = decoded.User.id;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token." });
    }
};

module.exports = authenticateToken;