const axios = require('axios');

async function testAdminAPI() {
  try {
    console.log('🔍 Testing Admin API...');
    
    // Test admin users endpoint
    const response = await axios.get('http://localhost:5000/api/v1/admin/users', {
      params: {
        page: 1,
        limit: 100
      }
    });
    
    console.log('✅ Status:', response.status);
    console.log('📊 Users found:', response.data.users?.length || 0);
    console.log('📊 Pagination:', response.data.pagination);
    
    if (response.data.users && response.data.users.length > 0) {
      console.log('\n📋 Sample users:');
      response.data.users.slice(0, 10).forEach((user, index) => {
        console.log(`${index + 1}. ${user.full_name} (${user.email}) - ${user.role} - ${user.status}`);
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

testAdminAPI();
