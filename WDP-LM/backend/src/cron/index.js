const CronService = require("../services/CronService");

/**
 * Khởi động tất cả cron jobs
 * Jobs chạy trong environment có CRON_ENABLED=true
 */
class CronManager {
  constructor() {
    this.jobs = [];
    this.isEnabled = process.env.CRON_ENABLED === "true" || false;
    
    if (this.isEnabled) {
      console.log("✅ Cron jobs enabled");
      this.startJobs();
    } else {
      console.log("ℹ️ Cron jobs disabled (set CRON_ENABLED=true to enable)");
    }
  }

  startJobs() {
    // Job 1: Auto-release escrow mỗi giờ
    this.scheduleJob("autoReleaseEscrow", 60 * 60 * 1000, () => {
      CronService.autoReleaseEscrow();
    });

    // Job 2: Cập nhật trạng thái booking mỗi 15 phút
    this.scheduleJob("updateBookingStatuses", 15 * 60 * 1000, () => {
      CronService.updateBookingStatuses();
    });

    // Job 3: Gửi reminder mỗi 15 phút
    this.scheduleJob("sendBookingReminders", 15 * 60 * 1000, () => {
      CronService.sendBookingReminders();
    });

    // Job 4: Cleanup old bookings mỗi ngày (24 giờ)
    this.scheduleJob("cleanupOldBookings", 24 * 60 * 60 * 1000, () => {
      CronService.cleanupOldBookings();
    });
  }

  scheduleJob(name, interval, callback) {
    console.log(`⏰ Scheduling cron job: ${name} (interval: ${interval / 1000}s)`);

    const job = setInterval(async () => {
      try {
        await callback();
      } catch (error) {
        console.error(`❌ Cron job ${name} error:`, error);
      }
    }, interval);

    // Chạy ngay lần đầu
    callback();

    this.jobs.push({ name, interval, job });

    return job;
  }

  stopAll() {
    console.log("🛑 Stopping all cron jobs...");
    this.jobs.forEach(({ name, job }) => {
      clearInterval(job);
      console.log(`✋ Stopped: ${name}`);
    });
    this.jobs = [];
  }
}

module.exports = CronManager;

