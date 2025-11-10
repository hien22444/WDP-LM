#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const User = mongoose.model('User', new mongoose.Schema({}, { 
  strict: false, 
  collection: 'users' 
}));

const TutorProfile = mongoose.model('TutorProfile', new mongoose.Schema({}, { 
  strict: false, 
  collection: 'tutor_profiles' 
}));

async function checkTutorRegistration() {
  try {
    const uri = process.env.URI_DB;
    if (!uri) {
      console.error('❌ URI_DB not found');
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB\n');

    // 1. Tìm tất cả users có role=tutor
    console.log('👥 USERS WITH ROLE=TUTOR:');
    const tutorUsers = await User.find({ role: 'tutor' });
    console.log(`Found ${tutorUsers.length} tutor users\n`);

    // 2. Tìm tất cả TutorProfiles
    console.log('📋 ALL TUTOR PROFILES:');
    const allProfiles = await TutorProfile.find();
    console.log(`Found ${allProfiles.length} tutor profiles\n`);

    // 3. Check từng tutor user xem có profile không
    console.log('🔍 CHECKING EACH TUTOR USER:\n');
    
    const usersWithoutProfile = [];
    const usersWithProfile = [];

    for (const user of tutorUsers) {
      const profile = await TutorProfile.findOne({ user: user._id });
      
      if (profile) {
        usersWithProfile.push({
          userId: user._id,
          email: user.email,
          fullName: user.full_name,
          profileId: profile._id,
          profileStatus: profile.status
        });
      } else {
        usersWithoutProfile.push({
          userId: user._id,
          email: user.email,
          fullName: user.full_name
        });
      }
    }

    console.log(`✅ Tutor users WITH profile: ${usersWithProfile.length}`);
    usersWithProfile.forEach((u, idx) => {
      console.log(`  ${idx + 1}. ${u.fullName} (${u.email})`);
      console.log(`     User ID: ${u.userId}`);
      console.log(`     Profile ID: ${u.profileId}`);
      console.log(`     Status: ${u.profileStatus}\n`);
    });

    console.log(`❌ Tutor users WITHOUT profile: ${usersWithoutProfile.length}`);
    if (usersWithoutProfile.length > 0) {
      usersWithoutProfile.forEach((u, idx) => {
        console.log(`  ${idx + 1}. ${u.fullName} (${u.email})`);
        console.log(`     User ID: ${u.userId}\n`);
      });
    }

    // 4. Check profiles không có user tương ứng (orphaned)
    console.log('\n👻 ORPHANED PROFILES (no matching user):');
    const orphanedProfiles = [];
    
    for (const profile of allProfiles) {
      const user = await User.findById(profile.user);
      if (!user) {
        orphanedProfiles.push({
          profileId: profile._id,
          userId: profile.user,
          status: profile.status
        });
      }
    }

    console.log(`Found ${orphanedProfiles.length} orphaned profiles`);
    orphanedProfiles.forEach((p, idx) => {
      console.log(`  ${idx + 1}. Profile ID: ${p.profileId}`);
      console.log(`     User ID (not exists): ${p.userId}`);
      console.log(`     Status: ${p.status}\n`);
    });

    await mongoose.disconnect();
    console.log('✅ Done');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkTutorRegistration();
