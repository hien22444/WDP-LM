const axios = require('axios');

async function quickTest() {
  console.log('🎥 Quick Camera & WebRTC Test\n');

  try {
    // Test server
    console.log('1️⃣ Testing server...');
    const response = await axios.get('http://localhost:5000/api/v1/tutors/search?limit=1');
    console.log('✅ Server OK - Status:', response.status);

    // Test WebRTC service
    console.log('\n2️⃣ Testing WebRTC service...');
    const WebRTCService = require('./src/services/WebRTCService');
    const roomId = WebRTCService.generateRoomId();
    console.log('✅ WebRTC service OK - Room ID:', roomId);

    // Test Socket.IO (basic)
    console.log('\n3️⃣ Testing Socket.IO...');
    const io = require('socket.io-client');
    const socket = io('http://localhost:5000/webrtc', {
      transports: ['websocket', 'polling'],
      timeout: 3000
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout')), 3000);
      
      socket.on('connect', () => {
        clearTimeout(timeout);
        console.log('✅ Socket.IO OK - Connected');
        socket.disconnect();
        resolve();
      });
      
      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    console.log('\n🎉 All systems working!');
    console.log('\n💡 Next steps:');
    console.log('1. Open http://localhost:3000 in browser');
    console.log('2. Navigate to a tutor profile');
    console.log('3. Test video call functionality');
    console.log('4. Or open test-camera-webrtc.html for direct testing');

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

quickTest();
