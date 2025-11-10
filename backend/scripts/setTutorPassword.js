require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const USER_ID = '6910a8ef0f7b26a5d7ed7484';
const PASSWORD = 'TestTutor123!';
(async () => {
  const MONGO_URI = process.env.URI_DB || process.env.MONGO_URI || process.env.MONGOURL;
  if (!MONGO_URI) { console.error('Missing URI_DB'); process.exit(2); }
  try {
    await mongoose.connect(MONGO_URI, { maxPoolSize: 5 });
    console.log('Connected to MongoDB');
    const users = mongoose.connection.db.collection('users');
    const oid = new mongoose.Types.ObjectId(USER_ID);
    const hash = await bcrypt.hash(PASSWORD, 10);
    const res = await users.findOneAndUpdate({ _id: oid }, { $set: { password_hash: hash, status: 'active', updated_at: new Date() } }, { returnDocument: 'after' });
    if (!res.value) { console.error('User not found or update failed'); process.exit(3); }
    console.log('Updated user:', JSON.stringify({ _id: res.value._id.toString(), email: res.value.email, status: res.value.status }, null, 2));
    console.log('Credentials you can use to log in:');
    console.log('email:', res.value.email);
    console.log('password:', PASSWORD);
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
    process.exit(4);
  }
})();
