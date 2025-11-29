const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

require('../src/models/User');
require('../src/models/Booking');

async function cleanupUnpaidBookings() {
  try {
    await mongoose.connect(process.env.URI_DB);
    console.log('✅ Connected to MongoDB\n');

    const Booking = mongoose.model('Booking');

    const pending = await Booking.find({
      status: 'pending',
      paymentStatus: { $in: ['none', 'pending'] }
    }).populate('student', 'full_name email');

    console.log(`📊 Found ${pending.length} pending unpaid bookings:\n`);

    if (pending.length > 0) {
      pending.forEach(b => {
        console.log(`  - ${b._id} | Student: ${b.student?.full_name} | Created: ${b.createdAt}`);
      });

      console.log('\n🗑️  Deleting...');
      const result = await Booking.deleteMany({
        status: 'pending',
        paymentStatus: { $in: ['none', 'pending'] }
      });

      console.log(`✅ Deleted ${result.deletedCount} bookings`);
    } else {
      console.log('✅ No pending unpaid bookings to delete');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

cleanupUnpaidBookings();
