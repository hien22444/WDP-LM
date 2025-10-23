const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api/v1';

// Test data
const testTutor = {
  email: 'tutor@test.com',
  password: 'password123',
  firstName: 'Test',
  lastName: 'Tutor'
};

const testStudent = {
  email: 'student@test.com',
  password: 'password123',
  firstName: 'Test',
  lastName: 'Student'
};

let tutorToken = '';
let studentToken = '';
let bookingId = '';

// Helper function to make API calls
const apiCall = async (method, endpoint, data = null, token = '') => {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      ...(data && { data })
    };
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};

// Test functions
const testUserRegistration = async () => {
  console.log('\n🔐 Testing user registration...');
  
  // Register tutor
  const tutorReg = await apiCall('POST', '/auth/register', testTutor);
  if (tutorReg.success) {
    console.log('✅ Tutor registered successfully');
  } else {
    console.log('❌ Tutor registration failed:', tutorReg.error);
  }
  
  // Register student
  const studentReg = await apiCall('POST', '/auth/register', testStudent);
  if (studentReg.success) {
    console.log('✅ Student registered successfully');
  } else {
    console.log('❌ Student registration failed:', studentReg.error);
  }
};

const testUserLogin = async () => {
  console.log('\n🔑 Testing user login...');
  
  // Login tutor
  const tutorLogin = await apiCall('POST', '/auth/login', {
    email: testTutor.email,
    password: testTutor.password
  });
  
  if (tutorLogin.success) {
    tutorToken = tutorLogin.data.accessToken;
    console.log('✅ Tutor logged in successfully');
  } else {
    console.log('❌ Tutor login failed:', tutorLogin.error);
  }
  
  // Login student
  const studentLogin = await apiCall('POST', '/auth/login', {
    email: testStudent.email,
    password: testStudent.password
  });
  
  if (studentLogin.success) {
    studentToken = studentLogin.data.accessToken;
    console.log('✅ Student logged in successfully');
  } else {
    console.log('❌ Student login failed:', studentLogin.error);
  }
};

const testTutorProfileCreation = async () => {
  console.log('\n👨‍🏫 Testing tutor profile creation...');
  
  const tutorProfile = {
    subjects: ['Math', 'Physics'],
    experience: 5,
    sessionRate: 100000,
    teachModes: ['online', 'offline'],
    availability: [
      { dayOfWeek: 'monday', start: '09:00', end: '17:00' },
      { dayOfWeek: 'tuesday', start: '09:00', end: '17:00' }
    ],
    bio: 'Experienced math and physics tutor',
    location: 'Ho Chi Minh City'
  };
  
  const result = await apiCall('POST', '/tutors/profile', tutorProfile, tutorToken);
  
  if (result.success) {
    console.log('✅ Tutor profile created successfully');
  } else {
    console.log('❌ Tutor profile creation failed:', result.error);
  }
};

const testBookingCreation = async () => {
  console.log('\n📅 Testing booking creation with escrow...');
  
  const bookingData = {
    tutorProfileId: '507f1f77bcf86cd799439011', // Mock ID
    start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    end: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // Tomorrow + 1 hour
    mode: 'online',
    price: 100000,
    notes: 'Test booking with escrow'
  };
  
  const result = await apiCall('POST', '/bookings', bookingData, studentToken);
  
  if (result.success) {
    bookingId = result.data.booking._id;
    console.log('✅ Booking created with escrow successfully');
    console.log('📊 Escrow amount:', result.data.booking.escrowAmount);
    console.log('💰 Platform fee:', result.data.booking.platformFee);
    console.log('🎯 Tutor payout:', result.data.booking.tutorPayout);
  } else {
    console.log('❌ Booking creation failed:', result.error);
  }
};

const testTutorDecision = async () => {
  console.log('\n✅ Testing tutor decision (accept)...');
  
  const result = await apiCall('POST', `/bookings/${bookingId}/decision`, {
    decision: 'accept'
  }, tutorToken);
  
  if (result.success) {
    console.log('✅ Tutor accepted booking successfully');
    console.log('💳 Payment status:', result.data.booking.paymentStatus);
  } else {
    console.log('❌ Tutor decision failed:', result.error);
  }
};

const testSessionCompletion = async () => {
  console.log('\n🎓 Testing session completion...');
  
  const result = await apiCall('POST', `/bookings/${bookingId}/complete`, {}, studentToken);
  
  if (result.success) {
    console.log('✅ Session completed successfully');
    console.log('💰 Payment status:', result.data.booking.paymentStatus);
    console.log('📊 Final status:', result.data.booking.status);
  } else {
    console.log('❌ Session completion failed:', result.error);
  }
};

const testBookingCancellation = async () => {
  console.log('\n❌ Testing booking cancellation...');
  
  // Create another booking for cancellation test
  const bookingData = {
    tutorProfileId: '507f1f77bcf86cd799439011',
    start: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    end: new Date(Date.now() + 48 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
    mode: 'online',
    price: 150000,
    notes: 'Test booking for cancellation'
  };
  
  const createResult = await apiCall('POST', '/bookings', bookingData, studentToken);
  
  if (createResult.success) {
    const cancelBookingId = createResult.data.booking._id;
    
    const cancelResult = await apiCall('POST', `/bookings/${cancelBookingId}/cancel`, {
      reason: 'Schedule conflict'
    }, studentToken);
    
    if (cancelResult.success) {
      console.log('✅ Booking cancelled successfully');
      console.log('💸 Refund amount:', cancelResult.data.refundAmount);
      console.log('📊 Payment status:', cancelResult.data.booking.paymentStatus);
    } else {
      console.log('❌ Booking cancellation failed:', cancelResult.error);
    }
  } else {
    console.log('❌ Failed to create booking for cancellation test');
  }
};

const testDisputeOpening = async () => {
  console.log('\n⚠️ Testing dispute opening...');
  
  // Create another booking for dispute test
  const bookingData = {
    tutorProfileId: '507f1f77bcf86cd799439011',
    start: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    end: new Date(Date.now() + 72 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
    mode: 'online',
    price: 200000,
    notes: 'Test booking for dispute'
  };
  
  const createResult = await apiCall('POST', '/bookings', bookingData, studentToken);
  
  if (createResult.success) {
    const disputeBookingId = createResult.data.booking._id;
    
    // Accept booking first
    await apiCall('POST', `/bookings/${disputeBookingId}/decision`, {
      decision: 'accept'
    }, tutorToken);
    
    // Open dispute
    const disputeResult = await apiCall('POST', `/bookings/${disputeBookingId}/dispute`, {
      reason: 'Tutor did not show up'
    }, studentToken);
    
    if (disputeResult.success) {
      console.log('✅ Dispute opened successfully');
      console.log('📊 Booking status:', disputeResult.data.booking.status);
    } else {
      console.log('❌ Dispute opening failed:', disputeResult.error);
    }
  } else {
    console.log('❌ Failed to create booking for dispute test');
  }
};

const testEscrowStats = async () => {
  console.log('\n📊 Testing escrow stats...');
  
  const result = await apiCall('GET', '/bookings/escrow/stats', null, tutorToken);
  
  if (result.success) {
    console.log('✅ Escrow stats retrieved successfully');
    console.log('📈 Stats:', result.data.stats);
  } else {
    console.log('❌ Escrow stats failed:', result.error);
  }
};

// Main test function
const runTests = async () => {
  console.log('🚀 Starting Escrow System Tests...\n');
  
  try {
    await testUserRegistration();
    await testUserLogin();
    await testTutorProfileCreation();
    await testBookingCreation();
    await testTutorDecision();
    await testSessionCompletion();
    await testBookingCancellation();
    await testDisputeOpening();
    await testEscrowStats();
    
    console.log('\n🎉 All tests completed!');
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
  }
};

// Run tests
runTests();
