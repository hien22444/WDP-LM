const mongoose = require('mongoose');
const TutorProfile = require('./src/models/TutorProfile');
const User = require('./src/models/User');

async function checkAllTutorsRealData() {
  try {
    await mongoose.connect('mongodb+srv://HieuTD:qbTXXCEIn1G4veK5@learnmate.6rejkx4.mongodb.net/?retryWrites=true&w=majority&appName=LearnMate');
    console.log('Connected to MongoDB Atlas');

    // Lấy tất cả gia sư
    const tutors = await TutorProfile.find({}).populate('user');
    
    console.log(`\n📊 TỔNG QUAN: ${tutors.length} gia sư trong database`);
    console.log('='.repeat(80));

    for (let i = 0; i < tutors.length; i++) {
      const tutor = tutors[i];
      const user = tutor.user;
      
      console.log(`\n👤 GIA SƯ ${i + 1}:`);
      console.log(`Name: ${user?.full_name || 'N/A'}`);
      console.log(`Email: ${user?.email || 'N/A'}`);
      console.log(`Phone: ${user?.phone_number || 'N/A'}`);
      console.log(`Avatar: ${tutor.avatarUrl || user?.image || 'Chưa có'}`);
      console.log(`City: ${tutor.city || 'Chưa có'}`);
      console.log(`District: ${tutor.district || 'Chưa có'}`);
      console.log(`Bio: ${tutor.bio || 'Chưa có'}`);
      console.log(`Subjects: ${tutor.subjects?.length || 0} môn`);
      console.log(`Experience: ${tutor.experienceYears || 0} năm`);
      console.log(`Session Rate: ${tutor.sessionRate || 0}đ`);
      console.log(`Rating: ${tutor.rating || 0}`);
      console.log(`Status: ${tutor.status || 'N/A'}`);
      console.log(`Teach Modes: ${tutor.teachModes?.join(', ') || 'Chưa có'}`);
      console.log(`Languages: ${tutor.languages?.join(', ') || 'Chưa có'}`);
      
      // Kiểm tra dữ liệu thực tế
      const hasRealData = {
        avatar: !!(tutor.avatarUrl || user?.image),
        location: !!(tutor.city || tutor.district),
        bio: !!tutor.bio,
        subjects: !!(tutor.subjects && tutor.subjects.length > 0),
        experience: !!(tutor.experienceYears && tutor.experienceYears > 0),
        price: !!(tutor.sessionRate && tutor.sessionRate > 0),
        rating: !!(tutor.rating && tutor.rating > 0)
      };
      
      console.log(`\n📋 DỮ LIỆU THỰC TẾ:`);
      console.log(`✅ Avatar: ${hasRealData.avatar ? 'Có' : '❌ Chưa có'}`);
      console.log(`✅ Địa chỉ: ${hasRealData.location ? 'Có' : '❌ Chưa có'}`);
      console.log(`✅ Giới thiệu: ${hasRealData.bio ? 'Có' : '❌ Chưa có'}`);
      console.log(`✅ Môn dạy: ${hasRealData.subjects ? 'Có' : '❌ Chưa có'}`);
      console.log(`✅ Kinh nghiệm: ${hasRealData.experience ? 'Có' : '❌ Chưa có'}`);
      console.log(`✅ Học phí: ${hasRealData.price ? 'Có' : '❌ Chưa có'}`);
      console.log(`✅ Đánh giá: ${hasRealData.rating ? 'Có' : '❌ Chưa có'}`);
      
      const realDataCount = Object.values(hasRealData).filter(Boolean).length;
      console.log(`📊 Tổng dữ liệu thực: ${realDataCount}/7`);
      
      if (realDataCount === 0) {
        console.log('⚠️  GIA SƯ NÀY CHƯA CÓ DỮ LIỆU THỰC TẾ!');
      } else if (realDataCount < 4) {
        console.log('⚠️  GIA SƯ NÀY CÓ ÍT DỮ LIỆU THỰC TẾ!');
      } else {
        console.log('✅ GIA SƯ NÀY CÓ ĐẦY ĐỦ DỮ LIỆU THỰC TẾ!');
      }
      
      console.log('-'.repeat(80));
    }

    // Thống kê tổng quan
    const stats = {
      total: tutors.length,
      withAvatar: tutors.filter(t => t.avatarUrl || t.user?.image).length,
      withLocation: tutors.filter(t => t.city || t.district).length,
      withBio: tutors.filter(t => t.bio).length,
      withSubjects: tutors.filter(t => t.subjects && t.subjects.length > 0).length,
      withExperience: tutors.filter(t => t.experienceYears && t.experienceYears > 0).length,
      withPrice: tutors.filter(t => t.sessionRate && t.sessionRate > 0).length,
      withRating: tutors.filter(t => t.rating && t.rating > 0).length
    };

    console.log('\n📊 THỐNG KÊ TỔNG QUAN:');
    console.log(`Tổng gia sư: ${stats.total}`);
    console.log(`Có avatar: ${stats.withAvatar}/${stats.total} (${Math.round(stats.withAvatar/stats.total*100)}%)`);
    console.log(`Có địa chỉ: ${stats.withLocation}/${stats.total} (${Math.round(stats.withLocation/stats.total*100)}%)`);
    console.log(`Có giới thiệu: ${stats.withBio}/${stats.total} (${Math.round(stats.withBio/stats.total*100)}%)`);
    console.log(`Có môn dạy: ${stats.withSubjects}/${stats.total} (${Math.round(stats.withSubjects/stats.total*100)}%)`);
    console.log(`Có kinh nghiệm: ${stats.withExperience}/${stats.total} (${Math.round(stats.withExperience/stats.total*100)}%)`);
    console.log(`Có học phí: ${stats.withPrice}/${stats.total} (${Math.round(stats.withPrice/stats.total*100)}%)`);
    console.log(`Có đánh giá: ${stats.withRating}/${stats.total} (${Math.round(stats.withRating/stats.total*100)}%)`);

    await mongoose.disconnect();
    console.log('\n🎉 Hoàn thành kiểm tra dữ liệu thực tế!');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkAllTutorsRealData();
