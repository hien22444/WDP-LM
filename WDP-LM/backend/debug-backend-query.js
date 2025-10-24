const mongoose = require('mongoose');
const TutorProfile = require('./src/models/TutorProfile');
const User = require('./src/models/User');

async function debugBackendQuery() {
  try {
    // Connect to database
    await mongoose.connect('mongodb+srv://HieuTD:qbTXXCEIn1G4veK5@learnmate.6rejkx4.mongodb.net/?retryWrites=true&w=majority&appName=LearnMate');
    console.log('🔗 Connected to database');
    
    // Simulate the exact backend logic
    console.log('\n🔍 Simulating backend API logic...');
    
    // Parameters from frontend
    const search = "";
    const subject = "";
    const grade = "";
    const location = "";
    const mode = "";
    const minPrice = 0;
    const maxPrice = 10000000;
    const minRating = 0;
    const maxRating = 5;
    const experience = "";
    const page = 1;
    const limit = 12;
    const sortBy = "rating";
    const includePending = false;
    
    console.log('📋 Parameters:', {
      search, subject, grade, location, mode,
      minPrice, maxPrice, minRating, maxRating,
      experience, page, limit, sortBy, includePending
    });
    
    // Build filter (exact logic from backend)
    const filter = {};
    if (includePending) {
      filter.status = { $in: ["approved", "pending"] };
    } else {
      filter.status = "approved";
    }
    
    console.log('🔍 Filter:', JSON.stringify(filter, null, 2));
    
    // Build search query
    let searchQuery = {};
    if (search) {
      const searchRegex = new RegExp(search, "i");
      searchQuery = {
        $or: [
          { bio: searchRegex },
          { subjects: { $in: [searchRegex] } },
          { "subjects.subject": searchRegex },
          { "subjects.name": searchRegex },
          { city: searchRegex }
        ]
      };
    }
    
    console.log('🔍 Search query:', JSON.stringify(searchQuery, null, 2));
    
    // Final filter
    const finalFilter = { ...filter, ...searchQuery };
    console.log('🔍 Final filter:', JSON.stringify(finalFilter, null, 2));
    
    // Test the query
    console.log('\n📊 Testing query...');
    
    // Count total
    const total = await TutorProfile.countDocuments(finalFilter);
    console.log('📊 Total matching documents:', total);
    
    // Get tutors with populate
    const tutors = await TutorProfile.find(finalFilter)
      .populate("user", "full_name image phone_number email")
      .sort({ rating: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();
    
    console.log('📊 Tutors found:', tutors.length);
    
    if (tutors.length > 0) {
      console.log('\n📋 Sample tutors:');
      tutors.slice(0, 5).forEach((tutor, index) => {
        console.log(`${index + 1}. ID: ${tutor._id}, User: ${tutor.user ? tutor.user.full_name || 'No name' : 'No user'}, Status: ${tutor.status}`);
      });
    }
    
    // Test without populate
    console.log('\n🔍 Testing without populate...');
    const tutorsNoPopulate = await TutorProfile.find(finalFilter)
      .sort({ rating: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();
    
    console.log('📊 Tutors without populate:', tutorsNoPopulate.length);
    
    // Test with different limits
    console.log('\n🔍 Testing with different limits...');
    const tutorsLimit50 = await TutorProfile.find(finalFilter)
      .populate("user", "full_name image phone_number email")
      .sort({ rating: -1 })
      .limit(50)
      .lean();
    
    console.log('📊 Tutors with limit 50:', tutorsLimit50.length);
    
    // Test with includePending=true
    console.log('\n🔍 Testing with includePending=true...');
    const filterWithPending = { status: { $in: ["approved", "pending"] } };
    const tutorsWithPending = await TutorProfile.find(filterWithPending)
      .populate("user", "full_name image phone_number email")
      .sort({ rating: -1 })
      .limit(50)
      .lean();
    
    console.log('📊 Tutors with pending:', tutorsWithPending.length);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

debugBackendQuery();
