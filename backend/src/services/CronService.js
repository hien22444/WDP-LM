const Booking = require("../models/Booking");
const EscrowService = require("./EscrowService");
const NotificationService = require("./NotificationService");

class CronService {
  /**
   * Tự động giải phóng tiền escrow sau 24h kể từ khi buổi học hoàn thành
   * Chạy mỗi giờ
   */
  static async autoReleaseEscrow() {
    try {
      console.log("[Cron] Starting auto-release escrow job...");

      // Tìm các booking đã hoàn thành hơn 24 giờ và đang được giữ tiền
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const bookingsToRelease = await Booking.find({
        status: "completed",
        paymentStatus: "held",
        completedAt: { $lte: twentyFourHoursAgo }
      });

      console.log(`[Cron] Found ${bookingsToRelease.length} bookings to release escrow`);

      let releasedCount = 0;
      let errorCount = 0;

      for (const booking of bookingsToRelease) {
        try {
          // Giải phóng tiền
          await EscrowService.releasePayment(booking._id, "auto");
          releasedCount++;
          
          console.log(`[Cron] Released escrow for booking ${booking._id}`);
          
          // Gửi thông báo
          await NotificationService.notifyTutorPaymentReleased(booking);
          await NotificationService.notifyStudentPaymentReleased(booking);
          
        } catch (error) {
          errorCount++;
          console.error(`[Cron] Error releasing escrow for booking ${booking._id}:`, error.message);
        }
      }

      console.log(`[Cron] Completed: Released ${releasedCount} bookings, ${errorCount} errors`);

      return {
        success: true,
        releasedCount,
        errorCount,
        total: bookingsToRelease.length
      };

    } catch (error) {
      console.error("[Cron] Auto-release escrow error:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

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
}

module.exports = CronService;

