const { MongoClient } = require('mongodb');

async function checkAllDatabases() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    // Liệt kê tất cả databases
    const adminDb = client.db().admin();
    const databases = await adminDb.listDatabases();
    
    console.log('\n=== TẤT CẢ DATABASES ===');
    databases.databases.forEach((db, index) => {
      console.log(`${index + 1}. ${db.name} (Size: ${db.sizeOnDisk} bytes)`);
    });
    
    // Kiểm tra từng database
    for (const dbInfo of databases.databases) {
      if (dbInfo.name === 'admin' || dbInfo.name === 'local' || dbInfo.name === 'config') continue;
      
      console.log(`\n=== DATABASE: ${dbInfo.name.toUpperCase()} ===`);
      const db = client.db(dbInfo.name);
      
      // Liệt kê collections
      const collections = await db.listCollections().toArray();
      console.log(`Collections: ${collections.length}`);
      
      for (const collection of collections) {
        const count = await db.collection(collection.name).countDocuments();
        console.log(`  - ${collection.name}: ${count} documents`);
        
        // Nếu có documents, lấy một vài mẫu
        if (count > 0 && collection.name === 'users') {
          const samples = await db.collection(collection.name).find({}).limit(3).toArray();
          console.log(`    Mẫu dữ liệu:`);
          samples.forEach((doc, index) => {
            console.log(`      ${index + 1}. ${doc.full_name || doc.fullName || 'N/A'} (${doc.role || 'N/A'})`);
          });
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
}

checkAllDatabases();
