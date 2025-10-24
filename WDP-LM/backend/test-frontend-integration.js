const axios = require('axios');

const baseURL = 'http://localhost:5000/api/v1';
const frontendURL = 'http://localhost:3000';

async function testFrontendIntegration() {
  try {
    console.log('🔍 Testing frontend integration...');
    
    // Test 1: Check if backend is running
    console.log('\n1. Testing backend API...');
    const backendResponse = await axios.get(`${baseURL}/tutors/search`, {
      params: { page: 1, limit: 5, includePending: false }
    });
    console.log('✅ Backend API working:', backendResponse.status === 200);
    console.log('📊 Tutors available:', backendResponse.data.tutors?.length || 0);
    
    // Test 2: Check if frontend is running
    console.log('\n2. Testing frontend...');
    try {
      const frontendResponse = await axios.get(`${frontendURL}/tutors`, {
        timeout: 5000
      });
      console.log('✅ Frontend accessible:', frontendResponse.status === 200);
    } catch (error) {
      console.log('❌ Frontend not accessible:', error.message);
      console.log('💡 Make sure to run: cd WDP-LM/frontend && npm start');
    }
    
    // Test 3: Simulate the exact API call frontend makes
    console.log('\n3. Testing exact frontend API call...');
    const frontendAPIResponse = await axios.get(`${baseURL}/tutors/search`, {
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
    
    console.log('✅ Frontend API call successful:', frontendAPIResponse.status === 200);
    console.log('📊 Response structure:');
    console.log('- Has tutors:', !!frontendAPIResponse.data.tutors);
    console.log('- Tutors count:', frontendAPIResponse.data.tutors?.length || 0);
    console.log('- Has pagination:', !!frontendAPIResponse.data.pagination);
    
    if (frontendAPIResponse.data.tutors && frontendAPIResponse.data.tutors.length > 0) {
      console.log('\n📋 Sample tutor data:');
      const sampleTutor = frontendAPIResponse.data.tutors[0];
      console.log('- ID:', sampleTutor.id);
      console.log('- Name:', sampleTutor.name || 'No name');
      console.log('- Avatar:', sampleTutor.avatar ? 'Has avatar' : 'No avatar');
      console.log('- Subjects:', sampleTutor.subjects?.length || 0, 'subjects');
      console.log('- Location:', sampleTutor.location || 'No location');
      console.log('- Rating:', sampleTutor.rating);
      console.log('- Price:', sampleTutor.price);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('📡 Response status:', error.response.status);
      console.error('📡 Response data:', error.response.data);
    }
  }
}

testFrontendIntegration();
