const mongoose = require('mongoose');
const TutorProfile = require('./src/models/TutorProfile');

// MongoDB connection
const MONGODB_URI = 'mongodb://localhost:27017/test';

async function checkTutorDetails() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Lấy tutor profile mới nhất
    const tutor = await TutorProfile.findOne()
      .populate('user', 'full_name email phone_number image')
      .sort({ createdAt: -1 });

    if (!tutor) {
      console.log('❌ Không tìm thấy tutor nào');
      return;
    }

    console.log('📋 Tutor Profile Details:');
    console.log('ID:', tutor._id);
    console.log('User ID:', tutor.user?._id);
    console.log('Name:', tutor.user?.full_name);
    console.log('Email:', tutor.user?.email);
    console.log('Phone:', tutor.user?.phone_number);
    console.log('User Image:', tutor.user?.image);
    console.log('Tutor AvatarUrl:', tutor.avatarUrl);
    console.log('Status:', tutor.status);
    console.log('Subjects:', tutor.subjects);
    console.log('Experience:', tutor.experienceYears);
    console.log('Session Rate:', tutor.sessionRate);

    // Test API endpoint
    console.log('\n🔍 Testing API endpoint...');
    const response = await fetch(`http://localhost:5000/api/tutors/${tutor._id}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:');
      console.log('Name:', data.name);
      console.log('Avatar:', data.avatar);
      console.log('AvatarUrl:', data.avatarUrl);
      console.log('User Image:', data.user?.image);
    } else {
      console.log('❌ API Error:', response.status, response.statusText);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkTutorDetails();
