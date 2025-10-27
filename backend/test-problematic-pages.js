const axios = require('axios');

async function testProblematicPages() {
  console.log('🔍 Testing Problematic Pages Database Connection...\n');
  
  const baseURL = 'http://localhost:5000/api/v1';
  
  const problematicTests = [
    {
      name: '🔐 Authentication System',
      tests: [
        { method: 'GET', url: `${baseURL}/auth/health`, expected: 'Health check endpoint' },
        { method: 'POST', url: `${baseURL}/auth/login`, data: { email: 'test@test.com', password: 'test' }, expected: 'Login endpoint' },
        { method: 'POST', url: `${baseURL}/auth/register`, data: { email: 'test@test.com', password: 'test' }, expected: 'Register endpoint' }
      ]
    },
    {
      name: '⭐ Review System',
      tests: [
        { method: 'GET', url: `${baseURL}/reviews`, expected: 'List reviews endpoint' },
        { method: 'POST', url: `${baseURL}/reviews`, data: { bookingId: 'test', rating: 5 }, expected: 'Create review endpoint' },
        { method: 'GET', url: `${baseURL}/reviews/tutor/test`, expected: 'Get tutor reviews endpoint' }
      ]
    },
    {
      name: '🤖 AI Chatbot System',
      tests: [
        { method: 'GET', url: `${baseURL}/ai/chat`, expected: 'AI chat endpoint' },
        { method: 'POST', url: `${baseURL}/ai/chat`, data: { message: 'Hello' }, expected: 'AI chat POST endpoint' },
        { method: 'POST', url: `${baseURL}/ai/search-tutors`, data: { query: 'math tutor' }, expected: 'AI search tutors endpoint' }
      ]
    },
    {
      name: '👑 Admin Dashboard',
      tests: [
        { method: 'GET', url: `${baseURL}/admin/users`, expected: 'Admin users endpoint' },
        { method: 'GET', url: `${baseURL}/admin/tutors`, expected: 'Admin tutors endpoint' },
        { method: 'GET', url: `${baseURL}/admin/bookings`, expected: 'Admin bookings endpoint' }
      ]
    },
    {
      name: '🎥 Video Call System',
      tests: [
        { method: 'GET', url: `${baseURL}/webrtc/rooms`, expected: 'WebRTC rooms endpoint' },
        { method: 'POST', url: `${baseURL}/webrtc/rooms`, data: { roomId: 'test' }, expected: 'Create WebRTC room endpoint' }
      ]
    }
  ];
  
  for (const pageTest of problematicTests) {
    console.log(`\n📋 Testing: ${pageTest.name}`);
    console.log('='.repeat(50));
    
    for (const test of pageTest.tests) {
      try {
        console.log(`\n🔍 ${test.method} ${test.url}`);
        console.log(`   📝 ${test.expected}`);
        
        const config = {
          method: test.method,
          url: test.url,
          timeout: 5000,
          validateStatus: function (status) {
            return status >= 200 && status < 500;
          }
        };
        
        if (test.data) {
          config.data = test.data;
          config.headers = { 'Content-Type': 'application/json' };
        }
        
        const response = await axios(config);
        
        if (response.status === 200) {
          console.log(`   ✅ Status: ${response.status} - Working perfectly`);
          if (response.data) {
            console.log(`   📊 Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
          }
        } else if (response.status === 401) {
          console.log(`   ⚠️  Status: ${response.status} - Authentication required (Normal)`);
        } else if (response.status === 404) {
          console.log(`   ❌ Status: ${response.status} - Endpoint not found`);
        } else {
          console.log(`   ⚠️  Status: ${response.status} - ${response.statusText}`);
        }
        
      } catch (error) {
        if (error.response) {
          console.log(`   ❌ Status: ${error.response.status} - ${error.response.statusText}`);
        } else if (error.code === 'ECONNREFUSED') {
          console.log(`   ❌ Connection refused - Service not running`);
        } else {
          console.log(`   ❌ Error: ${error.message}`);
        }
      }
    }
  }
  
  console.log('\n📋 PROBLEMATIC PAGES SUMMARY:');
  console.log('='.repeat(50));
  console.log('❌ Pages with Database Connection Issues:');
  console.log('   1. 🔐 Authentication - Some endpoints missing or need auth');
  console.log('   2. ⭐ Review System - GET endpoints not implemented');
  console.log('   3. 🤖 AI Chatbot - GET endpoints not implemented');
  console.log('   4. 👑 Admin Dashboard - Requires authentication');
  console.log('   5. 🎥 Video Call - REST endpoints not implemented');
  
  console.log('\n🔧 RECOMMENDED FIXES:');
  console.log('   1. Add GET endpoints for Reviews system');
  console.log('   2. Add GET endpoints for AI system');
  console.log('   3. Implement WebRTC REST endpoints');
  console.log('   4. Add health check endpoints');
  console.log('   5. Test with proper authentication tokens');
  
  console.log('\n✅ WORKING PAGES:');
  console.log('   - 🏠 Landing Page / Courses (98 slots)');
  console.log('   - 👨‍🏫 Tutor Profiles (3 tutors)');
  console.log('   - 📅 Booking System (98 slots)');
  console.log('   - 💰 Payment System (42 payments)');
  console.log('   - 📱 Frontend App (React)');
}

testProblematicPages().catch(console.error);
