const router = require("express").Router();
const { auth } = require("../middlewares/auth");
const Booking = require("../models/Booking");
const TutorProfile = require("../models/TutorProfile");
const TeachingSession = require("../models/TeachingSession");
const TeachingSlot = require("../models/TeachingSlot");

// Student creates booking request
router.post("/", auth(), async (req, res) => {
  try {
    const { tutorProfileId, start, end, mode, price, notes } = req.body;
    
    // Validation rules
    const errors = [];
    
    // Required fields validation
    if (!tutorProfileId) errors.push("Thiếu thông tin gia sư");
    if (!start) errors.push("Thiếu thời gian bắt đầu");
    if (!end) errors.push("Thiếu thời gian kết thúc");
    if (!mode) errors.push("Thiếu hình thức dạy học");
    
    if (errors.length > 0) {
      return res.status(400).json({ message: "Validation failed", errors });
    }
    
    // Check if tutor exists and is approved
    const tutor = await TutorProfile.findById(tutorProfileId);
    if (!tutor) {
      return res.status(404).json({ message: 'Gia sư không tồn tại' });
    }
    
    if (tutor.status !== 'approved') {
      return res.status(400).json({ message: 'Gia sư chưa được duyệt' });
    }
    
    // Check if student is trying to book their own profile
    if (String(tutor.user) === String(req.user.id)) {
      return res.status(400).json({ message: 'Không thể đặt lịch với chính mình' });
    }
    
    // Time validation
    const startTime = new Date(start);
    const endTime = new Date(end);
    const now = new Date();
    
    // Check if booking is in the future
    if (startTime <= now) {
      errors.push("Thời gian đặt lịch phải trong tương lai");
    }
    
    // Check if booking is not too far in the future (max 3 months)
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    if (startTime > threeMonthsFromNow) {
      errors.push("Không thể đặt lịch quá 3 tháng trước");
    }
    
    // Check if start time is before end time
    if (startTime >= endTime) {
      errors.push("Thời gian bắt đầu phải trước thời gian kết thúc");
    }
    
    // Check if duration is at least 1 hour
    const duration = (endTime - startTime) / (1000 * 60 * 60);
    if (duration < 1) {
      errors.push("Mỗi buổi học phải ít nhất 1 giờ");
    }
    
    // Check if duration is not more than 8 hours
    if (duration > 8) {
      errors.push("Mỗi buổi học không được quá 8 giờ");
    }
    
    // Check if mode is valid
    if (!['online', 'offline'].includes(mode)) {
      errors.push("Hình thức dạy học không hợp lệ");
    }
    
    // Check if tutor supports the requested mode
    if (!tutor.teachModes.includes(mode)) {
      errors.push(`Gia sư không hỗ trợ hình thức dạy ${mode === 'online' ? 'trực tuyến' : 'tại nhà'}`);
    }
    
    // Check if booking time conflicts with tutor's availability
    const dayOfWeek = startTime.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const startHour = startTime.toTimeString().slice(0, 5);
    const endHour = endTime.toTimeString().slice(0, 5);
    
    const isAvailable = tutor.availability.some(slot => 
      slot.dayOfWeek === dayOfWeek &&
      slot.start <= startHour &&
      slot.end >= endHour
    );
    
    if (!isAvailable) {
      errors.push("Gia sư không rảnh trong khung giờ này");
    }
    
    // Check for existing bookings at the same time
    const existingBooking = await Booking.findOne({
      tutorProfile: tutorProfileId,
      start: { $lt: endTime },
      end: { $gt: startTime },
      status: { $in: ['pending', 'accepted'] }
    });
    
    if (existingBooking) {
      errors.push("Khung giờ này đã được đặt bởi học viên khác");
    }
    
    // Check if student has too many pending bookings (max 5)
    const pendingBookings = await Booking.countDocuments({
      student: req.user.id,
      status: 'pending'
    });
    
    if (pendingBookings >= 5) {
      errors.push("Bạn đã có quá nhiều yêu cầu đang chờ xử lý (tối đa 5)");
    }
    
    // Price validation
    if (price && (price < 50000 || price > 5000000)) {
      errors.push("Giá buổi học phải từ 50,000 VNĐ đến 5,000,000 VNĐ");
    }
    
    // Notes validation
    if (notes && notes.length > 500) {
      errors.push("Ghi chú không được quá 500 ký tự");
    }
    
    if (errors.length > 0) {
      return res.status(400).json({ message: "Validation failed", errors });
    }
    
    // Create booking with tutor's session rate if price not provided
    const finalPrice = price || tutor.sessionRate;
    
    const booking = await Booking.create({ 
      tutorProfile: tutor._id, 
      student: req.user.id, 
      start: startTime, 
      end: endTime, 
      mode, 
      price: finalPrice, 
      notes 
    });
    
    res.status(201).json({ booking, message: "Đặt lịch thành công, chờ gia sư xác nhận" });
  } catch (e) {
    res.status(500).json({ message: "Failed to create booking" });
  }
});

// Tutor accepts/rejects
router.post("/:id/decision", auth(), async (req, res) => {
  try {
    const { decision } = req.body; // 'accept' or 'reject'
    
    // Validation rules
    const errors = [];
    
    if (!decision) {
      errors.push("Thiếu quyết định");
    }
    
    if (!['accept', 'reject'].includes(decision)) {
      errors.push("Quyết định không hợp lệ (chỉ chấp nhận hoặc từ chối)");
    }
    
    if (errors.length > 0) {
      return res.status(400).json({ message: "Validation failed", errors });
    }
    
    const booking = await Booking.findById(req.params.id).populate('tutorProfile');
    if (!booking) {
      return res.status(404).json({ message: 'Booking không tồn tại' });
    }
    
    // Check if user is the tutor
    if (String(booking.tutorProfile.user) !== req.user.id) {
      return res.status(403).json({ message: 'Bạn không có quyền thực hiện hành động này' });
    }
    
    // Check if booking is still pending
    if (booking.status !== 'pending') {
      return res.status(400).json({ message: `Booking đã được ${booking.status === 'accepted' ? 'chấp nhận' : 'từ chối'}` });
    }
    
    // Check if booking is not too close to start time (min 2 hours notice)
    const now = new Date();
    const timeDiff = (booking.start - now) / (1000 * 60 * 60); // hours
    
    if (timeDiff < 2) {
      return res.status(400).json({ message: 'Không thể thay đổi booking trong vòng 2 giờ trước giờ học' });
    }
    
    // Check if tutor has too many accepted bookings (max 20 per week)
    if (decision === 'accept') {
      const startOfWeek = new Date(booking.start);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 7);
      
      const weeklyBookings = await Booking.countDocuments({
        tutorProfile: booking.tutorProfile._id,
        start: { $gte: startOfWeek, $lt: endOfWeek },
        status: 'accepted'
      });
      
      if (weeklyBookings >= 20) {
        return res.status(400).json({ message: 'Bạn đã có quá nhiều buổi học trong tuần này (tối đa 20 buổi)' });
      }
    }
    
     // Update booking status
     if (decision === 'accept') {
       booking.status = 'accepted';
       
       // Create teaching session when booking is accepted
       const session = await TeachingSession.create({
         booking: booking._id,
         tutorProfile: booking.tutorProfile._id,
         student: booking.student,
         startTime: booking.start,
         endTime: booking.end,
         courseName: booking.notes || "Khóa học", // Default course name
         mode: booking.mode,
         location: booking.mode === 'offline' ? "Địa điểm sẽ được thông báo" : null,
         status: 'scheduled'
       });
       
       booking.sessionId = session._id;
     } else if (decision === 'reject') {
       booking.status = 'rejected';
     }
     
     await booking.save();
    
    const message = decision === 'accept' 
      ? 'Đã chấp nhận yêu cầu đặt lịch' 
      : 'Đã từ chối yêu cầu đặt lịch';
    
    res.json({ booking, message });
  } catch (e) {
    res.status(500).json({ message: "Failed to update booking" });
  }
});

// List my bookings (student or tutor)
router.get("/me", auth(), async (req, res) => {
  try {
    const role = req.query.role || 'student';
    const filter = role === 'tutor' ? { } : { student: req.user.id };
    if (role === 'tutor') {
      const tutors = await TutorProfile.find({ user: req.user.id }).select('_id');
      filter.tutorProfile = { $in: tutors.map(t => t._id) };
    }
    const items = await Booking.find(filter).sort({ created_at: -1 });
    res.json({ items });
  } catch (e) {
    res.status(500).json({ message: "Failed to load bookings" });
  }
});

// Get bookings by date range
router.get("/date-range", auth(), async (req, res) => {
  try {
    const { startDate, endDate, role = 'tutor' } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Start date and end date are required" });
    }

    const filter = {
      start: { $gte: new Date(startDate), $lte: new Date(endDate) }
    };

    if (role === 'tutor') {
      const tutors = await TutorProfile.find({ user: req.user.id }).select('_id');
      filter.tutorProfile = { $in: tutors.map(t => t._id) };
    } else {
      filter.student = req.user.id;
    }

    const items = await Booking.find(filter)
      .populate('student', 'full_name')
      .populate('tutorProfile', 'user')
      .sort({ start: 1 });
    
    res.json({ items });
  } catch (e) {
    res.status(500).json({ message: "Failed to load bookings by date range" });
  }
});

// Get booking statistics
router.get("/stats", auth(), async (req, res) => {
  try {
    const role = req.query.role || 'tutor';
    
    let filter = {};
    if (role === 'tutor') {
      const tutors = await TutorProfile.find({ user: req.user.id }).select('_id');
      filter.tutorProfile = { $in: tutors.map(t => t._id) };
    } else {
      filter.student = req.user.id;
    }

    const stats = {
      total: await Booking.countDocuments(filter),
      pending: await Booking.countDocuments({ ...filter, status: 'pending' }),
      accepted: await Booking.countDocuments({ ...filter, status: 'accepted' }),
      completed: await Booking.countDocuments({ ...filter, status: 'completed' }),
      cancelled: await Booking.countDocuments({ ...filter, status: 'cancelled' }),
      rejected: await Booking.countDocuments({ ...filter, status: 'rejected' })
    };

    // Calculate weekly stats
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const weeklyBookings = await Booking.countDocuments({
      ...filter,
      start: { $gte: startOfWeek }
    });

    stats.weekly = weeklyBookings;

    res.json({ stats });
  } catch (e) {
    res.status(500).json({ message: "Failed to load booking statistics" });
  }
});

// Tutor publishes an open teaching slot
router.post("/slots", auth(), async (req, res) => {
  try {
    const { start, end, mode, price, notes, capacity, courseName, courseCode, location, recurring } = req.body;

    // Basic validation
    const errors = [];
    const isRecurring = recurring && (recurring.type === 'weekly' || recurring.type === 'monthly') && Array.isArray(recurring.availability) && recurring.availability.length > 0;
    if (!courseName) errors.push("Thiếu tên khóa học");
    if (!isRecurring) {
      if (!start) errors.push("Thiếu thời gian bắt đầu");
      if (!end) errors.push("Thiếu thời gian kết thúc");
    }
    if (!mode || !['online','offline'].includes(mode)) errors.push("Hình thức dạy học không hợp lệ");
    if (price && (price < 50000 || price > 5000000)) errors.push("Giá buổi học phải từ 50,000 đến 5,000,000");
    if (mode === 'offline' && !location) errors.push("Thiếu địa điểm dạy (offline)");

    let startTime = start ? new Date(start) : null;
    let endTime = end ? new Date(end) : null;
    if (!isRecurring) {
      if (!(startTime < endTime)) errors.push("Thời gian bắt đầu phải trước thời gian kết thúc");
    }

    if (errors.length) return res.status(400).json({ message: "Validation failed", errors });

    // ensure tutor profile exists
    const tutor = await TutorProfile.findOne({ user: req.user.id });
    if (!tutor) return res.status(400).json({ message: "Tutor profile không tồn tại" });

    // Helpers for conflict checks
    const hasConflict = async (s, e) => {
      const bookingConflict = await Booking.findOne({
        tutorProfile: tutor._id,
        start: { $lt: e },
        end: { $gt: s },
        status: { $in: ['pending','accepted'] }
      });
      if (bookingConflict) return 'Khung giờ này đã có booking';
      const slotConflict = await TeachingSlot.findOne({
        tutorProfile: tutor._id,
        start: { $lt: e },
        end: { $gt: s },
        status: 'open'
      });
      if (slotConflict) return 'Khung giờ này đã có slot mở';
      return null;
    };

    // Single or recurring creation
    const created = [];
    const createOne = async (s, e) => {
      const slot = await TeachingSlot.create({
        tutorProfile: tutor._id,
        start: s,
        end: e,
        mode,
        price: price || tutor.sessionRate || 0,
        notes: notes || null,
        capacity: Math.max(1, Math.min(20, capacity || 1)),
        courseName,
        courseCode: courseCode || null,
        location: location || null
      });
      created.push(slot);
    };

    if (isRecurring) {
      // Generate dates from availability grid
      const duration = Math.min(52, Number(recurring.duration) || 4);
      const now = new Date();
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday
      startOfWeek.setHours(0,0,0,0);

      for (let w = 0; w < duration; w++) {
        const weekStart = new Date(startOfWeek);
        weekStart.setDate(weekStart.getDate() + w * 7);

        for (const slot of recurring.availability) {
          const dayIdx = Number(slot.dayOfWeek); // 0..6 (Sun..Sat)
          const dayDate = new Date(weekStart);
          dayDate.setDate(dayDate.getDate() + ((dayIdx - dayDate.getDay() + 7) % 7));
          const [sh, sm] = String(slot.start || '08:00').split(':').map(Number);
          const [eh, em] = String(slot.end || '10:00').split(':').map(Number);
          const s = new Date(dayDate); s.setHours(sh || 0, sm || 0, 0, 0);
          const e = new Date(dayDate); e.setHours(eh || 0, em || 0, 0, 0);
          if (!(s < e)) continue; // skip invalid
          if (s <= now) continue; // don't create in the past
          const conflict = await hasConflict(s, e);
          if (conflict) continue;
          await createOne(s, e);
        }
      }
      if (!created.length) return res.status(400).json({ message: 'Không tạo được slot nào từ thời khóa biểu (có thể do trùng hoặc quá khứ)' });
    } else {
      // Single slot path
      const conflict = await hasConflict(startTime, endTime);
      if (conflict) return res.status(400).json({ message: conflict });
      await createOne(startTime, endTime);
    }

    res.status(201).json({ items: created, message: "Đã tạo lịch dạy mở" });
  } catch (e) {
    console.error("Create teaching slot error:", e);
    res.status(500).json({ message: "Failed to create teaching slot" });
  }
});

// List tutor's open teaching slots
router.get("/slots/me", auth(), async (req, res) => {
  try {
    const tutor = await TutorProfile.findOne({ user: req.user.id }).select('_id');
    if (!tutor) return res.json({ items: [] });
    const items = await TeachingSlot.find({ tutorProfile: tutor._id }).sort({ start: 1 });
    res.json({ items });
  } catch (e) {
    console.error("Get teaching slots error:", e);
    res.status(500).json({ message: "Failed to load teaching slots" });
  }
});

// Public: list open teaching slots (optionally filter by tutor)
router.get("/slots/public", async (req, res) => {
  try {
    const { tutorId } = req.query;
    const now = new Date();
    const filter = { status: 'open', start: { $gte: now } };
    if (tutorId) filter.tutorProfile = tutorId;
    const items = await TeachingSlot.find(filter)
      .populate({ 
        path: 'tutorProfile', 
        select: 'user avatarUrl', 
        populate: { path: 'user', select: 'full_name image' } 
      })
      .sort({ start: 1 })
      .limit(500);
    res.json({ items });
  } catch (e) {
    console.error('List public slots error:', e);
    res.status(500).json({ message: 'Failed to load public slots' });
  }
});

// Public: get slot detail by id
router.get("/slots/:id", async (req, res) => {
  try {
    const slot = await TeachingSlot.findById(req.params.id)
      .populate({ path: 'tutorProfile', select: 'user', populate: { path: 'user', select: 'full_name avatar' } });
    if (!slot) return res.status(404).json({ message: 'Slot not found' });
    res.json({ slot });
  } catch (e) {
    res.status(500).json({ message: 'Failed to load slot' });
  }
});

// Delete a teaching slot (only if open and owned by tutor)
router.delete("/slots/:id", auth(), async (req, res) => {
  try {
    const tutor = await TutorProfile.findOne({ user: req.user.id }).select('_id');
    if (!tutor) return res.status(404).json({ message: "Tutor profile not found" });

    const slot = await TeachingSlot.findById(req.params.id);
    if (!slot) return res.status(404).json({ message: "Slot không tồn tại" });
    if (String(slot.tutorProfile) !== String(tutor._id)) {
      return res.status(403).json({ message: "Bạn không có quyền xóa slot này" });
    }
    if (slot.status !== 'open') {
      return res.status(400).json({ message: "Chỉ xóa được slot đang mở" });
    }

    await slot.deleteOne();
    res.json({ message: "Đã xóa slot" });
  } catch (e) {
    res.status(500).json({ message: "Failed to delete teaching slot" });
  }
});

// Get teaching sessions for today (for student/tutor to join)
router.get("/sessions/today", auth(), async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    let filter = {
      startTime: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['scheduled', 'ongoing'] }
    };

    // Filter by role
    const role = req.query.role || 'student';
    if (role === 'tutor') {
      const tutors = await TutorProfile.find({ user: req.user.id }).select('_id');
      filter.tutorProfile = { $in: tutors.map(t => t._id) };
    } else {
      filter.student = req.user.id;
    }

    const sessions = await TeachingSession.find(filter)
      .populate('student', 'full_name')
      .populate('tutorProfile', 'user')
      .sort({ startTime: 1 });

    res.json({ sessions });
  } catch (e) {
    res.status(500).json({ message: "Failed to load today's sessions" });
  }
});

// Join session (update attendance)
router.post("/sessions/:id/join", auth(), async (req, res) => {
  try {
    const session = await TeachingSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Check if user is student or tutor
    const role = req.query.role || 'student';
    const isStudent = role === 'student' && String(session.student) === String(req.user.id);
    const tutors = await TutorProfile.find({ user: req.user.id }).select('_id');
    const isTutor = role === 'tutor' && tutors.some(t => String(t._id) === String(session.tutorProfile));

    if (!isStudent && !isTutor) {
      return res.status(403).json({ message: "You don't have permission to join this session" });
    }

    // Update attendance
    const now = new Date();
    if (isStudent) {
      session.attendance.studentJoined = true;
      session.attendance.joinTimes.student = now;
    } else {
      session.attendance.tutorJoined = true;
      session.attendance.joinTimes.tutor = now;
    }

    // If both joined, mark as ongoing
    if (session.attendance.studentJoined && session.attendance.tutorJoined) {
      session.status = 'ongoing';
    }

    await session.save();
    res.json({ session, message: "Joined session successfully" });
  } catch (e) {
    res.status(500).json({ message: "Failed to join session" });
  }
});

// Complete session
router.post("/sessions/:id/complete", auth(), async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    
    const session = await TeachingSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Check if user is tutor
    const tutors = await TutorProfile.find({ user: req.user.id }).select('_id');
    const isTutor = tutors.some(t => String(t._id) === String(session.tutorProfile));

    if (!isTutor) {
      return res.status(403).json({ message: "Only tutor can complete session" });
    }

    session.status = 'completed';
    if (rating) session.rating = rating;
    if (feedback) session.feedback = feedback;

    await session.save();
    res.json({ session, message: "Session completed successfully" });
  } catch (e) {
    res.status(500).json({ message: "Failed to complete session" });
  }
});

module.exports = router;


