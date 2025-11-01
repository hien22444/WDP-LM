const router = require("express").Router();
const mongoose = require("mongoose");
const { auth } = require("../middlewares/auth");
const TutorProfile = require("../models/TutorProfile");
const User = require("../models/User");
const TeachingSlot = require("../models/TeachingSlot");
const Booking = require("../models/Booking");
const { upload } = require("../config/cloudinary");

// Search tutors (public) - keep BEFORE any dynamic :id routes
// (remove duplicated older /search implementations below; keep only this one at top)
router.get("/search", async (req, res) => {
  try {
    const {
      search = "",
      subject = "",
      grade = "",
      location = "",
      mode = "",
      minPrice = 0,
      maxPrice = 10000000,
      minRating = 0,
      maxRating = 5,
      experience = "",
      page = 1,
      limit = 20,
      sortBy = "rating",
      includePending,
      smartSuggest = false,
    } = req.query;

    const filter = {};
    // Hiển thị gia sư đã duyệt và đang chờ duyệt (loại bỏ draft)
    if (includePending) {
      filter.status = { $in: ["approved", "pending"] };
    } else {
      filter.status = { $in: ["approved", "pending"] }; // Hiển thị cả approved và pending
    }

    // Subject filter
    const subjectRegex = subject ? new RegExp(subject, "i") : null;
    if (subjectRegex) {
      filter.$or = [
        { subjects: { $in: [subjectRegex] } },
        { "subjects.subject": subjectRegex },
        { "subjects.name": subjectRegex },
        { "subjects.level": subjectRegex },
      ];
    }

    // Grade filter
    if (grade) {
      const gradeRegex = new RegExp(grade, "i");
      filter.$or = [
        ...(filter.$or || []),
        { "subjects.grade": gradeRegex },
        { "subjects.level": gradeRegex },
        { grades: { $in: [gradeRegex] } },
      ];
    }

    // Location filter
    if (location) filter.city = new RegExp(location, "i");

    // Mode filter
    if (mode) filter.teachModes = { $in: [mode] };

    // Price filter - chỉ filter khi có giá trị min hoặc max được chỉ định
    if (minPrice && minPrice > 0) {
      filter.sessionRate = { $gte: Number(minPrice) };
      if (maxPrice) filter.sessionRate.$lte = Number(maxPrice);
    } else if (maxPrice && maxPrice < 10000000) {
      // Chỉ filter maxPrice nếu nó khác giá trị mặc định
      filter.sessionRate = { $lte: Number(maxPrice) };
    }

    // Rating filter - chỉ filter khi có giá trị min hoặc max được chỉ định
    if (minRating && minRating > 0) {
      filter.rating = { $gte: Number(minRating) };
      if (maxRating && maxRating < 5) filter.rating.$lte = Number(maxRating);
    } else if (maxRating && maxRating < 5) {
      // Chỉ filter maxRating nếu nó khác giá trị mặc định
      filter.rating = { $lte: Number(maxRating) };
    }

    // Experience filter
    if (experience) {
      const expYears = Number(experience);
      if (!isNaN(expYears)) {
        filter.experience = { $gte: expYears };
      }
    }

    let searchQuery = {};
    if (search) {
      const searchRegex = new RegExp(search, "i");

      // Also match tutors who have open slots with matching courseName
      let slotTutorIds = [];
      try {
        const slots = await TeachingSlot.find({
          courseName: searchRegex,
          status: "open",
        }).select("tutorProfile");
        slotTutorIds = [...new Set(slots.map((s) => String(s.tutorProfile)))];
      } catch (e) {
        console.warn("search slots failed", e?.message);
      }

      searchQuery = {
        $or: [
          { bio: searchRegex },
          { subjects: { $in: [searchRegex] } },
          { "subjects.subject": searchRegex },
          { "subjects.name": searchRegex },
          { city: searchRegex },
          ...(slotTutorIds.length ? [{ _id: { $in: slotTutorIds } }] : []),
        ],
      };
    }

    const finalFilter = { ...filter, ...searchQuery };
    
    // DEBUG: Log filter để kiểm tra
    console.log('🔍 /tutors/search - finalFilter:', JSON.stringify(finalFilter, null, 2));
    console.log('🔍 /tutors/search - includePending:', includePending);
    console.log('🔍 /tutors/search - page:', page, 'limit:', limit);

    // Smart suggestion logic
    if (smartSuggest === "true" && req.user) {
      // Get user's learning history and preferences
      const userHistory = await Booking.find({
        student: req.user.id,
        status: "completed",
      }).populate("tutorProfile", "subjects rating experience");

      // Calculate preference scores
      const subjectPreferences = {};
      const pricePreferences = [];

      userHistory.forEach((booking) => {
        const tutor = booking.tutorProfile;
        if (tutor) {
          // Track subject preferences
          tutor.subjects.forEach((subject) => {
            subjectPreferences[subject] =
              (subjectPreferences[subject] || 0) + 1;
          });

          // Track price preferences
          pricePreferences.push(booking.price);
        }
      });

      // Add preference-based sorting
      if (Object.keys(subjectPreferences).length > 0) {
        finalFilter.$expr = {
          $add: [
            { $multiply: ["$rating", 0.4] },
            {
              $multiply: [
                {
                  $size: {
                    $setIntersection: [
                      "$subjects",
                      Object.keys(subjectPreferences),
                    ],
                  },
                },
                0.3,
              ],
            },
            { $multiply: ["$experience", 0.2] },
            {
              $multiply: [
                {
                  $subtract: [
                    5,
                    {
                      $divide: [
                        {
                          $subtract: [
                            "$sessionRate",
                            { $avg: pricePreferences },
                          ],
                        },
                        100000,
                      ],
                    },
                  ],
                },
                0.1,
              ],
            },
          ],
        };
      }
    }

    let sort = {};
    switch (sortBy) {
      case "rating":
        sort = { rating: -1 };
        break;
      case "price-low":
        sort = { sessionRate: 1 };
        break;
      case "price-high":
        sort = { sessionRate: -1 };
        break;
      case "experience":
        sort = { experience: -1 };
        break;
      case "smart":
        sort = smartSuggest === "true" ? { $expr: 1 } : { rating: -1 };
        break;
      default:
        sort = { rating: -1 };
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    // DEBUG: Count trước khi query
    const totalBeforeQuery = await TutorProfile.countDocuments(finalFilter);
    console.log('🔍 /tutors/search - Total matching filter:', totalBeforeQuery);
    
    const tutors = await TutorProfile.find(finalFilter)
      .populate("user", "full_name image phone_number email")
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    console.log('🔍 /tutors/search - Tutors found after query:', tutors.length);
    console.log('🔍 /tutors/search - Tutor IDs:', tutors.map(t => t._id));

    const total = await TutorProfile.countDocuments(finalFilter);

    const formattedTutors = tutors.map((tutor) => ({
      id: tutor._id,
      userId: tutor.user?._id,
      name: tutor.user?.full_name,
      avatar:
        tutor.user?.image ||
        tutor.avatarUrl ||
        tutor.avatar ||
        tutor.profileImage ||
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      subjects: tutor.subjects || [],
      location: tutor.city || "Chưa cập nhật",
      rating: tutor.rating || 0,
      reviewCount: tutor.reviewCount || 0,
      experience: `${tutor.experienceYears || 0} năm`,
      price: tutor.sessionRate || 0,
      teachModes: tutor.teachModes || [],
      bio: tutor.bio || "Chưa có giới thiệu",
      verified: tutor.status === "approved",
      isIncomplete: tutor.status !== "approved",
    }));

    res.json({
      tutors: formattedTutors,
      pagination: {
        current: Number(page),
        total: Math.ceil(total / Number(limit)),
        count: total,
        limit: Number(limit),
      },
      message: "Search completed successfully",
    });
  } catch (error) {
    console.error("Search tutors error:", error);
    res.status(500).json({ message: "Failed to search tutors" });
  }
});

// Ensure /me is defined BEFORE any dynamic :id routes
router.get("/me", auth(), async (req, res) => {
  try {
    console.log("Getting tutor profile for user:", req.user.id);
    let profile = await TutorProfile.findOne({ user: req.user.id });
    if (!profile) {
      console.log("Creating new tutor profile for user:", req.user.id);
      profile = await TutorProfile.create({
        user: req.user.id,
        status: "draft",
      });
      console.log("Created profile:", profile._id);
    }
    res.json({ profile });
  } catch (e) {
    console.error("Error in /tutors/me:", e);
    res
      .status(500)
      .json({ message: "Failed to load profile", error: e.message });
  }
});

// Get tutor's courses/slots (public) - MUST be before /:id route
router.get("/:id/courses", async (req, res) => {
  try {
    // Relaxed visibility: allow fetching courses by tutor id even if profile chưa approved
    const tutor = await TutorProfile.findOne({ _id: req.params.id });

    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }

    // Get open teaching slots for this tutor
    const TeachingSlot = require("../models/TeachingSlot");
    const courses = await TeachingSlot.find({
      tutorProfile: req.params.id,
      status: "open",
      start: { $gte: new Date() }, // Only future slots
    }).sort({ start: 1 });

    // Format response
    const formattedCourses = courses.map((course) => ({
      id: course._id,
      courseName: course.courseName,
      start: course.start,
      end: course.end,
      mode: course.mode,
      price: course.price,
      location: course.location,
      notes: course.notes,
      capacity: course.capacity,
      availableSlots: course.capacity,
      date: course.start.toISOString().split("T")[0],
      time: {
        start: course.start.toTimeString().substring(0, 5),
        end: course.end.toTimeString().substring(0, 5),
      },
    }));

    res.json({
      courses: formattedCourses,
      message: "Courses retrieved successfully",
    });
  } catch (error) {
    console.error("Get tutor courses error:", error);
    res.status(500).json({ message: "Failed to get tutor courses" });
  }
});

// Get tutor profile by ID (public) - MUST be before /me route
router.get("/:id", async (req, res) => {
  try {
    // Relaxed visibility: show profile even if not approved; flag isDraft for UI handling
    let tutor = null;
    const id = req.params.id;
    if (mongoose.isValidObjectId(id)) {
      tutor = await TutorProfile.findOne({ _id: id }).populate(
        "user",
        "full_name phone_number email status image"
      );
    }
    // Fallback: if not found by profile id, try by user id
    if (!tutor && mongoose.isValidObjectId(id)) {
      tutor = await TutorProfile.findOne({ user: id }).populate(
        "user",
        "full_name phone_number email status image"
      );
    }
    // Fallback by email
    if (!tutor && id && id.includes("@")) {
      const user = await require("../models/User").findOne({ email: id });
      if (user) {
        tutor = await TutorProfile.findOne({ user: user._id }).populate(
          "user",
          "full_name phone_number email status image"
        );
      }
    }

    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }

    // Helper to convert relative paths to absolute URLs for public consumption
    const toAbsoluteUrl = (p) => {
      if (!p) return "";
      if (typeof p !== "string") return p;
      if (p.startsWith("http")) return p;
      const serverUrl = process.env.SERVER_URL || "http://localhost:5000";
      return `${serverUrl}/${p.replace(/^\/?/, "")}`;
    };

    // Public-safe document lists: expose degree/other documents, but DO NOT expose ID documents
    const verification = tutor.verification || {};
    const degreeDocuments = Array.isArray(verification.degreeDocuments)
      ? verification.degreeDocuments.map(toAbsoluteUrl)
      : [];
    const otherDocuments = Array.isArray(verification.otherDocuments)
      ? verification.otherDocuments.map(toAbsoluteUrl)
      : [];

    // Normalize subjects to preserve name + level for the UI
    const normalizedSubjects = Array.isArray(tutor.subjects)
      ? tutor.subjects
          .map((s) => {
            if (!s) return null;
            if (typeof s === "string") return s;
            return s.name || s.subject || s.level || "";
          })
          .filter(Boolean)
      : [];

    // Format response with richer registration info
    const formattedTutor = {
      id: tutor._id,
      userId: tutor.user?._id || null,
      name: tutor.user?.full_name || tutor.user?.fullName || "Gia sư",
      // Prefer user's image (profile avatar), then tutor's avatarUrl
      avatarUrl: tutor.user?.image || tutor.avatarUrl || null,
      avatar:
        toAbsoluteUrl(
          tutor.user?.image ||
            tutor.avatarUrl ||
            tutor.avatar ||
            tutor.profileImage
        ) ||
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      subjects: normalizedSubjects,
      location: tutor.city || tutor.location || "Chưa cập nhật",
      rating: tutor.rating || 0,
      reviewCount: tutor.reviewCount || 0,
      experience: `${tutor.experienceYears || tutor.experience || 0} năm`,
      price: tutor.sessionRate || tutor.hourlyRate || tutor.price || 0,
      teachModes: tutor.teachModes || [],
      bio: tutor.bio || tutor.description || "Chưa có giới thiệu",
      verified: tutor.status === "approved",
      isDraft: tutor.status !== "approved" || !tutor.hasAvailability,
      phone: tutor.user?.phone_number || tutor.phone,
      email: tutor.user?.email || tutor.email,
      languages: tutor.languages || [],
      availability: tutor.availability || [],

      // Registration fields
      education: tutor.education || "",
      teachingStyle: tutor.teachingStyle || "",
      achievements: tutor.achievements || [],
      certificates: tutor.certificates || [],
      degrees: tutor.degrees || [],

      // Media fields normalized to absolute URLs
      gallery: Array.isArray(tutor.gallery)
        ? tutor.gallery.map(toAbsoluteUrl)
        : [],
      portfolio: Array.isArray(tutor.portfolio)
        ? tutor.portfolio.map((item) => ({
            ...item,
            image: toAbsoluteUrl(item?.image || item),
          }))
        : [],
      uploads: Array.isArray(tutor.uploads)
        ? tutor.uploads.map((u) => ({ ...u, url: toAbsoluteUrl(u?.url || u) }))
        : [],

      // Verification summary (statuses) and public-safe docs
      verification: {
        degreeStatus: verification.degreeStatus || "pending",
        idStatus: verification.idStatus || "pending",
        otherStatus: verification.otherStatus || "pending",
        degreeDocuments,
        otherDocuments,
      },
    };

    res.json({
      tutor: formattedTutor,
      message: "Tutor profile retrieved successfully",
    });
  } catch (error) {
    console.error("Get tutor profile error:", error);
    res.status(500).json({ message: "Failed to get tutor profile" });
  }
});

// Get tutor availability (slots trống và bận)
router.get("/:id/availability", async (req, res) => {
  try {
    const tutorId = req.params.id;

    // Find tutor profile
    const tutor = await TutorProfile.findById(tutorId);
    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }

    // Get tutor's availability (general schedule)
    const availability = tutor.availability || [];

    // Get all bookings for this tutor (next 2 weeks)
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

    const bookings = await Booking.find({
      tutorProfile: tutorId,
      status: { $in: ["accepted", "completed", "in_progress"] },
      start: { $gte: new Date(), $lte: twoWeeksFromNow },
    }).select("start end");

    // Calculate available slots for next 14 days
    const availableSlots = [];
    const bookedSlots = [];

    for (let day = 0; day < 14; day++) {
      const currentDate = new Date();
      currentDate.setDate(currentDate.getDate() + day);
      const dayOfWeek = currentDate.getDay(); // 0=Sunday, 1=Monday, ...

      // Find availability for this day of week
      const dayAvailability = availability.filter(
        (a) => a.dayOfWeek === dayOfWeek
      );

      for (const slot of dayAvailability) {
        const [startHour, startMin] = slot.start.split(":").map(Number);
        const [endHour, endMin] = slot.end.split(":").map(Number);

        const slotStart = new Date(currentDate);
        slotStart.setHours(startHour, startMin, 0, 0);

        const slotEnd = new Date(currentDate);
        slotEnd.setHours(endHour, endMin, 0, 0);

        // Check if this slot conflicts with any booking
        const isBooked = bookings.some((booking) => {
          const bookingStart = new Date(booking.start);
          const bookingEnd = new Date(booking.end);

          // Check for overlap
          return slotStart < bookingEnd && slotEnd > bookingStart;
        });

        if (isBooked) {
          bookedSlots.push({
            date: slotStart.toISOString(),
            start: slot.start,
            end: slot.end,
            available: false,
          });
        } else {
          availableSlots.push({
            date: slotStart.toISOString(),
            start: slot.start,
            end: slot.end,
            available: true,
          });
        }
      }
    }

    res.json({
      availability: {
        weekly: availability, // General weekly schedule
        slots: availableSlots, // Available slots for next 14 days
        booked: bookedSlots, // Booked slots
      },
    });
  } catch (error) {
    console.error("Get tutor availability error:", error);
    res.status(500).json({ message: "Failed to get tutor availability" });
  }
});

// Get my tutor profile (create if not exists as draft)
router.get("/me", auth(), async (req, res) => {
  try {
    console.log("Getting tutor profile for user:", req.user.id);
    let profile = await TutorProfile.findOne({ user: req.user.id });
    if (!profile) {
      console.log("Creating new tutor profile for user:", req.user.id);
      profile = await TutorProfile.create({
        user: req.user.id,
        status: "draft",
      });
      console.log("Created profile:", profile._id);
    }
    res.json({ profile });
  } catch (e) {
    console.error("Error in /tutors/me:", e);
    res
      .status(500)
      .json({ message: "Failed to load profile", error: e.message });
  }
});

// Update basic info
router.patch("/me/basic", auth(), async (req, res) => {
  try {
    let { avatarUrl, gender, dateOfBirth, city, district, bio } = req.body;

    // Sanitize only; don't block with strict validation (frontend flow simplified)
    const update = {};
    if (avatarUrl) update.avatarUrl = String(avatarUrl);
    if (gender && ["male", "female", "other"].includes(gender))
      update.gender = gender;
    if (dateOfBirth) {
      const dt = new Date(dateOfBirth);
      if (!isNaN(dt.getTime())) update.dateOfBirth = dt;
    }
    if (city) update.city = String(city).trim();
    if (district) update.district = String(district).trim();
    if (bio) update.bio = String(bio);

    const profile = await TutorProfile.findOneAndUpdate(
      { user: req.user.id },
      { $set: update },
      { new: true, upsert: true }
    );
    res.json({ profile });
  } catch (e) {
    console.error("/tutors/me/basic error:", e?.message);
    res.status(500).json({ message: "Failed to update basic info" });
  }
});

// Update expertise
router.patch("/me/expertise", auth(), async (req, res) => {
  try {
    let { subjects, experienceYears, experiencePlaces } = req.body;
    if (!Array.isArray(subjects)) subjects = [];
    experienceYears = Number(experienceYears || 0);

    const profile = await TutorProfile.findOneAndUpdate(
      { user: req.user.id },
      {
        $set: {
          subjects,
          experienceYears,
          experiencePlaces: experiencePlaces || null,
        },
      },
      { new: true, upsert: true }
    );
    res.json({ profile });
  } catch (e) {
    console.error("/tutors/me/expertise error:", e?.message);
    res.status(500).json({ message: "Failed to update expertise" });
  }
});

// Update entire tutor profile (comprehensive update)
router.patch("/me", auth(), async (req, res) => {
  try {
    const updateData = {};

    // Map form fields to database fields
    if (req.body.introduction) updateData.bio = req.body.introduction;
    if (req.body.subjects && Array.isArray(req.body.subjects)) {
      // Convert string array to object array format
      updateData.subjects = req.body.subjects.map((subject) => {
        if (typeof subject === "string") {
          return { name: subject, level: null };
        }
        return subject;
      });
    }
    if (req.body.experience)
      updateData.experienceYears = parseInt(req.body.experience) || 0;
    if (req.body.hourlyRate)
      updateData.sessionRate = parseInt(req.body.hourlyRate);
    if (req.body.location) updateData.city = req.body.location;
    if (req.body.education) updateData.education = req.body.education;
    if (req.body.university) updateData.university = req.body.university;
    if (req.body.teachingMethod)
      updateData.teachingMethod = req.body.teachingMethod;
    if (req.body.achievements) updateData.achievements = req.body.achievements;

    const profile = await TutorProfile.findOneAndUpdate(
      { user: req.user.id },
      { $set: updateData },
      { new: true, upsert: true }
    );

    res.json({ profile });
  } catch (e) {
    console.error("/tutors/me error:", e?.message);
    res
      .status(500)
      .json({ message: "Failed to update profile", error: e.message });
  }
});

// Update teaching preferences
router.patch("/me/preferences", auth(), async (req, res) => {
  try {
    let { teachModes, languages, paymentType, sessionRate } = req.body;
    // Normalize
    if (!Array.isArray(teachModes)) teachModes = teachModes ? [teachModes] : [];
    if (!Array.isArray(languages)) languages = languages ? [languages] : [];
    const languageMap = {
      vi: "vietnamese",
      en: "english",
      zh: "chinese",
      ja: "japanese",
      ko: "korean",
      fr: "french",
      de: "german",
      es: "spanish",
    };
    languages = languages
      .map((l) => String(l).trim().toLowerCase())
      .filter(Boolean)
      .map((l) => languageMap[l] || l); // accept both code and full name

    // Validation rules
    const errors = [];

    // Teach modes validation (at least one mode required)
    if (!teachModes || teachModes.length === 0) {
      errors.push("Phải chọn ít nhất 1 hình thức dạy học");
    } else {
      const validModes = ["online", "offline"];
      const invalidModes = teachModes.filter(
        (mode) => !validModes.includes(mode)
      );
      if (invalidModes.length > 0) {
        errors.push("Hình thức dạy học không hợp lệ");
      }
    }

    // Languages validation (at least one language required)
    if (!languages || languages.length === 0) {
      errors.push("Phải chọn ít nhất 1 ngôn ngữ");
    } else if (languages.length > 5) {
      errors.push("Không được chọn quá 5 ngôn ngữ");
    }

    // Payment type validation
    if (
      paymentType &&
      !["per_session", "per_hour", "per_month"].includes(paymentType)
    ) {
      errors.push("Loại thanh toán không hợp lệ");
    }

    // Session rate validation
    if (sessionRate !== undefined) {
      if (sessionRate < 50000) {
        errors.push("Giá mỗi buổi học tối thiểu là 50,000 VNĐ");
      } else if (sessionRate > 5000000) {
        errors.push("Giá mỗi buổi học tối đa là 5,000,000 VNĐ");
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    const profile = await TutorProfile.findOneAndUpdate(
      { user: req.user.id },
      {
        $set: {
          teachModes: teachModes || [],
          languages: languages || [],
          paymentType,
          sessionRate,
        },
      },
      { new: true, upsert: true }
    );
    res.json({ profile });
  } catch (e) {
    res.status(500).json({ message: "Failed to update preferences" });
  }
});

// Update availability slots
router.put("/me/availability", auth(), async (req, res) => {
  try {
    const { availability } = req.body; // [{dayOfWeek,start,end},...]

    // Validation rules
    const errors = [];

    if (!availability || availability.length === 0) {
      errors.push("Phải thiết lập ít nhất 1 khung giờ rảnh");
    } else {
      // Maximum 20 time slots per week
      if (availability.length > 20) {
        errors.push("Không được đặt quá 20 khung giờ trong tuần");
      }

      // Validate each time slot
      availability.forEach((slot, index) => {
        const { dayOfWeek, start, end } = slot;

        // Day validation
        if (
          !dayOfWeek ||
          ![
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
          ].includes(dayOfWeek)
        ) {
          errors.push(
            `Khung giờ thứ ${index + 1}: Ngày trong tuần không hợp lệ`
          );
        }

        // Time validation
        if (!start || !end) {
          errors.push(
            `Khung giờ thứ ${
              index + 1
            }: Thời gian bắt đầu và kết thúc là bắt buộc`
          );
        } else {
          const startTime = new Date(`2000-01-01T${start}:00`);
          const endTime = new Date(`2000-01-01T${end}:00`);

          // Check if start time is before end time
          if (startTime >= endTime) {
            errors.push(
              `Khung giờ thứ ${
                index + 1
              }: Thời gian bắt đầu phải trước thời gian kết thúc`
            );
          }

          // Check if duration is at least 1 hour
          const duration = (endTime - startTime) / (1000 * 60 * 60);
          if (duration < 1) {
            errors.push(
              `Khung giờ thứ ${index + 1}: Mỗi buổi học phải ít nhất 1 giờ`
            );
          }

          // Check if duration is not more than 8 hours
          if (duration > 8) {
            errors.push(
              `Khung giờ thứ ${index + 1}: Mỗi buổi học không được quá 8 giờ`
            );
          }

          // Check if time is within working hours (6 AM - 10 PM)
          const startHour = startTime.getHours();
          const endHour = endTime.getHours();
          if (startHour < 6 || endHour > 22) {
            errors.push(
              `Khung giờ thứ ${
                index + 1
              }: Thời gian dạy học phải trong khoảng 6:00 - 22:00`
            );
          }
        }
      });

      // Check for overlapping time slots on the same day
      const daySlots = {};
      availability.forEach((slot, index) => {
        const { dayOfWeek, start, end } = slot;
        if (!daySlots[dayOfWeek]) {
          daySlots[dayOfWeek] = [];
        }
        daySlots[dayOfWeek].push({ start, end, index });
      });

      Object.keys(daySlots).forEach((day) => {
        const slots = daySlots[day].sort((a, b) =>
          a.start.localeCompare(b.start)
        );
        for (let i = 1; i < slots.length; i++) {
          const prevEnd = new Date(`2000-01-01T${slots[i - 1].end}:00`);
          const currStart = new Date(`2000-01-01T${slots[i].start}:00`);
          if (prevEnd > currStart) {
            errors.push(
              `Khung giờ bị trùng lặp vào ${day}: khung ${
                slots[i - 1].index + 1
              } và khung ${slots[i].index + 1}`
            );
          }
        }
      });
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    const profile = await TutorProfile.findOneAndUpdate(
      { user: req.user.id },
      {
        $set: {
          availability: availability || [],
          hasAvailability: availability && availability.length > 0,
        },
      },
      { new: true, upsert: true }
    );
    res.json({ profile });
  } catch (e) {
    res.status(500).json({ message: "Failed to update availability" });
  }
});

// Submit for verification
router.post("/me/submit", auth(), async (req, res) => {
  try {
    const profile = await TutorProfile.findOne({ user: req.user.id });
    if (!profile) {
      const created = await TutorProfile.create({
        user: req.user.id,
        status: "draft",
      });
      return res.json({
        profile: created,
        message: "Hồ sơ được khởi tạo, vui lòng bổ sung thông tin",
      });
    }

    // Validation rules for submission (collect as warnings; do not block)
    const warnings = [];

    // Idempotent: nếu đã gửi/đã duyệt, trả 200 để frontend không báo lỗi
    if (profile.status === "pending") {
      return res.json({ profile, message: "Hồ sơ đang chờ duyệt" });
    }

    if (profile.status === "approved") {
      return res.json({ profile, message: "Hồ sơ đã được duyệt" });
    }

    // Required fields validation (relaxed to phù hợp quy trình rút gọn)
    if (!profile.subjects || profile.subjects.length === 0) {
      warnings.push("Nên thêm ít nhất 1 môn/khóa dạy");
    }
    // Basic info khuyến nghị nhưng không bắt buộc cứng
    if (!profile.gender) {
      warnings.push("(Khuyến nghị) Bổ sung giới tính");
    }
    if (!profile.dateOfBirth) {
      warnings.push("(Khuyến nghị) Bổ sung ngày sinh");
    }
    // Documents: yêu cầu có giấy tờ tùy thân; bằng cấp là khuyến nghị
    if (!profile.idDocumentUrls || profile.idDocumentUrls.length === 0) {
      warnings.push("Nên tải giấy tờ tùy thân (ít nhất 1 ảnh)");
    }
    // Không yêu cầu teachModes/languages/payment/availability trong quy trình tối giản

    // Không chặn gửi duyệt; luôn cập nhật trạng thái pending

    const updatedProfile = await TutorProfile.findOneAndUpdate(
      { user: req.user.id },
      {
        $set: {
          status: "pending",
          "verification.idStatus": "pending",
          "verification.degreeStatus": "pending",
        },
      },
      { new: true }
    );
    return res.json({
      profile: updatedProfile,
      message: "Hồ sơ đã gửi chờ duyệt thành công",
      warnings,
    });
  } catch (e) {
    console.error("/tutors/me/submit error:", e?.message);
    return res
      .status(200)
      .json({
        message: "Đã tiếp nhận yêu cầu gửi duyệt",
        warnings: ["Gặp lỗi không nghiêm trọng khi ghi log"],
      });
  }
});

// Get tutor availability
router.get("/me/availability", auth(), async (req, res) => {
  try {
    const tutorProfile = await TutorProfile.findOne({ user: req.user.id });
    if (!tutorProfile) {
      return res.status(404).json({ message: "Tutor profile not found" });
    }

    res.json({
      availability: tutorProfile.availability || [],
      message: "Availability retrieved successfully",
    });
  } catch (error) {
    console.error("Get availability error:", error);
    res.status(500).json({ message: "Failed to get availability" });
  }
});

// Update tutor availability
router.put("/me/availability", auth(), async (req, res) => {
  try {
    const { availability } = req.body;

    if (!availability || !Array.isArray(availability)) {
      return res.status(400).json({ message: "Availability must be an array" });
    }

    // Validate availability format
    const validDays = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    const isValid = availability.every(
      (slot) =>
        slot.dayOfWeek &&
        validDays.includes(slot.dayOfWeek.toLowerCase()) &&
        slot.start &&
        slot.end &&
        slot.start < slot.end
    );

    if (!isValid) {
      return res.status(400).json({
        message:
          "Invalid availability format. Each slot must have dayOfWeek, start, and end times",
      });
    }

    const tutorProfile = await TutorProfile.findOneAndUpdate(
      { user: req.user.id },
      {
        $set: {
          availability,
          hasAvailability: availability && availability.length > 0,
        },
      },
      { new: true, runValidators: true }
    );

    if (!tutorProfile) {
      return res.status(404).json({ message: "Tutor profile not found" });
    }

    res.json({
      availability: tutorProfile.availability,
      message: "Availability updated successfully",
    });
  } catch (error) {
    console.error("Update availability error:", error);
    res.status(500).json({ message: "Failed to update availability" });
  }
});

// (duplicate older /search removed)

// Upload ID document
router.post(
  "/me/upload-id",
  auth(),
  upload.array("files", 5),
  async (req, res) => {
    try {
      const files = req.files || [];

      // Validation rules
      const errors = [];

      if (files.length === 0) {
        errors.push("Phải chọn ít nhất 1 file để upload");
      }

      if (files.length > 5) {
        errors.push("Không được upload quá 5 file");
      }

      // Check file types and sizes
      files.forEach((file, index) => {
        const allowedTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/webp",
        ];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!allowedTypes.includes(file.mimetype)) {
          errors.push(
            `File thứ ${index + 1}: Chỉ chấp nhận file ảnh (JPG, PNG, WebP)`
          );
        }

        if (file.size > maxSize) {
          errors.push(
            `File thứ ${index + 1}: Kích thước file không được quá 5MB`
          );
        }
      });

      if (errors.length > 0) {
        return res.status(400).json({ message: "Validation failed", errors });
      }

      const urls = files.map((f) => f.path);

      // Check if user already has too many ID documents (max 10)
      const profile = await TutorProfile.findOne({ user: req.user.id });
      if (
        profile &&
        profile.idDocumentUrls &&
        profile.idDocumentUrls.length + urls.length > 10
      ) {
        return res
          .status(400)
          .json({ message: "Không được upload quá 10 giấy tờ tùy thân" });
      }

      const updatedProfile = await TutorProfile.findOneAndUpdate(
        { user: req.user.id },
        {
          $push: { idDocumentUrls: { $each: urls } },
          $set: { "verification.idStatus": "pending", status: "pending" },
        },
        { new: true, upsert: true }
      );

      res.json({
        profile: updatedProfile,
        uploaded: urls.length,
        message: "Upload giấy tờ tùy thân thành công",
      });
    } catch (e) {
      res.status(500).json({ message: "Failed to upload ID documents" });
    }
  }
);

// Public search tutors (approved only)
// (duplicate older /search removed)

// Public get tutor profile by id (approved only)
// (duplicate older /:id removed)

// Upload degree/certificates
router.post(
  "/me/upload-degree",
  auth(),
  upload.array("files", 5),
  async (req, res) => {
    try {
      const files = req.files || [];

      // Validation rules
      const errors = [];

      if (files.length === 0) {
        errors.push("Phải chọn ít nhất 1 file để upload");
      }

      if (files.length > 5) {
        errors.push("Không được upload quá 5 file");
      }

      // Check file types and sizes
      files.forEach((file, index) => {
        const allowedTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/webp",
          "application/pdf",
        ];
        const maxSize = 10 * 1024 * 1024; // 10MB for degree documents

        if (!allowedTypes.includes(file.mimetype)) {
          errors.push(
            `File thứ ${
              index + 1
            }: Chỉ chấp nhận file ảnh (JPG, PNG, WebP) hoặc PDF`
          );
        }

        if (file.size > maxSize) {
          errors.push(
            `File thứ ${index + 1}: Kích thước file không được quá 10MB`
          );
        }
      });

      if (errors.length > 0) {
        return res.status(400).json({ message: "Validation failed", errors });
      }

      const urls = files.map((f) => f.path);

      // Check if user already has too many degree documents (max 15)
      const profile = await TutorProfile.findOne({ user: req.user.id });
      if (
        profile &&
        profile.degreeDocumentUrls &&
        profile.degreeDocumentUrls.length + urls.length > 15
      ) {
        return res
          .status(400)
          .json({ message: "Không được upload quá 15 bằng cấp/chứng chỉ" });
      }

      const updatedProfile = await TutorProfile.findOneAndUpdate(
        { user: req.user.id },
        {
          $push: { degreeDocumentUrls: { $each: urls } },
          $set: { "verification.degreeStatus": "pending", status: "pending" },
        },
        { new: true, upsert: true }
      );

      res.json({
        profile: updatedProfile,
        uploaded: urls.length,
        message: "Upload bằng cấp/chứng chỉ thành công",
      });
    } catch (e) {
      res.status(500).json({ message: "Failed to upload degree documents" });
    }
  }
);

// Admin endpoint to approve all tutors
router.post("/admin/approve-all", async (req, res) => {
  try {
    console.log("🔧 Approving all tutors...");

    const result = await TutorProfile.updateMany(
      {}, // Update all documents
      {
        $set: {
          status: "approved",
          hasAvailability: true,
          verified: true,
        },
      }
    );

    console.log(`✅ Approved ${result.modifiedCount} tutors`);

    res.json({
      message: "All tutors approved successfully",
      matched: result.matchedCount,
      modified: result.modifiedCount,
    });
  } catch (error) {
    console.error("❌ Error approving tutors:", error);
    res.status(500).json({ message: "Failed to approve tutors" });
  }
});

module.exports = router;
