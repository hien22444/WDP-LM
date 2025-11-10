require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const EMAIL = 'test-tutor-1762699503669@example.com';
(async ()=>{
  const MONGO_URI = process.env.URI_DB || process.env.MONGO_URI || process.env.MONGOURL;
  if (!MONGO_URI) { console.error('Missing URI_DB'); process.exit(2); }
  try{
    await mongoose.connect(MONGO_URI, { maxPoolSize:5 });
    console.log('Connected to MongoDB');
    const users = mongoose.connection.db.collection('users');
    const doc = await users.findOne({ email: EMAIL });
    console.log('Found user:', doc ? JSON.stringify({ _id: doc._id.toString(), email: doc.email, role: doc.role, status: doc.status }, null, 2) : 'NOT FOUND');
    await mongoose.disconnect();
  }catch(e){ console.error(e); process.exit(3); }
})();
