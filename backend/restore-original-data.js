const mongoose = require('mongoose');
const TutorProfile = require('./src/models/TutorProfile');
const User = require('./src/models/User');

async function restoreOriginalData() {
  try {
    await mongoose.connect('mongodb+srv://HieuTD:qbTXXCEIn1G4veK5@learnmate.6rejkx4.mongodb.net/?retryWrites=true&w=majority&appName=LearnMate');
    console.log('Connected to MongoDB Atlas');

    // Tìm Nghia Phan
    const nghiaPhan = await User.findOne({ email: 'nghiaphan583@gmail.com' });
    if (!nghiaPhan) {
      console.log('❌ Không tìm thấy Nghia Phan');
      return;
    }

    console.log('✅ Tìm thấy Nghia Phan:', nghiaPhan.full_name);

    // Tìm TutorProfile của Nghia Phan
    const tutorProfile = await TutorProfile.findOne({ user: nghiaPhan._id });
    if (!tutorProfile) {
      console.log('❌ Không tìm thấy TutorProfile cho Nghia Phan');
      return;
    }

    console.log('\n=== DỮ LIỆU GỐC TRONG DATABASE ===');
    console.log('Profile ID:', tutorProfile._id);
    console.log('User ID:', tutorProfile.user);
    console.log('AvatarUrl:', tutorProfile.avatarUrl);
    console.log('City:', tutorProfile.city);
    console.log('District:', tutorProfile.district);
    console.log('Bio:', tutorProfile.bio);
    console.log('Subjects:', tutorProfile.subjects);
    console.log('Experience Years:', tutorProfile.experienceYears);
    console.log('Session Rate:', tutorProfile.sessionRate);
    console.log('Rating:', tutorProfile.rating);
    console.log('Review Count:', tutorProfile.reviewCount);
    console.log('Status:', tutorProfile.status);
    console.log('Teach Modes:', tutorProfile.teachModes);
    console.log('Languages:', tutorProfile.languages);
    console.log('Location (if any):', tutorProfile.location);

    // Khôi phục về dữ liệu gốc (null/empty)
    console.log('\n=== KHÔI PHỤC VỀ DỮ LIỆU GỐC ===');
    const originalData = {
      city: null,
      district: null,
      bio: null,
      subjects: [],
      experienceYears: 0,
      sessionRate: 0,
      teachModes: [],
      languages: [],
      hasAvailability: false
    };

    const restoredProfile = await TutorProfile.findByIdAndUpdate(
      tutorProfile._id,
      originalData,
      { new: true }
    );

    console.log('\n✅ Đã khôi phục về dữ liệu gốc:');
    console.log('City:', restoredProfile.city);
    console.log('District:', restoredProfile.district);
    console.log('Bio:', restoredProfile.bio);
    console.log('Subjects:', restoredProfile.subjects);
    console.log('Experience Years:', restoredProfile.experienceYears);
    console.log('Session Rate:', restoredProfile.sessionRate);
    console.log('Teach Modes:', restoredProfile.teachModes);
    console.log('Languages:', restoredProfile.languages);

    await mongoose.disconnect();
    console.log('\n🎉 Đã khôi phục về dữ liệu gốc từ database!');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

restoreOriginalData();
