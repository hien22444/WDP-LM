require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const USER_EMAIL = 'test-tutor-1762699503669@example.com';
const PASSWORD = 'TestTutor123!';
(async () => {
  const MONGO_URI = process.env.URI_DB || process.env.MONGO_URI || process.env.MONGOURL;
  if (!MONGO_URI) { console.error('Missing URI_DB'); process.exit(2); }
  try {
    await mongoose.connect(MONGO_URI, { maxPoolSize: 5 });
    console.log('Connected to MongoDB');
    const users = mongoose.connection.db.collection('users');
    const user = await users.findOne({ email: USER_EMAIL });
    if (!user) { console.error('User not found by email:', USER_EMAIL); process.exit(3); }
    const hash = await bcrypt.hash(PASSWORD, 10);
    const upd = await users.updateOne({ _id: user._id }, { $set: { password_hash: hash, status: 'active', updated_at: new Date() } });
    if (!upd || upd.matchedCount === 0) { console.error('UpdateOne failed'); process.exit(4); }
    const updated = await users.findOne({ _id: user._id });
    console.log('Updated user:', JSON.stringify({ _id: updated._id.toString(), email: updated.email, status: updated.status }, null, 2));
    console.log('Credentials:');
    console.log('email:', updated.email);
    console.log('password:', PASSWORD);
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
    process.exit(5);
  }
})();
