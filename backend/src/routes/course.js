const router = require("express").Router();
const { auth } = require("../middlewares/auth");
const Course = require("../models/Course");
const CourseEnrollment = require("../models/CourseEnrollment");
const TutorProfile = require("../models/TutorProfile");

// ============ TUTOR ROUTES ============

// Create new course (Tutor only)
router.post("/", auth(), async (req, res) => {
  console.log("🚀🚀🚀 POST /courses HIT!");
  console.log("🚀 req.body:", req.body);
  console.log("🚀 req.user:", req.user);
  
  try {
    const { subject, title, description, duration, schedule, price, maxStudents, startDate } = req.body;

    console.log("📚 Creating course...");
    console.log("📚 Subject:", subject);
    console.log("📚 User ID from auth:", req.user);

    // Get tutor profile
    const userId = req.user?.id;
    console.log("📚 Resolved userId:", userId);
    
    const tutorProfile = await TutorProfile.findOne({ user: userId });
    if (!tutorProfile) {
      console.log("❌ Tutor profile not found for user:", userId);
      return res.status(404).json({ message: "Tutor profile not found" });
    }

    console.log("✅ Found tutor profile:", tutorProfile._id);

    // Parse subject ID (format: tutorProfileId_index)
    const subjectIndex = parseInt(subject.split('_')[1]);
    const subjectData = tutorProfile.subjects[subjectIndex];
    
    if (!subjectData) {
      console.log("❌ Subject not found at index:", subjectIndex);
      return res.status(400).json({ message: "Subject not found in your tutor profile" });
    }

    console.log("✅ Found subject:", subjectData);

    // Create course with embedded subject data
    const course = new Course({
      tutor: tutorProfile._id,
      subject: {
        _id: subject,
        name: subjectData.name,
        level: subjectData.level,
      },
      title,
      description,
      duration,
      schedule,
      price,
      maxStudents,
      startDate,
      status: "draft",
    });

    await course.save();

    console.log("✅ Course created successfully:", course._id);
    res.status(201).json(course);
  } catch (error) {
    console.error("❌ Error creating course:", error);
    console.error("❌ Error stack:", error.stack);
    res.status(500).json({ message: error.message || "Server error" });
  }
});

// Get tutor's courses
router.get("/tutor/my-courses", auth(), async (req, res) => {
  try {
    const tutorProfile = await TutorProfile.findOne({ user: req.user.id });
    if (!tutorProfile) {
      return res.status(404).json({ message: "Tutor profile not found" });
    }

    const courses = await Course.find({ tutor: tutorProfile._id })
      .sort({ createdAt: -1 });

    res.json(courses);
  } catch (error) {
    console.error("Error fetching tutor courses:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update course (Tutor only, draft courses only)
router.put("/:id", auth(), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate("tutor");
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Verify ownership
    if (course.tutor.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Only draft courses can be edited
    if (course.status !== "draft") {
      return res.status(400).json({ message: "Only draft courses can be edited" });
    }

    const { title, description, duration, schedule, price, maxStudents, startDate } = req.body;

    Object.assign(course, {
      title,
      description,
      duration,
      schedule,
      price,
      maxStudents,
      startDate,
    });

    await course.save();
    await course.populate("subject", "name");

    res.json(course);
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
});

// Delete course (Tutor only, draft courses only)
router.delete("/:id", auth(), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate("tutor");
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Verify ownership
    if (course.tutor.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Only draft courses can be deleted
    if (course.status !== "draft") {
      return res.status(400).json({ message: "Only draft courses can be deleted" });
    }

    await course.deleteOne();
    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Publish course (Tutor only)
router.post("/:id/publish", auth(), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate("tutor");
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Verify ownership
    if (course.tutor.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (course.status !== "draft") {
      return res.status(400).json({ message: "Course is already published" });
    }

    course.status = "published";
    await course.save();

    res.json(course);
  } catch (error) {
    console.error("Error publishing course:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get course enrollments (Tutor only)
router.get("/:id/enrollments", auth(), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate("tutor");
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Verify ownership
    if (course.tutor.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const enrollments = await CourseEnrollment.find({ course: course._id })
      .populate("student", "fullName email phone")
      .sort({ enrolledAt: -1 });

    res.json(enrollments);
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ============ STUDENT ROUTES ============

// Get public courses (students/public)
router.get("/", async (req, res) => {
  try {
    const { subject, minPrice, maxPrice } = req.query;

    const filter = { status: "published" };

    if (subject) {
      filter.subject = subject;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseInt(minPrice);
      if (maxPrice) filter.price.$lte = parseInt(maxPrice);
    }

    const courses = await Course.find(filter)
      .populate({
        path: "tutor",
        populate: {
          path: "user",
          select: "fullName",
        },
      })
      .sort({ createdAt: -1 });

    res.json(courses);
  } catch (error) {
    console.error("Error fetching public courses:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get course by ID (public)
router.get("/:id", async (req, res) => {
  try {
    console.log("📖 Getting course by ID:", req.params.id);
    
    const course = await Course.findById(req.params.id)
      .populate({
        path: "tutor",
        populate: {
          path: "user",
          select: "fullName email phone",
        },
      });

    if (!course) {
      console.log("❌ Course not found:", req.params.id);
      return res.status(404).json({ message: "Course not found" });
    }

    console.log("✅ Course found:", course.title);
    res.json(course);
  } catch (error) {
    console.error("❌ Error fetching course:", error);
    console.error("❌ Error stack:", error.stack);
    res.status(500).json({ message: "Server error" });
  }
});

// Enroll in course (Student only)
router.post("/:id/enroll", auth(), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (course.status !== "published") {
      return res.status(400).json({ message: "Course is not available for enrollment" });
    }

    if (course.currentStudents >= course.maxStudents) {
      return res.status(400).json({ message: "Course is full" });
    }

    // Check if already enrolled
    const existingEnrollment = await CourseEnrollment.findOne({
      course: course._id,
      student: req.user.id,
      status: { $in: ["pending", "active"] },
    });

    if (existingEnrollment) {
      return res.status(400).json({ message: "Already enrolled in this course" });
    }

    // Create enrollment
    const enrollment = new CourseEnrollment({
      course: course._id,
      student: req.user.id,
      tutorProfile: course.tutor,
      amount: course.price * course.totalSessions,
      paymentStatus: "pending",
      status: "pending",
    });

    await enrollment.save();

    // Update course student count
    course.currentStudents += 1;
    await course.save();

    res.status(201).json({
      message: "Enrollment created successfully. Please proceed with payment.",
      enrollment,
    });
  } catch (error) {
    console.error("Error enrolling in course:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
});

// Get student's enrollments
router.get("/student/my-enrollments", auth(), async (req, res) => {
  try {
    const enrollments = await CourseEnrollment.find({ student: req.user.id })
      .populate({
        path: "course",
        populate: {
          path: "subject",
          select: "name",
        },
      })
      .populate({
        path: "tutorProfile",
        populate: {
          path: "user",
          select: "fullName",
        },
      })
      .sort({ enrolledAt: -1 });

    res.json(enrollments);
  } catch (error) {
    console.error("Error fetching student enrollments:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
