require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const PROFILE_ID = '6910a8ef0f7b26a5d7ed7485';
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
    console.log('TutorProfile:', JSON.stringify(doc, null, 2));
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
    process.exit(4);
  }
})();
