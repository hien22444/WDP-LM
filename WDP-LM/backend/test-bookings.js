const mongoose = require('mongoose');
const Booking = require('./src/models/Booking');
const TutorProfile = require('./src/models/TutorProfile');
const User = require('./src/models/User');

async function testBookings() {
  try {
    // Connect to database
    await mongoose.connect('mongodb+srv://HieuTD:****@learnmate.6rejkx4.mongodb.net/test?retryWrites=true&w=majority&appName=LearnMate');
    console.log('✅ Connected to MongoDB');

    // Get all bookings
    const bookings = await Booking.find({}).populate('tutorProfile student');
    console.log(`📊 Total bookings: ${bookings.length}`);

    if (bookings.length > 0) {
      console.log('\n📋 Booking details:');
      bookings.forEach((booking, index) => {
        console.log(`\n${index + 1}. Booking ID: ${booking._id}`);
        console.log(`   Status: ${booking.status}`);
        console.log(`   Start: ${booking.start}`);
        console.log(`   End: ${booking.end}`);
        console.log(`   Price: ${booking.price}`);
        console.log(`   Tutor: ${booking.tutorProfile?.user || 'N/A'}`);
        console.log(`   Student: ${booking.student || 'N/A'}`);
      });
    } else {
      console.log('❌ No bookings found in database');
    }

    // Get tutor profiles
    const tutors = await TutorProfile.find({}).populate('user');
    console.log(`\n👨‍🏫 Total tutors: ${tutors.length}`);
    
    if (tutors.length > 0) {
      console.log('\n📋 Tutor details:');
      tutors.forEach((tutor, index) => {
        console.log(`\n${index + 1}. Tutor ID: ${tutor._id}`);
        console.log(`   User: ${tutor.user?._id || 'N/A'}`);
        console.log(`   Name: ${tutor.user?.profile?.full_name || 'N/A'}`);
        console.log(`   Price: ${tutor.price}`);
      });
    }

    // Get users
    const users = await User.find({});
    console.log(`\n👥 Total users: ${users.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testBookings();
