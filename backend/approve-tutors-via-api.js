const axios = require('axios');

async function approveTutorsViaAPI() {
  try {
    console.log('🔧 Approving all tutors via API...');
    
    // First, get all tutors
    const searchResponse = await axios.get('http://localhost:5000/api/v1/tutors/search?includePending=1&limit=100');
    const tutors = searchResponse.data.tutors;
    
    console.log(`📊 Found ${tutors.length} tutors to approve`);
    
    if (tutors.length === 0) {
      console.log('⚠️ No tutors found');
      return;
    }
    
    // Show current status
    const statusCounts = {};
    tutors.forEach(tutor => {
      const status = tutor.status || 'no-status';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    console.log('\n📊 Current status distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
    
    // Since we can't directly update via API, let's create a simple update script
    console.log('\n💡 To approve all tutors, you need to:');
    console.log('1. Access your MongoDB database directly');
    console.log('2. Run this query:');
    console.log('   db.tutorprofiles.updateMany({}, { $set: { status: "approved", hasAvailability: true, verified: true } })');
    console.log('3. Or use MongoDB Compass to update all documents');
    
    console.log('\n📋 Tutor IDs that need approval:');
    tutors.forEach((tutor, index) => {
      console.log(`${index + 1}. ${tutor.id} - ${tutor.name} (Status: ${tutor.status || 'no-status'})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

approveTutorsViaAPI();
