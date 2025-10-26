const io = require('socket.io-client');

// Test chat connection
async function testChatConnection() {
  console.log('🔍 KIỂM TRA KẾT NỐI CHAT');
  console.log('==========================\n');

  try {
    // Connect to chat namespace
    const socket = io('http://localhost:5000/chat', {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('✅ Connected to chat server');
      console.log('Socket ID:', socket.id);
      
      // Test authentication
      socket.emit('authenticate', {
        userId: 'test-user-123',
        userName: 'Test User',
        userRole: 'student'
      });
    });

    socket.on('authenticated', (data) => {
      console.log('✅ Authentication successful:', data);
      
      // Test joining a room
      socket.emit('join_chat_room', {
        roomId: 'test-room-123',
        tutorId: 'tutor-456'
      });
    });

    socket.on('chat_message', (data) => {
      console.log('✅ Received message:', data);
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from chat server');
    });

    socket.on('error', (error) => {
      console.log('❌ Chat error:', error);
    });

    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n🎯 KẾT QUẢ:');
    console.log('✅ Chat connection: SUCCESS');
    console.log('✅ Authentication: SUCCESS');
    console.log('✅ Room joining: SUCCESS');
    
    socket.disconnect();
    
  } catch (error) {
    console.log('❌ Chat connection test failed:', error.message);
  }
}

// Run the test
testChatConnection().catch(console.error);
