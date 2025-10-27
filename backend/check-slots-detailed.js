const mongoose = require('mongoose');
const TeachingSlot = require('./src/models/TeachingSlot');

async function checkSlots() {
  try {
    await mongoose.connect('mongodb://localhost:27017/edumatch');
    console.log('Connected to MongoDB');
    
    // Kiểm tra tất cả slots
    const allSlots = await TeachingSlot.find();
    console.log('Tổng số slots:', allSlots.length);
    
    // Kiểm tra slots có status = 'open'
    const openSlots = await TeachingSlot.find({ status: 'open' });
    console.log('Số slots mở:', openSlots.length);
    
    // Kiểm tra slots trong tương lai
    const now = new Date();
    const futureSlots = await TeachingSlot.find({ 
      status: 'open', 
      start: { $gte: now } 
    });
    console.log('Số slots mở trong tương lai:', futureSlots.length);
    
    if (futureSlots.length > 0) {
      console.log('\n=== SLOTS MỞ TRONG TƯƠNG LAI ===');
      futureSlots.forEach((slot, index) => {
        console.log(`${index + 1}. ${slot.courseName || 'Chưa có tên'}`);
        console.log(`   Status: ${slot.status}`);
        console.log(`   Start: ${slot.start}`);
        console.log(`   Price: ${slot.price}`);
        console.log('---');
      });
    }
    
    // Kiểm tra tất cả slots với populate
    const allSlotsWithPopulate = await TeachingSlot.find()
      .populate('tutorProfile', 'user')
      .populate('tutorProfile.user', 'fullName email');
    
    console.log('\n=== TẤT CẢ SLOTS (VỚI POPULATE) ===');
    console.log('Số lượng:', allSlotsWithPopulate.length);
    
    if (allSlotsWithPopulate.length > 0) {
      allSlotsWithPopulate.forEach((slot, index) => {
        console.log(`${index + 1}. ${slot.courseName || 'Chưa có tên'}`);
        console.log(`   Tutor: ${slot.tutorProfile?.user?.fullName || 'N/A'}`);
        console.log(`   Status: ${slot.status}`);
        console.log(`   Start: ${slot.start}`);
        console.log(`   Price: ${slot.price}`);
        console.log('---');
      });
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkSlots();
