const mongoose = require('mongoose');
const TutorProfile = require('./src/models/TutorProfile');

async function checkTutorsCount() {
  try {
    // Connect to database
    await mongoose.connect('mongodb+srv://HieuTD:qbTXXCEIn1G4veK5@learnmate.6rejkx4.mongodb.net/?retryWrites=true&w=majority&appName=LearnMate');
    console.log('🔗 Connected to database');
    
    // Count total tutors
    const totalTutors = await TutorProfile.countDocuments();
    console.log('📊 Total tutors in database:', totalTutors);
    
    // Count approved tutors
    const approvedTutors = await TutorProfile.countDocuments({ status: 'approved' });
    console.log('✅ Approved tutors:', approvedTutors);
    
    // Count pending tutors
    const pendingTutors = await TutorProfile.countDocuments({ status: 'pending' });
    console.log('⏳ Pending tutors:', pendingTutors);
    
    // Count other statuses
    const otherStatuses = await TutorProfile.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    console.log('📈 Status breakdown:', otherStatuses);
    
    // Get sample tutors
    const sampleTutors = await TutorProfile.find().limit(10).select('status name user');
    console.log('\n📋 Sample tutors:');
    sampleTutors.forEach((tutor, index) => {
      console.log(`${index + 1}. Status: ${tutor.status}, Name: ${tutor.name || 'No name'}`);
    });
    
    // Check API limit
    console.log('\n🔍 API Configuration:');
    console.log('- Default limit in API:', '10 (from backend code)');
    console.log('- Frontend limit:', '12 (from TutorList.js)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

checkTutorsCount();
