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

    const setObj = { sessionRate: NEW_PRICE, updated_at: new Date() };
    if (Array.isArray(doc.subjects) && doc.subjects.length > 0) {
      setObj['subjects.0.price'] = NEW_PRICE;
    }

    const upd = await profiles.updateOne({ _id: oid }, { $set: setObj });
    if (!upd || upd.matchedCount === 0) {
      console.error('UpdateOne matched 0 documents');
      process.exit(4);
    }

    const updated = await profiles.findOne({ _id: oid });
    console.log('Updated profile (post-update):', JSON.stringify({ _id: updated._id.toString(), sessionRate: updated.sessionRate, subjects: updated.subjects }, null, 2));
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error updating profile:', err);
    process.exit(5);
  }
})();
