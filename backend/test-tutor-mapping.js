const axios = require('axios');

const baseURL = 'http://localhost:5000/api/v1';

async function testTutorMapping() {
  try {
    console.log('🔍 Testing tutor data mapping...');
    
    const response = await axios.get(`${baseURL}/tutors/search`, {
      params: {
        search: '',
        subject: '',
        page: 1,
        limit: 5,
        includePending: false
      }
    });
    
    console.log('📊 Raw API response:');
    console.log('Number of tutors:', response.data.tutors?.length || 0);
    
    if (response.data.tutors && response.data.tutors.length > 0) {
      console.log('\n🔄 Testing mapping for each tutor:');
      
      response.data.tutors.forEach((tutor, index) => {
        console.log(`\n--- Tutor ${index + 1} ---`);
        console.log('Raw data:', {
          id: tutor.id,
          name: tutor.name,
          userId: tutor.userId,
          avatar: tutor.avatar,
          subjects: tutor.subjects,
          location: tutor.location,
          rating: tutor.rating,
          price: tutor.price,
          experience: tutor.experience
        });
        
        // Test mapping
        const mappedTutor = {
          _id: tutor.id,
          user: {
            full_name: tutor.name || tutor.userId || "Gia sư"
          },
          avatarUrl: tutor.avatar,
          subjects: tutor.subjects || [],
          location: tutor.location || "Chưa cập nhật",
          rating: tutor.rating || 0,
          reviewCount: tutor.reviewCount || 0,
          experience: tutor.experience || "0 năm",
          sessionRate: tutor.price || 0,
          bio: tutor.bio || "Chưa có giới thiệu",
          verified: tutor.verified || false
        };
        
        console.log('Mapped data:', {
          _id: mappedTutor._id,
          full_name: mappedTutor.user.full_name,
          avatarUrl: mappedTutor.avatarUrl,
          subjects: mappedTutor.subjects,
          location: mappedTutor.location,
          rating: mappedTutor.rating,
          sessionRate: mappedTutor.sessionRate
        });
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testTutorMapping();
