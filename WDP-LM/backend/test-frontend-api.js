// Test script để verify frontend có thể fetch dữ liệu từ API
const axios = require('axios');

async function testFrontendAPI() {
  console.log('🧪 Testing Frontend API Integration...\n');
  
  const API_BASE_URL = 'http://localhost:5000/api/v1';
  
  try {
    // Test với cùng config như frontend
    const client = axios.create({ 
      baseURL: API_BASE_URL, 
      withCredentials: true 
    });
    
    console.log('1️⃣ Testing listPublicTeachingSlots...');
    const response = await client.get('/bookings/slots/public');
    
    console.log('✅ Response status:', response.status);
    console.log('📊 Response data structure:', {
      hasItems: !!response.data.items,
      itemsLength: response.data.items?.length || 0,
      firstItemKeys: response.data.items?.[0] ? Object.keys(response.data.items[0]) : []
    });
    
    if (response.data.items?.length > 0) {
      const firstItem = response.data.items[0];
      console.log('🎯 First item details:');
      console.log('  - _id:', firstItem._id);
      console.log('  - courseName:', firstItem.courseName);
      console.log('  - price:', firstItem.price);
      console.log('  - mode:', firstItem.mode);
      console.log('  - status:', firstItem.status);
      console.log('  - tutorProfile:', !!firstItem.tutorProfile);
      console.log('  - tutorName:', firstItem.tutorProfile?.user?.full_name);
    }
    
    console.log('\n🎉 Frontend API integration test passed!');
    console.log('📝 Frontend should now display', response.data.items.length, 'teaching slots');
    
  } catch (error) {
    console.error('❌ Frontend API test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testFrontendAPI();
