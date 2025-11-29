const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Load models
require('../src/models/User');
require('../src/models/TutorProfile');

async function approveTutor() {
  try {
    await mongoose.connect(process.env.URI_DB);
    console.log('✅ Connected to MongoDB\n');

    const TutorProfile = mongoose.model('TutorProfile');

    // Find all draft tutors
    const draftTutors = await TutorProfile.find({ status: 'draft' }).populate('user', 'full_name email');
    
    if (draftTutors.length === 0) {
      console.log('❌ Không có tutor nào cần duyệt');
      await mongoose.disconnect();
      return;
    }

    console.log(`📋 Tìm thấy ${draftTutors.length} tutor chờ duyệt:\n`);
    
    for (const tutor of draftTutors) {
      console.log(`✅ Duyệt: ${tutor.user?.full_name} (${tutor.user?.email})`);
      
      tutor.status = 'approved';
      await tutor.save();
    }

    console.log('\n✅ Đã duyệt tất cả tutor!');
    
    // Verify
    console.log('\n📊 Tutor Profiles sau khi duyệt:');
    const allTutors = await TutorProfile.find().populate('user', 'full_name email');
    allTutors.forEach(t => {
      console.log(`  - ${t.user?.full_name} | Status: ${t.status} | Availability: ${t.availability?.length || 0} slots`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

approveTutor();
