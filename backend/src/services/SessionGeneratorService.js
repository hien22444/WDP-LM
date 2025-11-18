const Booking = require("../models/Booking");
const TeachingSession = require("../models/TeachingSession");
const { generateRoomId } = require("./WebRTCService");

class SessionGeneratorService {
  /**
   * Helper: Extract ID from object or use directly if string
   */
  extractId(field) {
    if (!field) return null;
    return field._id ? field._id.toString() : field.toString();
  }

  /**
   * Generate teaching sessions for a booking within a date range
   * @param {Object} booking - The booking document
   * @param {Date} startDate - Start date for session generation
   * @param {Date} endDate - End date for session generation
   * @returns {Array} Created sessions
   */
  async generateSessionsForBooking(booking, startDate, endDate) {
    if (booking.type !== "recurring") {
      throw new Error("This method is only for recurring bookings");
    }

    // Ensure booking has required fields populated
    console.log("📋 [SessionGeneratorService] Processing booking:", {
      bookingId: booking._id,
      type: booking.type,
      hasStudent: !!booking.student,
      studentId: booking.student?._id || booking.student,
      hasTutorProfile: !!booking.tutorProfile,
      tutorProfileId: booking.tutorProfile?._id || booking.tutorProfile,
      mode: booking.mode,
      subject: booking.subject,
    });

    const { selectedSlots } = booking.recurrencePattern;
    const sessions = [];

    let currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);

    const endDateTime = new Date(endDate);
    endDateTime.setHours(23, 59, 59, 999);

    console.log(`📅 Generating sessions for booking ${booking._id}`);
    console.log(`   From: ${currentDate.toLocaleDateString()}`);
    console.log(`   To: ${endDateTime.toLocaleDateString()}`);

    while (currentDate <= endDateTime) {
      const dayOfWeek = currentDate.getDay();
      const daySlots = selectedSlots.filter((s) => s.dayOfWeek === dayOfWeek);

      for (const slot of daySlots) {
        // Create datetime objects for this slot
        const [startHour, startMin] = slot.start.split(":");
        const [endHour, endMin] = slot.end.split(":");

        const slotStart = new Date(currentDate);
        slotStart.setHours(parseInt(startHour), parseInt(startMin), 0, 0);

        const slotEnd = new Date(currentDate);
        slotEnd.setHours(parseInt(endHour), parseInt(endMin), 0, 0);

        // Check if session already exists for this date and time
        const exists = await TeachingSession.findOne({
          booking: booking._id,
          startTime: slotStart,
          endTime: slotEnd,
        });

        if (!exists) {
          const studentId = this.extractId(booking.student);
          const tutorProfileId = this.extractId(booking.tutorProfile);

          if (!studentId || !tutorProfileId) {
            console.error("❌ Missing student or tutorProfile:", {
              studentId,
              tutorProfileId,
              booking: booking._id,
            });
            throw new Error(
              `Missing required fields: student=${studentId}, tutorProfile=${tutorProfileId}`
            );
          }

          const sessionData = {
            booking: booking._id,
            student: studentId,
            tutorProfile: tutorProfileId,
            startTime: slotStart,
            endTime: slotEnd,
            courseName: booking.subject || "Buổi học",
            mode: booking.mode || "online",
            status: "scheduled",
            roomId: generateRoomId(),
          };

          console.log("📝 Creating recurring session with:", sessionData);

          const session = await TeachingSession.create(sessionData);

          sessions.push(session);
          console.log(
            `   ✅ Created: ${currentDate.toLocaleDateString()} ${slot.start}-${
              slot.end
            }`
          );
        } else {
          console.log(
            `   ⏭️  Skipped: ${currentDate.toLocaleDateString()} ${
              slot.start
            } (already exists)`
          );
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Update booking statistics
    const upcomingCount = await TeachingSession.countDocuments({
      booking: booking._id,
      status: "scheduled",
      startTime: { $gte: new Date() },
    });

    const completedCount = await TeachingSession.countDocuments({
      booking: booking._id,
      status: "completed",
    });

    booking.upcomingSessions = upcomingCount;
    booking.completedSessions = completedCount;
    await booking.save();

    console.log(`📊 Sessions created: ${sessions.length}`);
    console.log(
      `📊 Total upcoming: ${upcomingCount}, Completed: ${completedCount}`
    );

    return sessions;
  }

  /**
   * Generate sessions immediately after tutor accepts booking
   * - For bookings ≤2 weeks: Generate all sessions
   * - For bookings >2 weeks: Generate first 2 weeks only
   */
  async generateSessionsOnAccept(booking) {
    if (booking.type !== "recurring") {
      console.log("Single booking - session will be created separately");
      return [];
    }

    const { startDate, endDate, numberOfWeeks } = booking.recurrencePattern;
    const start = new Date(startDate);

    let generationEndDate;

    if (numberOfWeeks <= 2) {
      // Short-term booking: Create all sessions immediately
      generationEndDate = new Date(endDate);
      console.log(
        `📅 Short-term booking (${numberOfWeeks} week${
          numberOfWeeks > 1 ? "s" : ""
        }) - Creating all sessions`
      );
    } else {
      // Long-term booking: Create only first 2 weeks
      generationEndDate = new Date(start);
      generationEndDate.setDate(start.getDate() + 14);
      console.log(
        `📅 Long-term booking (${numberOfWeeks} weeks) - Creating sessions for first 2 weeks`
      );
    }

    return await this.generateSessionsForBooking(
      booking,
      start,
      generationEndDate
    );
  }

  /**
   * Cron job method: Generate upcoming sessions for long-term bookings
   * Runs daily to ensure sessions are available 2 weeks in advance
   */
  async generateUpcomingSessions() {
    console.log("\n🔄 Starting daily session generation...");

    const now = new Date();
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(now.getDate() + 14);

    // Find active long-term recurring bookings (>2 weeks)
    const longTermBookings = await Booking.find({
      type: "recurring",
      status: { $in: ["accepted", "in_progress"] },
      "recurrencePattern.numberOfWeeks": { $gt: 2 },
      "recurrencePattern.endDate": { $gte: now },
    }).populate("tutorProfile student");

    console.log(
      `📋 Found ${longTermBookings.length} long-term bookings to process`
    );

    let totalGenerated = 0;

    for (const booking of longTermBookings) {
      try {
        console.log(`\n📝 Processing booking ${booking._id}`);
        console.log(
          `   Student: ${booking.student?.full_name || booking.student}`
        );
        console.log(`   Tutor: ${booking.tutorProfile?.user || "N/A"}`);

        // Generate sessions for next 2 weeks if not already created
        const sessions = await this.generateSessionsForBooking(
          booking,
          now,
          twoWeeksFromNow
        );

        totalGenerated += sessions.length;
        console.log(`   ✅ Generated ${sessions.length} new sessions`);
      } catch (error) {
        console.error(
          `   ❌ Error processing booking ${booking._id}:`,
          error.message
        );
      }
    }

    console.log(`\n🎉 Daily session generation completed!`);
    console.log(`   Total sessions created: ${totalGenerated}`);
    console.log(`   Bookings processed: ${longTermBookings.length}`);
  }

  /**
   * Get session statistics for a booking
   */
  async getBookingSessionStats(bookingId) {
    const stats = await TeachingSession.aggregate([
      { $match: { booking: bookingId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {
      total: 0,
      scheduled: 0,
      completed: 0,
      cancelled: 0,
    };

    stats.forEach((stat) => {
      result.total += stat.count;
      result[stat._id] = stat.count;
    });

    return result;
  }
}

module.exports = new SessionGeneratorService();
