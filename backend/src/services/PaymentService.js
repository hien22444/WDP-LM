const payOS = require("../config/payos");
const Payment = require("../models/Payment");
const mongoose = require("mongoose");

/**
 * Payment Service for recurring bookings
 * Handles payment link generation and webhook processing
 */
class PaymentService {
  /**
   * Create payment link for recurring booking
   * @param {Object} params - {booking, tutorUser, student}
   * @returns {String} Payment checkout URL
   */
  static async createRecurringBookingPayment({ booking, tutorUser, student }) {
    try {
      console.log(`💳 [PaymentService] Creating payment for booking ${booking._id}`);

      // Validate PayOS config
      if (!payOS) {
        throw new Error("PayOS SDK chưa được khởi tạo");
      }

      if (
        !process.env.PAYOS_CLIENT_ID ||
        !process.env.PAYOS_API_KEY ||
        !process.env.PAYOS_CHECKSUM_KEY
      ) {
        throw new Error("Thiếu cấu hình PayOS trong biến môi trường");
      }

      // Create order code
      const orderCode = Date.now();

      // Short description for PayOS (max 25 chars)
      // Use last 8 digits of orderCode for uniqueness
      const shortCode = String(orderCode).slice(-8);
      const description = `DH${shortCode}`;

      console.log(`💳 [PaymentService] Payment details:`, {
        orderCode,
        description,
        amount: booking.totalPrice
      });

      // Create order for PayOS
      const order = {
        orderCode: orderCode,
        amount: booking.totalPrice,
        description: description,
        returnUrl: `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/payment-success?bookingId=${booking._id}`,
        cancelUrl: `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/payment-cancel?bookingId=${booking._id}`,
      };

      console.log(`💳 [PaymentService] PayOS order:`, order);

      // Create Payment record in database
      const paymentRecord = await Payment.create({
        orderCode: String(orderCode),
        vnp_txnref: String(orderCode),
        userId: student.id ? new mongoose.Types.ObjectId(student.id) : null,
        bookingId: booking._id,
        amount: booking.totalPrice,
        productName: description,
        status: "PENDING",
        metadata: {
          bookingId: String(booking._id),
          type: "recurring",
          totalSessions: booking.totalSessionsPlanned
        },
      });

      console.log(`✅ [PaymentService] Payment record created: ${paymentRecord._id}`);

      // Call PayOS API to create payment link
      const paymentLink = await payOS.paymentRequests.create(order);

      console.log(`✅ [PaymentService] PayOS payment link created`);

      // Update booking with payment info
      booking.paymentOrderCode = String(orderCode);
      await booking.save();

      return paymentLink.checkoutUrl;

    } catch (error) {
      console.error(`❌ [PaymentService] Error creating payment:`, error);
      throw new Error(`Không thể tạo link thanh toán: ${error.message}`);
    }
  }

  /**
   * Process payment webhook from PayOS
   * Updates booking paymentStatus and notifies tutor
   * @param {Object} webhookData - Payment webhook data from PayOS
   */
  static async processPaymentWebhook(webhookData) {
    try {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`🔔 [PaymentService] Processing webhook:`, JSON.stringify(webhookData, null, 2));
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

      const { orderCode, status } = webhookData;

      console.log(`🔍 [PaymentService] Looking for payment with orderCode: ${orderCode}`);

      // Find payment record
      const payment = await Payment.findOne({ orderCode: String(orderCode) });

      if (!payment) {
        console.error(`❌ [PaymentService] Payment not found: ${orderCode}`);
        return { success: false, message: "Payment not found" };
      }

      console.log(`✅ [PaymentService] Found payment:`, {
        paymentId: payment._id.toString(),
        bookingId: payment.bookingId?.toString() || 'NULL',
        currentStatus: payment.status,
        newStatus: status
      });

      // Update payment status (use "PAID" instead of "SUCCESS" to match enum)
      payment.status = status === "PAID" ? "PAID" : "CANCELLED";
      payment.paidAt = status === "PAID" ? new Date() : null;
      await payment.save();

      console.log(`✅ [PaymentService] Payment status updated to: ${payment.status}`);

      // Find associated booking using payment.bookingId
      const Booking = require("../models/Booking");
      
      if (!payment.bookingId) {
        console.error(`❌ [PaymentService] Payment has no bookingId`);
        return { success: false, message: "Payment has no associated booking" };
      }

      console.log(`🔍 [PaymentService] Looking for booking: ${payment.bookingId}`);

      const booking = await Booking.findById(payment.bookingId)
        .populate("tutorProfile", "full_name email")
        .populate("student", "full_name email");

      if (!booking) {
        console.error(`❌ [PaymentService] Booking not found: ${payment.bookingId}`);
        return { success: false, message: "Booking not found" };
      }

      console.log(`✅ [PaymentService] Found booking:`, {
        bookingId: booking._id.toString(),
        currentPaymentStatus: booking.paymentStatus,
        status: booking.status
      });

      if (status === "PAID") {
        // Update booking payment status
        const oldPaymentStatus = booking.paymentStatus;
        booking.paymentStatus = "paid";
        await booking.save();

        console.log(`✅ [PaymentService] Booking payment status updated: ${oldPaymentStatus} → ${booking.paymentStatus}`);
        console.log(`✅ [PaymentService] Payment successful for booking ${booking._id}`);

        // Notify tutor about new booking request
        const { notifyTutorBookingCreated } = require("./NotificationService");
        
        console.log(`📧 [PaymentService] Sending notification to tutor...`);
        await notifyTutorBookingCreated(booking);

        console.log(`📧 [PaymentService] Tutor notified about booking ${booking._id}`);

        return { 
          success: true, 
          message: "Payment processed successfully",
          bookingId: booking._id.toString(),
          paymentStatus: booking.paymentStatus
        };

      } else {
        console.log(`⚠️ [PaymentService] Payment failed for booking ${booking._id}`);
        return { success: false, message: "Payment failed" };
      }

    } catch (error) {
      console.error(`❌ [PaymentService] Webhook processing error:`, error.message);
      console.error(`❌ [PaymentService] Error stack:`, error.stack);
      return { success: false, message: error.message };
    }
  }
}

module.exports = PaymentService;
