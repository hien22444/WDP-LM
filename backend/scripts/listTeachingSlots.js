require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');
(async () => {
  const MONGO_URI = process.env.URI_DB || process.env.MONGO_URI || process.env.MONGOURL;
  if (!MONGO_URI) { console.error('Missing URI_DB'); process.exit(2); }
  try {
    await mongoose.connect(MONGO_URI, { maxPoolSize: 5 });
    console.log('Connected to MongoDB');
    const slots = mongoose.connection.db.collection('teaching_slots');
    const docs = await slots.find({}).sort({ created_at: -1 }).limit(20).toArray();
    console.log('Latest teaching_slots count:', docs.length);
    docs.forEach(d => {
      console.log('id=' + d._id + ' price=' + d.price + ' status=' + d.status + ' tutorProfile=' + (d.tutorProfile ? d.tutorProfile.toString() : 'NULL') + ' courseName=' + (d.courseName || ''));
    });
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error listing teaching_slots:', err);
    process.exit(3);
  }
})();
