const mongoose = require('mongoose');
const Booking = require('../src/models/Booking');
const TeachingSession = require('../src/models/TeachingSession');

async function checkBookings() {
  try {
    await mongoose.connect('mongodb://localhost:27017/test');
    console.log('Connected to MongoDB (test database)');

    // Check bookings
    const totalBookings = await Booking.countDocuments();
    console.log('\n=== BOOKINGS ===');
    console.log('Total bookings:', totalBookings);

    const bookings = await Booking.find()
      .limit(10)
      .sort({ createdAt: -1 });

    console.log('\nRecent 10 bookings:');
    bookings.forEach((b, idx) => {
      console.log(`\n[${idx + 1}] ID: ${b._id}`);
      console.log(`  Type: ${b.type}`);
      console.log(`  Status: ${b.status}`);
      console.log(`  Student ID: ${b.student || 'N/A'}`);
      console.log(`  Tutor ID: ${b.tutor || 'N/A'}`);
      console.log(`  Price: ${b.price} VND`);
      console.log(`  Start: ${b.start}`);
      console.log(`  End: ${b.end}`);
      if (b.weeklySchedule) {
        console.log(`  Weekly Schedule: [${b.weeklySchedule.join(', ')}]`);
      }
      if (b.selectedSlots && b.selectedSlots.length > 0) {
        console.log(`  Selected Slots (${b.selectedSlots.length}):`);
        b.selectedSlots.forEach((slot, i) => {
          console.log(`    [${i + 1}] Day: ${slot.dayOfWeek}, Start: ${slot.start}, End: ${slot.end}`);
        });
      }
      console.log(`  Created: ${b.createdAt}`);
    });

    // Check teaching sessions
    const totalSessions = await TeachingSession.countDocuments();
    console.log('\n\n=== TEACHING SESSIONS ===');
    console.log('Total teaching sessions:', totalSessions);

    const sessions = await TeachingSession.find()
      .limit(20)
      .sort({ scheduledDate: -1 });

    console.log('\nRecent 20 teaching sessions:');
    sessions.forEach((s, idx) => {
      console.log(`\n[${idx + 1}] ID: ${s._id}`);
      console.log(`  Booking ID: ${s.booking || 'N/A'}`);
      console.log(`  Student ID: ${s.student || 'N/A'}`);
      console.log(`  Tutor ID: ${s.tutor || 'N/A'}`);
      console.log(`  Date: ${s.scheduledDate}`);
      console.log(`  Time: ${s.startTime} - ${s.endTime}`);
      console.log(`  Status: ${s.status}`);
      console.log(`  Day of Week: ${s.dayOfWeek}`);
      console.log(`  Created: ${s.createdAt}`);
    });

    // Group sessions by booking
    const sessionsByBooking = await TeachingSession.aggregate([
      {
        $group: {
          _id: '$booking',
          count: { $sum: 1 },
          sessions: { $push: { date: '$scheduledDate', start: '$startTime', end: '$endTime' } }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    console.log('\n\n=== SESSIONS GROUPED BY BOOKING ===');
    console.log('Top 10 bookings with most sessions:');
    sessionsByBooking.forEach((group, idx) => {
      console.log(`\n[${idx + 1}] Booking ID: ${group._id}`);
      console.log(`  Total sessions: ${group.count}`);
      console.log(`  First 5 sessions:`);
      group.sessions.slice(0, 5).forEach((s, i) => {
        console.log(`    [${i + 1}] ${s.date} ${s.start}-${s.end}`);
      });
    });

    await mongoose.connection.close();
    console.log('\n\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkBookings();
