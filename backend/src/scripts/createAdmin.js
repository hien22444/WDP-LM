/*
  Usage:
  node backend/src/scripts/createAdmin.js admin2@edumatch.local "Admin@123" "Admin Two"
*/
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function run() {
  const email = process.argv[2] || 'admin2@edumatch.local';
  const password = process.argv[3] || 'Admin@123';
  const fullName = process.argv[4] || 'Admin Two';

  const uri = process.env.MONGO_URI || process.env.DB_HOST || process.env.URI_DB;
  if (!uri) {
    console.error('Missing MONGO_URI/DB_HOST/URI_DB');
    process.exit(1);
  }
  await mongoose.connect(uri);
  try {
    let user = await User.findOne({ email });
    if (user) {
      console.log('User existed, updating role/status/password...');
    }
    const hash = await bcrypt.hash(password, 10);
    await User.updateOne(
      { email },
      {
        $set: {
          full_name: fullName,
          password_hash: hash,
          role: 'admin',
          status: 'active',
          email_verified_at: new Date(),
          updated_at: new Date(),
        },
      },
      { upsert: true }
    );
    user = await User.findOne({ email });
    console.log('Created/updated admin:', { email: user.email, role: user.role, status: user.status });
  } catch (e) {
    console.error('Failed:', e.message);
  } finally {
    await mongoose.disconnect();
  }
}

run();
