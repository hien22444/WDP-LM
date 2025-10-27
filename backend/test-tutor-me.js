const axios = require('axios');

async function testTutorMe() {
  try {
    console.log('🔍 Testing PATCH /api/v1/tutors/me...');
    
    // Test without token
    console.log('\n1. Testing without token:');
    try {
      const response = await axios.patch('http://localhost:5000/api/v1/tutors/me', {
        introduction: 'Test introduction'
      });
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Expected error:', error.response?.status, error.response?.data);
    }
    
    // Test with fake token
    console.log('\n2. Testing with fake token:');
    try {
      const response = await axios.patch('http://localhost:5000/api/v1/tutors/me', {
        introduction: 'Test introduction'
      }, {
        headers: {
          'Authorization': 'Bearer fake-token'
        }
      });
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Expected error:', error.response?.status, error.response?.data);
    }
    
    // Test GET to see if endpoint exists
    console.log('\n3. Testing GET /api/v1/tutors/me:');
    try {
      const response = await axios.get('http://localhost:5000/api/v1/tutors/me');
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.data);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testTutorMe();
