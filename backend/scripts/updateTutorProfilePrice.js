require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const PROFILE_ID = '6910a8ef0f7b26a5d7ed7485';
const NEW_PRICE = 10000;
(async () => {
  const MONGO_URI = process.env.URI_DB || process.env.MONGO_URI || process.env.MONGOURL;
  if (!MONGO_URI) { console.error('Missing URI_DB'); process.exit(2); }
  try {
    await mongoose.connect(MONGO_URI, { maxPoolSize: 5 });
    console.log('Connected to MongoDB');
    const profiles = mongoose.connection.db.collection('tutor_profiles');
    const oid = new mongoose.Types.ObjectId(PROFILE_ID);

    const doc = await profiles.findOne({ _id: oid });
    if (!doc) { console.error('Profile not found:', PROFILE_ID); process.exit(3); }

    // Prepare update
    const update = { $set: { sessionRate: NEW_PRICE, updated_at: new Date() } };
    if (Array.isArray(doc.subjects) && doc.subjects.length > 0) {
      // update the first subject's price
      update.$set['subjects.0.price'] = NEW_PRICE;
    }

    const res = await profiles.findOneAndUpdate({ _id: oid }, update, { returnDocument: 'after' });
    if (!res.value) { console.error('Failed to update profile'); process.exit(4); }
    console.log('Profile updated:', JSON.stringify({ _id: res.value._id.toString(), sessionRate: res.value.sessionRate, subjects: res.value.subjects }, null, 2));
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error updating profile:', err);
    process.exit(5);
  }
})();
