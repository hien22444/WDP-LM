const mongoose = require('mongoose');
const TeachingSlot = require('../src/models/TeachingSlot');

async function checkTeachingSlots() {
  try {
    await mongoose.connect('mongodb://localhost:27017/test');
    console.log('Connected to MongoDB (test database)');

    // Check teaching slots
    const totalSlots = await TeachingSlot.countDocuments();
    console.log('\n=== TEACHING SLOTS ===');
    console.log('Total teaching slots:', totalSlots);

    const slots = await TeachingSlot.find()
      .limit(30)
      .sort({ createdAt: -1 });

    console.log('\nRecent 30 teaching slots:');
    slots.forEach((s, idx) => {
      console.log(`\n[${idx + 1}] ID: ${s._id}`);
      console.log(`  Booking ID: ${s.booking || 'N/A'}`);
      console.log(`  Student ID: ${s.student || 'N/A'}`);
      console.log(`  Tutor ID: ${s.tutor || 'N/A'}`);
      console.log(`  Date: ${s.date}`);
      console.log(`  Start Time: ${s.startTime}`);
      console.log(`  End Time: ${s.endTime}`);
      console.log(`  Status: ${s.status}`);
      console.log(`  Day of Week: ${s.dayOfWeek}`);
      console.log(`  Week Number: ${s.weekNumber}`);
      console.log(`  Created: ${s.createdAt}`);
    });

    // Group slots by booking
    const slotsByBooking = await TeachingSlot.aggregate([
      {
        $group: {
          _id: '$booking',
          count: { $sum: 1 },
          slots: { 
            $push: { 
              date: '$date', 
              start: '$startTime', 
              end: '$endTime',
              dayOfWeek: '$dayOfWeek',
              weekNumber: '$weekNumber'
            } 
          }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    console.log('\n\n=== SLOTS GROUPED BY BOOKING ===');
    console.log('Top 10 bookings with most slots:');
    slotsByBooking.forEach((group, idx) => {
      console.log(`\n[${idx + 1}] Booking ID: ${group._id}`);
      console.log(`  Total slots: ${group.count}`);
      console.log(`  All slots:`);
      group.slots.forEach((s, i) => {
        console.log(`    [${i + 1}] Week ${s.weekNumber}, Day ${s.dayOfWeek}: ${s.date} ${s.start}-${s.end}`);
      });
    });

    // Analyze why there are so many slots
    console.log('\n\n=== ANALYSIS ===');
    const sampleBookingId = slotsByBooking[0]?._id;
    if (sampleBookingId) {
      const bookingSlots = await TeachingSlot.find({ booking: sampleBookingId });
      console.log(`\nSample Booking ${sampleBookingId} has ${bookingSlots.length} slots`);
      
      // Group by week
      const byWeek = {};
      bookingSlots.forEach(slot => {
        const week = slot.weekNumber || 'unknown';
        if (!byWeek[week]) byWeek[week] = [];
        byWeek[week].push(slot);
      });
      
      console.log('\nBreakdown by week:');
      Object.keys(byWeek).sort().forEach(week => {
        console.log(`  Week ${week}: ${byWeek[week].length} slots`);
        byWeek[week].forEach((slot, i) => {
          console.log(`    [${i + 1}] Day ${slot.dayOfWeek}: ${slot.date} ${slot.startTime}-${slot.endTime}`);
        });
      });
    }

    await mongoose.connection.close();
    console.log('\n\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTeachingSlots();
