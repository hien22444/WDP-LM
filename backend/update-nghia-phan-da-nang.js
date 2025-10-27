const mongoose = require('mongoose');
const TutorProfile = require('./src/models/TutorProfile');
const User = require('./src/models/User');

async function updateNghiaPhanToDaNang() {
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

    console.log('✅ Tìm thấy TutorProfile:', tutorProfile._id);

    // Cập nhật địa chỉ thành Đà Nẵng
    const updateData = {
      city: 'Đà Nẵng',           // ← Cập nhật thành Đà Nẵng
      district: 'Quận Hải Châu',  // ← Quận phổ biến ở Đà Nẵng
      bio: 'Gia sư Toán với 2 năm kinh nghiệm, chuyên dạy Toán cấp 2 và cấp 3 tại Đà Nẵng.',
      subjects: [
        { name: 'Toán cấp 2', level: 'THCS' },
        { name: 'Toán cấp 3', level: 'THPT' },
        { name: 'Vật lý', level: 'THPT' }
      ],
      experienceYears: 2,
      sessionRate: 200000,
      teachModes: ['online', 'offline'],
      languages: ['Tiếng Việt', 'Tiếng Anh'],
      hasAvailability: true
    };

    const updatedProfile = await TutorProfile.findByIdAndUpdate(
      tutorProfile._id,
      updateData,
      { new: true }
    );

    console.log('\n✅ Đã cập nhật địa chỉ thành Đà Nẵng:');
    console.log('City:', updatedProfile.city);
    console.log('District:', updatedProfile.district);
    console.log('Bio:', updatedProfile.bio);
    console.log('Subjects:', updatedProfile.subjects);
    console.log('Experience Years:', updatedProfile.experienceYears);
    console.log('Session Rate:', updatedProfile.sessionRate);
    console.log('Teach Modes:', updatedProfile.teachModes);
    console.log('Languages:', updatedProfile.languages);

    await mongoose.disconnect();
    console.log('\n🎉 Cập nhật thành công! Bây giờ Nghia Phan ở Đà Nẵng.');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

updateNghiaPhanToDaNang();
