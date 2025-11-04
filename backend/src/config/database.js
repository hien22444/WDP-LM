// database.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri =
      process.env.MONGO_URI || process.env.DB_HOST || process.env.URI_DB;
    if (!uri)
      throw new Error("Missing MONGO_URI or DB_HOST or URI_DB in environment");

    // Mask password for log
    const safeUri = uri.replace(/(mongodb\+srv:\/\/[^:]+):[^@]+@/, "$1:****@");
    console.log("🔌 Mongo URI resolved:", safeUri);

    // Connect to 'test' database explicitly
    await mongoose.connect(uri, {
      dbName: "test", // CRITICAL: Use test database where your data lives
      useNewUrlParser: true,
      useUnifiedTopology: true,
      retryWrites: true,
      w: "majority",
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ Kết nối DB thành công - Database: test");
    console.log(
      "📊 Bạn có thể kiểm tra dữ liệu trong Atlas at: https://cloud.mongodb.com/"
    );
  } catch (error) {
    console.error("❌ Lỗi kết nối DB:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
