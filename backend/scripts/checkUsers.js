require('dotenv').config();
const mongoose = require('mongoose');

async function checkUsers() {
  try {
    await mongoose.connect(process.env.URI_DB);
    console.log('Connected to MongoDB Atlas');

    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    
    console.log('\n=== ALL USERS ===');
    users.forEach((u, i) => {
      console.log(`${i+1}. ${u.email || 'no email'}`);
      console.log(`   Role: ${u.role || 'no role'}`);
      console.log(`   Name: ${u.full_name || 'no name'}`);
      console.log('');
    });

    const tutors = users.filter(u => u.role === 'tutor');
    const learners = users.filter(u => u.role === 'learner');
    const admins = users.filter(u => u.role === 'admin');
    const noRole = users.filter(u => !u.role);

    console.log('\n=== SUMMARY ===');
    console.log(`Total users: ${users.length}`);
    console.log(`Tutors: ${tutors.length}`);
    console.log(`Learners: ${learners.length}`);
    console.log(`Admins: ${admins.length}`);
    console.log(`No role: ${noRole.length}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsers();
