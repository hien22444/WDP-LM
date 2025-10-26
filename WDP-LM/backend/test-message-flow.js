const fs = require('fs');
const path = require('path');

console.log('🔍 TEST MESSAGE FLOW COMPLETE');
console.log('==============================\n');

// 1. Check Backend ChatSocket
console.log('1️⃣ BACKEND CHATSOCKET CHECK...');
try {
  const chatSocketPath = path.join(__dirname, 'src', 'socket', 'chatSocket.js');
  if (fs.existsSync(chatSocketPath)) {
    const content = fs.readFileSync(chatSocketPath, 'utf8');
    
    if (content.includes('chatNamespace.to(roomId).emit(\'chat_message\'')) {
      console.log('✅ Message broadcasting: FOUND');
    } else {
      console.log('❌ Message broadcasting: NOT FOUND');
    }
    
    if (content.includes('await newMessage.save()')) {
      console.log('✅ Message saving: FOUND');
    } else {
      console.log('❌ Message saving: NOT FOUND');
    }
    
    if (content.includes('socket.join(roomId)')) {
      console.log('✅ Room joining: FOUND');
    } else {
      console.log('❌ Room joining: NOT FOUND');
    }
    
  } else {
    console.log('❌ ChatSocket file: MISSING');
  }
} catch (error) {
  console.log('❌ Backend check failed:', error.message);
}

// 2. Check Frontend ChatWidget
console.log('\n2️⃣ FRONTEND CHATWIDGET CHECK...');
try {
  const chatWidgetPath = path.join(__dirname, '..', 'frontend', 'src', 'components', 'Chat', 'ChatWidget.js');
  if (fs.existsSync(chatWidgetPath)) {
    const content = fs.readFileSync(chatWidgetPath, 'utf8');
    
    if (content.includes('socket.emit(\'send_message\', messageData)')) {
      console.log('✅ Message sending: FOUND');
    } else {
      console.log('❌ Message sending: NOT FOUND');
    }
    
    if (content.includes('chatSocket.on(\'chat_message\', handleChatMessage)')) {
      console.log('✅ Message receiving: FOUND');
    } else {
      console.log('❌ Message receiving: NOT FOUND');
    }
    
    if (content.includes('io(process.env.REACT_APP_API_URL || \'http://localhost:5000/chat\'')) {
      console.log('✅ Socket connection: FOUND');
    } else {
      console.log('❌ Socket connection: NOT FOUND');
    }
    
  } else {
    console.log('❌ ChatWidget file: MISSING');
  }
} catch (error) {
  console.log('❌ Frontend check failed:', error.message);
}

// 3. Check ChatContext
console.log('\n3️⃣ CHATCONTEXT CHECK...');
try {
  const chatContextPath = path.join(__dirname, '..', 'frontend', 'src', 'contexts', 'ChatContext.js');
  if (fs.existsSync(chatContextPath)) {
    const content = fs.readFileSync(chatContextPath, 'utf8');
    
    if (content.includes('newSocket.on(\'chat_message\', (data) => {')) {
      console.log('✅ Notification listening: FOUND');
    } else {
      console.log('❌ Notification listening: NOT FOUND');
    }
    
    if (content.includes('io(process.env.REACT_APP_API_URL || \'http://localhost:5000/chat\'')) {
      console.log('✅ Context socket connection: FOUND');
    } else {
      console.log('❌ Context socket connection: NOT FOUND');
    }
    
  } else {
    console.log('❌ ChatContext file: MISSING');
  }
} catch (error) {
  console.log('❌ ChatContext check failed:', error.message);
}

console.log('\n🎯 POSSIBLE ISSUES:');
console.log('==================');
console.log('1. 🔌 Socket Connection:');
console.log('   - Frontend connects to /chat namespace');
console.log('   - Backend uses chatNamespace');
console.log('   - Both should be on same namespace');
console.log('');
console.log('2. 📨 Message Broadcasting:');
console.log('   - Backend broadcasts to chatNamespace.to(roomId)');
console.log('   - Frontend listens on chatSocket.on(\'chat_message\')');
console.log('   - Both should use same event name');
console.log('');
console.log('3. 🔐 Authentication:');
console.log('   - User must be authenticated before sending');
console.log('   - Room must be joined before receiving');
console.log('   - Both users must be in same room');

console.log('\n🔧 DEBUGGING STEPS:');
console.log('===================');
console.log('1. Check backend console for:');
console.log('   - "User authenticated"');
console.log('   - "User joined room"');
console.log('   - "Message sent in room"');
console.log('   - "Broadcasting message to room"');
console.log('');
console.log('2. Check frontend console for:');
console.log('   - "ChatWidget: Connected to chat server"');
console.log('   - "ChatWidget: Authentication successful"');
console.log('   - "ChatWidget: Joining room"');
console.log('   - "Sending message"');
console.log('');
console.log('3. Check network tab for:');
console.log('   - WebSocket connection to ws://localhost:5000/chat');
console.log('   - Socket.io events being sent/received');

console.log('\n💡 TROUBLESHOOTING:');
console.log('===================');
console.log('1. Make sure both users are logged in');
console.log('2. Make sure both users join the same room');
console.log('3. Check if room ID is generated correctly');
console.log('4. Check if socket connection is stable');
console.log('5. Check if authentication is working');

console.log('\n🚀 NEXT STEPS:');
console.log('==============');
console.log('1. Test with two different browsers/tabs');
console.log('2. Check console logs on both sides');
console.log('3. Verify room ID generation');
console.log('4. Test message broadcasting');
