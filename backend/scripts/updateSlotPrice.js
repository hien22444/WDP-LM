require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const MONGO_URI = process.env.URI_DB || process.env.MONGO_URI || process.env.MONGOURL;
const SLOT_ID = '6910a8ef0f7b26a5d7ed7486'; // slot created earlier
const NEW_PRICE = 10000;
(async () => {
  if (!MONGO_URI) { console.error('Missing URI_DB'); process.exit(2); }
  try {
    await mongoose.connect(MONGO_URI, { maxPoolSize: 5 });
    console.log('Connected to MongoDB');
    const slots = mongoose.connection.db.collection('teaching_slots');
    const oid = new mongoose.Types.ObjectId(SLOT_ID);
    const res = await slots.findOneAndUpdate({ _id: oid }, { $set: { price: NEW_PRICE, updated_at: new Date() } }, { returnDocument: 'after' });
    if (!res.value) {
      console.error('Slot not found:', SLOT_ID);
      process.exit(3);
    }
    console.log('Updated slot:', res.value._id.toString(), 'new price:', res.value.price);
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
    process.exit(4);
  }
})();
