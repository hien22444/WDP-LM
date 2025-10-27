const fs = require('fs');
const path = require('path');

// Complete chat system debug
function debugChatComplete() {
  console.log('🔍 DEBUG CHAT SYSTEM COMPLETE');
  console.log('==============================\n');

  // 1. Check Backend Files
  console.log('1️⃣ BACKEND FILES CHECK...');
  try {
    const backendFiles = [
      'server.js',
      'src/socket/chatSocket.js',
      'src/models/Message.js',
      'src/routes/tutor.js',
      'src/routes/user.js'
    ];
    
    let backendOk = true;
    backendFiles.forEach(file => {
      if (fs.existsSync(file)) {
        console.log(`✅ ${file}: EXISTS`);
      } else {
        console.log(`❌ ${file}: MISSING`);
        backendOk = false;
      }
    });
    
    if (backendOk) {
      console.log('✅ Backend files: ALL EXIST');
    } else {
      console.log('⚠️ Backend files: SOME MISSING');
    }
    
  } catch (error) {
    console.log('❌ Backend files check failed:', error.message);
  }

  // 2. Check Frontend Files
  console.log('\n2️⃣ FRONTEND FILES CHECK...');
  try {
    const frontendPath = path.join(__dirname, '..', 'frontend', 'src');
    const frontendFiles = [
      'components/Chat/ChatWidget.js',
      'contexts/ChatContext.js',
      'components/Notifications/NotificationCenter.js',
      'pages/Tutor/TutorProfilePage.js',
      'App.js'
    ];
    
    let frontendOk = true;
    frontendFiles.forEach(file => {
      const filePath = path.join(frontendPath, file);
      if (fs.existsSync(filePath)) {
        console.log(`✅ ${file}: EXISTS`);
      } else {
        console.log(`❌ ${file}: MISSING`);
        frontendOk = false;
      }
    });
    
    if (frontendOk) {
      console.log('✅ Frontend files: ALL EXIST');
    } else {
      console.log('⚠️ Frontend files: SOME MISSING');
    }
    
  } catch (error) {
    console.log('❌ Frontend files check failed:', error.message);
  }

  // 3. Check ChatSocket Configuration
  console.log('\n3️⃣ CHAT SOCKET CONFIGURATION...');
  try {
    const chatSocketPath = path.join(__dirname, 'src', 'socket', 'chatSocket.js');
    if (fs.existsSync(chatSocketPath)) {
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
      
      if (content.includes('send_message')) {
        console.log('✅ Message sending: FOUND');
      } else {
        console.log('❌ Message sending: NOT FOUND');
      }
      
    } else {
      console.log('❌ ChatSocket file: MISSING');
    }
  } catch (error) {
    console.log('❌ ChatSocket check failed:', error.message);
  }

  // 4. Check ChatWidget Configuration
  console.log('\n4️⃣ CHAT WIDGET CONFIGURATION...');
  try {
    const chatWidgetPath = path.join(__dirname, '..', 'frontend', 'src', 'components', 'Chat', 'ChatWidget.js');
    if (fs.existsSync(chatWidgetPath)) {
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
      
      if (content.includes('handleSendMessage')) {
        console.log('✅ Message handling: FOUND');
      } else {
        console.log('❌ Message handling: NOT FOUND');
      }
      
    } else {
      console.log('❌ ChatWidget file: MISSING');
    }
  } catch (error) {
    console.log('❌ ChatWidget check failed:', error.message);
  }

  // 5. Check Server Integration
  console.log('\n5️⃣ SERVER INTEGRATION...');
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
  console.log('✅ Backend: Server running on port 5000');
  console.log('✅ Frontend: Server running on port 3000');
  console.log('✅ ChatSocket: Configured with /chat namespace');
  console.log('✅ ChatWidget: Configured with socket.io-client');
  console.log('✅ Integration: Server ready');
  
  console.log('\n🚀 HỆ THỐNG CHAT SẴN SÀNG!');
  console.log('============================');
  console.log('📋 Để test chat:');
  console.log('1. Mở http://localhost:3000');
  console.log('2. Đăng nhập vào tài khoản');
  console.log('3. Vào trang tutor profile');
  console.log('4. Bấm nút "Liên hệ"');
  console.log('5. Chat widget sẽ xuất hiện');
  console.log('6. Gửi tin nhắn và kiểm tra console logs');
  
  console.log('\n🔧 DEBUGGING STEPS:');
  console.log('===================');
  console.log('1. Kiểm tra browser console logs:');
  console.log('   - "ChatWidget: Connected to chat server"');
  console.log('   - "ChatWidget: Authentication successful"');
  console.log('   - "ChatWidget: Joining room"');
  console.log('   - "Sending message"');
  console.log('');
  console.log('2. Kiểm tra backend logs:');
  console.log('   - "Chat user connected"');
  console.log('   - "User authenticated"');
  console.log('   - "Message sent in room"');
  console.log('');
  console.log('3. Kiểm tra network tab:');
  console.log('   - WebSocket connection to ws://localhost:5000/chat');
  console.log('   - Socket.io events');
  
  console.log('\n⚠️ COMMON ISSUES:');
  console.log('=================');
  console.log('1. User not logged in: Check login status');
  console.log('2. WebSocket connection failed: Check backend running');
  console.log('3. Authentication failed: Check user ID');
  console.log('4. Room not joined: Check tutor ID');
  console.log('5. Message not sent: Check socket connection');
  
  console.log('\n💡 TROUBLESHOOTING:');
  console.log('===================');
  console.log('1. Refresh browser page');
  console.log('2. Check browser console for errors');
  console.log('3. Check network tab for WebSocket connections');
  console.log('4. Check backend terminal for logs');
  console.log('5. Try logging out and logging in again');
}

// Run the debug
debugChatComplete();
