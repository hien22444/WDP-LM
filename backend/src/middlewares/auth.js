const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Original auth function
const auth = function(required = true) {
	return (req, res, next) => {
		const authHeader = req.headers.authorization || req.headers.Authorization;
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			if (required) return res.status(401).json({ message: "Missing token" });
			return next();
		}
		const token = authHeader.split(" ")[1];
		try {
			const decoded = jwt.verify(token, process.env.JWT_SECRET);
			req.user = { id: decoded.sub };
			next();
		} catch (err) {
			return res.status(401).json({ message: "Invalid or expired token" });
		}
	};
};

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
	const authHeader = req.headers.authorization || req.headers.Authorization;
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.status(401).json({ message: "Missing token" });
	}
	const token = authHeader.split(" ")[1];
	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.user = { id: decoded.sub };
		next();
	} catch (err) {
		return res.status(401).json({ message: "Invalid or expired token" });
	}
};

// Middleware to require admin role
const requireAdmin = async (req, res, next) => {
	try {
		const user = await User.findById(req.user.id).select("role status");
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}
		if (user.role !== "admin") {
			return res.status(403).json({ message: "Admin access required" });
		}
		if (user.status !== "active") {
			return res.status(403).json({ message: "Account is not active" });
		}
		req.user.role = user.role;
		next();
	} catch (error) {
		console.error("Error checking admin role:", error);
		res.status(500).json({ message: "Error verifying admin access" });
	}
};

module.exports = {
	auth,
	authenticateToken,
	requireAdmin
};
