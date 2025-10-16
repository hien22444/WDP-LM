const router = require("express").Router();
const { auth } = require("../middlewares/auth");
const User = require("../models/User");
const { upload } = require("../config/cloudinary");

// GET current user
router.get("/me", auth(), async (req, res) => {
	try {
		const user = await User.findById(req.user.id);
		if (!user) return res.status(404).json({ message: "User not found" });
		res.json({ 
			user: { 
				account: { 
					email: user.email, 
					role: user.role, 
					status: user.status 
				}, 
				profile: { 
					full_name: user.full_name,
					phone_number: user.phone_number,
					date_of_birth: user.date_of_birth,
					gender: user.gender,
					address: user.address,
					city: user.city,
					image: user.image
				} 
			} 
		});
	} catch (err) {
		res.status(500).json({ message: "Failed to fetch user" });
	}
});

// PATCH update profile (limited fields)
router.patch("/me", auth(), async (req, res) => {
	try {
		console.log("=== PROFILE UPDATE DEBUG ===");
		console.log("User ID:", req.user.id);
		console.log("Request body:", req.body);
		
		const { full_name, phone_number, date_of_birth, gender, address, city, image } = req.body;
		
		const updateFields = {};
		if (full_name !== undefined) updateFields.full_name = full_name;
		if (phone_number !== undefined) updateFields.phone_number = phone_number;
		if (date_of_birth !== undefined) updateFields.date_of_birth = date_of_birth;
		if (gender !== undefined) updateFields.gender = gender;
		if (address !== undefined) updateFields.address = address;
		if (city !== undefined) updateFields.city = city;
		if (image !== undefined) updateFields.image = image;

		console.log("Update fields:", updateFields);

		const user = await User.findByIdAndUpdate(
			req.user.id,
			{ $set: updateFields },
			{ new: true, runValidators: true }
		);
		
		console.log("Updated user:", user);
		
		if (!user) return res.status(404).json({ message: "User not found" });
		
		res.json({ 
			message: "Profile updated successfully",
			user: { 
				account: { 
					email: user.email, 
					role: user.role, 
					status: user.status 
				}, 
				profile: { 
					full_name: user.full_name,
					phone_number: user.phone_number,
					date_of_birth: user.date_of_birth,
					gender: user.gender,
					address: user.address,
					city: user.city,
					image: user.image
				} 
			} 
		});
	} catch (err) {
		console.error("Profile update error:", err);
		res.status(500).json({ message: "Failed to update profile", error: err.message });
	}
});

// POST upload avatar
router.post("/upload-avatar", auth(), upload.single('avatar'), async (req, res) => {
	try {
		console.log("=== AVATAR UPLOAD DEBUG ===");
		console.log("User ID:", req.user.id);
		console.log("File:", req.file);
		
		if (!req.file) {
			return res.status(400).json({ message: "Không có file được upload" });
		}

		// Update user's image field with Cloudinary URL
		const user = await User.findByIdAndUpdate(
			req.user.id,
			{ $set: { image: req.file.path } },
			{ new: true, runValidators: true }
		);
		
		if (!user) {
			return res.status(404).json({ message: "Không tìm thấy người dùng" });
		}
		
		console.log("Avatar updated successfully:", req.file.path);
		
		res.json({ 
			message: "Upload avatar thành công",
			imageUrl: req.file.path,
			user: { 
				account: { 
					email: user.email, 
					role: user.role, 
					status: user.status 
				}, 
				profile: { 
					full_name: user.full_name,
					phone_number: user.phone_number,
					date_of_birth: user.date_of_birth,
					gender: user.gender,
					address: user.address,
					city: user.city,
					image: user.image
				} 
			} 
		});
	} catch (err) {
		console.error("Avatar upload error:", err);
		
		// Handle multer errors
		if (err.message.includes('File too large')) {
			return res.status(400).json({ message: "File quá lớn. Vui lòng chọn file nhỏ hơn 5MB" });
		}
		
		if (err.message.includes('Chỉ chấp nhận file ảnh')) {
			return res.status(400).json({ message: err.message });
		}
		
		res.status(500).json({ message: "Lỗi khi upload avatar", error: err.message });
	}
});

module.exports = router;
