const mongoose = require('mongoose');

async function listCollections() {
  try {
    await mongoose.connect('mongodb://localhost:27017/test');
    console.log('Connected to MongoDB (test database)\n');

    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('=== ALL COLLECTIONS ===');
    console.log(`Total: ${collections.length}\n`);
    
    for (const collection of collections) {
      const collName = collection.name;
      const count = await mongoose.connection.db.collection(collName).countDocuments();
      console.log(`${collName}: ${count} documents`);
    }

    // Get sample data from each non-empty collection
    console.log('\n\n=== SAMPLE DATA FROM EACH COLLECTION ===');
    for (const collection of collections) {
      const collName = collection.name;
      const count = await mongoose.connection.db.collection(collName).countDocuments();
      
      if (count > 0) {
        console.log(`\n--- ${collName} (${count} total) ---`);
        const samples = await mongoose.connection.db.collection(collName).find().limit(3).toArray();
        samples.forEach((doc, idx) => {
          console.log(`\nSample ${idx + 1}:`);
          console.log(JSON.stringify(doc, null, 2));
        });
      }
    }

    await mongoose.connection.close();
    console.log('\n\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listCollections();
