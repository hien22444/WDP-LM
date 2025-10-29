const User = require("../models/User");
const TutorProfile = require("../models/TutorProfile");
const Booking = require("../models/Booking");
const nodemailer = require("nodemailer");

// Email transporter
const createTransporter = () => {
  // Trim and clean env variables
  const strip = (v) => (v || "").toString().trim().replace(/^['"]|['"]$/g, "");
  
  let user = process.env.MAIL_USERNAME || process.env.MAIL_LEARNMATE_USERNAME;
  let pass = process.env.MAIL_PASSWORD || process.env.MAIL_LEARNMATE_PASSWORD;
  
  user = strip(user);
  pass = strip(pass);
  
  // Remove spaces from app password (e.g., 'abcd efgh ijkl mnop' -> 'abcdefghijklmnop')
  if (pass && pass.includes(' ')) {
    pass = pass.replace(/\s/g, '');
    console.log('✅ Cleaned app password (removed spaces)');
  }
  
  if (!user || !pass) {
    console.warn("⚠️ Email credentials not configured");
    console.log('MAIL_USERNAME:', user ? 'Found' : 'Missing');
    console.log('MAIL_PASSWORD:', pass ? 'Found' : 'Missing');
    return null;
  }
  
  console.log(`✅ Email transporter configured for: ${user}`);
  
  try {
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass }
    });
  } catch (error) {
    console.error('❌ Failed to create email transporter:', error.message);
    return null;
  }
};

// Send email helper
const sendEmail = async (to, subject, html) => {
  console.log(`\n📧 Attempting to send email...`);
  console.log(`   To: ${to}`);
  console.log(`   Subject: ${subject}`);
  
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log(`❌ [EMAIL MOCK MODE] Transporter not configured`);
      console.log(`   Would send: ${subject} to ${to}`);
      return { success: true, mode: "mock" };
    }
    
    // Verify connection
    console.log(`🔄 Verifying SMTP connection...`);
    await transporter.verify();
    console.log(`✅ SMTP connection verified`);
    
    // Send email
    const from = process.env.MAIL_FROM || process.env.MAIL_USERNAME || "no-reply@edumatch.com";
    console.log(`📤 Sending email from: ${from}`);
    
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html
    });
    
    console.log(`✅ Email sent successfully!`);
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response}\n`);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack:`, error.stack);
    return { success: false, error: error.message };
  }
};

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
      .populate("tutorProfile", "user")
      .populate("tutorProfile.user", "full_name email")
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

    if (!["pending", "active", "blocked"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Check current user status first
    const currentUser = await User.findById(id).select("status");
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent unbanning - banned status is permanent
    if (currentUser.status === "banned") {
      return res.status(403).json({ 
        message: "Cannot change status of banned user. Banned status is permanent.",
        currentStatus: "banned"
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).select("-password_hash -refresh_tokens");

    console.log(`✅ User ${user.email} status updated from ${currentUser.status} to ${status}`);
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

    if (!["learner", "tutor", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select("-password_hash -refresh_tokens");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
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

const blockUser = async (req, res) => {
  try {
    const { reason } = req.body;
    const { id } = req.params;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: "Block reason is required" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { 
        status: "blocked",
        block_reason: reason,
        blocked_at: new Date()
      },
      { new: true }
    ).select("-password_hash -refresh_tokens");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Send email notification
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ Tài khoản đã bị khóa</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #1f2937;">Xin chào <strong>${user.full_name}</strong>,</p>
          <p style="font-size: 16px; color: #1f2937;">Tài khoản của bạn trên <strong>EduMatch</strong> đã bị khóa bởi quản trị viên.</p>
          
          <div style="background: white; padding: 20px; border-left: 4px solid #ef4444; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #6b7280; font-size: 14px; font-weight: 600;">Lý do:</p>
            <p style="margin: 10px 0 0 0; color: #1f2937; font-size: 16px;">${reason}</p>
          </div>
          
          <p style="font-size: 16px; color: #1f2937;">Bạn sẽ không thể đăng nhập hoặc sử dụng các dịch vụ của chúng tôi cho đến khi tài khoản được mở khóa.</p>
          
          <p style="font-size: 16px; color: #1f2937;">Nếu bạn cho rằng đây là nhầm lẫn hoặc cần thêm thông tin, vui lòng liên hệ với đội ngũ hỗ trợ của chúng tôi.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 14px; color: #6b7280; margin: 0;">Trân trọng,</p>
            <p style="font-size: 14px; color: #6b7280; margin: 5px 0 0 0;"><strong>Đội ngũ EduMatch</strong></p>
          </div>
        </div>
      </div>
    `;

    await sendEmail(user.email, "⚠️ Tài khoản EduMatch của bạn đã bị khóa", emailHtml);

    console.log(`✅ User ${user.email} blocked by admin. Reason: ${reason}`);
    res.json({ 
      message: "User blocked successfully", 
      user 
    });
  } catch (error) {
    console.error("❌ Error blocking user:", error);
    res.status(500).json({ message: "Error blocking user" });
  }
};

const banUser = async (req, res) => {
  try {
    const { reason } = req.body;
    const { id } = req.params;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: "Ban reason is required" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { 
        status: "banned",
        ban_reason: reason,
        banned_at: new Date()
      },
      { new: true }
    ).select("-password_hash -refresh_tokens");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Send email notification
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #6b7280 0%, #374151 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🚫 Tài khoản đã bị cấm vĩnh viễn</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #1f2937;">Xin chào <strong>${user.full_name}</strong>,</p>
          <p style="font-size: 16px; color: #1f2937;">Tài khoản của bạn trên <strong>EduMatch</strong> đã bị cấm vĩnh viễn bởi quản trị viên.</p>
          
          <div style="background: white; padding: 20px; border-left: 4px solid #6b7280; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #6b7280; font-size: 14px; font-weight: 600;">Lý do:</p>
            <p style="margin: 10px 0 0 0; color: #1f2937; font-size: 16px;">${reason}</p>
          </div>
          
          <div style="background: #fee2e2; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="font-size: 14px; color: #991b1b; margin: 0; font-weight: 600;">⚠️ Lưu ý quan trọng:</p>
            <p style="font-size: 14px; color: #991b1b; margin: 10px 0 0 0;">Đây là quyết định vĩnh viễn. Bạn sẽ không thể đăng nhập hoặc tạo tài khoản mới với email này.</p>
          </div>
          
          <p style="font-size: 16px; color: #1f2937;">Nếu bạn cho rằng đây là sai sót nghiêm trọng, vui lòng liên hệ với đội ngũ hỗ trợ của chúng tôi trong vòng 7 ngày.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 14px; color: #6b7280; margin: 0;">Trân trọng,</p>
            <p style="font-size: 14px; color: #6b7280; margin: 5px 0 0 0;"><strong>Đội ngũ EduMatch</strong></p>
          </div>
        </div>
      </div>
    `;

    await sendEmail(user.email, "🚫 Tài khoản EduMatch của bạn đã bị cấm vĩnh viễn", emailHtml);

    console.log(`✅ User ${user.email} banned by admin. Reason: ${reason}`);
    res.json({ 
      message: "User banned successfully", 
      user 
    });
  } catch (error) {
    console.error("❌ Error banning user:", error);
    res.status(500).json({ message: "Error banning user" });
  }
};

// Tutor management
const getTutors = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search, role } = req.query;
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

    // Populate tutors với thông tin user đầy đủ
    let tutors = await TutorProfile.find(query)
      .populate("user", "full_name email phone_number status role")
      .sort({ created_at: -1 })
      .lean();

    // Filter theo role của user
    // Default: chỉ hiển thị đơn của learner (đơn chờ duyệt CV)
    // role=tutor: hiển thị đơn đã duyệt (người đã là tutor)
    // role=all: hiển thị tất cả
    const roleFilter = role || "learner";
    
    if (roleFilter !== "all") {
      tutors = tutors.filter(tutor => {
        if (!tutor.user) return false;
        return tutor.user.role === roleFilter;
      });
    }

    // Pagination sau khi filter
    const total = tutors.length;
    const paginatedTutors = tutors.slice(skip, skip + parseInt(limit));

    res.json({
      tutors: paginatedTutors,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      },
      filter: {
        role: roleFilter
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
      .populate("user", "full_name email phone_number status role");
    
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
    const { status, rejectionReason } = req.body;
    const { id } = req.params;

    if (!["draft", "pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const tutor = await TutorProfile.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate("user", "full_name email phone_number status role");

    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }

    // QUAN TRỌNG: Khi approve, tự động chuyển role từ learner sang tutor
    if (status === "approved" && tutor.user) {
      const user = await User.findById(tutor.user._id);
      
      if (user && user.role === "learner") {
        user.role = "tutor";
        await user.save();
        
        console.log(`✅ User ${user.email} role changed from learner to tutor`);
        
        // Gửi email thông báo đơn được duyệt
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Chúc mừng! Đơn đăng ký gia sư đã được duyệt</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; color: #1f2937;">Xin chào <strong>${user.full_name}</strong>,</p>
              <p style="font-size: 16px; color: #1f2937;">Đơn đăng ký làm gia sư của bạn trên <strong>EduMatch</strong> đã được phê duyệt!</p>
              
              <div style="background: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #10b981; font-size: 14px; font-weight: 600;">✅ Trạng thái:</p>
                <p style="margin: 10px 0 0 0; color: #1f2937; font-size: 16px;">Đã duyệt - Bạn giờ là gia sư chính thức của EduMatch</p>
              </div>
              
              <div style="background: #d1fae5; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="font-size: 14px; color: #065f46; margin: 0; font-weight: 600;">🚀 Bước tiếp theo:</p>
                <ul style="margin: 10px 0; padding-left: 20px; color: #065f46;">
                  <li>Hoàn thiện hồ sơ gia sư của bạn</li>
                  <li>Cập nhật lịch rảnh để học viên có thể đặt lịch</li>
                  <li>Bắt đầu nhận đơn đặt lịch từ học viên</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile" 
                   style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                  Xem hồ sơ gia sư của tôi
                </a>
              </div>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 14px; color: #6b7280; margin: 0;">Chúc bạn thành công với vai trò gia sư mới!</p>
                <p style="font-size: 14px; color: #6b7280; margin: 5px 0 0 0;"><strong>Đội ngũ EduMatch</strong></p>
              </div>
            </div>
          </div>
        `;

        await sendEmail(user.email, "🎉 Đơn đăng ký gia sư đã được duyệt - EduMatch", emailHtml);
      }
    }

    // Gửi email nếu bị từ chối
    if (status === "rejected" && tutor.user) {
      const user = await User.findById(tutor.user._id);
      
      if (user) {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">❌ Đơn đăng ký gia sư chưa được duyệt</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; color: #1f2937;">Xin chào <strong>${user.full_name}</strong>,</p>
              <p style="font-size: 16px; color: #1f2937;">Rất tiếc, đơn đăng ký làm gia sư của bạn chưa được phê duyệt.</p>
              
              ${rejectionReason ? `
              <div style="background: white; padding: 20px; border-left: 4px solid #ef4444; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #ef4444; font-size: 14px; font-weight: 600;">Lý do:</p>
                <p style="margin: 10px 0 0 0; color: #1f2937; font-size: 16px;">${rejectionReason}</p>
              </div>
              ` : ''}
              
              <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="font-size: 14px; color: #92400e; margin: 0; font-weight: 600;">💡 Bạn có thể:</p>
                <ul style="margin: 10px 0; padding-left: 20px; color: #92400e;">
                  <li>Cập nhật lại thông tin hồ sơ</li>
                  <li>Gửi lại đơn đăng ký với đầy đủ thông tin hơn</li>
                  <li>Liên hệ với đội ngũ hỗ trợ để được tư vấn</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile" 
                   style="background: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                  Cập nhật hồ sơ
                </a>
              </div>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 14px; color: #6b7280; margin: 0;">Đừng nản lòng! Hãy thử lại sau khi hoàn thiện hồ sơ.</p>
                <p style="font-size: 14px; color: #6b7280; margin: 5px 0 0 0;"><strong>Đội ngũ EduMatch</strong></p>
              </div>
            </div>
          </div>
        `;

        await sendEmail(user.email, "❌ Đơn đăng ký gia sư chưa được duyệt - EduMatch", emailHtml);
      }
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

module.exports = {
  getDashboardStats,
  getUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  blockUser,
  banUser,
  getTutors,
  getTutorById,
  updateTutorVerification,
  updateTutorStatus,
  getBookings,
  getBookingById,
  updateBookingStatus,
  getRevenueReport,
  getUserReport,
  getTutorReport
};
