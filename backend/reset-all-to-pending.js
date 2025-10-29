/**
 * Script: Reset All Tutors to Pending
 * Mục đích: Reset TẤT CẢ về trạng thái chờ duyệt (để test lại từ đầu)
 * 
 * CẢNH BÁO: Script này sẽ:
 * - Đặt TẤT CẢ user.role về "learner"
 * - Đặt TẤT CẢ tutor_profile.status về "pending"
 * - Chỉ dùng cho môi trường DEV/TEST
 */

require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');
const User = require('./src/models/User');
const TutorProfile = require('./src/models/TutorProfile');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function resetAllToPending() {
  try {
    console.log('\n⚠️  CẢNH BÁO: Script này sẽ reset TẤT CẢ dữ liệu về trạng thái chờ duyệt!\n');
    console.log('Thay đổi:');
    console.log('  - TẤT CẢ users có TutorProfile → role = "learner"');
    console.log('  - TẤT CẢ tutor_profiles → status = "pending"\n');

    const answer = await askQuestion('Bạn có chắc chắn muốn tiếp tục? (yes/no): ');
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Đã hủy.');
      rl.close();
      return;
    }

    // Kết nối MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/edumatch';
    await mongoose.connect(mongoUri);
    console.log('\n✅ Đã kết nối MongoDB:', mongoUri);
    console.log('---\n');

    // 1. Reset tất cả TutorProfile về pending
    console.log('🔄 Đang reset tất cả TutorProfile về pending...');
    const tutorProfiles = await TutorProfile.find({}).lean();
    
    let updatedProfiles = 0;
    for (const profile of tutorProfiles) {
      await TutorProfile.findByIdAndUpdate(profile._id, {
        status: 'pending'
      });
      updatedProfiles++;
    }
    console.log(`✅ Đã reset ${updatedProfiles} tutor profiles\n`);

    // 2. Reset tất cả user có TutorProfile về role="learner"
    console.log('🔄 Đang reset user roles về learner...');
    const userIds = tutorProfiles.map(p => p.user);
    
    const result = await User.updateMany(
      { 
        _id: { $in: userIds },
        role: { $ne: 'admin' }  // Không đổi admin
      },
      {
        $set: { role: 'learner' }
      }
    );
    console.log(`✅ Đã reset ${result.modifiedCount} users về learner\n`);

    // Hiển thị thống kê
    console.log('📊 THỐNG KÊ SAU KHI RESET:');
    
    const learnerCount = await User.countDocuments({ role: 'learner' });
    const tutorCount = await User.countDocuments({ role: 'tutor' });
    const adminCount = await User.countDocuments({ role: 'admin' });
    
    console.log(`   👤 Learners: ${learnerCount}`);
    console.log(`   🎓 Tutors: ${tutorCount}`);
    console.log(`   👨‍💼 Admins: ${adminCount}\n`);

    const pendingCount = await TutorProfile.countDocuments({ status: 'pending' });
    const approvedCount = await TutorProfile.countDocuments({ status: 'approved' });
    const rejectedCount = await TutorProfile.countDocuments({ status: 'rejected' });
    
    console.log(`   ⏳ Pending: ${pendingCount}`);
    console.log(`   ✅ Approved: ${approvedCount}`);
    console.log(`   ❌ Rejected: ${rejectedCount}\n`);

    // Hiển thị danh sách đơn chờ duyệt
    console.log('👥 DANH SÁCH ĐƠN CHỜ DUYỆT:');
    const profiles = await TutorProfile.find({ status: 'pending' })
      .populate('user', 'full_name email role')
      .limit(20)
      .lean();
    
    profiles.forEach((p, index) => {
      if (p.user) {
        console.log(`   ${index + 1}. ${p.user.full_name} (${p.user.email}) - Role: ${p.user.role}`);
      }
    });

    console.log('\n✅ Reset hoàn tất!\n');

  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Đã ngắt kết nối MongoDB');
    rl.close();
  }
}

// Chạy script
resetAllToPending();


