require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');
(async () => {
  const MONGO_URI = process.env.URI_DB || process.env.MONGO_URI || process.env.MONGOURL;
  if (!MONGO_URI) { console.error('Missing URI_DB'); process.exit(2); }
  try {
    await mongoose.connect(MONGO_URI, { maxPoolSize: 5 });
    console.log('Connected to MongoDB');
    const bookings = await mongoose.connection.db.collection('bookings').find({}).sort({ createdAt: -1 }).limit(10).toArray();
    console.log('Total bookings found:', bookings.length);
    bookings.forEach(b => {
      console.log(`id=${b._id} tutorProfile=${b.tutorProfile} student=${b.student} slotId=${b.slotId || 'NULL'} status=${b.status} paymentStatus=${b.paymentStatus || 'N/A'} price=${b.price}`);
    });
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
    process.exit(3);
  }
})();
