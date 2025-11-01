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

const setDefaultRating = async () => {
  try {
    console.log("🔧 CẬP NHẬT RATING MẶC ĐỊNH CHO TUTORS\n");
    console.log("=".repeat(80));

    // Tìm tất cả tutors có rating là null hoặc undefined
    const tutorsWithoutRating = await TutorProfile.find({
      $or: [
        { rating: null },
        { rating: { $exists: false } }
      ]
    }).populate("user", "full_name email");

    console.log(`\n📋 Tìm thấy ${tutorsWithoutRating.length} tutors không có rating\n`);

    if (tutorsWithoutRating.length === 0) {
      console.log("✅ Tất cả tutors đã có rating!");
      return;
    }

    let updated = 0;

    for (const tutor of tutorsWithoutRating) {
      console.log(`🔧 Cập nhật: ${tutor.user?.full_name || 'N/A'}`);
      console.log(`   Profile ID: ${tutor._id}`);
      console.log(`   Rating hiện tại: ${tutor.rating}`);
      
      await TutorProfile.findByIdAndUpdate(tutor._id, {
        rating: 0,
        reviewCount: 0
      });
      
      console.log(`   ✅ Đã set rating = 0, reviewCount = 0\n`);
      updated++;
    }

    console.log("=".repeat(80));
    console.log(`\n✅ Đã cập nhật ${updated} tutors`);

    // Verify
    console.log("\n📊 KIỂM TRA SAU KHI CẬP NHẬT:");
    const allTutors = await TutorProfile.find({
      status: { $in: ["approved", "pending"] }
    });
    
    const withRating = allTutors.filter(t => t.rating !== null && t.rating !== undefined);
    console.log(`   ✅ Tutors có rating: ${withRating.length}/${allTutors.length}`);

  } catch (error) {
    console.error("❌ Lỗi:", error);
    throw error;
  }
};

const main = async () => {
  try {
    await connectDB();
    await setDefaultRating();
    console.log("\n✅ HOÀN THÀNH CẬP NHẬT!");
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
