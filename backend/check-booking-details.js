require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('./src/models/Booking');
const TutorProfile = require('./src/models/TutorProfile');
const User = require('./src/models/User');

async function checkBookingDetails() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get the pending booking
    const booking = await Booking.findById('68fe2ce9ccfb3138a87b73d6')
      .populate('tutorProfile')
      .populate('student');
    
    console.log('\n📋 Booking details:');
    console.log('ID:', booking._id);
    console.log('Status:', booking.status);
    console.log('TutorProfile ID:', booking.tutorProfile);
    console.log('Student ID:', booking.student);
    console.log('Price:', booking.price);
    console.log('Start:', booking.start);
    console.log('End:', booking.end);

    if (booking.tutorProfile) {
      console.log('\n👨‍🏫 Tutor details:');
      console.log('Tutor ID:', booking.tutorProfile._id);
      console.log('User ID:', booking.tutorProfile.user);
      
      // Get tutor's user info
      const tutorUser = await User.findById(booking.tutorProfile.user);
      if (tutorUser) {
        console.log('Tutor Name:', tutorUser.profile?.full_name);
        console.log('Tutor Email:', tutorUser.email);
      }
    }

    if (booking.student) {
      console.log('\n👨‍🎓 Student details:');
      console.log('Student ID:', booking.student._id);
      console.log('Student Name:', booking.student.profile?.full_name);
      console.log('Student Email:', booking.student.email);
    }

    // Get all tutors
    console.log('\n👨‍🏫 All tutors:');
    const tutors = await TutorProfile.find({}).populate('user');
    tutors.forEach((tutor, index) => {
      console.log(`${index + 1}. Tutor ID: ${tutor._id}, User: ${tutor.user?._id}, Name: ${tutor.user?.profile?.full_name}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkBookingDetails();
