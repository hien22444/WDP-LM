const axios = require('axios');

const API_URL = 'http://localhost:5000/api/v1';

async function testBookingFlow() {
  try {
    console.log('🚀 Test luồng booking đơn giản...\n');

    // 1. Lấy danh sách teaching slots
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
    console.log(`📚 Chọn slot: ${selectedSlot.courseName} - ${selectedSlot.tutorProfile.user.full_name}`);

    // 2. Tạo tài khoản student
    console.log('\n2. Tạo tài khoản student...');
    const studentData = {
      email: 'student-test@example.com',
      password: 'password123',
      firstName: 'Student',
      lastName: 'Test'
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

    // 4. Book khóa học
    console.log('4. Book khóa học...');
    const bookingData = {
      notes: 'Em muốn học thêm về môn này'
    };

    const booking = await axios.post(`${API_URL}/bookings/slots/${selectedSlot._id}/book`, bookingData, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    console.log('✅ Book khóa học thành công');
    console.log('📋 Thông tin booking:', JSON.stringify(booking.data, null, 2));

    // 5. Đăng nhập tutor để kiểm tra
    console.log('\n5. Đăng nhập tutor để kiểm tra...');
    
    // Tạo tài khoản tutor nếu chưa có
    const tutorData = {
      email: 'tutor-test@example.com',
      password: 'password123',
      firstName: 'Tutor',
      lastName: 'Test'
    };

    try {
      await axios.post(`${API_URL}/auth/register`, tutorData);
      console.log('✅ Tạo tài khoản tutor thành công');
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.message.includes('already exists')) {
        console.log('ℹ️ Tài khoản tutor đã tồn tại');
      } else {
        throw error;
      }
    }

    const tutorLogin = await axios.post(`${API_URL}/auth/login`, {
      email: tutorData.email,
      password: tutorData.password
    });
    const tutorToken = tutorLogin.data.token;
    console.log('✅ Đăng nhập tutor thành công');

    // 6. Kiểm tra bookings của tutor
    console.log('6. Kiểm tra bookings của tutor...');
    try {
      const tutorBookings = await axios.get(`${API_URL}/bookings/me`, {
        headers: { Authorization: `Bearer ${tutorToken}` }
      });
      console.log('📋 Bookings của tutor:');
      console.log(JSON.stringify(tutorBookings.data, null, 2));
    } catch (error) {
      console.log('❌ Lỗi khi lấy bookings của tutor:', error.response?.data || error.message);
    }

    // 7. Kiểm tra teaching slots của tutor
    console.log('7. Kiểm tra teaching slots của tutor...');
    try {
      const tutorSlots = await axios.get(`${API_URL}/bookings/slots/me`, {
        headers: { Authorization: `Bearer ${tutorToken}` }
      });
      console.log('📚 Teaching slots của tutor:');
      console.log(JSON.stringify(tutorSlots.data, null, 2));
    } catch (error) {
      console.log('❌ Lỗi khi lấy teaching slots của tutor:', error.response?.data || error.message);
    }

    console.log('\n🎉 Test hoàn thành!');

  } catch (error) {
    console.error('❌ Lỗi trong quá trình test:', error.response?.data || error.message);
  }
}

testBookingFlow();
