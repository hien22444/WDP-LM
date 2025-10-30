/**
 * Script: Check Database Connection & Collections
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function checkDatabase() {
  try {
    // Try different possible URIs
    const possibleUris = [
      process.env.MONGODB_URI,
      process.env.MONGO_URI,
      process.env.DATABASE_URL,
      'mongodb://localhost:27017/edumatch',
      'mongodb://127.0.0.1:27017/edumatch'
    ].filter(Boolean);

    console.log('🔍 Checking possible MongoDB URIs...\n');
    
    for (const uri of possibleUris) {
      try {
        console.log(`Trying: ${uri.replace(/\/\/.*@/, '//***@')}`);
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
        
        console.log('✅ Connected!\n');
        
        // List all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('📊 Collections in database:');
        collections.forEach(col => {
          console.log(`   - ${col.name}`);
        });
        console.log('');
        
        // Count documents in each collection
        console.log('📈 Document counts:');
        for (const col of collections) {
          const count = await mongoose.connection.db.collection(col.name).countDocuments();
          console.log(`   - ${col.name}: ${count} documents`);
        }
        console.log('');
        
        // Check specific collections we need
        if (collections.some(c => c.name === 'tutor_profiles')) {
          const tutorCount = await mongoose.connection.db.collection('tutor_profiles').countDocuments();
          console.log(`✅ Found tutor_profiles: ${tutorCount} documents`);
          
          if (tutorCount > 0) {
            const sample = await mongoose.connection.db.collection('tutor_profiles').findOne();
            console.log('\n📋 Sample tutor_profile:');
            console.log(JSON.stringify(sample, null, 2));
          }
        } else {
          console.log('⚠️  Collection "tutor_profiles" not found!');
        }
        
        if (collections.some(c => c.name === 'users')) {
          const userCount = await mongoose.connection.db.collection('users').countDocuments();
          console.log(`\n✅ Found users: ${userCount} documents`);
        } else {
          console.log('\n⚠️  Collection "users" not found!');
        }
        
        await mongoose.disconnect();
        return;
        
      } catch (err) {
        console.log(`❌ Failed: ${err.message}\n`);
        if (mongoose.connection.readyState !== 0) {
          await mongoose.disconnect();
        }
      }
    }
    
    console.log('\n❌ Could not connect to any database!');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkDatabase();


