const mongoose = require('mongoose');
const User = require('./src/models/User');
const TutorProfile = require('./src/models/TutorProfile');
const TeachingSlot = require('./src/models/TeachingSlot');

async function checkAtlasDB() {
  try {
    // Sử dụng cùng connection string như backend
    await mongoose.connect('mongodb+srv://HieuTD:qbTXXCEIn1G4veK5@learnmate.6rejkx4.mongodb.net/?retryWrites=true&w=majority&appName=LearnMate');
    console.log('Connected to MongoDB Atlas');
    
    // Kiểm tra users
    const users = await User.find();
    console.log('\n=== USERS TRONG ATLAS ===');
    console.log('Số lượng users:', users.length);
    
    if (users.length > 0) {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.fullName || user.full_name || 'Chưa có tên'}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Status: ${user.status || 'N/A'}`);
        console.log(`   Verified: ${user.isEmailVerified || user.isVerified || 'N/A'}`);
        console.log('---');
      });
      
      // Kiểm tra users có role = tutor
      const tutors = await User.find({ role: 'tutor' });
      console.log('\n=== USERS CÓ ROLE TUTOR ===');
      console.log('Số lượng:', tutors.length);
      
      if (tutors.length > 0) {
        tutors.forEach((tutor, index) => {
          console.log(`${index + 1}. ${tutor.fullName || tutor.full_name || 'Chưa có tên'}`);
          console.log(`   Email: ${tutor.email}`);
          console.log(`   Role: ${tutor.role}`);
          console.log(`   Status: ${tutor.status || 'N/A'}`);
          console.log('---');
        });
      }
    }
    
    // Kiểm tra tutor profiles
    const profiles = await TutorProfile.find().populate('user', 'fullName full_name email role');
    console.log('\n=== TUTOR PROFILES ===');
    console.log('Số lượng profiles:', profiles.length);
    
    if (profiles.length > 0) {
      profiles.forEach((profile, index) => {
        console.log(`${index + 1}. ${profile.user?.fullName || profile.user?.full_name || 'N/A'}`);
        console.log(`   Email: ${profile.user?.email || 'N/A'}`);
        console.log(`   Role: ${profile.user?.role || 'N/A'}`);
        console.log(`   Status: ${profile.status}`);
        console.log(`   Subjects: ${profile.subjects?.join(', ') || 'Chưa có'}`);
        console.log(`   Experience: ${profile.experience || 'Chưa có'}`);
        console.log(`   Rating: ${profile.rating || 'Chưa có'}`);
        console.log('---');
      });
    }
    
    // Kiểm tra teaching slots
    const slots = await TeachingSlot.find().populate('tutorProfile', 'user').populate('tutorProfile.user', 'fullName full_name email');
    console.log('\n=== TEACHING SLOTS ===');
    console.log('Số lượng slots:', slots.length);
    
    if (slots.length > 0) {
      slots.forEach((slot, index) => {
        console.log(`${index + 1}. ${slot.courseName || 'Chưa có tên'}`);
        console.log(`   Subject: ${slot.subject || 'N/A'}`);
        console.log(`   Status: ${slot.status || 'N/A'}`);
        console.log(`   Start: ${slot.start || 'N/A'}`);
        console.log(`   Price: ${slot.price || 'N/A'}`);
        console.log(`   Tutor: ${slot.tutorProfile?.user?.fullName || slot.tutorProfile?.user?.full_name || 'N/A'}`);
        console.log('---');
      });
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkAtlasDB();
