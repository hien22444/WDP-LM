// Test booking database connection
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

async function testBookingDB() {
  try {
    console.log('🔌 Testing booking database connection...');
    
    const uri = process.env.MONGO_URI || process.env.DB_HOST || process.env.URI_DB;
    await mongoose.connect(uri, { dbName: 'test' });
    console.log('✅ Connected to MongoDB Atlas - test database\n');
    
    const Booking = require('./src/models/Booking');
    const TutorProfile = require('./src/models/TutorProfile');
    const User = require('./src/models/User');
    
    console.log('📊 Checking collections...');
    const bookingCount = await Booking.countDocuments();
    const tutorCount = await TutorProfile.countDocuments();
    const userCount = await User.countDocuments();
    
    console.log(`✅ Bookings: ${bookingCount} records`);
    console.log(`✅ Tutors: ${tutorCount} records`);
    console.log(`✅ Users: ${userCount} records\n`);
    
    if (bookingCount > 0) {
      console.log('📅 Latest bookings:');
      const latestBookings = await Booking.find()
        .populate('tutorProfile', 'name')
        .populate('student', 'fullName')
        .sort({ created_at: -1 })
        .limit(3);
        
      latestBookings.forEach((booking, idx) => {
        console.log(`${idx + 1}. Booking ID: ${booking._id}`);
        console.log(`   Tutor: ${booking.tutorProfile?.name || 'N/A'}`);
        console.log(`   Student: ${booking.student?.fullName || 'N/A'}`);
        console.log(`   Status: ${booking.status}`);
        console.log(`   Price: ${booking.price?.toLocaleString()}đ`);
        console.log(`   Start: ${booking.start}`);
        console.log(`   Payment: ${booking.paymentStatus}`);
        console.log('');
      });
    } else {
      console.log('⚠️ No bookings found in database');
    }
    
    // Test booking creation (dry run)
    console.log('🧪 Testing booking validation...');
    const sampleTutor = await TutorProfile.findOne({ status: 'approved' });
    const sampleUser = await User.findOne();
    
    if (sampleTutor && sampleUser) {
      console.log(`✅ Found sample tutor: ${sampleTutor.name}`);
      console.log(`✅ Found sample user: ${sampleUser.fullName}`);
      console.log('✅ Database ready for booking creation');
    } else {
      console.log('⚠️ Missing sample data for testing');
    }
    
    console.log('\n✅ Booking database test completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Booking database test failed:', error.message);
    process.exit(1);
  }
}

testBookingDB();
