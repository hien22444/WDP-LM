const mongoose = require('mongoose');
const TutorProfile = require('./src/models/TutorProfile');
const User = require('./src/models/User');

async function updateRealDataForTutors() {
  try {
    await mongoose.connect('mongodb+srv://HieuTD:qbTXXCEIn1G4veK5@learnmate.6rejkx4.mongodb.net/?retryWrites=true&w=majority&appName=LearnMate');
    console.log('Connected to MongoDB Atlas');

    // Lấy tất cả gia sư
    const tutors = await TutorProfile.find({}).populate('user');
    
    console.log(`\n🔄 CẬP NHẬT DỮ LIỆU THỰC TẾ CHO ${tutors.length} GIA SƯ`);
    console.log('='.repeat(80));

    let updatedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < tutors.length; i++) {
      const tutor = tutors[i];
      const user = tutor.user;
      
      console.log(`\n👤 GIA SƯ ${i + 1}: ${user?.full_name || 'N/A'}`);
      
      // Kiểm tra dữ liệu thực tế hiện tại
      const hasRealData = {
        avatar: !!(tutor.avatarUrl || user?.image),
        location: !!(tutor.city || tutor.district),
        bio: !!tutor.bio,
        subjects: !!(tutor.subjects && tutor.subjects.length > 0),
        experience: !!(tutor.experienceYears && tutor.experienceYears > 0),
        price: !!(tutor.sessionRate && tutor.sessionRate > 0)
      };
      
      const realDataCount = Object.values(hasRealData).filter(Boolean).length;
      
      if (realDataCount >= 4) {
        console.log(`✅ GIA SƯ NÀY ĐÃ CÓ DỮ LIỆU THỰC TẾ (${realDataCount}/6)`);
        console.log(`   - Avatar: ${hasRealData.avatar ? '✅' : '❌'}`);
        console.log(`   - Địa chỉ: ${hasRealData.location ? '✅' : '❌'}`);
        console.log(`   - Giới thiệu: ${hasRealData.bio ? '✅' : '❌'}`);
        console.log(`   - Môn dạy: ${hasRealData.subjects ? '✅' : '❌'}`);
        console.log(`   - Kinh nghiệm: ${hasRealData.experience ? '✅' : '❌'}`);
        console.log(`   - Học phí: ${hasRealData.price ? '✅' : '❌'}`);
        updatedCount++;
      } else if (realDataCount > 0) {
        console.log(`⚠️  GIA SƯ NÀY CÓ ÍT DỮ LIỆU THỰC TẾ (${realDataCount}/6)`);
        console.log(`   - Avatar: ${hasRealData.avatar ? '✅' : '❌'}`);
        console.log(`   - Địa chỉ: ${hasRealData.location ? '✅' : '❌'}`);
        console.log(`   - Giới thiệu: ${hasRealData.bio ? '✅' : '❌'}`);
        console.log(`   - Môn dạy: ${hasRealData.subjects ? '✅' : '❌'}`);
        console.log(`   - Kinh nghiệm: ${hasRealData.experience ? '✅' : '❌'}`);
        console.log(`   - Học phí: ${hasRealData.price ? '✅' : '❌'}`);
        updatedCount++;
      } else {
        console.log(`❌ GIA SƯ NÀY CHƯA CÓ DỮ LIỆU THỰC TẾ`);
        console.log(`   - Cần gia sư đăng nhập và cập nhật hồ sơ`);
        skippedCount++;
      }
      
      // Nếu có dữ liệu thực tế, đảm bảo status là approved
      if (realDataCount >= 4 && tutor.status !== 'approved') {
        await TutorProfile.updateOne(
          { _id: tutor._id },
          { $set: { status: 'approved' } }
        );
        console.log(`   🔄 Đã cập nhật status thành 'approved'`);
      }
    }

    // Thống kê tổng quan
    console.log('\n📊 THỐNG KÊ CẬP NHẬT:');
    console.log(`✅ Gia sư có dữ liệu thực tế: ${updatedCount}/${tutors.length}`);
    console.log(`❌ Gia sư chưa có dữ liệu: ${skippedCount}/${tutors.length}`);
    console.log(`📈 Tỷ lệ có dữ liệu: ${Math.round(updatedCount/tutors.length*100)}%`);

    // Cập nhật các gia sư có dữ liệu tốt nhất
    const goodTutors = tutors.filter(tutor => {
      const user = tutor.user;
      const hasRealData = {
        avatar: !!(tutor.avatarUrl || user?.image),
        location: !!(tutor.city || tutor.district),
        bio: !!tutor.bio,
        subjects: !!(tutor.subjects && tutor.subjects.length > 0),
        experience: !!(tutor.experienceYears && tutor.experienceYears > 0),
        price: !!(tutor.sessionRate && tutor.sessionRate > 0)
      };
      const realDataCount = Object.values(hasRealData).filter(Boolean).length;
      return realDataCount >= 4;
    });

    console.log('\n🎯 CÁC GIA SƯ CÓ DỮ LIỆU TỐT NHẤT:');
    goodTutors.forEach((tutor, index) => {
      const user = tutor.user;
      console.log(`${index + 1}. ${user?.full_name || 'N/A'} (${user?.email || 'N/A'})`);
      console.log(`   - Địa chỉ: ${tutor.city || 'Chưa có'}`);
      console.log(`   - Môn dạy: ${tutor.subjects?.length || 0} môn`);
      console.log(`   - Kinh nghiệm: ${tutor.experienceYears || 0} năm`);
      console.log(`   - Học phí: ${tutor.sessionRate || 0}đ`);
    });

    await mongoose.disconnect();
    console.log('\n🎉 Hoàn thành cập nhật dữ liệu thực tế!');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

updateRealDataForTutors();
