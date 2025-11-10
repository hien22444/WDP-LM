#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const TutorProfile = mongoose.model('TutorProfile', new mongoose.Schema({}, { 
  strict: false, 
  collection: 'tutor_profiles' 
}));

const TeachingSlot = mongoose.model('TeachingSlot', new mongoose.Schema({}, { 
  strict: false, 
  collection: 'teaching_slots' 
}));

async function setupHienTutor() {
  try {
    const uri = process.env.URI_DB;
    if (!uri) {
      console.error('❌ URI_DB not found');
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    const userId = '6906dc64a7aca0567d5f3510';

    // 1. Tạo TutorProfile
    console.log('\n📝 Creating TutorProfile...');
    const profile = await TutorProfile.create({
      user: userId,
      bio: 'Gia sư kinh nghiệm tại Đà Nẵng, chuyên dạy các môn học cấp trung học và đại học.',
      subjects: [
        {
          name: 'Mathematics',
          level: 'University',
          price: 100000
        },
        {
          name: 'Physics',
          level: 'High School',
          price: 80000
        }
      ],
      sessionRate: 100000,
      experience: 3,
      education: 'Đại học Đà Nẵng',
      certifications: ['Bằng cử nhân Toán học', 'Chứng chỉ sư phạm'],
      availability: {
        monday: [{ start: '08:00', end: '17:00' }],
        tuesday: [{ start: '08:00', end: '17:00' }],
        wednesday: [{ start: '08:00', end: '17:00' }],
        thursday: [{ start: '08:00', end: '17:00' }],
        friday: [{ start: '08:00', end: '17:00' }],
        saturday: [{ start: '09:00', end: '12:00' }]
      },
      status: 'approved',
      rating: 0,
      totalReviews: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ TutorProfile created:', profile._id);

    // 2. Tạo TeachingSlot cho môn Mathematics
    console.log('\n📝 Creating TeachingSlot for Mathematics...');
    const slot = await TeachingSlot.create({
      tutorProfile: profile._id,
      start: new Date('2025-11-15T08:00:00Z'),
      end: new Date('2025-11-15T10:00:00Z'),
      mode: 'offline',
      price: 100000,
      courseCode: 'MATH101',
      courseName: 'Mathematics',
      location: 'Đà Nẵng',
      notes: 'Dạy toán đại học, có tài liệu học tập',
      capacity: 5,
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ TeachingSlot created:', slot._id);

    console.log('\n🎉 HOÀN THÀNH!');
    console.log('\n📋 Thông tin gia sư Hien:');
    console.log('User ID:', userId);
    console.log('Profile ID:', profile._id);
    console.log('Slot ID:', slot._id);
    console.log('Session Rate:', profile.sessionRate, 'VND');
    console.log('Subjects:', profile.subjects.map(s => s.name).join(', '));
    console.log('Status:', profile.status);
    
    console.log('\n✅ Gia sư Hien đã sẵn sàng nhận học viên!');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setupHienTutor();
