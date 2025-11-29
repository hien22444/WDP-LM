const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function checkCollections() {
  try {
    await mongoose.connect(process.env.URI_DB);
    console.log('✅ Connected to MongoDB\n');

    // Lấy danh sách tất cả collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    console.log('═'.repeat(80));
    console.log('📦 TẤT CẢ COLLECTIONS TRONG DATABASE');
    console.log('═'.repeat(80));
    
    for (const collection of collections) {
      const count = await mongoose.connection.db.collection(collection.name).countDocuments();
      console.log(`\n📋 ${collection.name}`);
      console.log(`   Documents: ${count}`);
      
      if (count > 0 && count <= 10) {
        const docs = await mongoose.connection.db.collection(collection.name).find({}).limit(10).toArray();
        console.log('   Sample data:');
        docs.forEach((doc, index) => {
          console.log(`   ${index + 1}. ${JSON.stringify(doc, null, 2).substring(0, 200)}...`);
        });
      }
    }

    console.log('\n═'.repeat(80));
    console.log('🔍 CHI TIẾT 2 COLLECTIONS BẠN HỎI');
    console.log('═'.repeat(80));

    // Kiểm tra tutoravailabilities
    console.log('\n1️⃣ TUTORAVAILABILITIES:');
    const availabilities = await mongoose.connection.db.collection('tutoravailabilities').find({}).toArray();
    console.log(`   Total: ${availabilities.length}`);
    if (availabilities.length > 0) {
      console.log('   Data:', JSON.stringify(availabilities, null, 2));
    }

    // Kiểm tra subjects
    console.log('\n2️⃣ SUBJECTS:');
    const subjects = await mongoose.connection.db.collection('subjects').find({}).toArray();
    console.log(`   Total: ${subjects.length}`);
    if (subjects.length > 0) {
      console.log('   Data:', JSON.stringify(subjects, null, 2));
    }

    console.log('\n═'.repeat(80));
    console.log('🔍 KIỂM TRA MODELS CÓ DÙNG 2 COLLECTIONS NÀY KHÔNG');
    console.log('═'.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkCollections();
