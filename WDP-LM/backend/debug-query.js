const mongoose = require('mongoose');
const TutorProfile = require('./src/models/TutorProfile');

async function debugQuery() {
  try {
    // Connect to database
    await mongoose.connect('mongodb+srv://HieuTD:qbTXXCEIn1G4veK5@learnmate.6rejkx4.mongodb.net/?retryWrites=true&w=majority&appName=LearnMate');
    console.log('🔗 Connected to database');
    
    // Test 1: Basic query without populate
    console.log('\n1. Testing basic query without populate:');
    const basicTutors = await TutorProfile.find({ status: { $in: ["approved", "pending"] } }).limit(10);
    console.log('📊 Found tutors:', basicTutors.length);
    
    // Test 2: Query with populate
    console.log('\n2. Testing query with populate:');
    const populatedTutors = await TutorProfile.find({ status: { $in: ["approved", "pending"] } })
      .populate("user", "full_name image phone_number email")
      .limit(10)
      .lean();
    console.log('📊 Found tutors with populate:', populatedTutors.length);
    
    // Test 3: Check if populate is causing issues
    console.log('\n3. Checking populate issues:');
    const tutorsWithUser = populatedTutors.filter(t => t.user);
    const tutorsWithoutUser = populatedTutors.filter(t => !t.user);
    console.log('📊 Tutors with user:', tutorsWithUser.length);
    console.log('📊 Tutors without user:', tutorsWithoutUser.length);
    
    // Test 4: Check user references
    console.log('\n4. Checking user references:');
    const tutorsWithUserRef = await TutorProfile.find({ 
      status: { $in: ["approved", "pending"] },
      user: { $exists: true, $ne: null }
    }).limit(10);
    console.log('📊 Tutors with user reference:', tutorsWithUserRef.length);
    
    // Test 5: Check if there are tutors without user references
    console.log('\n5. Checking tutors without user references:');
    const tutorsWithoutUserRef = await TutorProfile.find({ 
      status: { $in: ["approved", "pending"] },
      $or: [
        { user: { $exists: false } },
        { user: null }
      ]
    }).limit(10);
    console.log('📊 Tutors without user reference:', tutorsWithoutUserRef.length);
    
    // Test 6: Check the actual filter being used
    console.log('\n6. Testing the exact filter from API:');
    const filter = { status: { $in: ["approved", "pending"] } };
    const searchQuery = {}; // No search query
    const finalFilter = { ...filter, ...searchQuery };
    
    console.log('🔍 Final filter:', JSON.stringify(finalFilter, null, 2));
    
    const finalTutors = await TutorProfile.find(finalFilter)
      .populate("user", "full_name image phone_number email")
      .sort({ rating: -1 })
      .skip(0)
      .limit(50)
      .lean();
    
    console.log('📊 Final result:', finalTutors.length);
    
    if (finalTutors.length > 0) {
      console.log('\n📋 Sample tutors:');
      finalTutors.slice(0, 5).forEach((tutor, index) => {
        console.log(`${index + 1}. ID: ${tutor._id}, User: ${tutor.user ? 'Has user' : 'No user'}, Status: ${tutor.status}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

debugQuery();
