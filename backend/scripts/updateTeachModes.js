const mongoose = require("mongoose");
require("dotenv").config();

const TutorProfile = require("../src/models/TutorProfile");

async function updateTeachModes() {
  try {
    // Connect to MongoDB (use same DB as server)
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/test");
    console.log("✅ Connected to MongoDB");

    // Update the specific tutor
    const tutorId = "6912ea95632743326fda0082";
    
    const result = await TutorProfile.findByIdAndUpdate(
      tutorId,
      { $set: { teachModes: ["online", "offline"] } },
      { new: true }
    );

    if (result) {
      console.log("✅ Updated tutor teachModes:");
      console.log("   ID:", result._id);
      console.log("   Name:", result.user);
      console.log("   Teach Modes:", result.teachModes);
    } else {
      console.log("❌ Tutor not found");
    }

    // Optionally update ALL tutors without teachModes
    const bulkUpdate = await TutorProfile.updateMany(
      { $or: [{ teachModes: { $exists: false } }, { teachModes: [] }] },
      { $set: { teachModes: ["online", "offline"] } }
    );

    console.log(`\n✅ Updated ${bulkUpdate.modifiedCount} tutors with default teachModes`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

updateTeachModes();
