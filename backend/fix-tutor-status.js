/**
 * Script: Fix Tutor Profile Status
 * Mục đích: Đồng bộ lại status của tutor_profiles dựa trên role của user
 * 
 * Logic:
 * - Nếu user.role = "learner" → tutor_profile.status = "pending" (chờ duyệt)
 * - Nếu user.role = "tutor" → tutor_profile.status = "approved" (đã duyệt)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const TutorProfile = require('./src/models/TutorProfile');

async function fixTutorStatus() {
  try {
    console.log('🔧 Bắt đầu fix tutor status...\n');

    // Kết nối MongoDB
    const mongoUri = process.env.MONGO_URI || process.env.DB_HOST || process.env.URI_DB || 'mongodb://localhost:27017';
    await mongoose.connect(mongoUri, {
      dbName: 'test' // CRITICAL: Backend đang dùng database 'test'
    });
    const safeUri = mongoUri.replace(/(mongodb\+srv:\/\/[^:]+):[^@]+@/, '$1:****@');
    console.log('✅ Đã kết nối MongoDB:', safeUri);
    console.log('✅ Database: test');
    console.log('---\n');

    // Lấy tất cả TutorProfile
    const tutorProfiles = await TutorProfile.find({}).populate('user').lean();
    console.log(`📊 Tổng số tutor profiles: ${tutorProfiles.length}\n`);

    let fixedCount = 0;
    let alreadyCorrectCount = 0;
    let noUserCount = 0;

    for (const profile of tutorProfiles) {
      if (!profile.user) {
        console.log(`⚠️  Profile ${profile._id} không có user (đã bị xóa)`);
        noUserCount++;
        continue;
      }

      const userRole = profile.user.role;
      const currentStatus = profile.status;
      let expectedStatus;

      // Xác định status mong muốn dựa vào role
      if (userRole === 'learner') {
        expectedStatus = 'pending';  // Chờ duyệt
      } else if (userRole === 'tutor') {
        expectedStatus = 'approved'; // Đã duyệt
      } else {
        // admin hoặc role khác, giữ nguyên
        expectedStatus = currentStatus;
      }

      if (currentStatus !== expectedStatus) {
        // Cần fix
        console.log(`🔄 Fixing Profile: ${profile._id}`);
        console.log(`   User: ${profile.user.full_name} (${profile.user.email})`);
        console.log(`   Role: ${userRole}`);
        console.log(`   Current Status: ${currentStatus} → Expected: ${expectedStatus}`);
        
        await TutorProfile.findByIdAndUpdate(profile._id, {
          status: expectedStatus
        });
        
        console.log(`   ✅ Updated!\n`);
        fixedCount++;
      } else {
        // Đã đúng rồi
        alreadyCorrectCount++;
      }
    }

    console.log('\n📊 KẾT QUẢ:');
    console.log(`   ✅ Đã fix: ${fixedCount} profiles`);
    console.log(`   ✔️  Đã đúng từ trước: ${alreadyCorrectCount} profiles`);
    console.log(`   ⚠️  Không có user: ${noUserCount} profiles`);
    console.log(`   📊 Tổng: ${tutorProfiles.length} profiles\n`);

    // Hiển thị thống kê sau khi fix
    console.log('📈 THỐNG KÊ SAU KHI FIX:');
    
    const pendingCount = await TutorProfile.countDocuments({ status: 'pending' });
    const approvedCount = await TutorProfile.countDocuments({ status: 'approved' });
    const rejectedCount = await TutorProfile.countDocuments({ status: 'rejected' });
    const draftCount = await TutorProfile.countDocuments({ status: 'draft' });
    
    console.log(`   ⏳ Pending (Chờ duyệt): ${pendingCount}`);
    console.log(`   ✅ Approved (Đã duyệt): ${approvedCount}`);
    console.log(`   ❌ Rejected (Từ chối): ${rejectedCount}`);
    console.log(`   📝 Draft (Nháp): ${draftCount}\n`);

    // Hiển thị chi tiết người chờ duyệt
    console.log('👥 DANH SÁCH ĐƠN CHỜ DUYỆT (role=learner):');
    const pendingProfiles = await TutorProfile.find({ status: 'pending' })
      .populate('user', 'full_name email role')
      .lean();
    
    pendingProfiles.forEach((p, index) => {
      if (p.user) {
        console.log(`   ${index + 1}. ${p.user.full_name} (${p.user.email}) - Role: ${p.user.role}`);
      }
    });

    console.log('\n✅ Hoàn thành!\n');

  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Đã ngắt kết nối MongoDB');
  }
}

// Chạy script
fixTutorStatus();

