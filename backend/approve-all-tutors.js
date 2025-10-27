const mongoose = require('mongoose');
const TutorProfile = require('./src/models/TutorProfile');

async function approveAllTutors() {
  try {
    // Connect using the same connection string as the backend
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://HieuTD:****@learnmate.6rejkx4.mongodb.net/?retryWrites=true&w=majority&appName=LearnMate');
    console.log('✅ Connected to MongoDB');
    
    // Get all tutor profiles
    const allTutors = await TutorProfile.find({});
    console.log('📊 Total TutorProfile documents found:', allTutors.length);
    
    if (allTutors.length === 0) {
      console.log('⚠️ No tutor profiles found in database');
      process.exit(0);
    }
    
    // Show current status distribution
    const statusCounts = {};
    allTutors.forEach(tutor => {
      const status = tutor.status || 'no-status';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    console.log('\n📊 Current status distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
    
    // Update all tutors to approved status
    console.log('\n🔧 Updating all tutors to approved status...');
    const result = await TutorProfile.updateMany(
      {}, // Update all documents
      { 
        $set: { 
          status: 'approved',
          hasAvailability: true,
          verified: true
        } 
      }
    );
    
    console.log('✅ Update completed:');
    console.log(`   - Matched: ${result.matchedCount} documents`);
    console.log(`   - Modified: ${result.modifiedCount} documents`);
    
    // Verify the update
    const approvedCount = await TutorProfile.countDocuments({ status: 'approved' });
    console.log(`\n📊 New approved count: ${approvedCount}`);
    
    // Show sample of updated tutors
    console.log('\n📋 Sample of updated tutors:');
    const sampleTutors = await TutorProfile.find({ status: 'approved' }).limit(5);
    sampleTutors.forEach((tutor, index) => {
      console.log(`${index + 1}. ID: ${tutor._id}`);
      console.log(`   Status: ${tutor.status}`);
      console.log(`   Has Availability: ${tutor.hasAvailability}`);
      console.log(`   Verified: ${tutor.verified}`);
      console.log('---');
    });
    
    console.log('\n🎉 All tutors have been approved successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

approveAllTutors();
