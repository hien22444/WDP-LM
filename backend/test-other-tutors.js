const axios = require('axios');

async function testOtherTutors() {
  try {
    console.log('🔍 Testing Other Tutors API...');
    
    // Test search API để lấy danh sách tutors
    const searchResponse = await axios.get('http://localhost:5000/api/v1/tutors/search');
    console.log('✅ Search API Status:', searchResponse.status);
    console.log('📊 Total Tutors:', searchResponse.data.tutors?.length || 0);
    
    if (searchResponse.data.tutors && searchResponse.data.tutors.length > 0) {
      console.log('\n📋 All Tutors with Avatars:');
      searchResponse.data.tutors.forEach((tutor, index) => {
        console.log(`${index + 1}. ${tutor.name || 'No name'}`);
        console.log(`   ID: ${tutor.id}`);
        console.log(`   Avatar: ${tutor.avatar}`);
        console.log(`   AvatarUrl: ${tutor.avatarUrl}`);
        console.log('---');
      });
    }
    
    // Test specific tutors
    const tutorIds = [
      '68f10e166ba4bdbf991cc271', // Tung Ju4nR3
      '68f11b909b26049dd1711379', // hien tran
      '68f5cf6361859aeaa3b0eb91'  // Hiến Trịnh
    ];
    
    for (const id of tutorIds) {
      try {
        const profileResponse = await axios.get(`http://localhost:5000/api/v1/tutors/${id}`);
        if (profileResponse.data.tutor || profileResponse.data.profile) {
          const tutor = profileResponse.data.tutor || profileResponse.data.profile;
          console.log(`\n📋 ${tutor.name} (${id}):`);
          console.log(`   Avatar: ${tutor.avatar}`);
          console.log(`   AvatarUrl: ${tutor.avatarUrl}`);
        }
      } catch (error) {
        console.log(`❌ Error testing ${id}: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testOtherTutors();
