const axios = require('axios');

const API_URL = 'http://localhost:5000/api/v1';

async function testExistingData() {
  try {
    console.log('🚀 Test với dữ liệu có sẵn...\n');

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
    console.log(`📚 Slot được chọn: ${selectedSlot.courseName}`);
    console.log(`👨‍🏫 Gia sư: ${selectedSlot.tutorProfile.user.full_name}`);
    console.log(`💰 Giá: ${selectedSlot.price.toLocaleString()} VNĐ`);
    console.log(`📅 Thời gian: ${new Date(selectedSlot.start).toLocaleString('vi-VN')}`);

    // 2. Kiểm tra xem có bookings nào không
    console.log('\n2. Kiểm tra bookings hiện có...');
    try {
      // Thử lấy bookings công khai (nếu có endpoint)
      const bookings = await axios.get(`${API_URL}/bookings/public`);
      console.log('📋 Bookings công khai:', JSON.stringify(bookings.data, null, 2));
    } catch (error) {
      console.log('ℹ️ Không có endpoint bookings công khai hoặc không có bookings');
    }

    // 3. Kiểm tra dashboard công khai
    console.log('\n3. Kiểm tra thống kê chung...');
    try {
      const generalStats = await axios.get(`${API_URL}/dashboard/stats`);
      console.log('📊 Thống kê chung:');
      console.log(JSON.stringify(generalStats.data, null, 2));
    } catch (error) {
      console.log('❌ Lỗi khi lấy thống kê:', error.response?.data || error.message);
    }

    // 4. Kiểm tra chi tiết slot
    console.log('\n4. Kiểm tra chi tiết slot...');
    try {
      const slotDetail = await axios.get(`${API_URL}/bookings/slots/${selectedSlot._id}`);
      console.log('📚 Chi tiết slot:');
      console.log(JSON.stringify(slotDetail.data, null, 2));
    } catch (error) {
      console.log('❌ Lỗi khi lấy chi tiết slot:', error.response?.data || error.message);
    }

    // 5. Thống kê slots theo gia sư
    console.log('\n5. Thống kê slots theo gia sư...');
    const tutorStats = {};
    slots.forEach(slot => {
      const tutorName = slot.tutorProfile.user.full_name;
      if (!tutorStats[tutorName]) {
        tutorStats[tutorName] = {
          totalSlots: 0,
          totalPrice: 0,
          subjects: new Set()
        };
      }
      tutorStats[tutorName].totalSlots++;
      tutorStats[tutorName].totalPrice += slot.price;
      tutorStats[tutorName].subjects.add(slot.courseName);
    });

    console.log('👨‍🏫 Thống kê gia sư:');
    Object.entries(tutorStats).forEach(([tutorName, stats]) => {
      console.log(`- ${tutorName}: ${stats.totalSlots} slots, ${stats.totalPrice.toLocaleString()} VNĐ, ${stats.subjects.size} môn học`);
    });

    // 6. Thống kê theo thời gian
    console.log('\n6. Thống kê theo thời gian...');
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const slotsThisWeek = slots.filter(slot => {
      const slotDate = new Date(slot.start);
      return slotDate >= now && slotDate <= nextWeek;
    });

    const slotsNextMonth = slots.filter(slot => {
      const slotDate = new Date(slot.start);
      return slotDate >= now && slotDate <= nextMonth;
    });

    console.log(`📅 Slots tuần này: ${slotsThisWeek.length}`);
    console.log(`📅 Slots tháng tới: ${slotsNextMonth.length}`);

    // 7. Thống kê theo giá
    console.log('\n7. Thống kê theo giá...');
    const prices = slots.map(slot => slot.price).sort((a, b) => a - b);
    const minPrice = prices[0];
    const maxPrice = prices[prices.length - 1];
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;

    console.log(`💰 Giá thấp nhất: ${minPrice.toLocaleString()} VNĐ`);
    console.log(`💰 Giá cao nhất: ${maxPrice.toLocaleString()} VNĐ`);
    console.log(`💰 Giá trung bình: ${Math.round(avgPrice).toLocaleString()} VNĐ`);

    console.log('\n🎉 Test hoàn thành! Hệ thống có dữ liệu phong phú để test.');

  } catch (error) {
    console.error('❌ Lỗi trong quá trình test:', error.response?.data || error.message);
  }
}

testExistingData();
