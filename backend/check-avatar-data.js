const mongoose = require('mongoose');

async function checkAvatarData() {
  try {
    await mongoose.connect('mongodb+srv://HieuTD:qbTXXCEIn1G4veK5@learnmate.6rejkx4.mongodb.net/?retryWrites=true&w=majority&appName=LearnMate');
    console.log('Connected to MongoDB Atlas');
    
    // Kiểm tra users có avatar/image
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log('\n=== USERS VỚI AVATAR ===');
    
    let usersWithAvatar = 0;
    users.forEach((user, index) => {
      if (user.image) {
        usersWithAvatar++;
        console.log(`${usersWithAvatar}. ${user.full_name || user.fullName || 'N/A'}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Image: ${user.image}`);
        console.log('---');
      }
    });
    
    console.log(`\nTổng users có avatar: ${usersWithAvatar}/${users.length}`);
    
    // Kiểm tra tutor profiles có avatarUrl
    const profiles = await mongoose.connection.db.collection('tutor_profiles').find({}).toArray();
    console.log('\n=== TUTOR PROFILES VỚI AVATAR ===');
    
    let profilesWithAvatar = 0;
    profiles.forEach((profile, index) => {
      if (profile.avatarUrl) {
        profilesWithAvatar++;
        console.log(`${profilesWithAvatar}. Profile ID: ${profile._id}`);
        console.log(`   AvatarUrl: ${profile.avatarUrl}`);
        console.log('---');
      }
    });
    
    console.log(`\nTổng profiles có avatarUrl: ${profilesWithAvatar}/${profiles.length}`);
    
    // Kiểm tra một tutor cụ thể
    const nghiaPhan = users.find(u => u.email === 'nghiaphan583@gmail.com');
    if (nghiaPhan) {
      console.log('\n=== NGHIA PHAN DETAILS ===');
      console.log('Name:', nghiaPhan.full_name || nghiaPhan.fullName);
      console.log('Email:', nghiaPhan.email);
      console.log('Image:', nghiaPhan.image || 'Không có');
      console.log('Role:', nghiaPhan.role);
      console.log('Status:', nghiaPhan.status);
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkAvatarData();
