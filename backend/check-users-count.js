const mongoose = require('mongoose');
const User = require('./src/models/User');
const TutorProfile = require('./src/models/TutorProfile');

// Load environment variables
require('dotenv').config();

async function checkUsersCount() {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://HieuTD:HieuTD123@learnmate.6rejkx4.mongodb.net/?retryWrites=true&w=majority&appName=LearnMate';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database');

    // Count all users
    const totalUsers = await User.countDocuments();
    console.log(`📊 Total Users: ${totalUsers}`);

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

    // Count users by status
    const usersByStatus = await User.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    console.log('📊 Users by Status:');
    usersByStatus.forEach(status => {
      console.log(`  - ${status._id}: ${status.count}`);
    });

    // Count tutor profiles
    const totalTutorProfiles = await TutorProfile.countDocuments();
    console.log(`📊 Total Tutor Profiles: ${totalTutorProfiles}`);

    // Count tutor profiles by status
    const tutorProfilesByStatus = await TutorProfile.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    console.log('📊 Tutor Profiles by Status:');
    tutorProfilesByStatus.forEach(status => {
      console.log(`  - ${status._id}: ${status.count}`);
    });

    // Get sample users
    console.log('\n📋 Sample Users:');
    const sampleUsers = await User.find()
      .select('full_name email role status created_at')
      .sort({ created_at: -1 })
      .limit(10);
    
    sampleUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.full_name} (${user.email}) - ${user.role} - ${user.status}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

checkUsersCount();
