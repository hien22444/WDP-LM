const mongoose = require('mongoose');
const TutorProfile = require('./src/models/TutorProfile');
const User = require('./src/models/User');

async function checkNghiaPhanLocation() {
  try {
    await mongoose.connect('mongodb+srv://HieuTD:qbTXXCEIn1G4veK5@learnmate.6rejkx4.mongodb.net/?retryWrites=true&w=majority&appName=LearnMate');
    console.log('Connected to MongoDB Atlas');

    // Tìm Nghia Phan
    const nghiaPhan = await User.findOne({ email: 'nghiaphan583@gmail.com' });
    if (!nghiaPhan) {
      console.log('❌ Không tìm thấy Nghia Phan');
      return;
    }

    console.log('\n=== NGHIA PHAN USER INFO ===');
    console.log('Name:', nghiaPhan.full_name);
    console.log('Email:', nghiaPhan.email);
    console.log('Phone:', nghiaPhan.phone_number);
    console.log('Image:', nghiaPhan.image);
    console.log('Role:', nghiaPhan.role);
    console.log('Status:', nghiaPhan.status);

    // Tìm TutorProfile của Nghia Phan
    const tutorProfile = await TutorProfile.findOne({ user: nghiaPhan._id })
      .populate('user', 'full_name email phone_number image role status');

    if (!tutorProfile) {
      console.log('\n❌ Không tìm thấy TutorProfile cho Nghia Phan');
      return;
    }

    console.log('\n=== NGHIA PHAN TUTOR PROFILE ===');
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

    // Kiểm tra tất cả fields có thể chứa địa chỉ
    console.log('\n=== LOCATION FIELDS CHECK ===');
    console.log('city:', tutorProfile.city || 'null/undefined');
    console.log('district:', tutorProfile.district || 'null/undefined');
    console.log('location:', tutorProfile.location || 'null/undefined');
    console.log('address:', tutorProfile.address || 'null/undefined');
    console.log('addressLine1:', tutorProfile.addressLine1 || 'null/undefined');
    console.log('addressLine2:', tutorProfile.addressLine2 || 'null/undefined');

    // Kiểm tra schema để xem có field nào khác không
    console.log('\n=== ALL TUTOR PROFILE FIELDS ===');
    const allFields = Object.keys(tutorProfile.toObject());
    console.log('Available fields:', allFields);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkNghiaPhanLocation();
