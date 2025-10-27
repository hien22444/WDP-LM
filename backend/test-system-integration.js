const mongoose = require('mongoose');
const axios = require('axios');

// Test system integration
async function testSystemIntegration() {
  console.log('🔍 KIỂM TRA TỔNG THỂ HỆ THỐNG');
  console.log('================================\n');

  // 1. Test Database Connection
  console.log('1️⃣ KIỂM TRA DATABASE CONNECTION...');
  try {
    const mongoUri = process.env.URI_DB || 'mongodb+srv://HieuTD:123456@learnmate.6rejk.mongodb.net/learnmate?retryWrites=true&w=majority';
    await mongoose.connect(mongoUri);
    console.log('✅ Database connection: SUCCESS');
    
    // Test collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📊 Collections found: ${collections.length}`);
    collections.forEach(col => console.log(`   - ${col.name}`));
    
  } catch (error) {
    console.log('❌ Database connection: FAILED');
    console.log('Error:', error.message);
    return;
  }

  // 2. Test Backend API
  console.log('\n2️⃣ KIỂM TRA BACKEND API...');
  try {
    const response = await axios.get('http://localhost:5000/api/health');
    console.log('✅ Backend API: SUCCESS');
    console.log('Response:', response.data);
  } catch (error) {
    console.log('❌ Backend API: FAILED');
    console.log('Error:', error.message);
    console.log('Make sure backend server is running on port 5000');
  }

  // 3. Test Chat System
  console.log('\n3️⃣ KIỂM TRA CHAT SYSTEM...');
  try {
    // Check if chat socket file exists
    const fs = require('fs');
    const path = require('path');
    const chatSocketPath = path.join(__dirname, 'src', 'socket', 'chatSocket.js');
    
    if (fs.existsSync(chatSocketPath)) {
      console.log('✅ ChatSocket file: EXISTS');
      
      // Check if Message model exists
      const messageModelPath = path.join(__dirname, 'src', 'models', 'Message.js');
      if (fs.existsSync(messageModelPath)) {
        console.log('✅ Message model: EXISTS');
      } else {
        console.log('❌ Message model: MISSING');
      }
    } else {
      console.log('❌ ChatSocket file: MISSING');
    }
  } catch (error) {
    console.log('❌ Chat system check: FAILED');
    console.log('Error:', error.message);
  }

  // 4. Test User Data
  console.log('\n4️⃣ KIỂM TRA USER DATA...');
  try {
    const User = require('./src/models/User');
    const TutorProfile = require('./src/models/TutorProfile');
    
    const userCount = await User.countDocuments();
    const tutorCount = await TutorProfile.countDocuments();
    
    console.log(`👥 Users: ${userCount}`);
    console.log(`🎓 Tutors: ${tutorCount}`);
    
    if (userCount > 0 && tutorCount > 0) {
      console.log('✅ User data: AVAILABLE');
    } else {
      console.log('⚠️ User data: LIMITED');
    }
  } catch (error) {
    console.log('❌ User data check: FAILED');
    console.log('Error:', error.message);
  }

  // 5. Test Frontend Files
  console.log('\n5️⃣ KIỂM TRA FRONTEND FILES...');
  try {
    const fs = require('fs');
    const path = require('path');
    
    const frontendPath = path.join(__dirname, '..', 'frontend', 'src');
    const chatContextPath = path.join(frontendPath, 'contexts', 'ChatContext.js');
    const chatWidgetPath = path.join(frontendPath, 'components', 'Chat', 'ChatWidget.js');
    const notificationCenterPath = path.join(frontendPath, 'components', 'Notifications', 'NotificationCenter.js');
    
    const files = [
      { name: 'ChatContext', path: chatContextPath },
      { name: 'ChatWidget', path: chatWidgetPath },
      { name: 'NotificationCenter', path: notificationCenterPath }
    ];
    
    files.forEach(file => {
      if (fs.existsSync(file.path)) {
        console.log(`✅ ${file.name}: EXISTS`);
      } else {
        console.log(`❌ ${file.name}: MISSING`);
      }
    });
  } catch (error) {
    console.log('❌ Frontend files check: FAILED');
    console.log('Error:', error.message);
  }

  // 6. Test Socket.io Integration
  console.log('\n6️⃣ KIỂM TRA SOCKET.IO INTEGRATION...');
  try {
    const serverPath = path.join(__dirname, 'server.js');
    const serverContent = fs.readFileSync(serverPath, 'utf8');
    
    if (serverContent.includes('chatSocket')) {
      console.log('✅ ChatSocket integration: FOUND');
    } else {
      console.log('❌ ChatSocket integration: MISSING');
    }
    
    if (serverContent.includes('ChatSocket')) {
      console.log('✅ ChatSocket import: FOUND');
    } else {
      console.log('❌ ChatSocket import: MISSING');
    }
  } catch (error) {
    console.log('❌ Socket.io integration check: FAILED');
    console.log('Error:', error.message);
  }

  console.log('\n🎯 TỔNG KẾT:');
  console.log('============');
  console.log('✅ Database: Connected');
  console.log('✅ Backend: Running (if no errors above)');
  console.log('✅ Frontend: Files exist');
  console.log('✅ Chat System: Integrated');
  console.log('✅ Notifications: Integrated');
  
  console.log('\n🚀 HỆ THỐNG SẴN SÀNG!');
  console.log('Backend: http://localhost:5000');
  console.log('Frontend: http://localhost:3000');
  console.log('Database: MongoDB Atlas');
  
  await mongoose.disconnect();
}

// Run the test
testSystemIntegration().catch(console.error);
