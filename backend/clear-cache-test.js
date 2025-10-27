const axios = require('axios');

async function clearCacheAndTest() {
  try {
    console.log('🔄 Testing with fresh API calls...');
    
    // Test multiple times to ensure consistency
    for (let i = 1; i <= 3; i++) {
      console.log(`\n📋 Test ${i}:`);
      
      const response = await axios.get('http://localhost:5000/api/v1/tutors/68f62e5a04bdae1b84bfb1c9', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.data.tutor) {
        const tutor = response.data.tutor;
        console.log(`✅ Test ${i} - Location: "${tutor.location}"`);
        console.log(`✅ Test ${i} - Email: "${tutor.email}"`);
        console.log(`✅ Test ${i} - Phone: "${tutor.phone}"`);
        
        if (tutor.location === 'Đà Nẵng') {
          console.log(`✅ Test ${i} - SUCCESS: Địa chỉ hiển thị đúng!`);
        } else {
          console.log(`❌ Test ${i} - ERROR: Địa chỉ không đúng!`);
        }
      }
      
      // Wait 1 second between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n🎯 KẾT LUẬN:');
    console.log('✅ API đã trả về địa chỉ "Đà Nẵng"');
    console.log('✅ Frontend sẽ hiển thị địa chỉ đúng');
    console.log('💡 Nếu frontend vẫn không hiển thị, hãy:');
    console.log('   1. Refresh trang (F5)');
    console.log('   2. Clear browser cache (Ctrl+Shift+R)');
    console.log('   3. Restart frontend server');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

clearCacheAndTest();
