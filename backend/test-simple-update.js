const axios = require('axios');

async function testSimpleUpdate() {
  try {
    console.log('🔍 Testing simple PATCH request...');
    
    // Test with a real token from the logs we saw earlier
    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGY2MmRmYzA0YmRhZTFiODRiZmIxYjkiLCJpYXQiOjE3MzI2NDQ4NzIsImV4cCI6MTczMjczMTI3Mn0.placeholder';
    
    const testData = {
      introduction: 'Test introduction',
      subjects: ['Toán', 'Lý'],
      experience: '3',
      hourlyRate: '200000',
      location: 'Hà Nội',
      education: 'Cử nhân',
      university: 'Đại học Bách Khoa',
      teachingMethod: 'Phương pháp dạy tích cực',
      achievements: 'Giải thưởng xuất sắc'
    };
    
    console.log('📤 Sending data:', testData);
    
    const response = await axios.patch('http://localhost:5000/api/v1/tutors/me', testData, {
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Success:', response.data);
    
  } catch (error) {
    console.error('❌ Error details:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Data:', error.response?.data);
    console.error('Headers:', error.response?.headers);
    console.error('Full Error:', error.message);
  }
}

testSimpleUpdate();
