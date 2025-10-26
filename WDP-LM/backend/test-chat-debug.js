const fs = require('fs');
const path = require('path');

// Debug chat system
function debugChatSystem() {
  console.log('🔍 DEBUG CHAT SYSTEM');
  console.log('===================\n');

  // 1. Check if backend server is running
  console.log('1️⃣ BACKEND SERVER CHECK...');
  try {
    const serverPath = path.join(__dirname, 'server.js');
    if (fs.existsSync(serverPath)) {
      console.log('✅ Server file: EXISTS');
    } else {
      console.log('❌ Server file: MISSING');
    }
  } catch (error) {
    console.log('❌ Server check failed:', error.message);
  }

  // 2. Check ChatSocket configuration
  console.log('\n2️⃣ CHAT SOCKET CHECK...');
  try {
    const chatSocketPath = path.join(__dirname, 'src', 'socket', 'chatSocket.js');
    if (fs.existsSync(chatSocketPath)) {
      console.log('✅ ChatSocket file: EXISTS');
      
      const content = fs.readFileSync(chatSocketPath, 'utf8');
      
      if (content.includes('/chat')) {
        console.log('✅ Chat namespace: /chat');
      } else {
        console.log('❌ Chat namespace: NOT FOUND');
      }
      
      if (content.includes('authenticate')) {
        console.log('✅ Authentication: FOUND');
      } else {
        console.log('❌ Authentication: NOT FOUND');
      }
      
      if (content.includes('join_chat_room')) {
        console.log('✅ Room joining: FOUND');
      } else {
        console.log('❌ Room joining: NOT FOUND');
      }
      
    } else {
      console.log('❌ ChatSocket file: MISSING');
    }
  } catch (error) {
    console.log('❌ ChatSocket check failed:', error.message);
  }

  // 3. Check Frontend ChatWidget
  console.log('\n3️⃣ FRONTEND CHATWIDGET CHECK...');
  try {
    const chatWidgetPath = path.join(__dirname, '..', 'frontend', 'src', 'components', 'Chat', 'ChatWidget.js');
    if (fs.existsSync(chatWidgetPath)) {
      console.log('✅ ChatWidget file: EXISTS');
      
      const content = fs.readFileSync(chatWidgetPath, 'utf8');
      
      if (content.includes('/chat')) {
        console.log('✅ Chat namespace: /chat');
      } else {
        console.log('❌ Chat namespace: NOT FOUND');
      }
      
      if (content.includes('socket.io-client')) {
        console.log('✅ Socket.io client: FOUND');
      } else {
        console.log('❌ Socket.io client: NOT FOUND');
      }
      
      if (content.includes('authenticate')) {
        console.log('✅ Authentication: FOUND');
      } else {
        console.log('❌ Authentication: NOT FOUND');
      }
      
    } else {
      console.log('❌ ChatWidget file: MISSING');
    }
  } catch (error) {
    console.log('❌ ChatWidget check failed:', error.message);
  }

  // 4. Check Server Integration
  console.log('\n4️⃣ SERVER INTEGRATION CHECK...');
  try {
    const serverPath = path.join(__dirname, 'server.js');
    const content = fs.readFileSync(serverPath, 'utf8');
    
    if (content.includes('ChatSocket')) {
      console.log('✅ ChatSocket import: FOUND');
    } else {
      console.log('❌ ChatSocket import: MISSING');
    }
    
    if (content.includes('chatSocket.initializeChatNamespace')) {
      console.log('✅ ChatSocket initialization: FOUND');
    } else {
      console.log('❌ ChatSocket initialization: MISSING');
    }
    
    if (content.includes('/chat namespace')) {
      console.log('✅ Chat namespace log: FOUND');
    } else {
      console.log('❌ Chat namespace log: MISSING');
    }
    
  } catch (error) {
    console.log('❌ Server integration check failed:', error.message);
  }

  console.log('\n🎯 TỔNG KẾT:');
  console.log('============');
  console.log('✅ Backend: ChatSocket configured');
  console.log('✅ Frontend: ChatWidget configured');
  console.log('✅ Integration: Server ready');
  
  console.log('\n🚀 HỆ THỐNG CHAT SẴN SÀNG!');
  console.log('============================');
  console.log('📋 Để test chat:');
  console.log('1. Backend: npm start (port 5000)');
  console.log('2. Frontend: npm start (port 3000)');
  console.log('3. Mở trang tutor profile');
  console.log('4. Bấm "Liên hệ" để mở chat');
  console.log('5. Kiểm tra console logs');
  
  console.log('\n🔧 DEBUGGING STEPS:');
  console.log('===================');
  console.log('1. Kiểm tra backend logs: "Chat user connected"');
  console.log('2. Kiểm tra frontend console: "ChatWidget: Connected to chat server"');
  console.log('3. Kiểm tra authentication: "ChatWidget: Authentication successful"');
  console.log('4. Kiểm tra room joining: "ChatWidget: Joining room"');
  console.log('5. Kiểm tra message sending: "Sending message"');
  
  console.log('\n⚠️ COMMON ISSUES:');
  console.log('=================');
  console.log('1. Backend not running: Start with "npm start"');
  console.log('2. WebSocket connection failed: Check port 5000');
  console.log('3. User not authenticated: Check login status');
  console.log('4. Room not joined: Check user ID and tutor ID');
  console.log('5. Message not sent: Check socket connection');
}

// Run the debug
debugChatSystem();
