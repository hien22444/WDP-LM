const User = require("../models/User");

// Dashboard data cho learner
exports.getLearnerDashboard = async (req, res) => {
	try {
		const userId = req.user.id;
		
		// Mock data cho learner dashboard
		// Trong thực tế, bạn sẽ lấy data từ các model Course, Booking, etc.
		const dashboardData = {
			activeCourses: 3,
			weeklyLessons: 8,
			favoriteTutors: 5,
			learningProgress: 75,
			recentActivities: [
				{ type: "lesson", title: "Toán học cơ bản", date: new Date() },
				{ type: "assignment", title: "Bài tập Tiếng Anh", date: new Date() }
			]
		};

		res.json({ 
			success: true, 
			data: dashboardData 
		});
	} catch (err) {
		console.error("Learner dashboard error:", err);
		res.status(500).json({ 
			success: false, 
			message: "Failed to fetch learner dashboard data" 
		});
	}
};

// Dashboard data cho tutor
exports.getTutorDashboard = async (req, res) => {
	try {
		const userId = req.user.id;
		
		// Mock data cho tutor dashboard
		const dashboardData = {
			currentStudents: 12,
			monthlyEarnings: 8500000,
			averageRating: 4.8,
			weeklyHours: 24,
			upcomingLessons: [
				{ student: "Nguyễn Văn A", subject: "Toán", time: "10:00 AM" },
				{ student: "Trần Thị B", subject: "Tiếng Anh", time: "2:00 PM" }
			],
			recentReviews: [
				{ rating: 5, comment: "Giáo viên rất tận tâm", student: "Lê Văn C" }
			]
		};

		res.json({ 
			success: true, 
			data: dashboardData 
		});
	} catch (err) {
		console.error("Tutor dashboard error:", err);
		res.status(500).json({ 
			success: false, 
			message: "Failed to fetch tutor dashboard data" 
		});
	}
};

// Dashboard data cho admin
exports.getAdminDashboard = async (req, res) => {
	try {
		// Lấy thống kê thực từ database
		const totalUsers = await User.countDocuments();
		const activeTutors = await User.countDocuments({ role: "tutor", status: "active" });
		const pendingUsers = await User.countDocuments({ status: "pending" });
		
		// Mock data cho phần còn lại
		const dashboardData = {
			totalUsers,
			activeTutors,
			pendingUsers,
			monthlyRevenue: 247000000,
			activeCourses: 89,
			recentSignups: await User.find({})
				.sort({ created_at: -1 })
				.limit(5)
				.select('full_name email role created_at'),
			systemStats: {
				serverUptime: process.uptime(),
				memoryUsage: process.memoryUsage(),
				activeSessions: 156 // Mock data
			}
		};

		res.json({ 
			success: true, 
			data: dashboardData 
		});
	} catch (err) {
		console.error("Admin dashboard error:", err);
		res.status(500).json({ 
			success: false, 
			message: "Failed to fetch admin dashboard data" 
		});
	}
};

// Lấy thống kê chung cho tất cả role
exports.getGeneralStats = async (req, res) => {
	try {
		const stats = {
			totalTutors: await User.countDocuments({ role: "tutor" }),
			totalLearners: await User.countDocuments({ role: "learner" }),
			totalReviews: 300000, // Mock data
			supportedSubjects: 120, // Mock data
			countries: 180 // Mock data
		};

		res.json({ 
			success: true, 
			data: stats 
		});
	} catch (err) {
		console.error("General stats error:", err);
		res.status(500).json({ 
			success: false, 
			message: "Failed to fetch general stats" 
		});
	}
};

// Endpoint để cập nhật role của user (admin only)
exports.updateUserRole = async (req, res) => {
	try {
		const { userId, newRole } = req.body;
		const currentUser = await User.findById(req.user.id);
		
		// Chỉ admin mới được phép thay đổi role
		if (currentUser.role !== "admin") {
			return res.status(403).json({ 
				success: false, 
				message: "Access denied. Admin only." 
			});
		}

		const validRoles = ["learner", "tutor", "admin"];
		if (!validRoles.includes(newRole)) {
			return res.status(400).json({ 
				success: false, 
				message: "Invalid role specified" 
			});
		}

		const updatedUser = await User.findByIdAndUpdate(
			userId,
			{ role: newRole },
			{ new: true }
		).select('-password_hash -refresh_tokens');

		res.json({ 
			success: true, 
			message: "User role updated successfully",
			data: updatedUser 
		});
	} catch (err) {
		console.error("Update role error:", err);
		res.status(500).json({ 
			success: false, 
			message: "Failed to update user role" 
		});
	}
};