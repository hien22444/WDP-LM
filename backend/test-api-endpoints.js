const axios = require('axios');

async function testAPI() {
  console.log('🧪 Testing API endpoints...\n');
  
  try {
    // Test health endpoint
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:5000/api/health');
    console.log('✅ Health check:', healthResponse.data);
    
    // Test teaching slots endpoint
    console.log('\n2️⃣ Testing teaching slots endpoint...');
    const slotsResponse = await axios.get('http://localhost:5000/api/v1/bookings/slots/public');
    console.log('✅ Slots response status:', slotsResponse.status);
    console.log('📊 Number of slots:', slotsResponse.data.items?.length || 0);
    
    if (slotsResponse.data.items?.length > 0) {
      console.log('🎯 First slot sample:');
      console.log('  - Course:', slotsResponse.data.items[0].courseName);
      console.log('  - Tutor:', slotsResponse.data.items[0].tutorProfile?.user?.full_name);
      console.log('  - Price:', slotsResponse.data.items[0].price);
      console.log('  - Mode:', slotsResponse.data.items[0].mode);
    }
    
    // Test tutors search endpoint
    console.log('\n3️⃣ Testing tutors search endpoint...');
    const tutorsResponse = await axios.get('http://localhost:5000/api/v1/tutors/search');
    console.log('✅ Tutors response status:', tutorsResponse.status);
    console.log('📊 Number of tutors:', tutorsResponse.data.tutors?.length || 0);
    
    if (tutorsResponse.data.tutors?.length > 0) {
      console.log('🎯 First tutor sample:');
      console.log('  - Name:', tutorsResponse.data.tutors[0].name);
      console.log('  - Subjects:', tutorsResponse.data.tutors[0].subjects?.length || 0);
      console.log('  - Rating:', tutorsResponse.data.tutors[0].rating);
    }
    
    console.log('\n🎉 All API tests passed!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testAPI();
