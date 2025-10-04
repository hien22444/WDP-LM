const router = require("express").Router();
const auth = require("../middlewares/auth");
const User = require("../models/User");

// GET current user
router.get("/me", auth(), async (req, res) => {
	try {
		const user = await User.findById(req.user.id);
		if (!user) return res.status(404).json({ message: "User not found" });
		res.json({ user: { account: { email: user.email, role: user.role, status: user.status }, profile: { full_name: user.full_name } } });
	} catch (err) {
		res.status(500).json({ message: "Failed to fetch user" });
	}
});

// PATCH update profile (limited fields)
router.patch("/me", auth(), async (req, res) => {
	try {
		const { full_name, city, gender } = req.body;
		const user = await User.findByIdAndUpdate(
			req.user.id,
			{ $set: { ...(full_name && { full_name }), ...(city && { city }), ...(gender && { gender }) } },
			{ new: true }
		);
		res.json({ user: { account: { email: user.email, role: user.role, status: user.status }, profile: { full_name: user.full_name, city: user.city, gender: user.gender } } });
	} catch (err) {
		res.status(500).json({ message: "Failed to update profile" });
	}
});

module.exports = router;
