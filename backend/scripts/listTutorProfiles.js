require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const MONGO_URI = process.env.URI_DB || process.env.MONGO_URI || process.env.MONGOURL;
(async ()=>{
  if(!MONGO_URI){ console.error('Missing URI_DB'); process.exit(2); }
  try{
    await mongoose.connect(MONGO_URI, { maxPoolSize:5 });
    const docs = await mongoose.connection.db.collection('tutorprofiles').find({}).limit(10).toArray();
    console.log('Found', docs.length, 'tutorprofiles. Showing status and some fields:');
    docs.forEach(d => {
      console.log({ _id: d._id.toString(), status: d.status, user: d.user, sessionRate: d.sessionRate, subjectsCount: (d.subjects || []).length });
    });
    await mongoose.disconnect();
  }catch(e){ console.error(e); process.exit(3); }
})();
