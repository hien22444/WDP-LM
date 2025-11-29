const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Load models
require('../src/models/User');
require('../src/models/TutorProfile');
require('../src/models/TeachingSlot');
require('../src/models/Booking');
require('../src/models/Payment');
require('../src/models/Notification');

async function resetDatabase() {
  try {
    await mongoose.connect(process.env.URI_DB);
    console.log('✅ Connected to MongoDB\n');

    const User = mongoose.model('User');
    const TutorProfile = mongoose.model('TutorProfile');
    const TeachingSlot = mongoose.model('TeachingSlot');
    const Booking = mongoose.model('Booking');
    const Payment = mongoose.model('Payment');
    const Notification = mongoose.model('Notification');

    console.log('🗑️  Đang xóa tất cả dữ liệu (GIỮ LẠI Users)...\n');

    // Xóa tất cả collections EXCEPT users
    await TutorProfile.deleteMany({});
    await TeachingSlot.deleteMany({});
    await Booking.deleteMany({});
    await Payment.deleteMany({});
    await Notification.deleteMany({});
    
    // Xóa các collections khác
    const db = mongoose.connection.db;
    try {
      await db.collection('subjects').deleteMany({});
      await db.collection('tutoravailabilities').deleteMany({});
      await db.collection('teaching_sessions').deleteMany({});
      await db.collection('conversations').deleteMany({});
      await db.collection('messages').deleteMany({});
      await db.collection('reviews').deleteMany({});
    } catch (e) {
      // Ignore if collections don't exist
    }

    console.log('✅ Đã xóa hết dữ liệu (GIỮ LẠI users collection)\n');

    console.log('\n🔍 Kiểm tra collections trong database...\n');

    // Lấy danh sách collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    console.log('📦 Các collections hiện có:');
    collectionNames.forEach(name => {
      console.log(`   ✓ ${name}`);
    });

    console.log('\n📊 Thống kê dữ liệu:');
    console.log(`   • Users: ${await User.countDocuments()}`);
    console.log(`   • TutorProfiles: ${await TutorProfile.countDocuments()}`);
    console.log(`   • TeachingSlots: ${await TeachingSlot.countDocuments()}`);
    console.log(`   • Bookings: ${await Booking.countDocuments()}`);
    console.log(`   • Payments: ${await Payment.countDocuments()}`);
    console.log(`   • Notifications: ${await Notification.countDocuments()}`);

    console.log('\n═'.repeat(80));
    console.log('✅ HOÀN TẤT! Database đã clear, giữ lại Users.');
    console.log('═'.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

resetDatabase();
