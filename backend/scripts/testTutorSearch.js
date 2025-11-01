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

const testTutorSearch = async () => {
  try {
    console.log("🔍 TEST TUTOR SEARCH API\n");
    console.log("=".repeat(80));

    // Test 1: Query với filter mặc định (giống API)
    const filter1 = {
      status: { $in: ["approved", "pending"] }
    };
    
    console.log("\n📋 Test 1: Filter mặc định");
    console.log("Filter:", JSON.stringify(filter1, null, 2));
    
    const tutors1 = await TutorProfile.find(filter1)
      .populate("user", "full_name email")
      .lean();
    
    console.log(`✅ Tìm thấy: ${tutors1.length} tutors`);
    tutors1.forEach(t => {
      console.log(`   - ${t.user?.full_name || 'N/A'} (${t.user?.email || 'N/A'}) - Status: ${t.status}`);
    });

    // Test 2: Query TẤT CẢ approved tutors
    const filter2 = {
      status: "approved"
    };
    
    console.log("\n📋 Test 2: Chỉ approved");
    console.log("Filter:", JSON.stringify(filter2, null, 2));
    
    const tutors2 = await TutorProfile.find(filter2)
      .populate("user", "full_name email role")
      .lean();
    
    console.log(`✅ Tìm thấy: ${tutors2.length} tutors`);
    tutors2.forEach(t => {
      console.log(`   - ${t.user?.full_name || 'N/A'} (${t.user?.email || 'N/A'}) - Role: ${t.user?.role || 'N/A'}`);
    });

    // Test 3: Count documents
    console.log("\n📋 Test 3: Count documents");
    const count1 = await TutorProfile.countDocuments({ status: "approved" });
    const count2 = await TutorProfile.countDocuments({ status: { $in: ["approved", "pending"] } });
    const countAll = await TutorProfile.countDocuments({});
    
    console.log(`   - Approved: ${count1}`);
    console.log(`   - Approved + Pending: ${count2}`);
    console.log(`   - Total: ${countAll}`);

    // Test 4: Check user population
    console.log("\n📋 Test 4: Check tutors có user null");
    const tutorsWithoutUser = await TutorProfile.find({
      status: { $in: ["approved", "pending"] }
    }).populate("user").lean();
    
    const nullUsers = tutorsWithoutUser.filter(t => !t.user);
    console.log(`   - Tutors có user null: ${nullUsers.length}`);
    if (nullUsers.length > 0) {
      nullUsers.forEach(t => {
        console.log(`     ⚠️  Profile ID: ${t._id} - User ID: ${t.user} (NULL)`);
      });
    }

    // Test 5: Simulate API query với limit
    console.log("\n📋 Test 5: Simulate API query (limit=20, page=1)");
    const page = 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    
    const apiFilter = {
      status: { $in: ["approved", "pending"] }
    };
    
    const apiTutors = await TutorProfile.find(apiFilter)
      .populate("user", "full_name image phone_number email")
      .sort({ rating: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    console.log(`   - Query returned: ${apiTutors.length} tutors`);
    console.log(`   - Tutors with valid user:`);
    apiTutors.forEach(t => {
      const hasUser = !!t.user;
      console.log(`     ${hasUser ? '✅' : '❌'} ${t.user?.full_name || 'NO USER'} - ID: ${t._id}`);
    });

    console.log("\n" + "=".repeat(80));

  } catch (error) {
    console.error("❌ Lỗi:", error);
    throw error;
  }
};

const main = async () => {
  try {
    await connectDB();
    await testTutorSearch();
    console.log("\n✅ HOÀN THÀNH TEST!");
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
