// Direct database test
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const TutorProfile = require('./src/models/TutorProfile');
const Booking = require('./src/models/Booking');

async function testDirectDB() {
  try {
    console.log('🔌 Connecting to database...');
    
    const uri = process.env.MONGO_URI || process.env.DB_HOST || process.env.URI_DB;
    await mongoose.connect(uri, { dbName: 'test' });
    console.log('✅ Connected to MongoDB Atlas - test database\n');

    // Test 1: Get all tutors
    console.log('📊 Test 1: Getting all tutors from database...');
    const tutors = await TutorProfile.find().limit(5);
    console.log(`✅ Found ${tutors.length} tutors`);
    
    if (tutors.length > 0) {
      tutors.forEach((tutor, idx) => {
        console.log(`\n${idx + 1}. Tutor ID: ${tutor._id}`);
        console.log(`   User ID: ${tutor.user}`);
        console.log(`   Availability:`, tutor.availability);
      });

      // Test 2: Get bookings for first tutor
      const firstTutorId = tutors[0]._id;
      console.log(`\n📅 Test 2: Getting bookings for tutor ${firstTutorId}...`);
      const bookings = await Booking.find({
        tutorProfile: firstTutorId
      }).limit(5);
      
      console.log(`✅ Found ${bookings.length} bookings`);
      bookings.forEach((booking, idx) => {
        console.log(`\n${idx + 1}. Booking ID: ${booking._id}`);
        console.log(`   Status: ${booking.status}`);
        console.log(`   Start: ${booking.start}`);
        console.log(`   End: ${booking.end}`);
      });

      // Test 3: Availability calculation
      console.log(`\n🕐 Test 3: Testing availability calculation...`);
      const tutor = tutors[0];
      const availability = tutor.availability || [];
      
      if (availability.length === 0) {
        console.log('⚠️ This tutor has no availability set up!');
        console.log('   To add availability, update TutorProfile with:');
        console.log('   availability: [{ dayOfWeek: 1, start: "18:00", end: "20:00" }]');
      } else {
        console.log(`✅ This tutor has ${availability.length} availability slots:`);
        availability.forEach((slot, idx) => {
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          console.log(`   ${idx + 1}. ${dayNames[slot.dayOfWeek]}: ${slot.start} - ${slot.end}`);
        });
      }
    } else {
      console.log('⚠️ No tutors found in database!');
    }

    console.log('\n✅ All tests completed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testDirectDB();
