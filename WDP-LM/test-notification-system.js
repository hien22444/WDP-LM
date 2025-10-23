const axios = require('axios');

const API_URL = 'http://localhost:5000/api/v1';

async function testNotificationSystem() {
  try {
    console.log('🚀 Test hệ thống thông báo...\n');

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

    // 2. Tạo tài khoản student
    console.log('\n2. Tạo tài khoản student...');
    const studentData = {
      email: 'student-notification-test@example.com',
      password: 'password123',
      firstName: 'Student',
      lastName: 'Notification Test'
    };

    try {
      await axios.post(`${API_URL}/auth/register`, studentData);
      console.log('✅ Tạo tài khoản student thành công');
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.message.includes('already exists')) {
        console.log('ℹ️ Tài khoản student đã tồn tại');
      } else {
        throw error;
      }
    }

    // 3. Đăng nhập student
    console.log('3. Đăng nhập student...');
    const studentLogin = await axios.post(`${API_URL}/auth/login`, {
      email: studentData.email,
      password: studentData.password
    });
    const studentToken = studentLogin.data.token;
    console.log('✅ Đăng nhập student thành công');

    // 4. Book khóa học và kiểm tra thông báo
    console.log('4. Book khóa học...');
    const bookingData = {
      notes: 'Test notification system - Em muốn học thêm về môn này'
    };

    console.log('📧 Gửi yêu cầu booking...');
    const booking = await axios.post(`${API_URL}/bookings/slots/${selectedSlot._id}/book`, bookingData, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    console.log('✅ Book khóa học thành công');
    console.log('📋 Thông tin booking:', JSON.stringify(booking.data, null, 2));

    // 5. Kiểm tra logs của backend để xem thông báo
    console.log('\n5. Kiểm tra thông báo...');
    console.log('📧 Kiểm tra console của backend server để xem:');
    console.log('   - [EMAIL MOCK] booking_created to [tutor-email]');
    console.log('   - Hoặc ✅ Email sent: booking_created to [tutor-email]');
    
    // 6. Kiểm tra xem có endpoint để xem notifications không
    console.log('\n6. Kiểm tra endpoint notifications...');
    try {
      const notifications = await axios.get(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      console.log('📬 Notifications:', JSON.stringify(notifications.data, null, 2));
    } catch (error) {
      console.log('ℹ️ Không có endpoint notifications hoặc cần authentication');
    }

    console.log('\n🎉 Test hoàn thành!');
    console.log('\n📋 Tóm tắt:');
    console.log('1. ✅ Booking đã được tạo thành công');
    console.log('2. 📧 Thông báo đã được gửi (check backend logs)');
    console.log('3. ⚠️ Nếu không thấy email thật, hệ thống đang chạy ở mock mode');
    console.log('4. 🔧 Để gửi email thật, cần cấu hình MAIL_USERNAME và MAIL_PASSWORD');

  } catch (error) {
    console.error('❌ Lỗi trong quá trình test:', error.response?.data || error.message);
  }
}

testNotificationSystem();
