const mongoose = require("mongoose");
const User = require("../src/models/User");
const TutorProfile = require("../src/models/TutorProfile");
const Booking = require("../src/models/Booking");
const bcrypt = require("bcrypt");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/tutor-booking";

async function seedTestData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    await User.deleteMany({});
    await TutorProfile.deleteMany({});
    await Booking.deleteMany({});
    console.log("🗑️  Cleared existing data");

    // Create test users
    const hashedPassword = await bcrypt.hash("123456", 10);

    const learner = await User.create({
      email: "learner@test.com",
      password: hashedPassword,
      full_name: "Nguyễn Văn Học",
      phone: "0123456789",
      role: "student",
      avatar: "https://res.cloudinary.com/dnyvwjbbm/image/upload/v1760334427/whiteava_m3gka1.jpg"
    });
    console.log("👨‍🎓 Created learner:", learner.email);

    const tutorUser = await User.create({
      email: "tutor@test.com",
      password: hashedPassword,
      full_name: "Trần Thị Giảng",
      phone: "0987654321",
      role: "tutor",
      avatar: "https://res.cloudinary.com/dnyvwjbbm/image/upload/v1760334427/whiteava_m3gka1.jpg"
    });
    console.log("👨‍🏫 Created tutor user:", tutorUser.email);

    // Create tutor profile
    const tutorProfile = await TutorProfile.create({
      user: tutorUser._id,
      subject: "Toán",
      subjects: ["Toán", "Vật lý"],
      bio: "Giáo viên Toán có 5 năm kinh nghiệm",
      education: "Đại học Sư phạm Hà Nội",
      experience: "5 năm",
      sessionRate: 200000,
      rating: 4.8,
      totalReviews: 0,
      status: "approved"
    });
    console.log("📚 Created tutor profile:", tutorProfile._id);

    // Create test booking (pending)
    const booking1 = await Booking.create({
      tutorProfile: tutorProfile._id,
      student: learner._id,
      start: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // +2 hours
      mode: "online",
      price: 200000,
      status: "pending",
      paymentStatus: "paid",
      notes: "Học Toán lớp 10",
      contractData: {
        studentName: learner.full_name,
        tutorName: tutorUser.full_name,
        subject: "Toán",
        sessionCount: 1,
        totalAmount: 200000,
        startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000)
      },
      studentSignature: learner.full_name,
      studentSignedAt: new Date(),
      contractNumber: `HD-${Date.now()}-1`
    });
    console.log("📝 Created pending booking:", booking1._id);

    // Create accepted booking
    const booking2 = await Booking.create({
      tutorProfile: tutorProfile._id,
      student: learner._id,
      start: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      mode: "offline",
      price: 200000,
      status: "accepted",
      paymentStatus: "paid",
      notes: "Học Vật lý lớp 11",
      contractSigned: true,
      tutorSignature: tutorUser.full_name,
      tutorSignedAt: new Date(),
      studentSignature: learner.full_name,
      studentSignedAt: new Date(),
      contractNumber: `HD-${Date.now()}-2`
    });
    console.log("✅ Created accepted booking:", booking2._id);

    console.log("\n🎉 Test data seeded successfully!");
    console.log("\n📋 Login credentials:");
    console.log("Learner: learner@test.com / 123456");
    console.log("Tutor: tutor@test.com / 123456");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  }
}

seedTestData();
