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

const fixAdminRole = async () => {
  try {
    console.log("🔧 BẮT ĐẦU SỬA ROLE ADMIN\n");
    console.log("=".repeat(80));

    // Danh sách email admin cần giữ nguyên role
    const adminEmails = [
      "admin@edumatch.vn",
      "admin@learnmate.vn",
      "admin2@edumatch.local",
      "nghiaptde170572@fpt.edu.vn",
      "quandhde180741@fpt.edu.vn",
      "hienttde180775@fpt.edu.vn",
      "tungptde180798@fpt.edu.vn"
    ];

    console.log("📋 Danh sách email admin cần kiểm tra:");
    adminEmails.forEach(email => console.log(`   - ${email}`));
    console.log("");

    let fixed = 0;

    for (const email of adminEmails) {
      const user = await User.findOne({ email });
      
      if (user) {
        if (user.role !== "admin") {
          console.log(`⚠️  User: ${user.full_name} (${email})`);
          console.log(`   Current Role: ${user.role}`);
          
          // Cập nhật role thành admin
          await User.findByIdAndUpdate(user._id, { role: "admin" });
          console.log(`   ✅ Đã cập nhật role thành "admin"\n`);
          fixed++;
        } else {
          console.log(`✅ User: ${user.full_name} (${email}) - Đã là admin\n`);
        }
      } else {
        console.log(`⚠️  Không tìm thấy user với email: ${email}\n`);
      }
    }

    // Xóa TutorProfiles của admin (nếu có)
    console.log("\n📋 Kiểm tra và xóa TutorProfiles của admin:\n");
    
    const adminUsers = await User.find({ 
      email: { $in: adminEmails },
      role: "admin" 
    });

    for (const admin of adminUsers) {
      const profile = await TutorProfile.findOne({ user: admin._id });
      
      if (profile) {
        console.log(`⚠️  Tìm thấy TutorProfile của admin: ${admin.full_name}`);
        console.log(`   Profile ID: ${profile._id}`);
        
        // Xóa profile
        await TutorProfile.findByIdAndDelete(profile._id);
        console.log(`   ✅ Đã xóa TutorProfile\n`);
        fixed++;
      }
    }

    console.log("=".repeat(80));
    console.log(`\n✅ Đã sửa ${fixed} bản ghi\n`);

    // Hiển thị thống kê
    console.log("📊 THỐNG KÊ SAU KHI SỬA:\n");

    const totalUsers = await User.countDocuments();
    const adminCount = await User.countDocuments({ role: "admin" });
    const tutorCount = await User.countDocuments({ role: "tutor" });
    const studentCount = await User.countDocuments({ role: "student" });
    const totalProfiles = await TutorProfile.countDocuments();

    console.log("👥 USERS:");
    console.log(`   Tổng số users: ${totalUsers}`);
    console.log(`   - Admin: ${adminCount}`);
    console.log(`   - Tutor: ${tutorCount}`);
    console.log(`   - Student: ${studentCount}`);

    console.log("\n👨‍🏫 TUTOR PROFILES:");
    console.log(`   Tổng số profiles: ${totalProfiles}`);

    console.log("\n💡 KẾT QUẢ:");
    console.log(`   ✅ Admin có thể truy cập: ${adminCount} accounts`);
    console.log(`   ✅ Tutors hiển thị cho learner: ${tutorCount} tutors`);

  } catch (error) {
    console.error("❌ Lỗi:", error);
    throw error;
  }
};

const main = async () => {
  try {
    await connectDB();
    await fixAdminRole();
    console.log("\n✅ HOÀN THÀNH SỬA ROLE ADMIN!");
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
