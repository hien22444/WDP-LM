const axios = require('axios');

const baseURL = 'http://localhost:5000/api/v1';

async function testFrontendTutorsAPI() {
  try {
    console.log('🔍 Testing frontend tutors API call...');
    
    // Simulate the exact call that frontend makes
    const response = await axios.get(`${baseURL}/tutors/search`, {
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
    
    console.log('✅ Status:', response.status);
    console.log('📊 Response structure:');
    console.log('- Has tutors array:', !!response.data.tutors);
    console.log('- Number of tutors:', response.data.tutors?.length || 0);
    console.log('- Has pagination:', !!response.data.pagination);
    
    if (response.data.tutors && response.data.tutors.length > 0) {
      const firstTutor = response.data.tutors[0];
      console.log('\n📋 First tutor structure:');
      console.log('- ID:', firstTutor.id);
      console.log('- Name:', firstTutor.name);
      console.log('- Avatar:', firstTutor.avatar);
      console.log('- Subjects:', firstTutor.subjects);
      console.log('- Location:', firstTutor.location);
      console.log('- Rating:', firstTutor.rating);
      console.log('- Price:', firstTutor.price);
      console.log('- Experience:', firstTutor.experience);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('📡 Response status:', error.response.status);
      console.error('📡 Response data:', error.response.data);
    }
  }
}

testFrontendTutorsAPI();
