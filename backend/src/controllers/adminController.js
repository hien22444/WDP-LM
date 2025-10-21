const User = require("../models/User");
const TutorProfile = require("../models/TutorProfile");
const Booking = require("../models/Booking");
const { sendMail } = require("../config/mailSendConfig");

// Dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTutors = await TutorProfile.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const pendingTutors = await TutorProfile.countDocuments({ status: "pending" });
    const activeUsers = await User.countDocuments({ status: "active" });
    const completedBookings = await Booking.countDocuments({ status: "completed" });

    // Revenue calculation (assuming price field exists)
    const revenueResult = await Booking.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, totalRevenue: { $sum: "$price" } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Recent activity
    const recentUsers = await User.find()
      .sort({ created_at: -1 })
      .limit(5)
      .select("full_name email role status created_at");

    const recentBookings = await Booking.find()
      .populate("student", "full_name email")
      .populate({
        path: "tutorProfile",
        populate: { path: "user", select: "full_name email" }
      })
      .sort({ created_at: -1 })
      .limit(5)
      .select("start end status price created_at");

    res.json({
      stats: {
        totalUsers,
        totalTutors,
        totalBookings,
        pendingTutors,
        activeUsers,
        completedBookings,
        totalRevenue
      },
      recentActivity: {
        users: recentUsers,
        bookings: recentBookings
      }
    });
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    res.status(500).json({ message: "Error fetching dashboard statistics" });
  }
};

// User management
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, status, search } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { full_name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    const users = await User.find(query)
      .select("-password_hash -refresh_tokens")
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password_hash -refresh_tokens");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error getting user:", error);
    res.status(500).json({ message: "Error fetching user" });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!["pending", "active"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).select("-password_hash -refresh_tokens");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({ message: "Error updating user status" });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const { id } = req.params;
    if (!role || !["learner", "tutor", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select("_id full_name email role status");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "Role updated", user });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ message: "Error updating user role" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Also delete associated tutor profile if exists
    await TutorProfile.findOneAndDelete({ user: req.params.id });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Error deleting user" });
  }
};

// Tutor management
const getTutors = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { bio: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
        { "subjects.name": { $regex: search, $options: "i" } }
      ];
    }

    const tutors = await TutorProfile.find(query)
      .populate("user", "full_name email phone_number status role")
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await TutorProfile.countDocuments(query);

    res.json({
      tutors,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error("Error getting tutors:", error);
    res.status(500).json({ message: "Error fetching tutors" });
  }
};

const getTutorById = async (req, res) => {
  try {
    const tutor = await TutorProfile.findById(req.params.id)
      .populate("user", "full_name email phone_number status");
    
    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }

    res.json(tutor);
  } catch (error) {
    console.error("Error getting tutor:", error);
    res.status(500).json({ message: "Error fetching tutor" });
  }
};

const updateTutorVerification = async (req, res) => {
  try {
    const { idStatus, degreeStatus, adminNotes } = req.body;
    const { id } = req.params;

    const updateData = {};
    if (idStatus) updateData["verification.idStatus"] = idStatus;
    if (degreeStatus) updateData["verification.degreeStatus"] = degreeStatus;
    if (adminNotes !== undefined) updateData["verification.adminNotes"] = adminNotes;

    const tutor = await TutorProfile.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate("user", "full_name email phone_number status");

    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }

    res.json(tutor);
  } catch (error) {
    console.error("Error updating tutor verification:", error);
    res.status(500).json({ message: "Error updating tutor verification" });
  }
};

const updateTutorStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!["draft", "pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const tutor = await TutorProfile.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate("user", "full_name email phone_number status");

    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }

    res.json(tutor);
  } catch (error) {
    console.error("Error updating tutor status:", error);
    res.status(500).json({ message: "Error updating tutor status" });
  }
};

// Booking management
const getBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { notes: { $regex: search, $options: "i" } }
      ];
    }

    const bookings = await Booking.find(query)
      .populate("student", "full_name email")
      .populate("tutorProfile", "user")
      .populate("tutorProfile.user", "full_name email")
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    res.json({
      bookings,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error("Error getting bookings:", error);
    res.status(500).json({ message: "Error fetching bookings" });
  }
};

const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("student", "full_name email phone_number")
      .populate("tutorProfile", "user")
      .populate("tutorProfile.user", "full_name email phone_number");
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json(booking);
  } catch (error) {
    console.error("Error getting booking:", error);
    res.status(500).json({ message: "Error fetching booking" });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!["pending", "accepted", "rejected", "cancelled", "completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const booking = await Booking.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate("student", "full_name email")
     .populate("tutorProfile", "user")
     .populate("tutorProfile.user", "full_name email");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json(booking);
  } catch (error) {
    console.error("Error updating booking status:", error);
    res.status(500).json({ message: "Error updating booking status" });
  }
};

// Reports
const getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let matchQuery = { status: "completed" };
    if (startDate && endDate) {
      matchQuery.created_at = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const revenueData = await Booking.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            year: { $year: "$created_at" },
            month: { $month: "$created_at" }
          },
          totalRevenue: { $sum: "$price" },
          bookingCount: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    res.json(revenueData);
  } catch (error) {
    console.error("Error getting revenue report:", error);
    res.status(500).json({ message: "Error fetching revenue report" });
  }
};

const getUserReport = async (req, res) => {
  try {
    const userStats = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 }
        }
      }
    ]);

    const statusStats = await User.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      byRole: userStats,
      byStatus: statusStats
    });
  } catch (error) {
    console.error("Error getting user report:", error);
    res.status(500).json({ message: "Error fetching user report" });
  }
};

const getTutorReport = async (req, res) => {
  try {
    const tutorStats = await TutorProfile.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const verificationStats = await TutorProfile.aggregate([
      {
        $group: {
          _id: {
            idStatus: "$verification.idStatus",
            degreeStatus: "$verification.degreeStatus"
          },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      byStatus: tutorStats,
      byVerification: verificationStats
    });
  } catch (error) {
    console.error("Error getting tutor report:", error);
    res.status(500).json({ message: "Error fetching tutor report" });
  }
};

const blockUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.role === "admin") {
      return res.status(403).json({ message: "Cannot block admin user" });
    }
    if (user.status === "blocked") {
      return res.status(400).json({ message: "User is already blocked" });
    }
    user.status = "blocked";
    await user.save();
    // Gửi email lý do block
    if (user.email && reason) {
      const subject = "Tài khoản của bạn đã bị khóa";
      const msg = `<p>Xin chào <b>${user.full_name}</b>,</p>
        <p>Tài khoản của bạn đã bị khóa bởi quản trị viên.</p>
        <p><b>Lý do:</b> ${reason}</p>
        <p>Nếu bạn có thắc mắc, vui lòng liên hệ lại với chúng tôi.</p>`;
      sendMail(user.email, subject, msg).catch(console.error);
    }
    res.json({ message: "User blocked successfully", user });
  } catch (error) {
    console.error("Block user error:", error);
    res.status(500).json({ message: "Error blocking user" });
  }
};

const banUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.role === "admin") {
      return res.status(403).json({ message: "Cannot ban admin user" });
    }
    if (user.status === "banned") {
      return res.status(400).json({ message: "User is already banned" });
    }
    user.status = "banned";
    await user.save();
    // Gửi email lý do ban
    if (user.email && reason) {
      const subject = "Tài khoản của bạn đã bị ban vĩnh viễn";
      const msg = `<p>Xin chào <b>${user.full_name}</b>,</p>
        <p>Tài khoản của bạn đã bị <b>ban vĩnh viễn</b> bởi quản trị viên.</p>
        <p><b>Lý do:</b> ${reason}</p>
        <p>Bạn sẽ không thể đăng nhập hoặc sử dụng dịch vụ nữa. Nếu có thắc mắc, vui lòng liên hệ lại với chúng tôi.</p>`;
      sendMail(user.email, subject, msg).catch(console.error);
    }
    res.json({ message: "User banned successfully", user });
  } catch (error) {
    console.error("Ban user error:", error);
    res.status(500).json({ message: "Error banning user" });
  }
};

module.exports = {
  getDashboardStats,
  getUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getTutors,
  getTutorById,
  updateTutorVerification,
  updateTutorStatus,
  getBookings,
  getBookingById,
  updateBookingStatus,
  getRevenueReport,
  getUserReport,
  getTutorReport,
  blockUser,
  banUser
};
