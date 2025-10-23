const axios = require('axios');

const API_URL = 'http://localhost:5000/api/v1';

// Test data
const testTutor = {
  email: 'tutor@test.com',
  password: 'password123',
  firstName: 'Gia sư',
  lastName: 'Test'
};

const testStudent = {
  email: 'student@test.com', 
  password: 'password123',
  firstName: 'Học viên',
  lastName: 'Test'
};

let tutorToken = '';
let studentToken = '';
let tutorProfileId = '';
let teachingSlotId = '';

async function testBookingFlow() {
  try {
    console.log('🚀 Bắt đầu test luồng booking...\n');

    // 1. Tạo tài khoản tutor
    console.log('1. Tạo tài khoản tutor...');
    try {
      await axios.post(`${API_URL}/auth/register`, testTutor);
      console.log('✅ Tạo tài khoản tutor thành công');
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.message.includes('already exists')) {
        console.log('ℹ️ Tài khoản tutor đã tồn tại');
      } else {
        throw error;
      }
    }

    // 2. Tạo tài khoản student
    console.log('2. Tạo tài khoản student...');
    try {
      await axios.post(`${API_URL}/auth/register`, testStudent);
      console.log('✅ Tạo tài khoản student thành công');
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.message.includes('already exists')) {
        console.log('ℹ️ Tài khoản student đã tồn tại');
      } else {
        throw error;
      }
    }

    // 3. Đăng nhập tutor
    console.log('3. Đăng nhập tutor...');
    const tutorLogin = await axios.post(`${API_URL}/auth/login`, {
      email: testTutor.email,
      password: testTutor.password
    });
    tutorToken = tutorLogin.data.token;
    console.log('✅ Đăng nhập tutor thành công');

    // 3.1. Cập nhật role cho tutor
    console.log('3.1. Cập nhật role cho tutor...');
    await axios.patch(`${API_URL}/dashboard/admin/user-role`, {
      userId: tutorLogin.data.user.id,
      newRole: 'tutor'
    }, {
      headers: { Authorization: `Bearer ${tutorToken}` }
    });
    console.log('✅ Cập nhật role tutor thành công');

    // 4. Đăng nhập student
    console.log('4. Đăng nhập student...');
    const studentLogin = await axios.post(`${API_URL}/auth/login`, {
      email: testStudent.email,
      password: testStudent.password
    });
    studentToken = studentLogin.data.token;
    console.log('✅ Đăng nhập student thành công');

    // 5. Tạo tutor profile
    console.log('5. Tạo tutor profile...');
    try {
      const tutorProfile = await axios.post(`${API_URL}/tutor/profile`, {
        title: 'Gia sư Toán học',
        subjects: ['Toán học', 'Vật lý'],
        teachModes: ['online', 'offline'],
        sessionRate: 200000,
        city: 'Hà Nội',
        description: 'Gia sư có kinh nghiệm 5 năm dạy Toán'
      }, {
        headers: { Authorization: `Bearer ${tutorToken}` }
      });
      tutorProfileId = tutorProfile.data.profile._id;
      console.log('✅ Tạo tutor profile thành công');
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.message.includes('already exists')) {
        // Lấy profile hiện có
        const existingProfile = await axios.get(`${API_URL}/tutor/profile`, {
          headers: { Authorization: `Bearer ${tutorToken}` }
        });
        tutorProfileId = existingProfile.data.profile._id;
        console.log('ℹ️ Tutor profile đã tồn tại');
      } else {
        throw error;
      }
    }

    // 6. Tạo teaching slot
    console.log('6. Tạo teaching slot...');
    const slotData = {
      courseName: 'Toán 12 - Hình học không gian',
      mode: 'online',
      price: 200000,
      capacity: 1,
      notes: 'Khóa học dành cho học sinh lớp 12',
      recurringType: 'single',
      start: new Date(Date.now() + 24 * 60 * 60 * 1000), // Ngày mai
      end: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000) // 2 tiếng sau
    };

    const teachingSlot = await axios.post(`${API_URL}/bookings/slots`, slotData, {
      headers: { Authorization: `Bearer ${tutorToken}` }
    });
    teachingSlotId = teachingSlot.data.slot._id;
    console.log('✅ Tạo teaching slot thành công');

    // 7. Student book khóa học
    console.log('7. Student book khóa học...');
    const bookingData = {
      slotId: teachingSlotId,
      notes: 'Em muốn học thêm về hình học không gian'
    };

    const booking = await axios.post(`${API_URL}/bookings/slots/${teachingSlotId}/book`, bookingData, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    console.log('✅ Student book khóa học thành công');

    // 8. Kiểm tra tutor có thấy booking không
    console.log('8. Kiểm tra tutor có thấy booking không...');
    const tutorBookings = await axios.get(`${API_URL}/bookings/me`, {
      headers: { Authorization: `Bearer ${tutorToken}` }
    });
    
    console.log('📋 Danh sách booking của tutor:');
    console.log(JSON.stringify(tutorBookings.data, null, 2));

    // 9. Kiểm tra teaching slots của tutor
    console.log('9. Kiểm tra teaching slots của tutor...');
    const tutorSlots = await axios.get(`${API_URL}/bookings/slots/me`, {
      headers: { Authorization: `Bearer ${tutorToken}` }
    });
    
    console.log('📚 Danh sách teaching slots của tutor:');
    console.log(JSON.stringify(tutorSlots.data, null, 2));

    // 10. Kiểm tra dashboard của tutor
    console.log('10. Kiểm tra dashboard của tutor...');
    const tutorDashboard = await axios.get(`${API_URL}/dashboard/tutor`, {
      headers: { Authorization: `Bearer ${tutorToken}` }
    });
    
    console.log('📊 Dashboard của tutor:');
    console.log(JSON.stringify(tutorDashboard.data, null, 2));

    console.log('\n🎉 Test hoàn thành! Tutor có thể thấy booking và teaching slots.');

  } catch (error) {
    console.error('❌ Lỗi trong quá trình test:', error.response?.data || error.message);
  }
}

// Chạy test
testBookingFlow();
