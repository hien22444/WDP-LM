/**
 * Script to remove old verify_token fields from all users
 * This migration is needed after switching from email verification links to OTP system
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../src/models/User");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/learnmate";

async function removeVerifyTokens() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    console.log("\n🔍 Finding users with verify_token...");
    const usersWithToken = await User.countDocuments({
      $or: [
        { verify_token: { $ne: null } },
        { verify_token_expires: { $ne: null } },
      ],
    });
    console.log(`📊 Found ${usersWithToken} users with verify_token fields`);

    if (usersWithToken === 0) {
      console.log("✨ No migration needed. All users already clean!");
      process.exit(0);
    }

    console.log("\n🧹 Removing verify_token and verify_token_expires from all users...");
    const result = await User.updateMany(
      {},
      {
        $unset: {
          verify_token: "",
          verify_token_expires: "",
        },
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} users`);
    console.log("\n📋 Summary:");
    console.log(`   - Users matched: ${result.matchedCount}`);
    console.log(`   - Users modified: ${result.modifiedCount}`);
    console.log(`   - Users acknowledged: ${result.acknowledged ? "Yes" : "No"}`);

    console.log("\n✨ Migration completed successfully!");
    console.log("💡 All users now use OTP verification instead of email links");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  console.log("🚀 Starting verify_token removal migration...\n");
  removeVerifyTokens();
}

module.exports = removeVerifyTokens;
