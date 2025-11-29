const cron = require("node-cron");
const Booking = require("../models/Booking");
const TutorProfile = require("../models/TutorProfile");
const NotificationService = require("./NotificationService");

class CronService {
  /**
   * Kiểm tra và cập nhật trạng thái các booking đã bắt đầu học
   * Chạy mỗi 15 phút
   */
  static async updateBookingStatuses() {
    try {
      console.log("[Cron] Starting booking status update job...");

      const now = new Date();

      // Cập nhật các booking đã accepted và đã đến giờ học → in_progress
      const acceptedBookings = await Booking.find({
        status: "accepted",
        start: { $lte: now },
        end: { $gte: now }
      });

      for (const booking of acceptedBookings) {
        booking.status = "in_progress";
        await booking.save();
        console.log(`[Cron] Updated booking ${booking._id} to in_progress`);
      }

      // Cập nhật các booking in_progress và đã qua giờ học → completed
      const inProgressBookings = await Booking.find({
        status: "in_progress",
        end: { $lt: now }
      });

      for (const booking of inProgressBookings) {
        booking.status = "completed";
        booking.completedAt = now;
        await booking.save();
        console.log(`[Cron] Updated booking ${booking._id} to completed`);
      }

      console.log(`[Cron] Status update completed: ${acceptedBookings.length} to in_progress, ${inProgressBookings.length} to completed`);

      return {
        success: true,
        toInProgress: acceptedBookings.length,
        toCompleted: inProgressBookings.length
      };

    } catch (error) {
      console.error("[Cron] Booking status update error:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Gửi nhắc nhở cho các booking sắp bắt đầu (trong 30 phút)
   * Chạy mỗi 15 phút
   */
  static async sendBookingReminders() {
    try {
      console.log("[Cron] Starting booking reminders job...");

      const now = new Date();
      const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);

      // Tìm các booking sắp bắt đầu trong 30 phút
      const upcomingBookings = await Booking.find({
        status: "accepted",
        start: {
          $gte: now,
          $lte: thirtyMinutesFromNow
        },
        reminderSent: { $ne: true }
      }).populate("student tutorProfile");

      console.log(`[Cron] Found ${upcomingBookings.length} bookings to remind`);

      let remindedCount = 0;

      for (const booking of upcomingBookings) {
        try {
          // Gửi reminder
          await NotificationService.sendBookingReminder(booking);
          
          booking.reminderSent = true;
          await booking.save();
          remindedCount++;

          console.log(`[Cron] Sent reminder for booking ${booking._id}`);

        } catch (error) {
          console.error(`[Cron] Error sending reminder for booking ${booking._id}:`, error.message);
        }
      }

      console.log(`[Cron] Sent ${remindedCount} reminders`);

      return {
        success: true,
        remindedCount,
        total: upcomingBookings.length
      };

    } catch (error) {
      console.error("[Cron] Booking reminders error:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cleanup old completed bookings (hơn 90 ngày)
   * Chạy mỗi ngày
   */
  static async cleanupOldBookings() {
    try {
      console.log("[Cron] Starting cleanup job...");

      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      const result = await Booking.deleteMany({
        status: "completed",
        completedAt: { $lte: ninetyDaysAgo }
      });

      console.log(`[Cron] Cleaned up ${result.deletedCount} old bookings`);

      return {
        success: true,
        deletedCount: result.deletedCount
      };

    } catch (error) {
      console.error("[Cron] Cleanup error:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Tự động xóa tutor profiles bị reject sau 30 ngày
   * Chạy mỗi ngày lúc 2:00 AM
   */
  static async cleanupRejectedProfiles() {
    try {
      console.log("[Cron] Starting cleanup rejected tutor profiles job...");

      // Tính ngày 30 ngày trước
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Tìm profiles bị reject từ 30 ngày trước
      const rejectedProfiles = await TutorProfile.find({
        status: 'rejected',
        updatedAt: { $lt: thirtyDaysAgo }
      }).populate('user', 'email full_name');

      if (rejectedProfiles.length === 0) {
        console.log("[Cron] No rejected profiles to cleanup");
        return { success: true, deletedCount: 0 };
      }

      console.log(`[Cron] Found ${rejectedProfiles.length} rejected profiles to cleanup:`);
      
      // Log thông tin profiles sẽ bị xóa
      rejectedProfiles.forEach((profile) => {
        console.log(`  - ${profile.user?.email || 'N/A'} (ID: ${profile._id}, Rejected: ${profile.updatedAt})`);
      });

      // Xóa profiles
      const result = await TutorProfile.deleteMany({
        status: 'rejected',
        updatedAt: { $lt: thirtyDaysAgo }
      });

      console.log(`[Cron] Deleted ${result.deletedCount} rejected profiles (>30 days old)`);

      return {
        success: true,
        deletedCount: result.deletedCount,
        deletedProfiles: rejectedProfiles.map(p => ({
          id: p._id.toString(),
          userEmail: p.user?.email,
          rejectedAt: p.updatedAt
        }))
      };

    } catch (error) {
      console.error("[Cron] Error cleaning up rejected profiles:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cleanup pending unpaid bookings after 30 minutes
   * Runs every 10 minutes
   */
  static async cleanupUnpaidBookings() {
    try {
      console.log("[Cron] Starting cleanup unpaid bookings job...");

      const now = new Date();
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

      // Find bookings that are pending, unpaid, and created more than 30 minutes ago
      const expiredBookings = await Booking.find({
        status: "pending",
        paymentStatus: { $in: ["none", "pending"] },
        createdAt: { $lt: thirtyMinutesAgo }
      });

      let deletedCount = 0;
      for (const booking of expiredBookings) {
        console.log(`[Cron] Deleting expired unpaid booking ${booking._id} (created ${booking.createdAt})`);
        await booking.deleteOne();
        deletedCount++;
      }

      console.log(`[Cron] Cleanup completed: ${deletedCount} unpaid bookings deleted`);

      return {
        success: true,
        deletedCount
      };

    } catch (error) {
      console.error("[Cron] Error in cleanupUnpaidBookings:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Bắt đầu tất cả cron jobs
   */
  static startAllJobs() {
    console.log("⏰ Starting cron jobs...");

    // Update booking statuses every 15 minutes
    cron.schedule("*/15 * * * *", async () => {
      await this.updateBookingStatuses();
    });

    // Send session reminders every 30 minutes
    cron.schedule("*/30 * * * *", async () => {
      await this.sendSessionReminders();
    });

    console.log("✅ All cron jobs started successfully");
  }
}

module.exports = CronService;

