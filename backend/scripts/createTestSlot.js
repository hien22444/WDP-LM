require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const MONGO_URI = process.env.URI_DB || process.env.MONGO_URI || process.env.MONGOURL;
(async () => {
  if (!MONGO_URI) {
    console.error('Missing URI_DB in environment or backend/.env');
    process.exit(2);
  }
  try {
    await mongoose.connect(MONGO_URI, { maxPoolSize: 5 });
    console.log('Connected to MongoDB');

    const tutorProfile = await mongoose.connection.db.collection('tutorprofiles').findOne({ status: 'approved' });
    if (!tutorProfile) {
      console.error('No approved tutor profile found. Please create one or fix tutor profiles.');
      process.exit(3);
    }
    console.log('Found tutorProfile:', tutorProfile._id.toString(), 'user:', tutorProfile.user);

    const now = new Date();
    const start = new Date(now.getTime() + 24 * 3600 * 1000); // tomorrow
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour later

    const newSlot = {
      tutorProfile: tutorProfile._id,
      start,
      end,
      mode: 'online',
      price: 50000,
      courseCode: 'TEST-SLOT',
      courseName: 'Test slot (auto-created)',
      location: null,
      notes: 'Auto-created test slot for payment flow',
      capacity: 1,
      status: 'open',
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await mongoose.connection.db.collection('teaching_slots').insertOne(newSlot);
    console.log('Created teaching slot with id:', result.insertedId.toString());
    console.log('Price:', newSlot.price, 'start:', newSlot.start.toISOString());

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
    process.exit(4);
  }
})();
