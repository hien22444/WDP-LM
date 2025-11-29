const mongoose = require('mongoose');
require('dotenv').config();

async function checkNewUsers() {
  try {
    await mongoose.connect(process.env.URI_DB);
    console.log('✅ Connected to:', process.env.URI_DB);
    
    const users = await mongoose.connection.db.collection('users')
      .find({})
      .sort({ created_at: -1 })
      .toArray();
    
    console.log('\n=== ALL USERS IN DB ===');
    console.log('Total:', users.length);
    console.log('');
    
    users.forEach((u, i) => {
      console.log(`${i + 1}. ${u.email}`);
      console.log(`   Role: ${u.role}`);
      console.log(`   Name: ${u.full_name}`);
      console.log(`   Created: ${u.created_at}`);
      console.log(`   ID: ${u._id}`);
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkNewUsers();
