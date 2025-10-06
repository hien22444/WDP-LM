const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = function auth(required = true) {
    return async (req, res, next) => {
		const authHeader = req.headers.authorization || req.headers.Authorization;
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			if (required) return res.status(401).json({ message: "Missing token" });
			return next();
		}
		const token = authHeader.split(" ")[1];
		try {
			const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // hydrate role and status for downstream checks
            const user = await User.findById(decoded.sub).select("role status");
            if (!user) return res.status(401).json({ message: "Invalid token user" });
            req.user = { id: decoded.sub, role: user.role, status: user.status };
            next();
		} catch (err) {
			return res.status(401).json({ message: "Invalid or expired token" });
		}
	};
};

module.exports.requireRole = function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });
        if (!roles.includes(req.user.role)) return res.status(403).json({ message: "Forbidden" });
        next();
    };
};
