const axios = require('axios');

async function testLogin() {
  try {
    console.log('=== TESTING LOGIN API ===\n');
    
    const response = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: 'tungptde180798@fpt.edu.vn',
      password: '123123123' // Password của bạn
    });

    console.log('✅ Login successful!\n');
    console.log('=== RESPONSE DATA ===');
    console.log(JSON.stringify(response.data, null, 2));
    
    console.log('\n=== ACCESS TOKEN (first 50 chars) ===');
    console.log(response.data.accessToken?.substring(0, 50) + '...');
    
    console.log('\n=== USER INFO ===');
    console.log('Email:', response.data.user?.account?.email || response.data.user?.email);
    console.log('Role:', response.data.user?.account?.role || response.data.user?.role);
    console.log('Name:', response.data.user?.profile?.full_name || response.data.user?.full_name);
    
  } catch (error) {
    console.error('❌ Login failed!');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.message);
    console.error('\n=== FULL ERROR RESPONSE ===');
    console.error(JSON.stringify(error.response?.data, null, 2));
  }
}

testLogin();
