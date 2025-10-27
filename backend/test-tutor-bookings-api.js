const axios = require('axios');

async function testTutorBookingsAPI() {
  try {
    console.log('🧪 Testing Tutor Bookings API...');
    
    // Test without auth first
    console.log('\n1️⃣ Testing without authentication...');
    try {
      const response = await axios.get('http://localhost:5000/api/v1/bookings/me?role=tutor');
      console.log('✅ Response:', response.data);
    } catch (error) {
      console.log('❌ Expected error (no auth):', error.response?.status, error.response?.data?.message);
    }

    // Test with a sample token (you'll need to replace this with a real token)
    console.log('\n2️⃣ Testing with authentication...');
    const token = 'your-jwt-token-here'; // Replace with actual token
    
    try {
      const response = await axios.get('http://localhost:5000/api/v1/bookings/me?role=tutor', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Authenticated response:', response.data);
    } catch (error) {
      console.log('❌ Auth error:', error.response?.status, error.response?.data?.message);
    }

    // Test backend health
    console.log('\n3️⃣ Testing backend health...');
    try {
      const response = await axios.get('http://localhost:5000/api/v1/health');
      console.log('✅ Backend health:', response.data);
    } catch (error) {
      console.log('❌ Backend not responding:', error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testTutorBookingsAPI();
