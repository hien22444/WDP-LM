const mongoose = require('mongoose');
const User = require('./src/models/User');
const TutorProfile = require('./src/models/TutorProfile');

// MongoDB connection - sử dụng local database
const MONGODB_URI = 'mongodb://localhost:27017/test';

async function createTestTutor() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Tạo User trước
    const user = new User({
      full_name: 'Nghia Phan',
      email: 'nghiaphan583@gmail.com',
      phone_number: '123456789',
      role: 'tutor',
      status: 'active',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', // Avatar từ User
      profile_completed: true
    });

    await user.save();
    console.log('✅ Created user:', user._id);

    // Tạo TutorProfile
    const tutorProfile = new TutorProfile({
      user: user._id,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', // Avatar riêng cho TutorProfile
      bio: 'Gia sư có kinh nghiệm dạy Toán, Lý, Hóa',
      subjects: [
        { name: 'Toán học', level: 'Cấp 2' },
        { name: 'Vật lý', level: 'Cấp 3' },
        { name: 'Hóa học', level: 'Cấp 3' }
      ],
      experienceYears: 3,
      teachModes: ['online', 'offline'],
      sessionRate: 200000,
      city: 'Hồ Chí Minh',
      status: 'approved',
      rating: 4.8,
      totalReviews: 15
    });

    await tutorProfile.save();
    console.log('✅ Created tutor profile:', tutorProfile._id);

    // Tạo thêm 1 tutor khác để test
    const user2 = new User({
      full_name: 'Minh Nguyen',
      email: 'minhnguyen@gmail.com',
      phone_number: '0987654321',
      role: 'tutor',
      status: 'active',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      profile_completed: true
    });

    await user2.save();
    console.log('✅ Created user 2:', user2._id);

    const tutorProfile2 = new TutorProfile({
      user: user2._id,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
      bio: 'Gia sư chuyên dạy Tiếng Anh',
      subjects: [
        { name: 'Tiếng Anh', level: 'IELTS' },
        { name: 'Tiếng Anh', level: 'TOEIC' }
      ],
      experienceYears: 5,
      teachModes: ['online'],
      sessionRate: 300000,
      city: 'Hà Nội',
      status: 'approved',
      rating: 4.9,
      totalReviews: 25
    });

    await tutorProfile2.save();
    console.log('✅ Created tutor profile 2:', tutorProfile2._id);

    console.log('\n🎉 Đã tạo thành công 2 gia sư test!');
    console.log('Tutor 1 ID:', tutorProfile._id);
    console.log('Tutor 2 ID:', tutorProfile2._id);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestTutor();
