const cron = require("node-cron");
const SessionGeneratorService = require("../services/SessionGeneratorService");

/**
 * Daily cron job to generate upcoming sessions for long-term recurring bookings
 * Runs at 2:00 AM every day
 * 
 * Logic:
 * - Finds recurring bookings with status "in_progress"
 * - For bookings that last > 2 weeks, creates sessions 2 weeks ahead
 * - Only creates sessions that don't exist yet
 */
function setupSessionGeneratorCron() {
  // Schedule: "0 2 * * *" = At 02:00 AM every day
  cron.schedule("0 2 * * *", async () => {
    console.log("⏰ [Cron] Starting session generator at", new Date().toISOString());
    
    try {
      const result = await SessionGeneratorService.generateUpcomingSessions();
      
      console.log("✅ [Cron] Session generation completed:", {
        processed: result.processedBookings,
        created: result.sessionsCreated,
        errors: result.errors.length,
        timestamp: new Date().toISOString()
      });

      // Log errors if any
      if (result.errors.length > 0) {
        console.error("⚠️ [Cron] Errors during session generation:");
        result.errors.forEach(err => {
          console.error(`  - Booking ${err.bookingId}: ${err.error}`);
        });
      }

    } catch (error) {
      console.error("❌ [Cron] Fatal error in session generator:", error);
    }
  });

  console.log("✅ Session generator cron job initialized (runs daily at 2:00 AM)");
}

module.exports = { setupSessionGeneratorCron };
