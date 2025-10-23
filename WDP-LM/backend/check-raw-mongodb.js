const { MongoClient } = require('mongodb');

async function checkRawMongoDB() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('test');
    
    // Liệt kê tất cả collections
    const collections = await db.listCollections().toArray();
    console.log('\n=== COLLECTIONS TRONG DATABASE TEST ===');
    collections.forEach((collection, index) => {
      console.log(`${index + 1}. ${collection.name}`);
    });
    
    // Kiểm tra collection users
    const usersCollection = db.collection('users');
    const userCount = await usersCollection.countDocuments();
    console.log(`\n=== COLLECTION USERS ===`);
    console.log(`Số lượng documents: ${userCount}`);
    
    if (userCount > 0) {
      // Lấy 5 users đầu tiên
      const users = await usersCollection.find({}).limit(5).toArray();
      console.log('\n=== 5 USERS ĐẦU TIÊN ===');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.full_name || user.fullName || 'Chưa có tên'}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Status: ${user.status || 'N/A'}`);
        console.log('---');
      });
      
      // Kiểm tra users có role = tutor
      const tutors = await usersCollection.find({ role: 'tutor' }).toArray();
      console.log(`\n=== USERS CÓ ROLE TUTOR ===`);
      console.log(`Số lượng: ${tutors.length}`);
      
      if (tutors.length > 0) {
        tutors.forEach((tutor, index) => {
          console.log(`${index + 1}. ${tutor.full_name || tutor.fullName || 'Chưa có tên'}`);
          console.log(`   Email: ${tutor.email}`);
          console.log(`   Role: ${tutor.role}`);
          console.log(`   Status: ${tutor.status || 'N/A'}`);
          console.log('---');
        });
      }
    }
    
    // Kiểm tra collection tutorprofiles
    const tutorProfilesCollection = db.collection('tutorprofiles');
    const profileCount = await tutorProfilesCollection.countDocuments();
    console.log(`\n=== COLLECTION TUTORPROFILES ===`);
    console.log(`Số lượng documents: ${profileCount}`);
    
    if (profileCount > 0) {
      const profiles = await tutorProfilesCollection.find({}).limit(3).toArray();
      console.log('\n=== 3 PROFILES ĐẦU TIÊN ===');
      profiles.forEach((profile, index) => {
        console.log(`${index + 1}. Profile ID: ${profile._id}`);
        console.log(`   User ID: ${profile.user}`);
        console.log(`   Status: ${profile.status || 'N/A'}`);
        console.log(`   Subjects: ${profile.subjects?.join(', ') || 'Chưa có'}`);
        console.log('---');
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
}

checkRawMongoDB();
