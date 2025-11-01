require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const User = require("../src/models/User");
const TutorProfile = require("../src/models/TutorProfile");
const Booking = require("../src/models/Booking");
const TeachingSlot = require("../src/models/TeachingSlot");
const TeachingSession = require("../src/models/TeachingSession");
const Payment = require("../src/models/Payment");
const Review = require("../src/models/Review");
const Notification = require("../src/models/Notification");
const Message = require("../src/models/Message");
const Withdrawal = require("../src/models/Withdrawal");

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || process.env.DB_HOST || process.env.URI_DB;
    
    if (!mongoURI) {
      throw new Error("Không tìm thấy MONGO_URI trong file .env");
    }

    console.log("🔗 Đang kết nối đến MongoDB...");
    await mongoose.connect(mongoURI);
    console.log("✅ Đã kết nối thành công đến MongoDB");
  } catch (error) {
    console.error("❌ Lỗi kết nối MongoDB:", error.message);
    process.exit(1);
  }
};

const cleanDatabase = async () => {
  try {
    console.log("\n🧹 BẮT ĐẦU KIỂM TRA VÀ DỌN DẸP DATABASE...\n");

    let totalDeleted = 0;
    let totalFixed = 0;

    // 1. Kiểm tra và xóa Users không hợp lệ
    console.log("📋 Kiểm tra Users...");
    const invalidUsers = await User.find({
      $or: [
        { email: { $exists: false } },
        { email: null },
        { email: "" },
        { role: { $nin: ["student", "tutor", "admin"] } }
      ]
    });
    
    if (invalidUsers.length > 0) {
      console.log(`⚠️  Tìm thấy ${invalidUsers.length} users không hợp lệ:`);
      invalidUsers.forEach(user => {
        console.log(`   - ID: ${user._id}, Email: ${user.email || "N/A"}, Role: ${user.role || "N/A"}`);
      });
      
      const deletedUsers = await User.deleteMany({
        _id: { $in: invalidUsers.map(u => u._id) }
      });
      totalDeleted += deletedUsers.deletedCount;
      console.log(`✅ Đã xóa ${deletedUsers.deletedCount} users không hợp lệ`);
    } else {
      console.log("✅ Tất cả users đều hợp lệ");
    }

    // 2. Kiểm tra TutorProfiles không có user tương ứng
    console.log("\n📋 Kiểm tra TutorProfiles...");
    const allTutorProfiles = await TutorProfile.find({});
    const orphanedProfiles = [];
    
    for (const profile of allTutorProfiles) {
      const userExists = await User.findById(profile.user);
      if (!userExists) {
        orphanedProfiles.push(profile);
      }
    }
    
    if (orphanedProfiles.length > 0) {
      console.log(`⚠️  Tìm thấy ${orphanedProfiles.length} tutor profiles không có user:`);
      orphanedProfiles.forEach(profile => {
        console.log(`   - Profile ID: ${profile._id}, User ID: ${profile.user}`);
      });
      
      const deletedProfiles = await TutorProfile.deleteMany({
        _id: { $in: orphanedProfiles.map(p => p._id) }
      });
      totalDeleted += deletedProfiles.deletedCount;
      console.log(`✅ Đã xóa ${deletedProfiles.deletedCount} tutor profiles mồ côi`);
    } else {
      console.log("✅ Tất cả tutor profiles đều hợp lệ");
    }

    // 3. Kiểm tra Bookings không hợp lệ
    console.log("\n📋 Kiểm tra Bookings...");
    const allBookings = await Booking.find({});
    const invalidBookings = [];
    
    for (const booking of allBookings) {
      const studentExists = await User.findById(booking.student);
      const tutorExists = await User.findById(booking.tutor);
      const tutorProfileExists = await TutorProfile.findById(booking.tutorProfile);
      
      if (!studentExists || !tutorExists || !tutorProfileExists) {
        invalidBookings.push({
          booking,
          reason: !studentExists ? "Student không tồn tại" : 
                  !tutorExists ? "Tutor không tồn tại" : 
                  "TutorProfile không tồn tại"
        });
      }
    }
    
    if (invalidBookings.length > 0) {
      console.log(`⚠️  Tìm thấy ${invalidBookings.length} bookings không hợp lệ:`);
      invalidBookings.forEach(({ booking, reason }) => {
        console.log(`   - Booking ID: ${booking._id}, Lý do: ${reason}`);
      });
      
      const deletedBookings = await Booking.deleteMany({
        _id: { $in: invalidBookings.map(b => b.booking._id) }
      });
      totalDeleted += deletedBookings.deletedCount;
      console.log(`✅ Đã xóa ${deletedBookings.deletedCount} bookings không hợp lệ`);
    } else {
      console.log("✅ Tất cả bookings đều hợp lệ");
    }

    // 4. Kiểm tra TeachingSlots không hợp lệ
    console.log("\n📋 Kiểm tra TeachingSlots...");
    const allSlots = await TeachingSlot.find({});
    const invalidSlots = [];
    
    for (const slot of allSlots) {
      const tutorProfileExists = await TutorProfile.findById(slot.tutorProfile);
      if (!tutorProfileExists) {
        invalidSlots.push(slot);
      }
    }
    
    if (invalidSlots.length > 0) {
      console.log(`⚠️  Tìm thấy ${invalidSlots.length} teaching slots không hợp lệ:`);
      invalidSlots.forEach(slot => {
        console.log(`   - Slot ID: ${slot._id}, TutorProfile ID: ${slot.tutorProfile}`);
      });
      
      const deletedSlots = await TeachingSlot.deleteMany({
        _id: { $in: invalidSlots.map(s => s._id) }
      });
      totalDeleted += deletedSlots.deletedCount;
      console.log(`✅ Đã xóa ${deletedSlots.deletedCount} teaching slots không hợp lệ`);
    } else {
      console.log("✅ Tất cả teaching slots đều hợp lệ");
    }

    // 5. Kiểm tra Payments không hợp lệ
    console.log("\n📋 Kiểm tra Payments...");
    const allPayments = await Payment.find({});
    const invalidPayments = [];
    
    for (const payment of allPayments) {
      const userExists = await User.findById(payment.user);
      if (!userExists) {
        invalidPayments.push(payment);
      }
    }
    
    if (invalidPayments.length > 0) {
      console.log(`⚠️  Tìm thấy ${invalidPayments.length} payments không hợp lệ:`);
      invalidPayments.forEach(payment => {
        console.log(`   - Payment ID: ${payment._id}, User ID: ${payment.user}`);
      });
      
      const deletedPayments = await Payment.deleteMany({
        _id: { $in: invalidPayments.map(p => p._id) }
      });
      totalDeleted += deletedPayments.deletedCount;
      console.log(`✅ Đã xóa ${deletedPayments.deletedCount} payments không hợp lệ`);
    } else {
      console.log("✅ Tất cả payments đều hợp lệ");
    }

    // 6. Kiểm tra Reviews không hợp lệ
    console.log("\n📋 Kiểm tra Reviews...");
    const allReviews = await Review.find({});
    const invalidReviews = [];
    
    for (const review of allReviews) {
      const studentExists = await User.findById(review.student);
      const tutorExists = await User.findById(review.tutor);
      
      if (!studentExists || !tutorExists) {
        invalidReviews.push(review);
      }
    }
    
    if (invalidReviews.length > 0) {
      console.log(`⚠️  Tìm thấy ${invalidReviews.length} reviews không hợp lệ:`);
      invalidReviews.forEach(review => {
        console.log(`   - Review ID: ${review._id}`);
      });
      
      const deletedReviews = await Review.deleteMany({
        _id: { $in: invalidReviews.map(r => r._id) }
      });
      totalDeleted += deletedReviews.deletedCount;
      console.log(`✅ Đã xóa ${deletedReviews.deletedCount} reviews không hợp lệ`);
    } else {
      console.log("✅ Tất cả reviews đều hợp lệ");
    }

    // 7. Kiểm tra Notifications không hợp lệ
    console.log("\n📋 Kiểm tra Notifications...");
    const allNotifications = await Notification.find({});
    const invalidNotifications = [];
    
    for (const notification of allNotifications) {
      const userExists = await User.findById(notification.user);
      if (!userExists) {
        invalidNotifications.push(notification);
      }
    }
    
    if (invalidNotifications.length > 0) {
      console.log(`⚠️  Tìm thấy ${invalidNotifications.length} notifications không hợp lệ:`);
      const deletedNotifications = await Notification.deleteMany({
        _id: { $in: invalidNotifications.map(n => n._id) }
      });
      totalDeleted += deletedNotifications.deletedCount;
      console.log(`✅ Đã xóa ${deletedNotifications.deletedCount} notifications không hợp lệ`);
    } else {
      console.log("✅ Tất cả notifications đều hợp lệ");
    }

    // 8. Kiểm tra Messages không hợp lệ
    console.log("\n📋 Kiểm tra Messages...");
    const allMessages = await Message.find({});
    const invalidMessages = [];
    
    for (const message of allMessages) {
      const senderExists = await User.findById(message.sender);
      const receiverExists = await User.findById(message.receiver);
      
      if (!senderExists || !receiverExists) {
        invalidMessages.push(message);
      }
    }
    
    if (invalidMessages.length > 0) {
      console.log(`⚠️  Tìm thấy ${invalidMessages.length} messages không hợp lệ:`);
      const deletedMessages = await Message.deleteMany({
        _id: { $in: invalidMessages.map(m => m._id) }
      });
      totalDeleted += deletedMessages.deletedCount;
      console.log(`✅ Đã xóa ${deletedMessages.deletedCount} messages không hợp lệ`);
    } else {
      console.log("✅ Tất cả messages đều hợp lệ");
    }

    // 9. Kiểm tra Withdrawals không hợp lệ
    console.log("\n📋 Kiểm tra Withdrawals...");
    const allWithdrawals = await Withdrawal.find({});
    const invalidWithdrawals = [];
    
    for (const withdrawal of allWithdrawals) {
      const tutorExists = await User.findById(withdrawal.tutor);
      if (!tutorExists) {
        invalidWithdrawals.push(withdrawal);
      }
    }
    
    if (invalidWithdrawals.length > 0) {
      console.log(`⚠️  Tìm thấy ${invalidWithdrawals.length} withdrawals không hợp lệ:`);
      const deletedWithdrawals = await Withdrawal.deleteMany({
        _id: { $in: invalidWithdrawals.map(w => w._id) }
      });
      totalDeleted += deletedWithdrawals.deletedCount;
      console.log(`✅ Đã xóa ${deletedWithdrawals.deletedCount} withdrawals không hợp lệ`);
    } else {
      console.log("✅ Tất cả withdrawals đều hợp lệ");
    }

    // Tổng kết
    console.log("\n" + "=".repeat(60));
    console.log("📊 TỔNG KẾT:");
    console.log(`   ✅ Tổng số bản ghi đã xóa: ${totalDeleted}`);
    console.log(`   🔧 Tổng số bản ghi đã sửa: ${totalFixed}`);
    console.log("=".repeat(60) + "\n");

    // Hiển thị thống kê sau khi dọn dẹp
    console.log("📊 THỐNG KÊ DATABASE SAU KHI DỌN DẸP:");
    const stats = {
      users: await User.countDocuments(),
      tutorProfiles: await TutorProfile.countDocuments(),
      bookings: await Booking.countDocuments(),
      teachingSlots: await TeachingSlot.countDocuments(),
      teachingSessions: await TeachingSession.countDocuments(),
      payments: await Payment.countDocuments(),
      reviews: await Review.countDocuments(),
      notifications: await Notification.countDocuments(),
      messages: await Message.countDocuments(),
      withdrawals: await Withdrawal.countDocuments()
    };

    console.log(`   👥 Users: ${stats.users}`);
    console.log(`   👨‍🏫 Tutor Profiles: ${stats.tutorProfiles}`);
    console.log(`   📅 Bookings: ${stats.bookings}`);
    console.log(`   🕐 Teaching Slots: ${stats.teachingSlots}`);
    console.log(`   📚 Teaching Sessions: ${stats.teachingSessions}`);
    console.log(`   💰 Payments: ${stats.payments}`);
    console.log(`   ⭐ Reviews: ${stats.reviews}`);
    console.log(`   🔔 Notifications: ${stats.notifications}`);
    console.log(`   💬 Messages: ${stats.messages}`);
    console.log(`   🏦 Withdrawals: ${stats.withdrawals}`);

  } catch (error) {
    console.error("❌ Lỗi khi dọn dẹp database:", error);
    throw error;
  }
};

const main = async () => {
  try {
    await connectDB();
    await cleanDatabase();
    console.log("\n✅ HOÀN THÀNH VIỆC DỌN DẸP DATABASE!");
  } catch (error) {
    console.error("❌ Lỗi:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Đã đóng kết nối MongoDB");
    process.exit(0);
  }
};

main();
