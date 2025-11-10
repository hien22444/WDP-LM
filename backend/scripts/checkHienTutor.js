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

const User = mongoose.model('User', new mongoose.Schema({}, { 
  strict: false, 
  collection: 'users' 
}));

async function checkHienTutor() {
  try {
    const uri = process.env.URI_DB || process.env.MONGO_URI || process.env.DATABASE_URI;
    if (!uri) {
      console.error('❌ URI_DB not found in .env');
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    const userId = '6906dc64a7aca0567d5f3510';
    
    // Tìm user
    const user = await User.findById(userId);
    if (!user) {
      console.error('❌ User không tồn tại');
      process.exit(1);
    }

    console.log('\n👤 USER INFO:');
    console.log('_id:', user._id);
    console.log('full_name:', user.full_name);
    console.log('email:', user.email);
    console.log('role:', user.role);
    console.log('status:', user.status);

    // Tìm TutorProfile
    const profile = await TutorProfile.findOne({ user: userId });
    
    console.log('\n📋 TUTOR PROFILE:');
    if (profile) {
      console.log('✅ CÓ PROFILE');
      console.log('_id:', profile._id);
      console.log('status:', profile.status);
      console.log('sessionRate:', profile.sessionRate);
      console.log('subjects:', profile.subjects);
      console.log('bio:', profile.bio);
    } else {
      console.log('❌ KHÔNG CÓ PROFILE');
      console.log('👉 Cần tạo TutorProfile cho gia sư này');
    }

    // Tìm TeachingSlots
    if (profile) {
      const slots = await TeachingSlot.find({ tutorProfile: profile._id });
      
      console.log('\n📅 TEACHING SLOTS:');
      if (slots.length > 0) {
        console.log(`✅ CÓ ${slots.length} SLOT(S)`);
        slots.forEach((slot, idx) => {
          console.log(`\nSlot ${idx + 1}:`);
          console.log('  _id:', slot._id);
          console.log('  courseName:', slot.courseName);
          console.log('  price:', slot.price);
          console.log('  status:', slot.status);
          console.log('  start:', slot.start);
          console.log('  end:', slot.end);
        });
      } else {
        console.log('❌ KHÔNG CÓ SLOT');
        console.log('👉 Cần tạo TeachingSlot cho gia sư này');
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Done');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkHienTutor();
