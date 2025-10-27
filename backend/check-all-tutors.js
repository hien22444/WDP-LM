const mongoose = require('mongoose');
const TutorProfile = require('./src/models/TutorProfile');
const User = require('./src/models/User');

async function checkAllTutors() {
  try {
    // Connect using the same connection string as the backend
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://HieuTD:****@learnmate.6rejkx4.mongodb.net/?retryWrites=true&w=majority&appName=LearnMate');
    console.log('✅ Connected to MongoDB');
    
    // Check all tutor profiles
    const allTutors = await TutorProfile.find({}).populate('user', 'full_name email role');
    console.log('📊 Total TutorProfile documents:', allTutors.length);
    
    // Check all users with role tutor
    const tutorUsers = await User.find({ role: 'tutor' });
    console.log('👥 Total users with role tutor:', tutorUsers.length);
    
    // Show details of first few tutors
    console.log('\n📋 First 5 tutor profiles:');
    allTutors.slice(0, 5).forEach((tutor, index) => {
      console.log(`${index + 1}. ID: ${tutor._id}`);
      console.log(`   User: ${tutor.user?.full_name || 'No user'}`);
      console.log(`   Status: ${tutor.status || 'No status'}`);
      console.log(`   Subjects: ${tutor.subjects?.length || 0}`);
      console.log('---');
    });
    
    // Check status distribution
    const statusCounts = {};
    allTutors.forEach(tutor => {
      const status = tutor.status || 'no-status';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    console.log('\n📊 Status distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAllTutors();
