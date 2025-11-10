require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');

const MONGO_URI = process.env.URI_DB || process.env.MONGO_URI || process.env.MONGOURL;
(async () => {
  if (!MONGO_URI) {
    console.error('Missing URI_DB in environment or backend/.env');
    process.exit(2);
  }
  try {
    await mongoose.connect(MONGO_URI, { maxPoolSize: 5 });
    console.log('Connected to MongoDB');

    const usersColl = mongoose.connection.db.collection('users');
    const profilesColl = mongoose.connection.db.collection('tutor_profiles');
    const slotsColl = mongoose.connection.db.collection('teaching_slots');

    // Create a unique test email to avoid collisions
    const ts = Date.now();
    const testEmail = `test-tutor-${ts}@example.com`;

    // Insert user
    const userDoc = {
      full_name: `Test Tutor ${ts}`,
      email: testEmail,
      role: 'tutor',
      status: 'active',
      profile_completed: true,
      created_at: new Date(),
      updated_at: new Date()
    };

    const ures = await usersColl.insertOne(userDoc);
    const userId = ures.insertedId;
    console.log('Created test user id:', userId.toString(), 'email:', testEmail);

    // Create TutorProfile linked to user
    const profileDoc = {
      user: userId,
      avatarUrl: null,
      bio: 'Auto-created test tutor profile',
      subjects: [{ name: 'Mathematics', level: 'High School', price: 50000 }],
      teachModes: ['online'],
      sessionRate: 50000,
      hasAvailability: false,
      status: 'approved',
      created_at: new Date(),
      updated_at: new Date()
    };

    const pres = await profilesColl.insertOne(profileDoc);
    const profileId = pres.insertedId;
    console.log('Created tutor profile id:', profileId.toString());

    // Create a teaching slot for tomorrow 1-hour long
    const now = new Date();
    const start = new Date(now.getTime() + 24 * 3600 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const slotDoc = {
      tutorProfile: profileId,
      start,
      end,
      mode: 'online',
      price: 50000,
      courseCode: `TEST-${ts}`,
      courseName: 'Auto test slot',
      location: null,
      notes: 'Auto-created slot for payment testing',
      capacity: 1,
      status: 'open',
      created_at: new Date(),
      updated_at: new Date()
    };

    const sres = await slotsColl.insertOne(slotDoc);
    const slotId = sres.insertedId;
    console.log('Created teaching slot id:', slotId.toString(), 'price:', slotDoc.price);

    // Optionally, ensure tutor profile user role remains tutor (already set)

    await mongoose.disconnect();

    // Print JSON for easy parsing
    console.log(JSON.stringify({ userId: userId.toString(), profileId: profileId.toString(), slotId: slotId.toString(), slotPrice: slotDoc.price }));
  } catch (err) {
    console.error('Error creating test data:', err);
    process.exit(3);
  }
})();
