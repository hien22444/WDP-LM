const mongoose = require('mongoose');
const User = require('./src/models/User');
const TutorProfile = require('./src/models/TutorProfile');

async function checkTestDB() {
  try {
    // Kết nối đến database 'test' thay vì 'edumatch'
    await mongoose.connect('mongodb://localhost:27017/test');
    console.log('Connected to MongoDB database: test');
    
    // Kiểm tra tất cả users
    const allUsers = await User.find();
    console.log('Tổng số users:', allUsers.length);
    
    if (allUsers.length > 0) {
      console.log('\n=== TẤT CẢ USERS ===');
      allUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.full_name || user.fullName || 'Chưa có tên'}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Status: ${user.status || 'N/A'}`);
        console.log(`   Verified: ${user.isEmailVerified || user.isVerified || 'N/A'}`);
        console.log('---');
      });
    }
    
    // Kiểm tra users có role = tutor
    const tutors = await User.find({ role: 'tutor' });
    console.log('\n=== USERS CÓ ROLE TUTOR ===');
    console.log('Số lượng:', tutors.length);
    
    if (tutors.length > 0) {
      tutors.forEach((tutor, index) => {
        console.log(`${index + 1}. ${tutor.full_name || tutor.fullName || 'Chưa có tên'}`);
        console.log(`   Email: ${tutor.email}`);
        console.log(`   Role: ${tutor.role}`);
        console.log(`   Status: ${tutor.status || 'N/A'}`);
        console.log(`   Verified: ${tutor.isEmailVerified || tutor.isVerified || 'N/A'}`);
        console.log('---');
      });
    }
    
    // Kiểm tra tutor profiles
    const profiles = await TutorProfile.find().populate('user', 'full_name fullName email role');
    console.log('\n=== TUTOR PROFILES ===');
    console.log('Số lượng profiles:', profiles.length);
    
    if (profiles.length > 0) {
      profiles.forEach((profile, index) => {
        console.log(`${index + 1}. ${profile.user?.full_name || profile.user?.fullName || 'N/A'}`);
        console.log(`   Email: ${profile.user?.email || 'N/A'}`);
        console.log(`   Role: ${profile.user?.role || 'N/A'}`);
        console.log(`   Status: ${profile.status}`);
        console.log(`   Subjects: ${profile.subjects?.join(', ') || 'Chưa có'}`);
        console.log('---');
      });
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkTestDB();
