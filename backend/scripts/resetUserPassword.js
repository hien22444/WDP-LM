const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function resetPassword() {
  try {
    await mongoose.connect('mongodb://localhost:27017/test');
    console.log('✅ Connected to database\n');

    const email = 'tungptde180798@fpt.edu.vn';
    const newPassword = '123123123';

    // Hash password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user
    const result = await mongoose.connection.db.collection('users').updateOne(
      { email },
      { 
        $set: { 
          password_hash: hashedPassword,
          updated_at: new Date()
        } 
      }
    );

    if (result.modifiedCount === 0) {
      console.log('❌ User not found or password already set');
    } else {
      console.log('✅ Password reset successful!\n');
      console.log('Email:', email);
      console.log('New Password:', newPassword);
      console.log('\n📝 You can now login with this password');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetPassword();
