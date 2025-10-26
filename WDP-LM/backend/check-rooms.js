const mongoose = require('mongoose');
const Booking = require('./src/models/Booking');
const TeachingSession = require('./src/models/TeachingSession');

async function checkRooms() {
  try {
    await mongoose.connect('mongodb+srv://HieuTD:qbTXXCEIn1G4veK5@learnmate.6rejkx4.mongodb.net/?retryWrites=true&w=majority&appName=LearnMate');
    console.log('Connected to MongoDB Atlas');

    console.log('\n=== BOOKINGS WITH ROOM ID ===');
    const bookingsWithRooms = await Booking.find({ roomId: { $ne: null } });
    console.log(`Total bookings with room ID: ${bookingsWithRooms.length}`);
    
    bookingsWithRooms.forEach((booking, index) => {
      console.log(`${index + 1}. Booking ID: ${booking._id}`);
      console.log(`   Room ID: ${booking.roomId}`);
      console.log(`   Status: ${booking.status}`);
      console.log(`   Start: ${booking.start}`);
      console.log(`   End: ${booking.end}`);
      console.log(`   Mode: ${booking.mode}`);
      console.log('---');
    });

    console.log('\n=== TEACHING SESSIONS ===');
    const sessions = await TeachingSession.find().limit(10);
    console.log(`Total teaching sessions: ${await TeachingSession.countDocuments()}`);
    
    sessions.forEach((session, index) => {
      console.log(`${index + 1}. Session ID: ${session._id}`);
      console.log(`   Room ID: ${session.roomId}`);
      console.log(`   Status: ${session.status}`);
      console.log(`   Start: ${session.startTime}`);
      console.log(`   End: ${session.endTime}`);
      console.log(`   Course: ${session.courseName}`);
      console.log('---');
    });

    console.log('\n=== TODAY SESSIONS ===');
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const todaySessions = await TeachingSession.find({
      startTime: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ["scheduled", "ongoing"] }
    });

    console.log(`Today's sessions: ${todaySessions.length}`);
    todaySessions.forEach((session, index) => {
      console.log(`${index + 1}. Session ID: ${session._id}`);
      console.log(`   Room ID: ${session.roomId}`);
      console.log(`   Status: ${session.status}`);
      console.log(`   Start: ${session.startTime}`);
      console.log(`   End: ${session.endTime}`);
      console.log(`   Course: ${session.courseName}`);
      console.log('---');
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkRooms();
