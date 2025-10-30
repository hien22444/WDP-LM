const axios = require('axios');

async function testFrontendDisplay() {
  try {
    console.log('🔍 Testing Frontend Display for Nghia Phan...');
    
    // Test API response
    const response = await axios.get('http://localhost:5000/api/v1/tutors/68f62e5a04bdae1b84bfb1c9');
    
    if (response.data.tutor) {
      const tutor = response.data.tutor;
      console.log('\n📋 API Response:');
      console.log('Name:', tutor.name);
      console.log('Location:', tutor.location);
      console.log('Email:', tutor.email);
      console.log('Phone:', tutor.phone);
      
      // Simulate frontend logic
      console.log('\n🎯 Frontend Display Logic:');
      console.log('Contact Info Address:', tutor.contactInfo?.address || 'undefined');
      console.log('Tutor Location:', tutor.location || 'undefined');
      console.log('Final Address Display:', tutor.contactInfo?.address || tutor.location || 'Chưa cập nhật');
      
      // Check if location is properly set
      if (tutor.location === 'Đà Nẵng') {
        console.log('\n✅ SUCCESS: API trả về địa chỉ "Đà Nẵng"');
        console.log('✅ Frontend sẽ hiển thị: "Đà Nẵng"');
      } else {
        console.log('\n❌ ERROR: API không trả về địa chỉ đúng');
        console.log('❌ Location value:', tutor.location);
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

testFrontendDisplay();
