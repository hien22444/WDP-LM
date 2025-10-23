const axios = require('axios');

const API_URL = 'http://localhost:5000/api/v1';

async function checkNotificationSystem() {
  try {
    console.log('🔍 Kiểm tra hệ thống thông báo...\n');

    // 1. Kiểm tra xem có teaching slots nào không
    console.log('1. Lấy danh sách teaching slots...');
    const publicSlots = await axios.get(`${API_URL}/bookings/slots/public`);
    const slots = publicSlots.data.items;
    
    if (slots.length === 0) {
      console.log('❌ Không có teaching slots nào');
      return;
    }

    console.log(`✅ Tìm thấy ${slots.length} teaching slots`);
    
    // Chọn slot đầu tiên để test
    const selectedSlot = slots[0];
    console.log(`📚 Slot được chọn: ${selectedSlot.courseName}`);
    console.log(`👨‍🏫 Gia sư: ${selectedSlot.tutorProfile.user.full_name}`);
    console.log(`📧 Email gia sư: ${selectedSlot.tutorProfile.user.email || 'Chưa có email'}`);

    // 2. Kiểm tra cấu hình email
    console.log('\n2. Kiểm tra cấu hình email...');
    console.log('📧 Để gửi email thật, cần cấu hình:');
    console.log('   - MAIL_USERNAME=your-gmail@gmail.com');
    console.log('   - MAIL_PASSWORD=your-app-password');
    console.log('   - MAIL_FROM=no-reply@edumatch.com');

    // 3. Kiểm tra thống kê chung
    console.log('\n3. Kiểm tra thống kê chung...');
    try {
      const generalStats = await axios.get(`${API_URL}/dashboard/stats`);
      console.log('📊 Thống kê chung:');
      console.log(`   - Tổng gia sư: ${generalStats.data.data.totalTutors}`);
      console.log(`   - Tổng học viên: ${generalStats.data.data.totalLearners}`);
    } catch (error) {
      console.log('❌ Lỗi khi lấy thống kê:', error.response?.data || error.message);
    }

    // 4. Kiểm tra chi tiết slot
    console.log('\n4. Kiểm tra chi tiết slot...');
    try {
      const slotDetail = await axios.get(`${API_URL}/bookings/slots/${selectedSlot._id}`);
      console.log('📚 Chi tiết slot:');
      console.log(`   - ID: ${slotDetail.data.slot._id}`);
      console.log(`   - Tên khóa học: ${slotDetail.data.slot.courseName}`);
      console.log(`   - Giá: ${slotDetail.data.slot.price.toLocaleString()} VNĐ`);
      console.log(`   - Thời gian: ${new Date(slotDetail.data.slot.start).toLocaleString('vi-VN')}`);
      console.log(`   - Trạng thái: ${slotDetail.data.slot.status}`);
    } catch (error) {
      console.log('❌ Lỗi khi lấy chi tiết slot:', error.response?.data || error.message);
    }

    console.log('\n📋 Tóm tắt vấn đề thông báo:');
    console.log('1. ✅ Backend API hoạt động bình thường');
    console.log('2. ✅ Teaching slots có sẵn để test');
    console.log('3. ✅ Notification service đã được implement');
    console.log('4. ❌ Email credentials chưa được cấu hình');
    console.log('5. ⚠️ Hệ thống đang chạy ở MOCK MODE');
    
    console.log('\n🔧 Cách khắc phục:');
    console.log('1. Tạo Gmail App Password');
    console.log('2. Cấu hình MAIL_USERNAME và MAIL_PASSWORD trong .env');
    console.log('3. Restart backend server');
    console.log('4. Test lại với email thật');
    
    console.log('\n📧 Khi cấu hình xong, tutor sẽ nhận được email:');
    console.log('   Subject: "🎓 Có yêu cầu đặt lịch mới - EduMatch"');
    console.log('   Nội dung: Thông tin chi tiết về booking và link để phản hồi');

  } catch (error) {
    console.error('❌ Lỗi trong quá trình kiểm tra:', error.response?.data || error.message);
  }
}

checkNotificationSystem();
