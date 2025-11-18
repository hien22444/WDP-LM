const router = require("express").Router();
const { auth } = require("../middlewares/auth");
const Booking = require("../models/Booking");
const TutorProfile = require("../models/TutorProfile");
const TeachingSession = require("../models/TeachingSession");
const TeachingSlot = require("../models/TeachingSlot");
const SessionGeneratorService = require("../services/SessionGeneratorService");
const {
  notifyTutorBookingCreated,
  notifyStudentBookingDecision,
  notifyStudentPaymentSuccess,
  notifyTutorPaymentSuccess,
  notifyStudentPaymentHeld,
  notifyTutorPaymentReleased,
  notifyStudentRefund,
  notifyAdminDispute,
} = require("../services/NotificationService");
const {
  generateRoomId,
  generateRoomToken,
} = require("../services/WebRTCService");

/**
 * =====================================================
 * BOOKING SYSTEM FLOW (Updated Architecture)
 * =====================================================
 * 
 * 1. TUTOR SETUP:
 *    - Tutor creates AVAILABILITY PATTERN (not teaching slots)
 *    - Example: "T2, T4, T6 buổi sáng 8:00-11:30"
 *    - Stored in TutorProfile.availability[]
 *    - No documents created in database
 * 
 * 2. STUDENT BOOKING:
 *    - Student views tutor's availability pattern
 *    - Selects specific slots (e.g., "T2+T4 sáng, 4 tuần")
 *    - POST /recurring → Creates ONE booking with recurrencePattern
 *    - Payment link generated via PayOS
 *    - Status: "pending", paymentStatus: "none"
 * 
 * 3. PAYMENT:
 *    - Student pays via PayOS
 *    - Webhook updates paymentStatus = "paid"
 *    - Tutor receives notification
 * 
 * 4. TUTOR ACCEPTS:
 *    - POST /:id/decision → Tutor accepts/rejects
 *    - If accept: SessionGeneratorService creates TEACHING SESSIONS
 *    - Smart logic: ≤2 weeks = all sessions, >2 weeks = first 2 weeks
 *    - Teaching sessions = actual calendar events with date/time
 * 
 * 5. CALENDAR VIEW:
 *    - GET /sessions/calendar → Returns teaching sessions
 *    - Both tutor and student see calendar with scheduled sessions
 *    - Like the images provided: weekly view with specific slots
 * 
 * 6. CRON JOB:
 *    - Daily job generates upcoming sessions for long-term bookings
 *    - Creates sessions 2 weeks ahead
 * 
 * KEY CONCEPTS:
 *    - Availability = Pattern (general schedule)
 *    - Booking = Booking request with recurrence pattern
 *    - Teaching Session = Actual scheduled class (calendar event)
 *    - Teaching Slot = DEPRECATED (no longer used)
 * =====================================================
 */

/**
 * GET /api/bookings/tutors/:tutorId/available-slots
 * Generate available slots on-demand from tutor's availability pattern
 */
router.get("/tutors/:tutorId/available-slots", async (req, res) => {
  try {
    const { tutorId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        message: "startDate and endDate are required" 
      });
    }

    // Get tutor profile with availability
    const tutor = await TutorProfile.findById(tutorId);
    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }

    if (!tutor.availability || tutor.availability.length === 0) {
      return res.json({ slots: [] });
    }

    // Get existing bookings in the date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Only check conflicts with PAID bookings or accepted bookings
    // Ignore pending bookings that haven't been paid yet
    const existingBookings = await Booking.find({
      tutorProfile: tutorId,
      $and: [
        // Must be paid OR already accepted
        {
          $or: [
            { paymentStatus: "paid" },
            { status: { $in: ["accepted", "in_progress"] } }
          ]
        },
        // Must match date range
        {
          $or: [
            // Single bookings
            {
              type: "single",
              start: { $lte: end },
              end: { $gte: start }
            },
            // Recurring bookings
            {
              type: "recurring",
              "recurrencePattern.startDate": { $lte: end },
              "recurrencePattern.endDate": { $gte: start }
            }
          ]
        }
      ]
    });

    // Generate available slots
    const slots = generateAvailableSlots(
      tutor.availability,
      start,
      end,
      existingBookings
    );

    res.json({ 
      slots,
      total: slots.length,
      tutor: {
        id: tutor._id,
        availability: tutor.availability
      }
    });

  } catch (error) {
    console.error("Error generating available slots:", error);
    res.status(500).json({ message: "Failed to generate available slots" });
  }
});

/**
 * Helper function to generate available slots from availability pattern
 */
function generateAvailableSlots(availability, startDate, endDate, existingBookings) {
  const slots = [];
  let currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);
  
  const endDateTime = new Date(endDate);
  endDateTime.setHours(23, 59, 59, 999);
  
  while (currentDate <= endDateTime) {
    const dayOfWeek = currentDate.getDay();
    
    // Find availability for this day
    const dayAvailability = availability.filter(a => a.dayOfWeek === dayOfWeek);
    
    dayAvailability.forEach(avail => {
      const slotStart = new Date(currentDate);
      const [startHour, startMin] = avail.start.split(':');
      slotStart.setHours(parseInt(startHour), parseInt(startMin), 0, 0);
      
      const slotEnd = new Date(currentDate);
      const [endHour, endMin] = avail.end.split(':');
      slotEnd.setHours(parseInt(endHour), parseInt(endMin), 0, 0);
      
      // Check for conflicts with existing bookings
      const hasConflict = existingBookings.some(booking => {
        if (booking.type === "single") {
          return slotStart < booking.end && slotEnd > booking.start;
        } else if (booking.type === "recurring") {
          // Check if this date/time conflicts with recurring pattern
          const bookingDate = new Date(booking.recurrencePattern.startDate);
          const bookingEnd = new Date(booking.recurrencePattern.endDate);
          
          if (slotStart >= bookingDate && slotStart <= bookingEnd) {
            const slotDayOfWeek = slotStart.getDay();
            return booking.recurrencePattern.selectedSlots.some(slot => {
              if (slot.dayOfWeek !== slotDayOfWeek) return false;
              
              const [slotStartH, slotStartM] = slot.start.split(':');
              const [slotEndH, slotEndM] = slot.end.split(':');
              
              const bookingSlotStart = new Date(slotStart);
              bookingSlotStart.setHours(parseInt(slotStartH), parseInt(slotStartM));
              
              const bookingSlotEnd = new Date(slotStart);
              bookingSlotEnd.setHours(parseInt(slotEndH), parseInt(slotEndM));
              
              return slotStart < bookingSlotEnd && slotEnd > bookingSlotStart;
            });
          }
          return false;
        }
        return false;
      });
      
      slots.push({
        date: new Date(currentDate),
        dayOfWeek,
        start: avail.start,
        end: avail.end,
        startDateTime: slotStart,
        endDateTime: slotEnd,
        available: !hasConflict,
        session: avail.start < '12:00' ? 'morning' : 'afternoon'
      });
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return slots;
}

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
      return res.status(404).json({ message: "Gia sư không tồn tại" });
    }

    if (tutor.status !== "approved") {
      return res.status(400).json({ message: "Gia sư chưa được duyệt" });
    }

    // Check if student is trying to book their own profile
    if (String(tutor.user) === String(req.user.id)) {
      return res
        .status(400)
        .json({ message: "Không thể đặt lịch với chính mình" });
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

    // Check if duration is at least 2 hours
    const duration = (endTime - startTime) / (1000 * 60 * 60);
    if (duration < 2) {
      errors.push("Mỗi buổi học phải ít nhất 2 giờ");
    }

    // Check if duration is not more than 8 hours
    if (duration > 8) {
      errors.push("Mỗi buổi học không được quá 8 giờ");
    }

    // Check if mode is valid
    if (!["online", "offline"].includes(mode)) {
      errors.push("Hình thức dạy học không hợp lệ");
    }

    // Check if tutor supports the requested mode
    if (!tutor.teachModes.includes(mode)) {
      errors.push(
        `Gia sư không hỗ trợ hình thức dạy ${
          mode === "online" ? "trực tuyến" : "tại nhà"
        }`
      );
    }

    // Check if booking time conflicts with tutor's availability
    const dayOfWeek = startTime
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();
    const startHour = startTime.toTimeString().slice(0, 5);
    const endHour = endTime.toTimeString().slice(0, 5);

    const isAvailable = tutor.availability.some(
      (slot) =>
        slot.dayOfWeek === dayOfWeek &&
        slot.start <= startHour &&
        slot.end >= endHour
    );

    if (!isAvailable) {
      errors.push("Gia sư không rảnh trong khung giờ này");
    }

    // Check for existing bookings at the same time (including completed ones)
    const existingBooking = await Booking.findOne({
      tutorProfile: tutorProfileId,
      start: { $lt: endTime },
      end: { $gt: startTime },
      status: { $in: ["pending", "accepted", "completed"] },
    });

    if (existingBooking) {
      errors.push("Khung giờ này đã được đặt bởi học viên khác");
    }

    // Check for existing teaching slots at the same time
    const existingSlot = await TeachingSlot.findOne({
      tutorProfile: tutorProfileId,
      start: { $lt: endTime },
      end: { $gt: startTime },
      status: "open",
    });

    if (existingSlot) {
      errors.push("Khung giờ này đã có slot dạy mở, vui lòng đặt từ slot đó");
    }

    // Check if student has too many pending bookings (max 5)
    const pendingBookings = await Booking.countDocuments({
      student: req.user.id,
      status: "pending",
    });

    if (pendingBookings >= 5) {
      errors.push("Bạn đã có quá nhiều yêu cầu đang chờ xử lý (tối đa 5)");
    }

    // Price validation (unified with teaching slot)
    if (price && (price < 2000 || price > 5000000)) {
      errors.push("Giá buổi học phải từ 2,000 VNĐ đến 5,000,000 VNĐ");
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

    // Create booking directly (no escrow)
    const booking = await Booking.create({
      tutorProfile: tutor._id,
      student: req.user.id,
      start: startTime,
      end: endTime,
      mode,
      subject: req.body.subject || null,
      price: finalPrice,
      notes,
      status: "pending",
      paymentStatus: "none", // Sẽ được cập nhật khi thanh toán
    });

    // Send notification email to tutor
    try {
      const notificationResult = await notifyTutorBookingCreated(booking);
      console.log("📧 Booking notification sent:", notificationResult);
    } catch (notificationError) {
      console.error(
        "❌ Failed to send booking notification:",
        notificationError
      );
      // Don't fail the booking creation if notification fails
    }

    res
      .status(201)
      .json({ booking, message: "Đặt lịch thành công, chờ gia sư xác nhận" });
  } catch (e) {
    res.status(500).json({ message: "Failed to create booking" });
  }
});

// Student creates recurring booking request (multiple weeks)
router.post("/recurring", auth(), async (req, res) => {
  try {
    const { 
      tutorProfileId, 
      startDate,  // Ngày bắt đầu (YYYY-MM-DD)
      selectedSlots, // Array of {dayOfWeek, start, end}
      numberOfWeeks, 
      mode, 
      pricePerSession, 
      notes 
    } = req.body;

    console.log('📅 [Recurring Booking] Request received:', {
      tutorProfileId,
      startDate,
      selectedSlots,
      numberOfWeeks,
      mode,
      pricePerSession,
      userId: req.user.id
    });

    const errors = [];

    // Required fields validation
    if (!tutorProfileId) errors.push("Thiếu thông tin gia sư");
    if (!startDate) errors.push("Thiếu ngày bắt đầu");
    if (!selectedSlots || selectedSlots.length === 0) errors.push("Chưa chọn buổi học");
    if (!numberOfWeeks || numberOfWeeks < 1) errors.push("Số tuần học không hợp lệ");
    if (!mode) errors.push("Thiếu hình thức dạy học");

    if (errors.length > 0) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    // Check if tutor exists and is approved
    const tutor = await TutorProfile.findById(tutorProfileId).populate('user', 'full_name email');
    if (!tutor) {
      return res.status(404).json({ message: "Gia sư không tồn tại" });
    }

    if (tutor.status !== "approved") {
      return res.status(400).json({ message: "Gia sư chưa được duyệt" });
    }

    // Check if student is trying to book their own profile
    if (String(tutor.user._id) === String(req.user.id)) {
      return res.status(400).json({ message: "Không thể đặt lịch với chính mình" });
    }

    // Check if tutor supports the requested mode
    if (!tutor.teachModes.includes(mode)) {
      errors.push(`Gia sư không hỗ trợ hình thức dạy ${mode === "online" ? "trực tuyến" : "tại nhà"}`);
    }

    // Validate start date is in the future (with timezone consideration)
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0); // Set to start of day
    
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Set to start of today
    
    if (start < now) {
      errors.push("Ngày bắt đầu phải từ hôm nay trở đi");
    }

    console.log('📅 [Recurring Booking] Date validation:', {
      startDate,
      start: start.toISOString(),
      now: now.toISOString(),
      isValid: start >= now
    });

    // Validate number of weeks (max 20)
    if (numberOfWeeks > 20) {
      errors.push("Số tuần học không được quá 20");
    }

    // Validate each slot
    selectedSlots.forEach((slot, index) => {
      const [startHour, startMin] = slot.start.split(':');
      const [endHour, endMin] = slot.end.split(':');
      
      const slotStart = parseInt(startHour) * 60 + parseInt(startMin);
      const slotEnd = parseInt(endHour) * 60 + parseInt(endMin);
      const durationMinutes = slotEnd - slotStart;
      const durationHours = durationMinutes / 60;
      
      if (durationHours < 2) {
        const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        errors.push(`Buổi học ${dayNames[slot.dayOfWeek]} - ${slot.start} phải ít nhất 2 giờ`);
      }
      if (durationHours > 8) {
        const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        errors.push(`Buổi học ${dayNames[slot.dayOfWeek]} - ${slot.start} không được quá 8 giờ`);
      }
    });

    if (errors.length > 0) {
      console.error('❌ [Recurring Booking] Validation errors:', errors);
      return res.status(400).json({ message: "Validation failed", errors });
    }

    // Calculate end date and total sessions
    const endDate = new Date(start);
    endDate.setDate(start.getDate() + (numberOfWeeks * 7) - 1);
    
    const totalSessions = selectedSlots.length * numberOfWeeks;
    const price = pricePerSession || tutor.sessionRate || 0;
    const totalPrice = totalSessions * price;

    console.log(`📊 [Recurring Booking] Calculated:`, {
      startDate: start.toISOString(),
      endDate: endDate.toISOString(),
      totalSessions,
      pricePerSession: price,
      totalPrice
    });

    // Check for conflicts with existing PAID OR ACCEPTED recurring bookings
    // Ignore pending unpaid bookings
    const conflicts = await Booking.find({
      tutorProfile: tutorProfileId,
      type: 'recurring',
      $and: [
        {
          $or: [
            { paymentStatus: "paid" },
            { status: { $in: ["accepted", "in_progress"] } }
          ]
        },
        {
          "recurrencePattern.startDate": { $lte: endDate },
          "recurrencePattern.endDate": { $gte: start }
        }
      ]
    });

    // Check if any conflicting booking has overlapping slots
    for (const conflict of conflicts) {
      const conflictSlots = conflict.recurrencePattern.selectedSlots;
      const hasOverlap = selectedSlots.some(slot => 
        conflictSlots.some(cSlot => {
          if (cSlot.dayOfWeek !== slot.dayOfWeek) return false;
          
          // Check time overlap
          const slot1Start = slot.start;
          const slot1End = slot.end;
          const slot2Start = cSlot.start;
          const slot2End = cSlot.end;
          
          return slot1Start < slot2End && slot1End > slot2Start;
        })
      );
      
      if (hasOverlap) {
        errors.push("Có xung đột với lịch học đã đặt trước");
        break;
      }
    }

    if (errors.length > 0) {
      console.error('❌ [Recurring Booking] Conflict errors:', errors);
      return res.status(400).json({ message: "Có xung đột lịch học", errors });
    }

    // Create ONE recurring booking
    const booking = await Booking.create({
      type: 'recurring',
      tutorProfile: tutor._id,
      student: req.user.id,
      recurrencePattern: {
        selectedSlots: selectedSlots.map(s => ({
          dayOfWeek: s.dayOfWeek,
          start: s.start,
          end: s.end
        })),
        startDate: start,
        endDate: endDate,
        numberOfWeeks
      },
      totalSessionsPlanned: totalSessions,
      mode,
      subject: req.body.subject || null,
      price,
      totalPrice,
      notes: notes || '',
      status: "pending", // Chờ thanh toán
      paymentStatus: "none"
    });

    console.log(`✅ [Recurring Booking] Created booking:`, booking._id);

    // Generate payment link using PayOS
    const PaymentService = require("../services/PaymentService");
    const paymentLink = await PaymentService.createRecurringBookingPayment({
      booking,
      tutorUser: tutor.user, // Pass user object, not tutor profile
      student: req.user
    });

    console.log(`💳 [Recurring Booking] Payment link generated:`, paymentLink);

    // Send notification to student about payment
    res.status(201).json({ 
      booking: {
        id: booking._id,
        type: booking.type,
        totalSessions,
        numberOfWeeks,
        startDate: start,
        endDate: endDate,
        pricePerSession: price,
        totalPrice,
        status: booking.status,
        paymentStatus: booking.paymentStatus
      },
      paymentLink,
      message: `Đã tạo lịch học ${totalSessions} buổi. Vui lòng thanh toán để gửi yêu cầu đến gia sư.`
    });
    
  } catch (e) {
    console.error("❌ [Recurring Booking] Error:", e);
    console.error("❌ [Recurring Booking] Stack trace:", e.stack);
    res.status(500).json({ 
      message: "Failed to create recurring booking",
      error: process.env.NODE_ENV === 'development' ? e.message : undefined
    });
  }
});

// Tutor accepts/rejects
router.post("/:id/decision", auth(), async (req, res) => {
  try {
    const { decision, tutorSignature } = req.body; // 'accept' or 'reject'

    // Validation rules
    const errors = [];

    if (!decision) {
      errors.push("Thiếu quyết định");
    }

    if (!["accept", "reject"].includes(decision)) {
      errors.push("Quyết định không hợp lệ (chỉ chấp nhận hoặc từ chối)");
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    const booking = await Booking.findById(req.params.id)
      .populate("tutorProfile")
      .populate("student", "full_name email");
    
    if (!booking) {
      return res.status(404).json({ message: "Booking không tồn tại" });
    }

    // Check if user is the tutor
    if (String(booking.tutorProfile.user) !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền thực hiện hành động này" });
    }

    // Check if booking is still pending
    if (booking.status !== "pending") {
      return res.status(400).json({
        message: `Booking đã được ${
          booking.status === "accepted" ? "chấp nhận" : "từ chối"
        }`,
      });
    }

    // Check if payment is completed for recurring bookings
    if (booking.type === "recurring" && booking.paymentStatus !== "paid") {
      return res.status(400).json({
        message: "Học sinh chưa thanh toán. Chỉ có thể chấp nhận sau khi thanh toán."
      });
    }

    // For single bookings, check time constraints
    if (booking.type === "single" && booking.start) {
      const now = new Date();
      const timeDiff = (booking.start - now) / (1000 * 60 * 60); // hours

      if (timeDiff < 2) {
        return res.status(400).json({
          message: "Không thể thay đổi booking trong vòng 2 giờ trước giờ học",
        });
      }
    }

    // Update booking status
    if (decision === "accept") {
      booking.status = "accepted";

      if (tutorSignature) {
        booking.tutorSignature = tutorSignature;
        booking.tutorSignedAt = new Date();
      }
      if (booking.studentSignature && booking.tutorSignature) {
        booking.contractSigned = true;
      }

      await booking.save();

      // Generate teaching sessions based on booking type
      if (booking.type === "single") {
        // Create ONE session for single booking
        const roomId = generateRoomId();
        booking.roomId = roomId;

        const session = await TeachingSession.create({
          booking: booking._id,
          tutor: booking.tutorProfile.user,
          student: booking.student._id,
          scheduledDate: booking.start,
          startTime: booking.start.toTimeString().substring(0, 5),
          endTime: booking.end.toTimeString().substring(0, 5),
          status: "scheduled",
          roomId: roomId
        });

        booking.sessionId = session._id;
        await booking.save();

        console.log(`✅ Created single session: ${session._id}`);

      } else if (booking.type === "recurring") {
        // Generate sessions using SessionGeneratorService
        console.log(`📅 Generating sessions for recurring booking ${booking._id}`);
        
        const sessions = await SessionGeneratorService.generateSessionsOnAccept(booking);
        
        console.log(`✅ Created ${sessions.length} sessions for recurring booking`);
        
        // Update booking status to in_progress
        booking.status = "in_progress";
        await booking.save();
      }

    } else if (decision === "reject") {
      booking.status = "rejected";
      await booking.save();
    }

    // Send notification email to student
    try {
      const notificationResult = await notifyStudentBookingDecision(
        booking,
        decision
      );
      console.log("📧 Booking decision notification sent:", notificationResult);
    } catch (notificationError) {
      console.error(
        "❌ Failed to send booking decision notification:",
        notificationError
      );
      // Don't fail the decision if notification fails
    }

    const message =
      decision === "accept"
        ? booking.type === "recurring" 
          ? `Đã chấp nhận yêu cầu đặt lịch. Đã tạo ${booking.upcomingSessions} buổi học.`
          : "Đã chấp nhận yêu cầu đặt lịch"
        : "Đã từ chối yêu cầu đặt lịch";

    res.json({ booking, message });
  } catch (e) {
    console.error("❌ Error in booking decision:", e);
    res.status(500).json({ message: "Failed to update booking", error: e.message });
  }
});

// Student attaches contract data and signature to a booking
router.post("/:id/contract", auth(), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Only the student of the booking can attach contract
    if (String(booking.student) !== String(req.user.id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { contractData, studentSignature } = req.body || {};
    if (contractData && typeof contractData === 'object') {
      booking.contractData = {
        ...booking.contractData,
        ...contractData,
      };
    }
    if (studentSignature) {
      booking.studentSignature = studentSignature;
      booking.studentSignedAt = new Date();
    }

    // Generate a contract number if absent
    if (!booking.contractNumber) {
      booking.contractNumber = `HD-${Date.now()}`;
    }

    await booking.save();
    res.json({ success: true, booking });
  } catch (error) {
    console.error('Attach contract error:', error);
    res.status(500).json({ message: 'Failed to attach contract' });
  }
});

// List my bookings (student or tutor)
router.get("/me", auth(), async (req, res) => {
  try {
    const role = req.query.role || "student";
    const filter = role === "tutor" ? {} : { student: req.user.id };
    if (role === "tutor") {
      const tutors = await TutorProfile.find({ user: req.user.id }).select(
        "_id"
      );
      filter.tutorProfile = { $in: tutors.map((t) => t._id) };
    }
    
    const items = await Booking.find(filter)
      .select('+contractData')
      .populate("student", "full_name email avatar phone")
      .populate({
        path: "tutorProfile",
        select: "user subject subjects bio rating totalReviews sessionRate",
        populate: {
          path: "user",
          select: "full_name email avatar phone"
        }
      })
      .sort({ created_at: -1 });
      
    res.json({ items });
  } catch (e) {
    console.error("Error loading bookings:", e);
    res.status(500).json({ message: "Failed to load bookings" });
  }
});

// Get bookings by date range
router.get("/date-range", auth(), async (req, res) => {
  try {
    const { startDate, endDate, role = "tutor" } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Start date and end date are required" });
    }

    const filter = {
      start: { $gte: new Date(startDate), $lte: new Date(endDate) },
    };

    if (role === "tutor") {
      const tutors = await TutorProfile.find({ user: req.user.id }).select(
        "_id"
      );
      filter.tutorProfile = { $in: tutors.map((t) => t._id) };
    } else {
      filter.student = req.user.id;
    }

    const items = await Booking.find(filter)
      .populate("student", "full_name")
      .populate("tutorProfile", "user")
      .sort({ start: 1 });

    res.json({ items });
  } catch (e) {
    res.status(500).json({ message: "Failed to load bookings by date range" });
  }
});

// Get booking statistics
router.get("/stats", auth(), async (req, res) => {
  try {
    const role = req.query.role || "tutor";

    let filter = {};
    if (role === "tutor") {
      const tutors = await TutorProfile.find({ user: req.user.id }).select(
        "_id"
      );
      filter.tutorProfile = { $in: tutors.map((t) => t._id) };
    } else {
      filter.student = req.user.id;
    }

    const stats = {
      total: await Booking.countDocuments(filter),
      pending: await Booking.countDocuments({ ...filter, status: "pending" }),
      accepted: await Booking.countDocuments({ ...filter, status: "accepted" }),
      completed: await Booking.countDocuments({
        ...filter,
        status: "completed",
      }),
      cancelled: await Booking.countDocuments({
        ...filter,
        status: "cancelled",
      }),
      rejected: await Booking.countDocuments({ ...filter, status: "rejected" }),
    };

    // Calculate weekly stats
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const weeklyBookings = await Booking.countDocuments({
      ...filter,
      start: { $gte: startOfWeek },
    });

    stats.weekly = weeklyBookings;

    res.json({ stats });
  } catch (e) {
    res.status(500).json({ message: "Failed to load booking statistics" });
  }
});

// DEPRECATED: Teaching slots are no longer used
// Tutors should only set availability patterns, not create teaching slots
// Students book directly from availability, creating teaching sessions
router.post("/slots", auth(), async (req, res) => {
  return res.status(410).json({ 
    message: "Teaching slots feature is deprecated. Please use availability patterns instead.",
    info: "Tutors: Update your availability in profile settings. Students: Book directly from tutor's availability."
  });
});

// DEPRECATED: List tutor's teaching sessions instead
router.get("/slots/me", auth(), async (req, res) => {
  try {
    const tutor = await TutorProfile.findOne({ user: req.user.id }).select("_id");
    if (!tutor) return res.json({ items: [] });
    
    // Return teaching sessions instead of teaching slots
    const TeachingSession = require("../models/TeachingSession");
    const items = await TeachingSession.find({ tutor: req.user.id })
      .populate("booking")
      .populate("student", "full_name email")
      .sort({ scheduledDate: 1 });
    
    res.json({ items });
  } catch (e) {
    console.error("Get teaching sessions error:", e);
    res.status(500).json({ message: "Failed to load teaching sessions" });
  }
});

// DEPRECATED: Use availability patterns instead
router.get("/slots/public", async (req, res) => {
  return res.status(410).json({ 
    message: "Teaching slots are deprecated. Use tutor availability patterns instead.",
    info: "Call GET /tutors/:id to see tutor's availability pattern and book directly."
  });
});

// DEPRECATED: Get tutor availability pattern instead
router.get("/teaching-slots/tutor/:tutorProfileId", async (req, res) => {
  try {
    const { tutorProfileId } = req.params;
    
    // Return tutor's availability pattern instead of teaching slots
    const tutor = await TutorProfile.findById(tutorProfileId)
      .select("availability hasAvailability")
      .populate("user", "full_name");
    
    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }
    
    return res.json({ 
      availability: tutor.availability || [],
      hasAvailability: tutor.hasAvailability || false,
      message: "Use availability pattern to book sessions"
    });
  } catch (e) {
    console.error("Get tutor availability error:", e);
    res.status(500).json({ message: "Failed to load tutor availability" });
  }
});

// LEGACY: Old teaching slots endpoint (kept for backward compatibility)
router.get("/teaching-slots/tutor/:tutorProfileId/legacy", async (req, res) => {
  try {
    const { tutorProfileId } = req.params;
    const slots = await TeachingSlot.find({ 
      tutorProfile: tutorProfileId,
      status: "open" 
    }).sort({ start: 1 });
    
    console.log(`📚 Fetched ${slots.length} slots for tutor profile: ${tutorProfileId}`);
    res.json(slots);
  } catch (e) {
    console.error("Get tutor slots error:", e);
    res.status(500).json({ message: "Failed to load tutor slots" });
  }
});

// Public: get slot detail by id
router.get("/slots/:id", async (req, res) => {
  try {
    const slot = await TeachingSlot.findById(req.params.id).populate({
      path: "tutorProfile",
      select: "user",
      populate: { path: "user", select: "full_name avatar" },
    });
    if (!slot) return res.status(404).json({ message: "Slot not found" });
    res.json({ slot });
  } catch (e) {
    res.status(500).json({ message: "Failed to load slot" });
  }
});

// Delete a teaching slot (only if open and owned by tutor)
router.delete("/slots/:id", auth(), async (req, res) => {
  try {
    const tutor = await TutorProfile.findOne({ user: req.user.id }).select(
      "_id"
    );
    if (!tutor)
      return res.status(404).json({ message: "Tutor profile not found" });

    const slot = await TeachingSlot.findById(req.params.id);
    if (!slot) return res.status(404).json({ message: "Slot không tồn tại" });
    if (String(slot.tutorProfile) !== String(tutor._id)) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xóa slot này" });
    }
    if (slot.status !== "open") {
      return res.status(400).json({ message: "Chỉ xóa được slot đang mở" });
    }

    await slot.deleteOne();
    res.json({ message: "Đã xóa slot" });
  } catch (e) {
    res.status(500).json({ message: "Failed to delete teaching slot" });
  }
});

// Get calendar/schedule for tutor or student (all teaching sessions)
router.get("/sessions/calendar", auth(), async (req, res) => {
  try {
    const { role = "student", startDate, endDate, week, month, year } = req.query;
    
    // Build date filter
    let dateFilter = {};
    
    if (startDate && endDate) {
      // Custom date range
      dateFilter.scheduledDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (week && year) {
      // Specific week
      const weekNum = parseInt(week);
      const yearNum = parseInt(year);
      const startOfYear = new Date(yearNum, 0, 1);
      const daysOffset = (weekNum - 1) * 7;
      const weekStart = new Date(startOfYear);
      weekStart.setDate(startOfYear.getDate() + daysOffset);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      
      dateFilter.scheduledDate = {
        $gte: weekStart,
        $lt: weekEnd
      };
    } else if (month && year) {
      // Specific month
      const monthNum = parseInt(month) - 1; // 0-indexed
      const yearNum = parseInt(year);
      const monthStart = new Date(yearNum, monthNum, 1);
      const monthEnd = new Date(yearNum, monthNum + 1, 0);
      
      dateFilter.scheduledDate = {
        $gte: monthStart,
        $lte: monthEnd
      };
    }
    
    let filter = {
      ...dateFilter,
      status: { $in: ["scheduled", "ongoing", "completed", "cancelled"] }
    };

    // Filter by role
    if (role === "tutor") {
      filter.tutor = req.user.id;
    } else {
      filter.student = req.user.id;
    }

    const sessions = await TeachingSession.find(filter)
      .populate("student", "full_name email avatar")
      .populate("tutor", "full_name email avatar")
      .populate("booking", "type mode notes")
      .sort({ scheduledDate: 1, startTime: 1 });

    // Group by date for calendar view
    const calendar = sessions.reduce((acc, session) => {
      const dateKey = session.scheduledDate.toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push({
        id: session._id,
        startTime: session.startTime,
        endTime: session.endTime,
        status: session.status,
        student: session.student,
        tutor: session.tutor,
        booking: session.booking,
        roomId: session.roomId
      });
      return acc;
    }, {});

    res.json({ 
      sessions,
      calendar,
      totalSessions: sessions.length,
      role
    });
  } catch (e) {
    console.error("Get calendar error:", e);
    res.status(500).json({ message: "Failed to load calendar" });
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
      status: { $in: ["scheduled", "ongoing"] },
    };

    // Filter by role
    const role = req.query.role || "student";
    if (role === "tutor") {
      const tutors = await TutorProfile.find({ user: req.user.id }).select(
        "_id"
      );
      filter.tutorProfile = { $in: tutors.map((t) => t._id) };
    } else {
      filter.student = req.user.id;
    }

    const sessions = await TeachingSession.find(filter)
      .populate("student", "full_name")
      .populate("tutorProfile", "user")
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
    const role = req.query.role || "student";
    const isStudent =
      role === "student" && String(session.student) === String(req.user.id);
    const tutors = await TutorProfile.find({ user: req.user.id }).select("_id");
    const isTutor =
      role === "tutor" &&
      tutors.some((t) => String(t._id) === String(session.tutorProfile));

    if (!isStudent && !isTutor) {
      return res
        .status(403)
        .json({ message: "You don't have permission to join this session" });
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
      session.status = "ongoing";
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
    const tutors = await TutorProfile.find({ user: req.user.id }).select("_id");
    const isTutor = tutors.some(
      (t) => String(t._id) === String(session.tutorProfile)
    );

    if (!isTutor) {
      return res
        .status(403)
        .json({ message: "Only tutor can complete session" });
    }

    session.status = "completed";
    if (rating) session.rating = rating;
    if (feedback) session.feedback = feedback;

    await session.save();
    res.json({ session, message: "Session completed successfully" });
  } catch (e) {
    res.status(500).json({ message: "Failed to complete session" });
  }
});

// Process payment success and send room code notifications
router.post("/:id/payment-success", auth(), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if user is the student who made the booking
    if (String(booking.student) !== String(req.user.id)) {
      return res
        .status(403)
        .json({
          message: "Not authorized to process payment for this booking",
        });
    }

    // Check if booking is accepted
    if (booking.status !== "accepted") {
      return res
        .status(400)
        .json({ message: "Booking must be accepted before payment" });
    }

    // Check if room already exists
    if (!booking.roomId) {
      // Generate room ID if not exists
      const roomId = generateRoomId();
      booking.roomId = roomId;
      await booking.save();

      // Update teaching session with room ID
      if (booking.sessionId) {
        await TeachingSession.findByIdAndUpdate(booking.sessionId, { roomId });
      }
    }

    // Send payment success notifications
    try {
      // Notify student
      const studentNotification = await notifyStudentPaymentSuccess(booking);
      console.log(
        "📧 Student payment success notification sent:",
        studentNotification
      );

      // Notify tutor
      const tutorNotification = await notifyTutorPaymentSuccess(booking);
      console.log(
        "📧 Tutor payment success notification sent:",
        tutorNotification
      );

      res.json({
        success: true,
        message: "Payment processed successfully and notifications sent",
        roomCode: booking.roomId,
        roomUrl: `${process.env.FRONTEND_URL}/room/${booking.roomId}`,
      });
    } catch (notificationError) {
      console.error(
        "❌ Failed to send payment notifications:",
        notificationError
      );
      // Still return success for payment processing
      res.json({
        success: true,
        message: "Payment processed successfully, but notifications failed",
        roomCode: booking.roomId,
        roomUrl: `${process.env.FRONTEND_URL}/room/${booking.roomId}`,
        warning: "Notifications may not have been sent",
      });
    }
  } catch (error) {
    console.error("Error processing payment success:", error);
    res.status(500).json({ message: "Failed to process payment success" });
  }
});

// Book from teaching slot
router.post("/slots/:slotId/book", auth(), async (req, res) => {
  try {
    const { notes } = req.body;

    // Get the teaching slot
    const slot = await TeachingSlot.findById(req.params.slotId);
    if (!slot) {
      return res.status(404).json({ message: "Không tìm thấy slot dạy học" });
    }

    if (slot.status !== "open") {
      return res.status(400).json({ message: "Slot không khả dụng để đặt" });
    }

    // Check if student is trying to book their own slot
    const tutor = await TutorProfile.findById(slot.tutorProfile);
    if (String(tutor.user) === String(req.user.id)) {
      return res
        .status(400)
        .json({ message: "Không thể đặt lịch với chính mình" });
    }

    // Check if slot is in the future
    const now = new Date();
    if (slot.start <= now) {
      return res
        .status(400)
        .json({ message: "Không thể đặt slot trong quá khứ" });
    }

    // Check if slot is not too far in the future (max 3 months)
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    if (slot.start > threeMonthsFromNow) {
      return res
        .status(400)
        .json({ message: "Không thể đặt slot quá 3 tháng trước" });
    }

    // Check if student has too many pending bookings (max 5)
    const pendingBookings = await Booking.countDocuments({
      student: req.user.id,
      status: "pending",
    });

    if (pendingBookings >= 5) {
      return res.status(400).json({
        message: "Bạn đã có quá nhiều yêu cầu đang chờ xử lý (tối đa 5)",
      });
    }

    // Create booking from slot
    const booking = await Booking.create({
      tutorProfile: slot.tutorProfile,
      student: req.user.id,
      start: slot.start,
      end: slot.end,
      mode: slot.mode,
      price: slot.price,
      notes: notes || `Đặt từ slot: ${slot.courseName}`,
      slotId: slot._id, // Reference to original slot
    });

    // Update slot status to booked
    slot.status = "booked";
    await slot.save();

    // Send notification email to tutor
    try {
      const notificationResult = await notifyTutorBookingCreated(booking);
      console.log("📧 Slot booking notification sent:", notificationResult);
    } catch (notificationError) {
      console.error(
        "❌ Failed to send slot booking notification:",
        notificationError
      );
      // Don't fail the booking creation if notification fails
    }

    res.status(201).json({
      booking,
      message: "Đặt lịch từ slot thành công, chờ gia sư xác nhận",
    });
  } catch (error) {
    console.error("Error booking from slot:", error);
    res.status(500).json({ message: "Failed to book from slot" });
  }
});

// Generate room token for joining WebRTC session
router.post("/:id/join-token", auth(), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if user is authorized to join this room
    const isStudent = String(booking.student) === String(req.user.id);
    const isTutor = String(booking.tutorProfile) === String(req.user.id);

    if (!isStudent && !isTutor) {
      return res
        .status(403)
        .json({ message: "Not authorized to join this room" });
    }

    // Check if booking is accepted
    if (booking.status !== "accepted") {
      return res
        .status(400)
        .json({ message: "Booking must be accepted to join room" });
    }

    // Check if room exists
    if (!booking.roomId) {
      return res.status(400).json({ message: "Room not created yet" });
    }

    // Check if session is still valid
    const now = new Date();
    if (now < booking.start || now > booking.end) {
      return res.status(400).json({
        message: "Session is not active",
        startTime: booking.start,
        endTime: booking.end,
      });
    }

    // Generate room token
    const role = isStudent ? "student" : "tutor";
    const duration = Math.ceil((booking.end - now) / (1000 * 60)); // Minutes remaining
    const token = generateRoomToken(
      booking.roomId,
      req.user.id,
      role,
      duration
    );

    res.json({
      token,
      roomId: booking.roomId,
      role,
      duration,
      startTime: booking.start,
      endTime: booking.end,
      roomUrl: `${process.env.FRONTEND_URL}/room/${booking.roomId}?token=${token}`,
    });
  } catch (error) {
    console.error("Error generating room token:", error);
    res.status(500).json({ message: "Failed to generate room token" });
  }
});

// Complete session and release payment
router.post("/:id/complete", auth(), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('tutorProfile', 'user')
      .populate('student', '_id');
      
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if user is the tutor
    const tutorUserId = booking.tutorProfile?.user?._id || booking.tutorProfile?.user;
    const isTutor = String(tutorUserId) === String(req.user.id);

    if (!isTutor) {
      return res.status(403).json({ message: "Only tutor can mark booking as completed" });
    }

    if (booking.status !== "accepted") {
      return res
        .status(400)
        .json({ message: "Booking must be accepted to complete" });
    }

    // Check if it's the end date or later
    let endDate;
    if (booking.type === 'recurring' && booking.recurrencePattern?.endDate) {
      endDate = new Date(booking.recurrencePattern.endDate);
    } else if (booking.end) {
      endDate = new Date(booking.end);
    }

    if (endDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      if (today < endDate) {
        return res.status(400).json({ 
          message: "Chỉ có thể hoàn thành từ ngày kết thúc lịch dạy trở đi" 
        });
      }
    }

    // Update booking status to completed
    booking.status = "completed";
    booking.completedAt = new Date();
    await booking.save();

    console.log(`✅ Booking ${booking._id} marked as completed by tutor`);

    res.json({
      success: true,
      message: "Đã hoàn thành khóa học",
      booking,
    });
  } catch (error) {
    console.error("Error completing booking:", error);
    res.status(500).json({ message: "Failed to complete booking" });
  }
});

// Cancel booking and process refund
router.post("/:id/cancel", auth(), async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if user is authorized (tutor or student)
    const isTutor = String(booking.tutorProfile) === String(req.user.id);
    const isStudent = String(booking.student) === String(req.user.id);

    if (!isTutor && !isStudent) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (!["pending", "accepted"].includes(booking.status)) {
      return res.status(400).json({ message: "Booking cannot be cancelled" });
    }

    // Update booking status (no refund processing needed - handled manually)
    booking.status = "cancelled";
    booking.cancellationReason = reason || "Hủy bởi người dùng";
    booking.cancelledBy = isTutor ? "tutor" : "student";
    booking.cancelledAt = new Date();
    await booking.save();

    // Send email notification to tutor if student cancelled
    if (isStudent) {
      try {
        await NotificationService.notifyTutorBookingCancelled(booking);
        console.log("✅ Notification sent to tutor about booking cancellation");
      } catch (emailError) {
        console.error("❌ Failed to send cancellation notification:", emailError);
        // Continue even if email fails
      }
    }

    res.json({
      success: true,
      message: "Booking cancelled successfully. Refund will be processed manually if payment was made.",
      booking,
    });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({ message: "Failed to cancel booking" });
  }
});

// ❌ DISPUTE & ESCROW STATS ROUTES REMOVED (No escrow system)

module.exports = router;
