const jwt = require("jsonwebtoken");

module.exports = function auth(required = true) {
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
