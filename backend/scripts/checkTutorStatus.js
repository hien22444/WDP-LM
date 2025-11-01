require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const User = require("../src/models/User");
const TutorProfile = require("../src/models/TutorProfile");

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || process.env.DB_HOST || process.env.URI_DB;
    
    if (!mongoURI) {
      throw new Error("Không tìm thấy MONGO_URI trong file .env");
    }

    console.log("🔗 Đang kết nối đến MongoDB...");
    await mongoose.connect(mongoURI);
    console.log("✅ Đã kết nối thành công đến MongoDB\n");
  } catch (error) {
    console.error("❌ Lỗi kết nối MongoDB:", error.message);
    process.exit(1);
  }
};

const checkTutorStatus = async () => {
  try {
    console.log("📊 KIỂM TRA TRẠNG THÁI GIA SƯ\n");
    console.log("=".repeat(80));

    // 1. Kiểm tra Users
    const totalUsers = await User.countDocuments();
    const tutorUsers = await User.countDocuments({ role: "tutor" });
    const studentUsers = await User.countDocuments({ role: "student" });
    const adminUsers = await User.countDocuments({ role: "admin" });

    console.log("\n👥 USERS:");
    console.log(`   Tổng số users: ${totalUsers}`);
    console.log(`   - Admin: ${adminUsers}`);
    console.log(`   - Tutor: ${tutorUsers}`);
    console.log(`   - Student: ${studentUsers}`);

    // 2. Kiểm tra TutorProfiles
    const totalProfiles = await TutorProfile.countDocuments();
    const approvedProfiles = await TutorProfile.countDocuments({ status: "approved" });
    const pendingProfiles = await TutorProfile.countDocuments({ status: "pending" });
    const draftProfiles = await TutorProfile.countDocuments({ status: "draft" });
    const rejectedProfiles = await TutorProfile.countDocuments({ status: "rejected" });

    console.log("\n👨‍🏫 TUTOR PROFILES:");
    console.log(`   Tổng số profiles: ${totalProfiles}`);
    console.log(`   - Approved: ${approvedProfiles}`);
    console.log(`   - Pending: ${pendingProfiles}`);
    console.log(`   - Draft: ${draftProfiles}`);
    console.log(`   - Rejected: ${rejectedProfiles}`);

    // 3. Liệt kê chi tiết từng tutor profile
    console.log("\n📋 CHI TIẾT TỪNG TUTOR PROFILE:");
    console.log("=".repeat(80));

    const allProfiles = await TutorProfile.find({})
      .populate("user", "full_name email role")
      .lean();

    for (const profile of allProfiles) {
      console.log(`\n   Profile ID: ${profile._id}`);
      console.log(`   User: ${profile.user?.full_name || "N/A"} (${profile.user?.email || "N/A"})`);
      console.log(`   User Role: ${profile.user?.role || "N/A"}`);
      console.log(`   Profile Status: ${profile.status || "N/A"}`);
      console.log(`   Subjects: ${profile.subjects?.length || 0} môn`);
      console.log(`   Session Rate: ${profile.sessionRate || 0} VNĐ`);
      console.log(`   City: ${profile.city || "Chưa cập nhật"}`);
    }

    // 4. Kiểm tra users có role="tutor" nhưng không có profile
    console.log("\n\n⚠️  KIỂM TRA USERS TUTOR KHÔNG CÓ PROFILE:");
    console.log("=".repeat(80));

    const tutorUsersData = await User.find({ role: "tutor" }).lean();
    let tutorsWithoutProfile = 0;

    for (const user of tutorUsersData) {
      const profile = await TutorProfile.findOne({ user: user._id });
      if (!profile) {
        tutorsWithoutProfile++;
        console.log(`\n   ⚠️  User: ${user.full_name} (${user.email})`);
        console.log(`      User ID: ${user._id}`);
        console.log(`      Role: ${user.role}`);
        console.log(`      Không có TutorProfile!`);
      }
    }

    if (tutorsWithoutProfile === 0) {
      console.log("\n   ✅ Tất cả users có role='tutor' đều có profile");
    } else {
      console.log(`\n   ⚠️  Có ${tutorsWithoutProfile} users tutor không có profile`);
    }

    // 5. Kiểm tra profiles có user không phải tutor
    console.log("\n\n⚠️  KIỂM TRA PROFILES CÓ USER KHÔNG PHẢI TUTOR:");
    console.log("=".repeat(80));

    let profilesWithWrongRole = 0;
    for (const profile of allProfiles) {
      if (profile.user && profile.user.role !== "tutor") {
        profilesWithWrongRole++;
        console.log(`\n   ⚠️  Profile ID: ${profile._id}`);
        console.log(`      User: ${profile.user.full_name} (${profile.user.email})`);
        console.log(`      User Role: ${profile.user.role} (Nên là 'tutor')`);
        console.log(`      Profile Status: ${profile.status}`);
      }
    }

    if (profilesWithWrongRole === 0) {
      console.log("\n   ✅ Tất cả profiles đều có user role='tutor'");
    } else {
      console.log(`\n   ⚠️  Có ${profilesWithWrongRole} profiles có user không phải tutor`);
    }

    console.log("\n" + "=".repeat(80));
    console.log("\n💡 GIẢI THÍCH:");
    console.log("   - Admin thấy 8 tutors vì filter theo role='tutor' trong User collection");
    console.log("   - Learner chỉ thấy 2 tutors vì API /tutors/search filter theo status trong TutorProfile");
    console.log("   - Cần đảm bảo:");
    console.log("     1. Users có role='tutor' phải có TutorProfile tương ứng");
    console.log("     2. TutorProfile phải có status='approved' hoặc 'pending' để hiển thị");
    console.log("=".repeat(80));

  } catch (error) {
    console.error("❌ Lỗi:", error);
    throw error;
  }
};

const main = async () => {
  try {
    await connectDB();
    await checkTutorStatus();
    console.log("\n✅ HOÀN THÀNH KIỂM TRA!");
  } catch (error) {
    console.error("❌ Lỗi:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Đã đóng kết nối MongoDB");
    process.exit(0);
  }
};

main();
