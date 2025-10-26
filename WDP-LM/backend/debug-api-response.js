const axios = require('axios');

async function debugApiResponse() {
  try {
    console.log('🔍 Testing API Response for Nghia Phan...');
    
    const response = await axios.get('http://localhost:5000/api/v1/tutors/68f62e5a04bdae1b84bfb1c9');
    
    console.log('\n📋 Full API Response:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.tutor || response.data.profile) {
      const tutor = response.data.tutor || response.data.profile;
      console.log('\n🎯 Tutor Object Fields:');
      console.log('ID:', tutor.id);
      console.log('Name:', tutor.name);
      console.log('Avatar:', tutor.avatar);
      console.log('Location:', tutor.location);
      console.log('City:', tutor.city);
      console.log('Bio:', tutor.bio);
      console.log('Subjects:', tutor.subjects);
      console.log('Experience:', tutor.experience);
      console.log('Price:', tutor.price);
      console.log('Teach Modes:', tutor.teachModes);
      console.log('Languages:', tutor.languages);
      
      console.log('\n🔍 All Available Fields:');
      Object.keys(tutor).forEach(key => {
        console.log(`${key}: ${tutor[key]}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

debugApiResponse();
