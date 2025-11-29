// Script để update teachModes cho tutor profile
require('dotenv').config();
const mongoose = require('mongoose');
const TutorProfile = require('../src/models/TutorProfile');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/learnmate';

async function updateTeachModes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Lấy tutorId từ command line hoặc dùng default
    const tutorId = process.argv[2] || '6912ea95632743326fda0082';
    
    const result = await TutorProfile.findByIdAndUpdate(
      tutorId,
      { 
        $set: { 
          teachModes: ['online', 'offline'] // Hỗ trợ cả 2
        } 
      },
      { new: true }
    );

    if (result) {
      console.log('✅ Updated tutor:', result._id);
      console.log('📚 TeachModes:', result.teachModes);
    } else {
      console.log('❌ Tutor not found with ID:', tutorId);
    }

    await mongoose.disconnect();
    console.log('✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateTeachModes();
