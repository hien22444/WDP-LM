const mongoose = require('mongoose');
const User = require('./src/models/User');

async function checkAdminUsers() {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect(process.env.URI_DB || 'mongodb+srv://HieuTD:qbTXXCEIn1G4veK5@learnmate.6rejkx4.mongodb.net/?retryWrites=true&w=majority&appName=LearnMate');
    console.log('✅ Database connected successfully');
    
    // Count all users
    const totalUsers = await User.countDocuments();
    console.log(`📊 Total Users: ${totalUsers}`);
    
    // Get all users (like admin API)
    const allUsers = await User.find()
      .select('-password_hash -refresh_tokens')
      .sort({ created_at: -1 });
    
    console.log(`📊 Users found by query: ${allUsers.length}`);
    
    // Show all users
    console.log('\n📋 All Users:');
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.full_name} (${user.email}) - ${user.role} - ${user.status}`);
    });
    
    // Test pagination like admin API
    console.log('\n🔍 Testing Admin API Pagination:');
    const page = 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    
    const paginatedUsers = await User.find()
      .select('-password_hash -refresh_tokens')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);
    
    console.log(`📊 Paginated Users (page ${page}, limit ${limit}): ${paginatedUsers.length}`);
    
    paginatedUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.full_name} (${user.email}) - ${user.role} - ${user.status}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database disconnected');
  }
}

checkAdminUsers();
