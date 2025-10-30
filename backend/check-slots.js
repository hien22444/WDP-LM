const mongoose = require('mongoose');
const TeachingSlot = require('./src/models/TeachingSlot');
const TutorProfile = require('./src/models/TutorProfile');

async function checkSlots() {
  try {
    await mongoose.connect('mongodb://localhost:27017/edumatch');
    console.log('Connected to MongoDB');
    
    // Kiểm tra Teaching Slots
    const slots = await TeachingSlot.find().populate('tutorProfile', 'user').populate('tutorProfile.user', 'fullName email');
    console.log('\n=== TEACHING SLOTS ===');
    console.log('Số lượng slots:', slots.length);
    
    if (slots.length > 0) {
      slots.forEach((slot, index) => {
        console.log(`${index + 1}. ${slot.courseName || 'Chưa có tên'}`);
        console.log(`   Tutor: ${slot.tutorProfile?.user?.fullName || 'N/A'}`);
        console.log(`   Status: ${slot.status}`);
        console.log(`   Start: ${slot.start}`);
        console.log(`   Price: ${slot.price}`);
        console.log('---');
      });
    }
    
    // Kiểm tra Tutor Profiles
    const profiles = await TutorProfile.find().populate('user', 'fullName email');
    console.log('\n=== TUTOR PROFILES ===');
    console.log('Số lượng profiles:', profiles.length);
    
    if (profiles.length > 0) {
      profiles.forEach((profile, index) => {
        console.log(`${index + 1}. ${profile.user?.fullName || 'N/A'}`);
        console.log(`   Email: ${profile.user?.email || 'N/A'}`);
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

checkSlots();
