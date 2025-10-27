const { MongoClient } = require('mongodb');

async function checkWdpLmDB() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('wdp-lm');
    
    // Kiểm tra users
    const usersCollection = db.collection('users');
    const userCount = await usersCollection.countDocuments();
    console.log(`\n=== USERS TRONG DATABASE WDP-LM ===`);
    console.log(`Số lượng users: ${userCount}`);
    
    if (userCount > 0) {
      const users = await usersCollection.find({}).toArray();
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.fullName || user.full_name || 'Chưa có tên'}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Status: ${user.status || 'N/A'}`);
        console.log(`   Verified: ${user.isEmailVerified || user.isVerified || 'N/A'}`);
        console.log('---');
      });
      
      // Kiểm tra users có role = tutor
      const tutors = await usersCollection.find({ role: 'tutor' }).toArray();
      console.log(`\n=== USERS CÓ ROLE TUTOR ===`);
      console.log(`Số lượng: ${tutors.length}`);
      
      if (tutors.length > 0) {
        tutors.forEach((tutor, index) => {
          console.log(`${index + 1}. ${tutor.fullName || tutor.full_name || 'Chưa có tên'}`);
          console.log(`   Email: ${tutor.email}`);
          console.log(`   Role: ${tutor.role}`);
          console.log(`   Status: ${tutor.status || 'N/A'}`);
          console.log('---');
        });
      }
    }
    
    // Kiểm tra tutor_profiles
    const tutorProfilesCollection = db.collection('tutor_profiles');
    const profileCount = await tutorProfilesCollection.countDocuments();
    console.log(`\n=== TUTOR PROFILES ===`);
    console.log(`Số lượng profiles: ${profileCount}`);
    
    if (profileCount > 0) {
      const profiles = await tutorProfilesCollection.find({}).toArray();
      profiles.forEach((profile, index) => {
        console.log(`${index + 1}. Profile ID: ${profile._id}`);
        console.log(`   User ID: ${profile.user}`);
        console.log(`   Status: ${profile.status || 'N/A'}`);
        console.log(`   Subjects: ${profile.subjects?.join(', ') || 'Chưa có'}`);
        console.log(`   Experience: ${profile.experience || 'Chưa có'}`);
        console.log(`   Rating: ${profile.rating || 'Chưa có'}`);
        console.log('---');
      });
    }
    
    // Kiểm tra teaching_slots
    const teachingSlotsCollection = db.collection('teaching_slots');
    const slotCount = await teachingSlotsCollection.countDocuments();
    console.log(`\n=== TEACHING SLOTS ===`);
    console.log(`Số lượng slots: ${slotCount}`);
    
    if (slotCount > 0) {
      const slots = await teachingSlotsCollection.find({}).toArray();
      slots.forEach((slot, index) => {
        console.log(`${index + 1}. ${slot.courseName || 'Chưa có tên'}`);
        console.log(`   Subject: ${slot.subject || 'N/A'}`);
        console.log(`   Status: ${slot.status || 'N/A'}`);
        console.log(`   Start: ${slot.start || 'N/A'}`);
        console.log(`   Price: ${slot.price || 'N/A'}`);
        console.log('---');
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
}

checkWdpLmDB();
