const axios = require('axios');

async function testSimpleAPI() {
  try {
    console.log('🔍 Testing simple API call...');
    
    const response = await axios.get('http://localhost:5000/api/v1/tutors/search', {
      params: {
        page: 1,
        limit: 100
      }
    });
    
    console.log('✅ Status:', response.status);
    console.log('📊 Tutors found:', response.data.tutors?.length || 0);
    console.log('📊 Pagination:', response.data.pagination);
    
    if (response.data.tutors && response.data.tutors.length > 0) {
      console.log('\n📋 Sample tutors:');
      response.data.tutors.slice(0, 5).forEach((tutor, index) => {
        console.log(`${index + 1}. ${tutor.name || 'No name'} (${tutor.id})`);
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

testSimpleAPI();
