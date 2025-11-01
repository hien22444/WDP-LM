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

const fixTutorData = async () => {
  try {
    console.log("🔧 BẮT ĐẦU SỬA DỮ LIỆU GIA SƯ\n");
    console.log("=".repeat(80));

    let fixed = 0;

    // 1. Tìm tất cả TutorProfiles có user không phải role="tutor"
    const allProfiles = await TutorProfile.find({})
      .populate("user", "full_name email role")
      .lean();

    console.log("\n📋 Kiểm tra và sửa TutorProfiles có user role sai:\n");

    for (const profile of allProfiles) {
      if (profile.user && profile.user.role !== "tutor") {
        console.log(`⚠️  Profile ID: ${profile._id}`);
        console.log(`   User: ${profile.user.full_name} (${profile.user.email})`);
        console.log(`   Current Role: ${profile.user.role}`);
        console.log(`   Profile Status: ${profile.status}`);

        // Cập nhật role của user thành "tutor"
        await User.findByIdAndUpdate(profile.user._id, { role: "tutor" });
        
        console.log(`   ✅ Đã cập nhật role thành "tutor"\n`);
        fixed++;
      }
    }

    // 2. Tìm các TutorProfiles có status="draft" và cập nhật thành "approved"
    console.log("\n📋 Kiểm tra và sửa TutorProfiles có status='draft':\n");

    const draftProfiles = await TutorProfile.find({ status: "draft" })
      .populate("user", "full_name email")
      .lean();

    for (const profile of draftProfiles) {
      console.log(`⚠️  Profile ID: ${profile._id}`);
      console.log(`   User: ${profile.user?.full_name || "N/A"} (${profile.user?.email || "N/A"})`);
      console.log(`   Current Status: ${profile.status}`);

      // Cập nhật status thành "approved"
      await TutorProfile.findByIdAndUpdate(profile._id, { status: "approved" });
      
      console.log(`   ✅ Đã cập nhật status thành "approved"\n`);
      fixed++;
    }

    console.log("=".repeat(80));
    console.log(`\n✅ Đã sửa ${fixed} bản ghi\n`);

    // 3. Hiển thị thống kê sau khi sửa
    console.log("📊 THỐNG KÊ SAU KHI SỬA:\n");

    const totalUsers = await User.countDocuments();
    const tutorUsers = await User.countDocuments({ role: "tutor" });
    const totalProfiles = await TutorProfile.countDocuments();
    const approvedProfiles = await TutorProfile.countDocuments({ status: "approved" });
    const pendingProfiles = await TutorProfile.countDocuments({ status: "pending" });
    const draftProfiles2 = await TutorProfile.countDocuments({ status: "draft" });

    console.log("👥 USERS:");
    console.log(`   Tổng số users: ${totalUsers}`);
    console.log(`   Users có role='tutor': ${tutorUsers}`);

    console.log("\n👨‍🏫 TUTOR PROFILES:");
    console.log(`   Tổng số profiles: ${totalProfiles}`);
    console.log(`   - Approved: ${approvedProfiles}`);
    console.log(`   - Pending: ${pendingProfiles}`);
    console.log(`   - Draft: ${draftProfiles2}`);

    console.log("\n💡 KẾT QUẢ:");
    console.log(`   ✅ Admin sẽ thấy: ${tutorUsers} tutors (filter theo User.role='tutor')`);
    console.log(`   ✅ Learner sẽ thấy: ${approvedProfiles + pendingProfiles} tutors (filter theo TutorProfile.status)`);

  } catch (error) {
    console.error("❌ Lỗi:", error);
    throw error;
  }
};

const main = async () => {
  try {
    await connectDB();
    await fixTutorData();
    console.log("\n✅ HOÀN THÀNH SỬA DỮ LIỆU!");
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
