const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Load models
require('../src/models/User');
require('../src/models/TutorProfile');

async function checkTutors() {
  try {
    await mongoose.connect(process.env.URI_DB);
    console.log('✅ Connected to MongoDB\n');

    const User = mongoose.model('User');
    const TutorProfile = mongoose.model('TutorProfile');

    const users = await User.find();
    console.log(`📊 Total Users: ${users.length}`);
    users.forEach(u => {
      console.log(`  - ${u.full_name} (${u.email}) | Role: ${u.role}`);
    });

    console.log('\n📊 Tutor Profiles:');
    const tutors = await TutorProfile.find().populate('user', 'full_name email');
    console.log(`Total: ${tutors.length}\n`);
    
    if (tutors.length === 0) {
      console.log('❌ Không có tutor profile nào!');
      console.log('\n💡 Để tạo tutor:');
      console.log('   1. Đăng ký tài khoản (role: learner)');
      console.log('   2. Nộp đơn gia sư qua /api/v1/tutors/me');
      console.log('   3. Admin duyệt đơn (status: approved)');
      console.log('   4. Tutor set availability pattern');
    } else {
      tutors.forEach(t => {
        console.log(`  - ${t.user?.full_name || 'N/A'}`);
        console.log(`    Status: ${t.status}`);
        console.log(`    Availability: ${t.availability?.length || 0} slots`);
        console.log(`    hasAvailability: ${t.hasAvailability}`);
        if (t.availability && t.availability.length > 0) {
          t.availability.forEach(a => {
            console.log(`      • Day ${a.dayOfWeek}: ${a.start}-${a.end}`);
          });
        }
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkTutors();
