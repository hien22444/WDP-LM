const mongoose = require('mongoose');
const TutorProfile = require('./src/models/TutorProfile');

async function checkTutors() {
  try {
    await mongoose.connect('mongodb+srv://HieuTD:****@learnmate.6rejkx4.mongodb.net/?retryWrites=true&w=majority&appName=LearnMate');
    console.log('✅ Connected to MongoDB');
    
    const totalTutors = await TutorProfile.countDocuments();
    const approvedTutors = await TutorProfile.countDocuments({ status: 'approved' });
    const pendingTutors = await TutorProfile.countDocuments({ status: 'pending' });
    
    console.log('📊 Tutor Statistics:');
    console.log('• Total tutors:', totalTutors);
    console.log('• Approved tutors:', approvedTutors);
    console.log('• Pending tutors:', pendingTutors);
    
    if (approvedTutors === 0) {
      console.log('⚠️ No approved tutors found!');
      console.log('🔧 Updating some tutors to approved status...');
      
      const result = await TutorProfile.updateMany(
        { status: { $in: ['pending', 'draft'] } },
        { $set: { status: 'approved', hasAvailability: true } }
      );
      
      console.log('✅ Updated', result.modifiedCount, 'tutors to approved status');
      
      const newApprovedCount = await TutorProfile.countDocuments({ status: 'approved' });
      console.log('📊 New approved count:', newApprovedCount);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkTutors();
