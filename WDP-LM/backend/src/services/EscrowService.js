const Booking = require("../models/Booking");
const TeachingSession = require("../models/TeachingSession");
const NotificationService = require("./NotificationService");

class EscrowService {
  // Tính toán phí platform và số tiền gia sư nhận được
  static calculatePayouts(price) {
    const platformFeeRate = 0.15; // 15% phí platform
    const platformFee = Math.round(price * platformFeeRate);
    const tutorPayout = price - platformFee;
    
    return {
      escrowAmount: price,
      platformFee,
      tutorPayout
    };
  }

  // Tạo booking với escrow
  static async createEscrowBooking(bookingData) {
    const payouts = this.calculatePayouts(bookingData.price);
    
    const booking = await Booking.create({
      ...bookingData,
      paymentStatus: "escrow",
      escrowAmount: payouts.escrowAmount,
      platformFee: payouts.platformFee,
      tutorPayout: payouts.tutorPayout
    });

    return booking;
  }

  // Chuyển tiền từ escrow sang held (khi gia sư chấp nhận)
  static async holdPayment(bookingId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.paymentStatus !== "escrow") {
      throw new Error("Invalid payment status for holding");
    }

    booking.paymentStatus = "held";
    await booking.save();

    return booking;
  }

  // Giải phóng tiền cho gia sư (khi buổi học hoàn thành)
  static async releasePayment(bookingId, releasedBy = "system") {
    const booking = await Booking.findById(bookingId).populate("tutorProfile student");
    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.paymentStatus !== "held") {
      throw new Error("Payment must be held before release");
    }

    booking.paymentStatus = "released";
    booking.status = "completed";
    booking.completedAt = new Date();
    await booking.save();

    // Gửi thông báo thanh toán cho gia sư
    try {
      await NotificationService.notifyTutorPaymentReleased(booking);
    } catch (error) {
      console.error("Failed to send payment release notification:", error);
    }

    return booking;
  }

  // Hoàn tiền cho học viên (khi hủy hoặc tranh chấp)
  static async refundPayment(bookingId, refundAmount = null, reason = "cancellation") {
    const booking = await Booking.findById(bookingId).populate("student");
    if (!booking) {
      throw new Error("Booking not found");
    }

    if (!["escrow", "held"].includes(booking.paymentStatus)) {
      throw new Error("Invalid payment status for refund");
    }

    const refund = refundAmount || booking.escrowAmount;
    booking.paymentStatus = "refunded";
    booking.refundAmount = refund;
    booking.status = "cancelled";
    booking.cancelledAt = new Date();
    await booking.save();

    // Gửi thông báo hoàn tiền cho học viên
    try {
      await NotificationService.notifyStudentRefund(booking);
    } catch (error) {
      console.error("Failed to send refund notification:", error);
    }

    return booking;
  }

  // Tự động giải phóng tiền sau 24h (nếu không có tranh chấp)
  static async autoReleasePayment(bookingId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return;
    }

    if (booking.paymentStatus === "held" && booking.status === "completed") {
      await this.releasePayment(bookingId, "auto");
    }
  }

  // Mở tranh chấp
  static async openDispute(bookingId, reason, openedBy) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.paymentStatus !== "held") {
      throw new Error("Cannot dispute non-held payment");
    }

    booking.status = "disputed";
    booking.disputeReason = reason;
    booking.disputeOpenedAt = new Date();
    await booking.save();

    // Gửi thông báo tranh chấp cho admin
    try {
      await NotificationService.notifyAdminDispute(booking);
    } catch (error) {
      console.error("Failed to send dispute notification:", error);
    }

    return booking;
  }

  // Giải quyết tranh chấp (admin)
  static async resolveDispute(bookingId, resolution, adminId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.status !== "disputed") {
      throw new Error("Booking is not in dispute");
    }

    booking.disputeResolvedAt = new Date();
    booking.resolvedBy = adminId;

    if (resolution === "release") {
      await this.releasePayment(bookingId, "admin");
    } else if (resolution === "refund") {
      await this.refundPayment(bookingId, booking.escrowAmount, "dispute_resolved");
    }

    return booking;
  }

  // Lấy thống kê escrow cho admin
  static async getEscrowStats() {
    const stats = await Booking.aggregate([
      {
        $group: {
          _id: "$paymentStatus",
          count: { $sum: 1 },
          totalAmount: { $sum: "$escrowAmount" }
        }
      }
    ]);

    return stats;
  }
}

module.exports = EscrowService;
