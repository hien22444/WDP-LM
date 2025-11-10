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
    const payments = await mongoose.connection.db.collection('payments').find({}).sort({ createdAt: -1 }).limit(20).toArray();
    const total = await mongoose.connection.db.collection('payments').countDocuments();
    const withSlot = payments.filter(p => p.slotId).length;
    console.log(`Total payments in DB: ${total}`);
    console.log(`Sample count (latest 20): ${payments.length}, of which have slotId: ${withSlot}`);
    console.log('--- Recent payments ---');
    payments.forEach(p => {
      console.log(`id=${p._id} orderCode=${p.orderCode} status=${p.status} amount=${p.amount} slotId=${p.slotId || 'NULL'} userId=${p.userId || 'NULL'}`);
    });
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error connecting or querying:', err);
    process.exit(3);
  }
})();
