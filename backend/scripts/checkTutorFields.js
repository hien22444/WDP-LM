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

const checkTutorFields = async () => {
  try {
    console.log("🔍 KIỂM TRA sessionRate VÀ rating CỦA TUTORS\n");
    console.log("=".repeat(80));

    // Lấy tất cả approved tutors
    const tutors = await TutorProfile.find({
      status: { $in: ["approved", "pending"] }
    }).populate("user", "full_name email").lean();

    console.log(`\n📋 Tổng số tutors: ${tutors.length}\n`);

    let withSessionRate = 0;
    let withoutSessionRate = 0;
    let withRating = 0;
    let withoutRating = 0;

    tutors.forEach(tutor => {
      const hasSessionRate = tutor.sessionRate !== null && tutor.sessionRate !== undefined;
      const hasRating = tutor.rating !== null && tutor.rating !== undefined;
      
      console.log(`\n📋 ${tutor.user?.full_name || 'N/A'}`);
      console.log(`   Profile ID: ${tutor._id}`);
      console.log(`   sessionRate: ${tutor.sessionRate} (${hasSessionRate ? '✅ HAS' : '❌ NULL/UNDEFINED'})`);
      console.log(`   rating: ${tutor.rating} (${hasRating ? '✅ HAS' : '❌ NULL/UNDEFINED'})`);
      
      if (hasSessionRate) withSessionRate++;
      else withoutSessionRate++;
      
      if (hasRating) withRating++;
      else withoutRating++;
    });

    console.log("\n" + "=".repeat(80));
    console.log(`\n📊 SUMMARY:`);
    console.log(`   sessionRate:`);
    console.log(`     ✅ Có giá trị: ${withSessionRate}`);
    console.log(`     ❌ NULL/undefined: ${withoutSessionRate}`);
    console.log(`   rating:`);
    console.log(`     ✅ Có giá trị: ${withRating}`);
    console.log(`     ❌ NULL/undefined: ${withoutRating}`);

    console.log(`\n💡 GIẢI THÍCH:`);
    console.log(`   Filter đang dùng: { sessionRate: { $lte: 10000000 }, rating: { $lte: 5 } }`);
    console.log(`   → MongoDB $lte không match với NULL/undefined!`);
    console.log(`   → Chỉ ${Math.min(withSessionRate, withRating)} tutors match cả 2 điều kiện`);

    // Test filter giống API
    console.log(`\n🔍 TEST FILTER GIỐNG API:`);
    const apiFilter = {
      status: { $in: ["approved", "pending"] },
      sessionRate: { $lte: 10000000 },
      rating: { $lte: 5 }
    };
    
    const matchingTutors = await TutorProfile.find(apiFilter).populate("user", "full_name").lean();
    console.log(`   Filter: ${JSON.stringify(apiFilter, null, 2)}`);
    console.log(`   Kết quả: ${matchingTutors.length} tutors`);
    matchingTutors.forEach(t => {
      console.log(`     - ${t.user?.full_name} (sessionRate: ${t.sessionRate}, rating: ${t.rating})`);
    });

  } catch (error) {
    console.error("❌ Lỗi:", error);
    throw error;
  }
};

const main = async () => {
  try {
    await connectDB();
    await checkTutorFields();
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
