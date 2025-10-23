// Simple script to approve all tutors
// This will be executed directly in MongoDB

console.log('🔧 MongoDB Query to approve all tutors:');
console.log('');
console.log('db.tutorprofiles.updateMany({}, {');
console.log('  $set: {');
console.log('    status: "approved",');
console.log('    hasAvailability: true,');
console.log('    verified: true');
console.log('  }');
console.log('})');
console.log('');
console.log('📋 Instructions:');
console.log('1. Open MongoDB Compass or MongoDB Shell');
console.log('2. Connect to your database');
console.log('3. Run the query above');
console.log('4. Or copy this query and run it in your MongoDB client');
console.log('');
console.log('🎯 Expected result:');
console.log('- All tutors will have status: "approved"');
console.log('- All tutors will have hasAvailability: true');
console.log('- All tutors will have verified: true');
console.log('- Frontend will display all approved tutors');
