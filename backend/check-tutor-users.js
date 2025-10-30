const mongoose = require('mongoose');
const User = require('./src/models/User');

async function checkTutorUsers() {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect(process.env.URI_DB || 'mongodb+srv://HieuTD:qbTXXCEIn1G4veK5@learnmate.6rejkx4.mongodb.net/?retryWrites=true&w=majority&appName=LearnMate');
    console.log('✅ Database connected successfully');
    
    // Count users by role
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('📊 Users by Role:');
    usersByRole.forEach(role => {
      console.log(`  - ${role._id}: ${role.count}`);
    });
    
    // Get only tutor users (like admin page might be filtering)
    const tutorUsers = await User.find({ role: 'tutor' })
      .select('-password_hash -refresh_tokens')
      .sort({ created_at: -1 });
    
    console.log(`\n📊 Tutor Users: ${tutorUsers.length}`);
    
    console.log('\n📋 All Tutor Users:');
    tutorUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.full_name} (${user.email}) - ${user.role} - ${user.status}`);
    });
    
    // Test pagination for tutor users
    console.log('\n🔍 Testing Tutor Users Pagination:');
    const page = 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    
    const paginatedTutorUsers = await User.find({ role: 'tutor' })
      .select('-password_hash -refresh_tokens')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);
    
    console.log(`📊 Paginated Tutor Users (page ${page}, limit ${limit}): ${paginatedTutorUsers.length}`);
    
    paginatedTutorUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.full_name} (${user.email}) - ${user.role} - ${user.status}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database disconnected');
  }
}

checkTutorUsers();
