const mongoose = require('mongoose');

// Debug user structure
async function debugUserStructure() {
  console.log('🔍 DEBUG USER STRUCTURE');
  console.log('========================\n');

  try {
    // Connect to database
    const mongoUri = 'mongodb+srv://HieuTD:123456@learnmate.6rejk.mongodb.net/learnmate?retryWrites=true&w=majority';
    await mongoose.connect(mongoUri);
    console.log('✅ Database connected');

    // Get User model
    const User = require('./src/models/User');
    
    // Find a user
    const user = await User.findOne();
    
    if (user) {
      console.log('\n📊 USER STRUCTURE:');
      console.log('==================');
      console.log('User ID:', user._id);
      console.log('User Object Keys:', Object.keys(user.toObject()));
      console.log('Full User Object:', JSON.stringify(user.toObject(), null, 2));
      
      console.log('\n🔍 FRONTEND EXPECTED FIELDS:');
      console.log('============================');
      console.log('_id:', user._id);
      console.log('id:', user._id); // Same as _id
      console.log('account._id:', 'N/A (not in User model)');
      console.log('account.id:', 'N/A (not in User model)');
      console.log('user._id:', 'N/A (not in User model)');
      console.log('user.id:', 'N/A (not in User model)');
      
      console.log('\n💡 SOLUTION:');
      console.log('=============');
      console.log('Frontend should use: currentUser._id or currentUser.id');
      console.log('Both are the same value:', user._id);
      
    } else {
      console.log('❌ No users found in database');
    }

  } catch (error) {
    console.log('❌ Debug failed:', error.message);
  }

  await mongoose.disconnect();
}

// Run the debug
debugUserStructure().catch(console.error);
