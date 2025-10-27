const mongoose = require('mongoose');
const TutorProfile = require('./src/models/TutorProfile');
const User = require('./src/models/User'); // Import User model

async function debugQueryFixed() {
  try {
    // Connect to database
    await mongoose.connect('mongodb+srv://HieuTD:qbTXXCEIn1G4veK5@learnmate.6rejkx4.mongodb.net/?retryWrites=true&w=majority&appName=LearnMate');
    console.log('🔗 Connected to database');
    
    // Test 1: Basic query without populate
    console.log('\n1. Testing basic query without populate:');
    const basicTutors = await TutorProfile.find({ status: { $in: ["approved", "pending"] } }).limit(10);
    console.log('📊 Found tutors:', basicTutors.length);
    
    // Test 2: Query with populate (now that User model is imported)
    console.log('\n2. Testing query with populate:');
    const populatedTutors = await TutorProfile.find({ status: { $in: ["approved", "pending"] } })
      .populate("user", "full_name image phone_number email")
      .limit(10)
      .lean();
    console.log('📊 Found tutors with populate:', populatedTutors.length);
    
    // Test 3: Check if populate is working
    console.log('\n3. Checking populate results:');
    const tutorsWithUser = populatedTutors.filter(t => t.user);
    const tutorsWithoutUser = populatedTutors.filter(t => !t.user);
    console.log('📊 Tutors with user:', tutorsWithUser.length);
    console.log('📊 Tutors without user:', tutorsWithoutUser.length);
    
    // Test 4: Test the exact API query
    console.log('\n4. Testing exact API query:');
    const filter = { status: { $in: ["approved", "pending"] } };
    const searchQuery = {};
    const finalFilter = { ...filter, ...searchQuery };
    
    const finalTutors = await TutorProfile.find(finalFilter)
      .populate("user", "full_name image phone_number email")
      .sort({ rating: -1 })
      .skip(0)
      .limit(50)
      .lean();
    
    console.log('📊 Final result:', finalTutors.length);
    
    if (finalTutors.length > 0) {
      console.log('\n📋 Sample tutors:');
      finalTutors.slice(0, 10).forEach((tutor, index) => {
        console.log(`${index + 1}. ID: ${tutor._id}, User: ${tutor.user ? tutor.user.full_name || 'No name' : 'No user'}, Status: ${tutor.status}`);
      });
    }
    
    // Test 5: Check total count
    console.log('\n5. Checking total count:');
    const totalCount = await TutorProfile.countDocuments({ status: { $in: ["approved", "pending"] } });
    console.log('📊 Total tutors matching filter:', totalCount);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

debugQueryFixed();
