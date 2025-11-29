const mongoose = require('mongoose');

async function checkRawData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/test');
    console.log('Connected to MongoDB (test database)\n');

    // Get raw teaching slots
    const slots = await mongoose.connection.db.collection('teachingslots').find().limit(5).toArray();
    console.log('=== RAW TEACHING SLOTS (First 5) ===');
    slots.forEach((slot, idx) => {
      console.log(`\n[${idx + 1}]`);
      console.log(JSON.stringify(slot, null, 2));
    });

    // Get raw bookings
    const bookings = await mongoose.connection.db.collection('bookings').find().limit(3).toArray();
    console.log('\n\n=== RAW BOOKINGS (First 3) ===');
    bookings.forEach((booking, idx) => {
      console.log(`\n[${idx + 1}]`);
      console.log(JSON.stringify(booking, null, 2));
    });

    await mongoose.connection.close();
    console.log('\n\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkRawData();
