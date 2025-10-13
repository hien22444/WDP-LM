const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || process.env.DB_HOST || process.env.URI_DB;
    if (!uri) throw new Error("Missing MONGO_URI or DB_HOST or URI_DB in environment");

    const safeUri = uri.replace(/(mongodb\+srv:\/\/[^:]+):[^@]+@/, '$1:****@');
    console.log('🔌 Mongo URI resolved:', safeUri);

    await mongoose.connect(uri);
    console.log("✅ Kết nối DB thành công");
  } catch (error) {
    console.error("❌ Lỗi kết nối DB:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
