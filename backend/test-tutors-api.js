const axios = require('axios');

const baseURL = 'http://localhost:5000/api/v1';

async function testTutorsAPI() {
  try {
    console.log('🔍 Testing tutors API...');
    
    // Test 1: Basic tutors search
    console.log('\n1. Testing GET /tutors/search');
    const response = await axios.get(`${baseURL}/tutors/search`, {
      params: {
        search: '',
        subject: '',
        page: 1,
        limit: 10,
        includePending: false
      }
    });
    
    console.log('✅ Status:', response.status);
    console.log('📊 Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.tutors) {
      console.log('👥 Number of tutors found:', response.data.tutors.length);
    } else {
      console.log('❌ No tutors data in response');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('📡 Response status:', error.response.status);
      console.error('📡 Response data:', error.response.data);
    }
  }
}

testTutorsAPI();
