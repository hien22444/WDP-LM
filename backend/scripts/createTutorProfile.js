require('dotenv').config();
const mongoose = require('mongoose');

async function createTutorProfile() {
  try {
    await mongoose.connect(process.env.URI_DB);
    console.log('Connected to MongoDB Atlas');

    // Get first tutor user
    const tutor = await mongoose.connection.db.collection('users')
      .findOne({ role: 'tutor' });

    if (!tutor) {
      console.log('No tutor user found!');
      process.exit(1);
    }

    console.log(`Creating profile for: ${tutor.email} (${tutor.full_name})`);

    // Create TutorProfile
    const profile = {
      user: tutor._id,
      status: 'approved', // Direct approval for testing
      subjects: ['Toán', 'Lý'],
      bio: 'Gia sư có kinh nghiệm, tận tâm với học sinh',
      sessionRate: 200000,
      gender: 'Nam',
      dateOfBirth: new Date('1995-01-01'),
      teachModes: ['online', 'offline'],
      languages: ['Tiếng Việt', 'Tiếng Anh'],
      rating: 5,
      totalReviews: 0,
      verification: {
        idStatus: 'verified',
        degreeStatus: 'verified',
        certificatesStatus: 'verified',
        isVerified: true
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await mongoose.connection.db.collection('tutorprofiles')
      .insertOne(profile);

    console.log('✅ TutorProfile created successfully!');
    console.log('Profile ID:', result.insertedId);
    console.log('\nNow you can:');
    console.log('1. Create a booking with this tutor');
    console.log('2. Test the tutor dashboard');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTutorProfile();
