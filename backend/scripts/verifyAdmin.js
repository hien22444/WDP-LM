const mongoose = require('mongoose');
require('dotenv').config();

async function verifyAdmin() {
  try {
    await mongoose.connect('mongodb://localhost:27017/test');
    console.log('✅ Connected to database');

    const result = await mongoose.connection.db.collection('users').updateOne(
      { email: 'admin@test.com' },
      { 
        $set: { 
          is_verified: true, 
          email_verified: true, 
          verified_at: new Date() 
        } 
      }
    );

    console.log('✅ Đã verify admin account!');
    console.log('Modified:', result.modifiedCount);

    const admin = await mongoose.connection.db.collection('users').findOne({ 
      email: 'admin@test.com' 
    });

    console.log('\n=== ADMIN ACCOUNT INFO ===');
    console.log('📧 Email:', admin.email);
    console.log('👤 Role:', admin.role);
    console.log('✓ is_verified:', admin.is_verified);
    console.log('✓ email_verified:', admin.email_verified);
    console.log('🆔 ID:', admin._id);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyAdmin();
