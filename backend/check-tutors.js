const mongoose = require('mongoose');
const User = require('./src/models/User');
const TutorProfile = require('./src/models/TutorProfile');

async function checkTutors() {
  try {
    await mongoose.connect('mongodb://localhost:27017/edumatch');
    console.log('Connected to MongoDB');
    
    // Lấy tất cả users có role là tutor
    const tutors = await User.find({ role: 'tutor' }).select('fullName email phone role createdAt');
    console.log('\n=== TỔNG SỐ GIA SƯ ===');
    console.log('Số lượng gia sư:', tutors.length);
    
    if (tutors.length > 0) {
      console.log('\n=== DANH SÁCH GIA SƯ ===');
      tutors.forEach((tutor, index) => {
        console.log(`${index + 1}. ${tutor.fullName || 'Chưa có tên'}`);
        console.log(`   Email: ${tutor.email}`);
        console.log(`   Phone: ${tutor.phone || 'Chưa có'}`);
        console.log(`   Role: ${tutor.role}`);
        console.log(`   Ngày tạo: ${tutor.createdAt}`);
        console.log('---');
      });
    }
    
    // Kiểm tra tutor profiles
    const tutorProfiles = await TutorProfile.find().populate('user', 'fullName email');
    console.log('\n=== TUTOR PROFILES ===');
    console.log('Số lượng profiles:', tutorProfiles.length);
    
    if (tutorProfiles.length > 0) {
      tutorProfiles.forEach((profile, index) => {
        console.log(`${index + 1}. ${profile.user?.fullName || 'N/A'}`);
        console.log(`   Email: ${profile.user?.email || 'N/A'}`);
        console.log(`   Subjects: ${profile.subjects?.join(', ') || 'Chưa có'}`);
        console.log(`   Experience: ${profile.experience || 'Chưa có'}`);
        console.log(`   Rating: ${profile.rating || 'Chưa có'}`);
        console.log('---');
      });
    }
    
    // Kiểm tra verification status
    const verifiedTutors = await User.find({ 
      role: 'tutor',
      'tutor_verification.overall_status': 'approved'
    });
    console.log('\n=== GIA SƯ ĐÃ XÁC MINH ===');
    console.log('Số lượng gia sư đã xác minh:', verifiedTutors.length);
    
    const pendingTutors = await User.find({ 
      role: 'tutor',
      'tutor_verification.overall_status': 'pending'
    });
    console.log('Số lượng gia sư chờ xác minh:', pendingTutors.length);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkTutors();
