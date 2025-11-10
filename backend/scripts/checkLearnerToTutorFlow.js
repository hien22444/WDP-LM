const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Load models
require('../src/models/User');
require('../src/models/TutorProfile');

async function checkLearnerToTutorFlow() {
  try {
    await mongoose.connect(process.env.URI_DB);
    console.log('✅ Connected to MongoDB\n');

    const User = mongoose.model('User');
    const TutorProfile = mongoose.model('TutorProfile');

    // 1. Tìm tất cả users có role=learner HOẶC tutor
    const allUsers = await User.find({
      role: { $in: ['learner', 'tutor'] }
    }).select('_id name email role createdAt').lean();

    console.log(`👥 Total users (learner + tutor): ${allUsers.length}\n`);

    // 2. Tìm tất cả TutorProfiles
    const allProfiles = await TutorProfile.find({}).select('user status createdAt').lean();
    console.log(`📋 Total TutorProfiles: ${allProfiles.length}\n`);

    // 3. Tạo map của profiles theo userId
    const profileMap = new Map();
    allProfiles.forEach(profile => {
      profileMap.set(profile.user.toString(), profile);
    });

    // 4. Phân loại users
    const learners = [];
    const tutorsWithProfile = [];
    const tutorsWithoutProfile = [];
    const learnersWithProfile = []; // Learner đã nộp đơn nhưng chưa được duyệt

    allUsers.forEach(user => {
      const profile = profileMap.get(user._id.toString());
      
      if (user.role === 'learner') {
        if (profile) {
          // Learner có profile = đã nộp đơn đăng ký tutor
          learnersWithProfile.push({
            ...user,
            profileStatus: profile.status,
            profileCreated: profile.createdAt
          });
        } else {
          // Learner thuần túy, chưa nộp đơn
          learners.push(user);
        }
      } else if (user.role === 'tutor') {
        if (profile) {
          tutorsWithProfile.push({
            ...user,
            profileStatus: profile.status,
            profileCreated: profile.createdAt
          });
        } else {
          // BUG: Tutor không có profile!
          tutorsWithoutProfile.push(user);
        }
      }
    });

    // 5. In kết quả
    console.log('=' .repeat(60));
    console.log('📊 PHÂN LOẠI USERS:');
    console.log('=' .repeat(60));

    console.log(`\n1️⃣ Pure Learners (chưa nộp đơn): ${learners.length}`);
    learners.forEach(u => {
      console.log(`   - ${u.name} (${u.email})`);
      console.log(`     User ID: ${u._id}`);
    });

    console.log(`\n2️⃣ Learners ĐÃ NỘP ĐƠN (có TutorProfile): ${learnersWithProfile.length}`);
    learnersWithProfile.forEach(u => {
      console.log(`   - ${u.name} (${u.email})`);
      console.log(`     User ID: ${u._id}`);
      console.log(`     Profile Status: ${u.profileStatus}`);
      console.log(`     User created: ${u.createdAt}`);
      console.log(`     Profile created: ${u.profileCreated}`);
    });

    console.log(`\n3️⃣ Approved Tutors (role=tutor + profile): ${tutorsWithProfile.length}`);
    tutorsWithProfile.forEach(u => {
      console.log(`   - ${u.name} (${u.email})`);
      console.log(`     User ID: ${u._id}`);
      console.log(`     Profile Status: ${u.profileStatus}`);
    });

    console.log(`\n4️⃣ ❌ BUG: Tutors KHÔNG CÓ profile: ${tutorsWithoutProfile.length}`);
    if (tutorsWithoutProfile.length > 0) {
      console.log('   ⚠️ USERS SAU ĐÂY CÓ ROLE=TUTOR NHƯNG KHÔNG CÓ TUTORPROFILE:');
      tutorsWithoutProfile.forEach(u => {
        console.log(`   - ${u.name} (${u.email})`);
        console.log(`     User ID: ${u._id}`);
        console.log(`     Created: ${u.createdAt}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('🔍 PHÂN TÍCH LUỒNG:');
    console.log('='.repeat(60));
    console.log(`✅ Learners chưa nộp đơn: ${learners.length}`);
    console.log(`📝 Learners đã nộp đơn (pending): ${learnersWithProfile.filter(u => u.profileStatus === 'pending').length}`);
    console.log(`⏳ Learners đang chờ duyệt (draft): ${learnersWithProfile.filter(u => u.profileStatus === 'draft').length}`);
    console.log(`✅ Tutors đã được duyệt: ${tutorsWithProfile.length}`);
    console.log(`❌ Tutors THIẾU profile (BUG): ${tutorsWithoutProfile.length}`);

    // 6. Kiểm tra orphaned profiles
    const userIds = new Set(allUsers.map(u => u._id.toString()));
    const orphanedProfiles = allProfiles.filter(p => !userIds.has(p.user.toString()));
    
    console.log(`\n👻 Orphaned profiles (user đã bị xóa): ${orphanedProfiles.length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkLearnerToTutorFlow();
