const io = require('socket.io-client');

console.log('🔍 TEST DUAL CHAT SYSTEM');
console.log('=========================\n');

// Test with two different socket connections
async function testDualChat() {
  console.log('1️⃣ CREATING TWO SOCKET CONNECTIONS...');
  
  // First user (Student)
  const studentSocket = io('http://localhost:5000/chat', {
    transports: ['websocket', 'polling']
  });
  
  // Second user (Tutor)
  const tutorSocket = io('http://localhost:5000/chat', {
    transports: ['websocket', 'polling']
  });
  
  let studentConnected = false;
  let tutorConnected = false;
  let studentAuthenticated = false;
  let tutorAuthenticated = false;
  let studentJoinedRoom = false;
  let tutorJoinedRoom = false;
  let messageReceived = false;
  
  // Student connection
  studentSocket.on('connect', () => {
    console.log('✅ Student connected');
    studentConnected = true;
    
    // Authenticate student
    studentSocket.emit('authenticate', {
      userId: 'student123',
      userName: 'Student User',
      userRole: 'student'
    });
  });
  
  studentSocket.on('authenticated', () => {
    console.log('✅ Student authenticated');
    studentAuthenticated = true;
    
    // Join room
    const roomId = 'chat_student123_tutor456';
    studentSocket.emit('join_chat_room', { roomId, tutorId: 'tutor456' });
  });
  
  studentSocket.on('chat_history', (history) => {
    console.log('✅ Student received chat history:', history.length, 'messages');
  });
  
  studentSocket.on('chat_message', (data) => {
    console.log('✅ Student received message:', data.message);
    messageReceived = true;
  });
  
  // Tutor connection
  tutorSocket.on('connect', () => {
    console.log('✅ Tutor connected');
    tutorConnected = true;
    
    // Authenticate tutor
    tutorSocket.emit('authenticate', {
      userId: 'tutor456',
      userName: 'Tutor User',
      userRole: 'tutor'
    });
  });
  
  tutorSocket.on('authenticated', () => {
    console.log('✅ Tutor authenticated');
    tutorAuthenticated = true;
    
    // Join room
    const roomId = 'chat_student123_tutor456';
    tutorSocket.emit('join_chat_room', { roomId, tutorId: 'tutor456' });
  });
  
  tutorSocket.on('chat_history', (history) => {
    console.log('✅ Tutor received chat history:', history.length, 'messages');
  });
  
  tutorSocket.on('chat_message', (data) => {
    console.log('✅ Tutor received message:', data.message);
    messageReceived = true;
  });
  
  // Wait for connections
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('\n2️⃣ CONNECTION STATUS:');
  console.log('=====================');
  console.log(`Student connected: ${studentConnected ? '✅' : '❌'}`);
  console.log(`Tutor connected: ${tutorConnected ? '✅' : '❌'}`);
  console.log(`Student authenticated: ${studentAuthenticated ? '✅' : '❌'}`);
  console.log(`Tutor authenticated: ${tutorAuthenticated ? '✅' : '❌'}`);
  
  if (studentAuthenticated && tutorAuthenticated) {
    console.log('\n3️⃣ TESTING MESSAGE SENDING...');
    console.log('==============================');
    
    // Student sends message
    const messageData = {
      message: 'Hello from student!',
      receiverId: 'tutor456',
      roomId: 'chat_student123_tutor456'
    };
    
    console.log('📤 Student sending message:', messageData.message);
    studentSocket.emit('send_message', messageData);
    
    // Wait for message to be processed
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('\n4️⃣ MESSAGE DELIVERY STATUS:');
    console.log('===========================');
    console.log(`Message received: ${messageReceived ? '✅' : '❌'}`);
    
    if (messageReceived) {
      console.log('\n🎉 CHAT SYSTEM WORKING!');
      console.log('======================');
      console.log('✅ Both users can connect');
      console.log('✅ Both users can authenticate');
      console.log('✅ Both users can join room');
      console.log('✅ Messages are delivered');
    } else {
      console.log('\n❌ CHAT SYSTEM NOT WORKING');
      console.log('==========================');
      console.log('❌ Messages are not being delivered');
      console.log('❌ Check backend logs for errors');
      console.log('❌ Check room joining logic');
    }
  } else {
    console.log('\n❌ AUTHENTICATION FAILED');
    console.log('========================');
    console.log('❌ Cannot test message delivery');
    console.log('❌ Check authentication logic');
  }
  
  // Close connections
  studentSocket.close();
  tutorSocket.close();
  
  console.log('\n🔧 DEBUGGING TIPS:');
  console.log('==================');
  console.log('1. Check backend console for:');
  console.log('   - "Chat user connected"');
  console.log('   - "User authenticated"');
  console.log('   - "User joined room"');
  console.log('   - "Message sent in room"');
  console.log('   - "Broadcasting message to room"');
  console.log('');
  console.log('2. Check if both users are in same room');
  console.log('3. Check if room ID is generated correctly');
  console.log('4. Check if message broadcasting is working');
}

// Run the test
testDualChat().catch(console.error);
