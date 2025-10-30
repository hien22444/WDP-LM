// Test script for availability API
const fetch = require('node-fetch');

async function testAvailability() {
  console.log('🧪 Testing Availability API...\n');

  // Step 1: Get list of tutors
  try {
    console.log('1️⃣ Getting list of tutors...');
    const tutorsResponse = await fetch('http://localhost:5000/api/v1/tutors');
    const tutorsData = await tutorsResponse.json();
    
    if (tutorsData.tutors && tutorsData.tutors.length > 0) {
      const firstTutor = tutorsData.tutors[0];
      console.log(`✅ Found ${tutorsData.tutors.length} tutors`);
      console.log(`   First tutor ID: ${firstTutor.id}`);
      console.log(`   Name: ${firstTutor.name}\n`);

      // Step 2: Test availability API
      console.log('2️⃣ Testing availability API...');
      const availResponse = await fetch(`http://localhost:5000/api/v1/tutors/${firstTutor.id}/availability`);
      const availData = await availResponse.json();
      
      if (availData.availability) {
        console.log('✅ Availability API working!');
        console.log(`   Weekly schedule: ${availData.availability.weekly?.length || 0} slots`);
        console.log(`   Available slots (next 14 days): ${availData.availability.slots?.length || 0}`);
        console.log(`   Booked slots: ${availData.availability.booked?.length || 0}`);
        
        if (availData.availability.slots && availData.availability.slots.length > 0) {
          console.log('\n   📅 Sample available slots:');
          availData.availability.slots.slice(0, 3).forEach((slot, idx) => {
            console.log(`   ${idx + 1}. ${new Date(slot.date).toLocaleDateString('vi-VN')} - ${slot.start} to ${slot.end}`);
          });
        }
      } else {
        console.log('❌ No availability data returned');
      }
    } else {
      console.log('⚠️ No tutors found in database');
    }
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    console.log('\n💡 Make sure backend is running:');
    console.log('   cd backend && npm start');
  }
}

testAvailability();
