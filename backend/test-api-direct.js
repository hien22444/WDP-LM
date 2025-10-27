const axios = require('axios');

const baseURL = 'http://localhost:5000/api/v1';

async function testAPIDirect() {
  try {
    console.log('🔍 Testing API directly...');
    
    // Test with different parameters
    const tests = [
      {
        name: 'Basic search',
        params: { search: '', page: 1, limit: 50, includePending: true }
      },
      {
        name: 'No filters',
        params: { page: 1, limit: 100, includePending: true }
      },
      {
        name: 'High limit',
        params: { page: 1, limit: 1000, includePending: true }
      }
    ];
    
    for (const test of tests) {
      console.log(`\n📋 Testing: ${test.name}`);
      try {
        const response = await axios.get(`${baseURL}/tutors/search`, { params: test.params });
        console.log(`✅ Status: ${response.status}`);
        console.log(`📊 Tutors found: ${response.data.tutors?.length || 0}`);
        console.log(`📊 Pagination: ${JSON.stringify(response.data.pagination)}`);
        
        if (response.data.tutors && response.data.tutors.length > 0) {
          console.log(`📋 First tutor: ${response.data.tutors[0].name || 'No name'}`);
        }
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
      }
    }
    
    // Test the exact same call that frontend makes
    console.log('\n🎯 Testing exact frontend call:');
    const frontendCall = await axios.get(`${baseURL}/tutors/search`, {
      params: {
        search: '',
        subject: '',
        grade: '',
        location: '',
        mode: '',
        minPrice: undefined,
        maxPrice: undefined,
        minRating: undefined,
        experience: '',
        page: 1,
        limit: 12,
        sortBy: 'rating',
        includePending: false
      }
    });
    
    console.log('✅ Frontend call status:', frontendCall.status);
    console.log('📊 Frontend call result:', frontendCall.data.tutors?.length || 0);
    console.log('📊 Frontend pagination:', frontendCall.data.pagination);
    
    // Test with includePending=true (should show more)
    console.log('\n🔄 Testing with includePending=true:');
    const pendingCall = await axios.get(`${baseURL}/tutors/search`, {
      params: {
        search: '',
        subject: '',
        grade: '',
        location: '',
        mode: '',
        minPrice: undefined,
        maxPrice: undefined,
        minRating: undefined,
        experience: '',
        page: 1,
        limit: 12,
        sortBy: 'rating',
        includePending: true // This should show more tutors
      }
    });
    
    console.log('✅ Pending call status:', pendingCall.status);
    console.log('📊 Pending call result:', pendingCall.data.tutors?.length || 0);
    console.log('📊 Pending pagination:', pendingCall.data.pagination);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPIDirect();
