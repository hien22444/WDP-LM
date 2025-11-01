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

const checkTutorUserRef = async () => {
  try {
    console.log("🔍 KIỂM TRA USER REFERENCE TRONG TUTOR PROFILES\n");
    console.log("=".repeat(80));

    // Lấy tất cả approved tutors
    const tutors = await TutorProfile.find({
      status: { $in: ["approved", "pending"] }
    }).lean();

    console.log(`\n📋 Tổng số tutors (approved + pending): ${tutors.length}\n`);

    let validCount = 0;
    let invalidCount = 0;

    for (const tutor of tutors) {
      console.log(`\n🔍 Checking Profile ID: ${tutor._id}`);
      console.log(`   User Reference: ${tutor.user}`);
      console.log(`   Status: ${tutor.status}`);

      // Check if user exists
      const user = await User.findById(tutor.user);
      
      if (user) {
        console.log(`   ✅ User EXISTS: ${user.full_name} (${user.email})`);
        console.log(`   User Role: ${user.role}`);
        console.log(`   User Status: ${user.status}`);
        validCount++;
      } else {
        console.log(`   ❌ User NOT FOUND! (Orphaned profile)`);
        invalidCount++;
      }
    }

    console.log("\n" + "=".repeat(80));
    console.log(`\n📊 SUMMARY:`);
    console.log(`   ✅ Valid tutors (có user): ${validCount}`);
    console.log(`   ❌ Invalid tutors (không có user): ${invalidCount}`);
    console.log(`   📊 Total: ${tutors.length}`);

    if (invalidCount > 0) {
      console.log(`\n⚠️  CÓ ${invalidCount} TUTOR PROFILES KHÔNG CÓ USER!`);
      console.log(`   → Đây có thể là nguyên nhân API chỉ trả về ${validCount} tutors`);
    }

  } catch (error) {
    console.error("❌ Lỗi:", error);
    throw error;
  }
};

const main = async () => {
  try {
    await connectDB();
    await checkTutorUserRef();
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
