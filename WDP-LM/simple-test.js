const axios = require('axios');

const API_URL = 'http://localhost:5000/api/v1';

async function testBookingFlow() {
  try {
    console.log('🚀 Test luồng booking đơn giản...\n');

    // 1. Kiểm tra xem có teaching slots nào không
    console.log('1. Kiểm tra teaching slots công khai...');
    try {
      const publicSlots = await axios.get(`${API_URL}/bookings/slots/public`);
      console.log('📚 Teaching slots có sẵn:');
      console.log(JSON.stringify(publicSlots.data, null, 2));
    } catch (error) {
      console.log('❌ Không có teaching slots:', error.response?.data || error.message);
    }

    // 2. Kiểm tra xem có bookings nào không
    console.log('\n2. Kiểm tra bookings...');
    try {
      const bookings = await axios.get(`${API_URL}/bookings`);
      console.log('📋 Bookings có sẵn:');
      console.log(JSON.stringify(bookings.data, null, 2));
    } catch (error) {
      console.log('❌ Không có bookings:', error.response?.data || error.message);
    }

    // 3. Kiểm tra dashboard
    console.log('\n3. Kiểm tra dashboard...');
    try {
      const dashboard = await axios.get(`${API_URL}/dashboard/tutor`);
      console.log('📊 Dashboard tutor:');
      console.log(JSON.stringify(dashboard.data, null, 2));
    } catch (error) {
      console.log('❌ Không thể truy cập dashboard:', error.response?.data || error.message);
    }

    console.log('\n✅ Test hoàn thành!');

  } catch (error) {
    console.error('❌ Lỗi:', error.response?.data || error.message);
  }
}

testBookingFlow();
