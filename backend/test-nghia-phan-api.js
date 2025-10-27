const axios = require('axios');

async function testNghiaPhanAPI() {
  try {
    console.log('🔍 Testing Nghia Phan API...');
    
    // Test search API
    const searchResponse = await axios.get('http://localhost:5000/api/v1/tutors/search?search=Nghia');
    console.log('✅ Search API Status:', searchResponse.status);
    console.log('📊 Search Results:', searchResponse.data.tutors?.length || 0);
    
    if (searchResponse.data.tutors && searchResponse.data.tutors.length > 0) {
      const nghiaPhan = searchResponse.data.tutors.find(t => t.name === 'Nghia Phan');
      if (nghiaPhan) {
        console.log('\n📋 Nghia Phan from Search API:');
        console.log('ID:', nghiaPhan.id);
        console.log('Name:', nghiaPhan.name);
        console.log('Avatar:', nghiaPhan.avatar);
        console.log('AvatarUrl:', nghiaPhan.avatarUrl);
        console.log('User Image:', nghiaPhan.user?.image);
      }
    }
    
    // Test specific tutor profile API
    const profileResponse = await axios.get('http://localhost:5000/api/v1/tutors/68f62e5a04bdae1b84bfb1c9');
    console.log('\n✅ Profile API Status:', profileResponse.status);
    
    if (profileResponse.data.tutor || profileResponse.data.profile) {
      const tutor = profileResponse.data.tutor || profileResponse.data.profile;
      console.log('\n📋 Nghia Phan from Profile API:');
      console.log('ID:', tutor.id);
      console.log('Name:', tutor.name);
      console.log('Avatar:', tutor.avatar);
      console.log('AvatarUrl:', tutor.avatarUrl);
      console.log('Location:', tutor.location);
      console.log('City:', tutor.city);
      console.log('Bio:', tutor.bio);
      console.log('Subjects:', tutor.subjects);
      console.log('Experience:', tutor.experience);
      console.log('Price:', tutor.price);
      console.log('Teach Modes:', tutor.teachModes);
      console.log('Languages:', tutor.languages);
      console.log('User Image:', tutor.user?.image);
      console.log('User Object:', tutor.user);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testNghiaPhanAPI();
