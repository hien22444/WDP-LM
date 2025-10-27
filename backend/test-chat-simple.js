const fs = require('fs');
const path = require('path');

console.log('🔍 TEST CHAT SYSTEM SIMPLE');
console.log('===========================\n');

// 1. Check if backend server is running
console.log('1️⃣ BACKEND SERVER CHECK...');
try {
  const { exec } = require('child_process');
  exec('netstat -an | findstr :5000', (error, stdout, stderr) => {
    if (stdout.includes('5000')) {
      console.log('✅ Backend server is running on port 5000');
    } else {
      console.log('❌ Backend server is NOT running on port 5000');
    }
  });
} catch (error) {
  console.log('❌ Cannot check server status:', error.message);
}

// 2. Check ChatSocket configuration
console.log('\n2️⃣ CHATSOCKET CONFIGURATION...');
try {
  const chatSocketPath = path.join(__dirname, 'src', 'socket', 'chatSocket.js');
  if (fs.existsSync(chatSocketPath)) {
    const content = fs.readFileSync(chatSocketPath, 'utf8');
    
    console.log('✅ ChatSocket file exists');
    
    if (content.includes('/chat')) {
      console.log('✅ Chat namespace: /chat');
    } else {
      console.log('❌ Chat namespace: NOT FOUND');
    }
    
    if (content.includes('socket.join(roomId)')) {
      console.log('✅ Room joining: FOUND');
    } else {
      console.log('❌ Room joining: NOT FOUND');
    }
    
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
    
  } else {
    console.log('❌ ChatSocket file: MISSING');
  }
} catch (error) {
  console.log('❌ ChatSocket check failed:', error.message);
}

// 3. Check Frontend ChatWidget
console.log('\n3️⃣ FRONTEND CHATWIDGET...');
try {
  const chatWidgetPath = path.join(__dirname, '..', 'frontend', 'src', 'components', 'Chat', 'ChatWidget.js');
  if (fs.existsSync(chatWidgetPath)) {
    const content = fs.readFileSync(chatWidgetPath, 'utf8');
    
    console.log('✅ ChatWidget file exists');
    
    if (content.includes('io(process.env.REACT_APP_API_URL || \'http://localhost:5000/chat\'')) {
      console.log('✅ Socket connection: /chat namespace');
    } else {
      console.log('❌ Socket connection: NOT /chat namespace');
    }
    
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
    
  } else {
    console.log('❌ ChatWidget file: MISSING');
  }
} catch (error) {
  console.log('❌ ChatWidget check failed:', error.message);
}

// 4. Check ChatContext
console.log('\n4️⃣ CHATCONTEXT...');
try {
  const chatContextPath = path.join(__dirname, '..', 'frontend', 'src', 'contexts', 'ChatContext.js');
  if (fs.existsSync(chatContextPath)) {
    const content = fs.readFileSync(chatContextPath, 'utf8');
    
    console.log('✅ ChatContext file exists');
    
    if (content.includes('io(process.env.REACT_APP_API_URL || \'http://localhost:5000/chat\'')) {
      console.log('✅ Context socket connection: /chat namespace');
    } else {
      console.log('❌ Context socket connection: NOT /chat namespace');
    }
    
    if (content.includes('newSocket.on(\'chat_message\', (data) => {')) {
      console.log('✅ Notification listening: FOUND');
    } else {
      console.log('❌ Notification listening: NOT FOUND');
    }
    
  } else {
    console.log('❌ ChatContext file: MISSING');
  }
} catch (error) {
  console.log('❌ ChatContext check failed:', error.message);
}

console.log('\n🎯 DIAGNOSIS:');
console.log('=============');
console.log('If all checks pass, the issue might be:');
console.log('1. 🔐 Authentication: Users not properly authenticated');
console.log('2. 🏠 Room joining: Users not joining the same room');
console.log('3. 📨 Message broadcasting: Backend not broadcasting correctly');
console.log('4. 🔌 Socket connection: Frontend not connecting to right namespace');
console.log('5. 👥 Multiple users: Need 2 different users to test');

console.log('\n🔧 DEBUGGING STEPS:');
console.log('===================');
console.log('1. Open 2 different browser tabs');
console.log('2. Login as different users in each tab');
console.log('3. Go to tutor profile in both tabs');
console.log('4. Click "Liên hệ" in one tab');
console.log('5. Send message and check if other tab receives it');
console.log('6. Check console logs in both tabs');
console.log('7. Check backend console for logs');

console.log('\n💡 COMMON FIXES:');
console.log('================');
console.log('1. Make sure both users are logged in');
console.log('2. Make sure both users are in the same room');
console.log('3. Check if room ID is generated correctly');
console.log('4. Check if socket connection is stable');
console.log('5. Check if authentication is working');
console.log('6. Check if message broadcasting is working');

console.log('\n🚀 NEXT STEPS:');
console.log('==============');
console.log('1. Test with 2 different browser tabs');
console.log('2. Check console logs on both sides');
console.log('3. Verify room ID generation');
console.log('4. Test message broadcasting');
console.log('5. Check backend logs for errors');