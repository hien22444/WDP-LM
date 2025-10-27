const mongoose = require('mongoose');
require('dotenv').config();

async function listAllUsers() {
  try {
    await mongoose.connect(process.env.URI_DB);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    console.log('=== TẤT CẢ USERS ===');
    
    const users = await db.collection('users').find({}).toArray();
    console.log('Tổng số users:', users.length);
    console.log('');
    
    users.forEach((user, i) => {
      console.log(`${i+1}. ${user.full_name || user.name || 'N/A'}`);
      console.log(`   - Role: ${user.role}`);
      console.log(`   - Status: ${user.status}`);
      console.log(`   - Email: ${user.email || 'N/A'}`);
      console.log(`   - Created: ${user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}`);
      console.log('');
    });
    
    // Thống kê theo role
    const roleStats = {};
    users.forEach(user => {
      roleStats[user.role] = (roleStats[user.role] || 0) + 1;
    });
    
    console.log('=== THỐNG KÊ THEO ROLE ===');
    Object.entries(roleStats).forEach(([role, count]) => {
      console.log(`${role}: ${count} users`);
    });
    
    // Thống kê theo status
    const statusStats = {};
    users.forEach(user => {
      statusStats[user.status] = (statusStats[user.status] || 0) + 1;
    });
    
    console.log('\n=== THỐNG KÊ THEO STATUS ===');
    Object.entries(statusStats).forEach(([status, count]) => {
      console.log(`${status}: ${count} users`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listAllUsers();
