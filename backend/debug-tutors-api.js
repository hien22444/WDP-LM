const axios = require('axios');

const baseURL = 'http://localhost:5000/api/v1';

async function debugTutorsAPI() {
  try {
    console.log('🔍 Debugging tutors API...');
    
    // Test 1: Basic search without filters
    console.log('\n1. Testing basic search (no filters):');
    const basicResponse = await axios.get(`${baseURL}/tutors/search`, {
      params: {
        search: '',
        subject: '',
        grade: '',
        location: '',
        mode: '',
        page: 1,
        limit: 50, // Increase limit
        includePending: false
      }
    });
    
    console.log('✅ Status:', basicResponse.status);
    console.log('📊 Tutors found:', basicResponse.data.tutors?.length || 0);
    console.log('📊 Pagination:', basicResponse.data.pagination);
    
    // Test 2: Include pending tutors
    console.log('\n2. Testing with includePending=true:');
    const pendingResponse = await axios.get(`${baseURL}/tutors/search`, {
      params: {
        search: '',
        subject: '',
        grade: '',
        location: '',
        mode: '',
        page: 1,
        limit: 50,
        includePending: true // Include pending tutors
      }
    });
    
    console.log('✅ Status:', pendingResponse.status);
    console.log('📊 Tutors found:', pendingResponse.data.tutors?.length || 0);
    console.log('📊 Pagination:', pendingResponse.data.pagination);
    
    // Test 3: Check what filters are applied
    console.log('\n3. Analyzing filter logic:');
    console.log('- includePending=false means: status="approved" only');
    console.log('- includePending=true means: status in ["approved", "pending"]');
    console.log('- From database: 12 approved + 6 pending = 18 total visible');
    
    // Test 4: Check if there are any other filters
    console.log('\n4. Checking for additional filters:');
    const allResponse = await axios.get(`${baseURL}/tutors/search`, {
      params: {
        search: '',
        subject: '',
        grade: '',
        location: '',
        mode: '',
        minPrice: 0,
        maxPrice: 10000000,
        minRating: 0,
        maxRating: 5,
        experience: '',
        page: 1,
        limit: 100, // Very high limit
        includePending: true,
        sortBy: 'rating'
      }
    });
    
    console.log('✅ Status:', allResponse.status);
    console.log('📊 Tutors found:', allResponse.data.tutors?.length || 0);
    console.log('📊 Pagination:', allResponse.data.pagination);
    
    if (allResponse.data.tutors && allResponse.data.tutors.length > 0) {
      console.log('\n📋 Sample tutors:');
      allResponse.data.tutors.slice(0, 5).forEach((tutor, index) => {
        console.log(`${index + 1}. ID: ${tutor.id}, Name: ${tutor.name || 'No name'}, Status: ${tutor.verified ? 'Approved' : 'Pending'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('📡 Response status:', error.response.status);
      console.error('📡 Response data:', error.response.data);
    }
  }
}

debugTutorsAPI();
