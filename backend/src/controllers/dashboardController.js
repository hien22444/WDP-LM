const User = require("../models/User");
const TutorProfile = require("../models/TutorProfile");
const Booking = require("../models/Booking");

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
        { type: "assignment", title: "Bài tập Tiếng Anh", date: new Date() },
      ],
    };

    res.json({
      success: true,
      data: dashboardData,
    });
  } catch (err) {
    console.error("Learner dashboard error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch learner dashboard data",
    });
  }
};

// Dashboard data cho tutor
exports.getTutorDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Lấy thông tin tutor profile
    const tutorProfile = await TutorProfile.findOne({ userId });
    if (!tutorProfile) {
      return res.status(404).json({
        success: false,
        message: "Tutor profile not found",
      });
    }

    // Tính toán thống kê từ database
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

    // Đếm học viên hiện tại (có booking trong tháng này)
    const currentStudents = await Booking.distinct("studentId", {
      tutorId: userId,
      status: { $in: ["confirmed", "completed"] },
      createdAt: { $gte: startOfMonth },
    });

    // Tính thu nhập tháng này
    const monthlyBookings = await Booking.find({
      tutorId: userId,
      status: "completed",
      createdAt: { $gte: startOfMonth },
    });

    const monthlyEarnings = monthlyBookings.reduce((total, booking) => {
      return total + (booking.price || 0);
    }, 0);

    // Lấy buổi dạy sắp tới (trong 7 ngày tới)
    const upcomingLessons = await Booking.find({
      tutorId: userId,
      status: { $in: ["confirmed", "pending"] },
      startTime: {
        $gte: now,
        $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      },
    })
      .populate("studentId", "full_name")
      .sort({ startTime: 1 })
      .limit(5);

    // Lấy yêu cầu mới (trong 3 ngày gần đây)
    const recentRequests = await Booking.find({
      tutorId: userId,
      status: "pending",
      createdAt: { $gte: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
    })
      .populate("studentId", "full_name")
      .sort({ createdAt: -1 })
      .limit(5);

    // Tính thu nhập tuần (7 ngày qua)
    const weeklyEarnings = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(day.getDate() - i);
      const startOfDay = new Date(day.setHours(0, 0, 0, 0));
      const endOfDay = new Date(day.setHours(23, 59, 59, 999));

      const dayBookings = await Booking.find({
        tutorId: userId,
        status: "completed",
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      });

      const dayEarnings = dayBookings.reduce((total, booking) => {
        return total + (booking.price || 0);
      }, 0);

      weeklyEarnings.push({
        day: day.toLocaleDateString("vi-VN", { weekday: "long" }),
        amount: dayEarnings,
      });
    }

    // Thống kê tổng quan
    const totalBookings = await Booking.countDocuments({
      tutorId: userId,
      status: { $in: ["confirmed", "completed"] },
    });

    const completedBookings = await Booking.countDocuments({
      tutorId: userId,
      status: "completed",
    });

    const cancelledBookings = await Booking.countDocuments({
      tutorId: userId,
      status: "cancelled",
    });

    // Tính response rate (tỷ lệ phản hồi)
    const totalRequests = await Booking.countDocuments({ tutorId: userId });
    const responseRate =
      totalRequests > 0 ? Math.round((totalBookings / totalRequests) * 100) : 0;

    const dashboardData = {
      // Basic stats
      currentStudents: currentStudents.length,
      monthlyEarnings,
      averageRating: tutorProfile.averageRating || 0,
      weeklyHours: tutorProfile.weeklyHours || 0,

      // Upcoming lessons
      upcomingLessons: upcomingLessons.map((lesson) => ({
        id: lesson._id,
        studentName: lesson.studentId?.full_name || "N/A",
        subject: lesson.subject || "N/A",
        date: lesson.startTime.toISOString().split("T")[0],
        time: lesson.startTime.toTimeString().split(" ")[0].substring(0, 5),
        duration: lesson.duration || 60,
        status: lesson.status,
      })),

      // New requests
      newRequests: recentRequests.map((request) => ({
        id: request._id,
        studentName: request.studentId?.full_name || "N/A",
        subject: request.subject || "N/A",
        message: request.message || "Không có tin nhắn",
        requestDate: request.createdAt.toISOString().split("T")[0],
        hourlyRate: request.price || 0,
      })),

      // Weekly earnings chart
      weeklyEarnings,

      // Quick stats
      totalLessonsThisMonth: await Booking.countDocuments({
        tutorId: userId,
        createdAt: { $gte: startOfMonth },
      }),
      totalEarningsThisMonth: monthlyEarnings,
      completedLessons: completedBookings,
      cancelledLessons: cancelledBookings,
      responseRate,

      // Recent reviews (mock for now - cần tạo Review model)
      recentReviews: [
        {
          id: 1,
          studentName: "Nguyễn Văn A",
          rating: 5,
          comment: "Thầy dạy rất hay, em hiểu bài ngay",
          date: "2024-01-10",
        },
        {
          id: 2,
          studentName: "Trần Thị B",
          rating: 4,
          comment: "Phương pháp dạy tốt, nhưng hơi nhanh",
          date: "2024-01-08",
        },
      ],
    };

    res.json({
      success: true,
      data: dashboardData,
    });
  } catch (err) {
    console.error("Tutor dashboard error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tutor dashboard data",
    });
  }
};

// Dashboard data cho admin
exports.getAdminDashboard = async (req, res) => {
  try {
    // Lấy thống kê thực từ database
    const totalUsers = await User.countDocuments();
    const activeTutors = await User.countDocuments({
      role: "tutor",
      status: "active",
    });
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
        .select("full_name email role created_at"),
      systemStats: {
        serverUptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        activeSessions: 156, // Mock data
      },
    };

    res.json({
      success: true,
      data: dashboardData,
    });
  } catch (err) {
    console.error("Admin dashboard error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin dashboard data",
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
      countries: 180, // Mock data
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (err) {
    console.error("General stats error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch general stats",
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
        message: "Access denied. Admin only.",
      });
    }

    const validRoles = ["learner", "tutor", "admin"];
    if (!validRoles.includes(newRole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role specified",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role: newRole },
      { new: true }
    ).select("-password_hash -refresh_tokens");

    res.json({
      success: true,
      message: "User role updated successfully",
      data: updatedUser,
    });
  } catch (err) {
    console.error("Update role error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update user role",
    });
  }
};
