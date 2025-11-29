const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Load models
require('../src/models/TutorProfile');

async function testCleanup() {
  try {
    await mongoose.connect(process.env.URI_DB);
    console.log('✅ Connected to MongoDB\n');

    const TutorProfile = mongoose.model('TutorProfile');

    console.log('═'.repeat(80));
    console.log('🧪 TEST CLEANUP REJECTED TUTOR PROFILES');
    console.log('═'.repeat(80));

    // 1. Kiểm tra profiles hiện tại
    const allProfiles = await TutorProfile.find({}).populate('user', 'email full_name');
    console.log(`\n📊 Total profiles: ${allProfiles.length}`);
    
    const statusCount = {};
    allProfiles.forEach(p => {
      statusCount[p.status] = (statusCount[p.status] || 0) + 1;
    });
    console.log('Status distribution:', statusCount);

    // 2. Tìm profiles bị reject
    const rejectedProfiles = await TutorProfile.find({ status: 'rejected' }).populate('user', 'email full_name');
    console.log(`\n🔍 Rejected profiles: ${rejectedProfiles.length}`);

    if (rejectedProfiles.length > 0) {
      rejectedProfiles.forEach(p => {
        const daysSinceRejected = Math.floor((Date.now() - new Date(p.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
        console.log(`   - ${p.user?.email || 'N/A'} - Rejected ${daysSinceRejected} days ago`);
      });
    }

    // 3. Tìm profiles cần xóa (>30 ngày)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const toDelete = await TutorProfile.find({
      status: 'rejected',
      updatedAt: { $lt: thirtyDaysAgo }
    }).populate('user', 'email full_name');

    console.log(`\n🗑️  Profiles to delete (rejected >30 days): ${toDelete.length}`);

    if (toDelete.length > 0) {
      console.log('\n⚠️  Các profiles sau sẽ bị xóa:');
      toDelete.forEach(p => {
        const daysSinceRejected = Math.floor((Date.now() - new Date(p.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
        console.log(`   - ${p.user?.email || 'N/A'} (ID: ${p._id}, ${daysSinceRejected} days)`);
      });

      // Hỏi user có muốn xóa không
      console.log('\n❓ Bạn có muốn XÓA các profiles này không?');
      console.log('   (Để test, bạn có thể uncomment dòng delete bên dưới)\n');

      // UNCOMMENT DÒNG NÀY ĐỂ THẬT SỰ XÓA:
      // const result = await TutorProfile.deleteMany({
      //   status: 'rejected',
      //   updatedAt: { $lt: thirtyDaysAgo }
      // });
      // console.log(`✅ Đã xóa ${result.deletedCount} profiles!`);

      console.log('ℹ️  Để xóa, uncomment dòng delete trong script này.');
    } else {
      console.log('✅ Không có profile nào cần xóa (rejected >30 days)');
    }

    console.log('\n═'.repeat(80));
    console.log('✅ TEST HOÀN TẤT');
    console.log('═'.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testCleanup();
