const payOS = require("../config/payos");
const TeachingSlot = require("../models/TeachingSlot");
const Payment = require("../models/Payment");
const Booking = require("../models/Booking");
const TeachingSession = require("../models/TeachingSession");
const { generateRoomId } = require("../services/WebRTCService");
const { notifyStudentPaymentSuccess, notifyTutorPaymentSuccess } = require("../services/NotificationService");

// Tạo link thanh toán
const createPaymentLink = async (req, res) => {
  // FIX: orderCode phải là một SỐ NGUYÊN DƯƠNG hợp lệ theo PayOS.
  // PayOS yêu cầu order_code là integer, positive và <= Number.MAX_SAFE_INTEGER.
  // Sinh orderCode an toàn: seconds-since-epoch (smaller than ms) + 3-digit random suffix.
  const seconds = Math.floor(Date.now() / 1000);
  const suffix = Math.floor(Math.random() * 900) + 100; // 100..999
  let orderCode = Number(String(seconds) + String(suffix));
  // Safety checks
  if (
    !Number.isFinite(orderCode) ||
    !Number.isInteger(orderCode) ||
    orderCode <= 0
  ) {
    orderCode = seconds; // fallback
  }
  if (orderCode > Number.MAX_SAFE_INTEGER) {
    orderCode = seconds; // ensure below safe integer
  }

  // Determine amount server-side: prefer DB price from TeachingSlot (slotId),
  // fallback to payload.product.unitPrice if provided by client.
  let amount = null;
  let productName = "Thanh toán đơn hàng WDP-LM";
  let slotId = null;

  try {
    const payload = req.body || {};
    const product = payload.product || {};
    const metadata = payload.metadata || {};

    // Try to resolve slotId from metadata.slotId or product.id
    slotId = metadata.slotId || product.id;
    if (slotId) {
      try {
        const slot = await TeachingSlot.findById(slotId).lean();
        if (slot && typeof slot.price === "number" && slot.price > 0) {
          amount = slot.price;
          productName = slot.courseName || product.name || productName;
        }
      } catch (e) {
        // ignore DB lookup failures for now and fallback to client-provided price
        console.warn(
          "Warning: unable to load TeachingSlot for payment amount:",
          e.message
        );
      }
    }

    // fallback to client-provided unitPrice (in VND integer)
    if (amount === null && product && typeof product.unitPrice === "number") {
      amount = product.unitPrice;
      productName = product.name || productName;
    }

    // If still no valid amount, return 400
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Không xác định được số tiền thanh toán cho sản phẩm.",
      });
    }
  } catch (err) {
    console.error("Error while resolving payment amount:", err);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi máy chủ khi xử lý thanh toán." });
  }

  const order = {
    orderCode: orderCode, // Mã đơn hàng duy nhất, là số nguyên
    amount: amount,
    description: productName,
    returnUrl: `${process.env.FRONTEND_URL}/payment-success`,
    cancelUrl: `${process.env.FRONTEND_URL}/payment-cancel`,
  };

  let paymentRecord = null;
  try {
    if (!payOS || typeof payOS.paymentRequests.create !== "function") {
      throw new Error("PayOS SDK chưa được khởi tạo đúng cách.");
    }

    // Persist a Payment record before calling PayOS
    paymentRecord = await Payment.create({
      orderCode: String(orderCode),
      vnp_txnref: String(orderCode),
      slotId: slotId || null,
      amount,
      productName,
      status: "PENDING",
      metadata: {
        metadata: req.body.metadata || {},
        product: req.body.product || {},
      },
    });

    console.log("Creating payment link with order:", order);
    const paymentLink = await payOS.paymentRequests.create(order);

    console.log(
      `Resolved payment amount for orderCode ${orderCode}:`,
      amount,
      "description:",
      productName
    );

    // Update the payment record with checkout/qr info
    paymentRecord.checkoutUrl = paymentLink.checkoutUrl;
    paymentRecord.qrUrl = paymentLink.qrUrl || null;
    await paymentRecord.save();

    const payload = {
      success: true,
      paymentId: paymentRecord._id,
      checkoutUrl: paymentLink.checkoutUrl,
      qrUrl: paymentLink.qrUrl || null,
      qrBase64: paymentLink.qrBase64 || null,
      amount: amount,
      productName: productName,
    };

    console.log(
      "✅ Payment link created successfully for orderCode:",
      orderCode
    );
    return res.json(payload);
  } catch (error) {
    // Enhanced logging to help debug 500 errors
    console.error("Error creating payment link", {
      orderCode,
      slotId,
      amount,
      productName,
      message: error.message,
      stack: error.stack,
    });

    // If a payment record was already created, mark it cancelled to avoid dangling PENDING
    try {
      if (paymentRecord) {
        paymentRecord.status = "CANCELLED";
        paymentRecord.metadata = paymentRecord.metadata || {};
        paymentRecord.metadata.error = (error && error.message) || "unknown";
        await paymentRecord.save();
      }
    } catch (e2) {
      console.error("Error updating paymentRecord after failure:", e2);
    }

    // Return a clearer message for the frontend while avoiding sensitive details
    const safeMessage =
      error && error.message
        ? error.message
        : "Lỗi máy chủ khi tạo link thanh toán";
    return res.status(500).json({
      success: false,
      message: `Không thể tạo link thanh toán: ${safeMessage}`,
    });
  }
};

// Nhận webhook từ PayOS
const receiveWebhook = async (req, res) => {
  console.log("🔄 Webhook received - Full data:", {
    body: req.body,
    headers: req.headers,
    method: req.method,
  });
  const webhookData = req.body || {};
  try {
    console.log("🔍 Processing webhook with code:", webhookData.code);

    // Extract orderCode and status, handle different response formats
    const orderCode = webhookData.data?.orderCode || webhookData.orderCode;
    const status = (
      webhookData.data?.status ||
      webhookData.status ||
      ""
    ).toString();

    if (orderCode) {
      console.log("📦 Processing order:", {
        orderCode,
        status,
        code: webhookData.code,
        responseCode: webhookData.responseCode,
        message: webhookData.message,
      });

      try {
        // Log incoming status for debugging
        console.log("🔍 Processing payment status:", {
          orderCode,
          status,
          rawStatus: webhookData.data.status,
          description: webhookData.data.description,
        });

        // PayOS can send either "PAID" or "COMPLETED" for successful payments
        // Check both the status and the response code
        if (
          webhookData.code === "00" &&
          webhookData.data?.status &&
          (status.toUpperCase() === "PAID" ||
            status.toUpperCase() === "COMPLETED" ||
            status.toUpperCase() === "SUCCESS" ||
            status.toUpperCase() === "PROCESSED" ||
            status === "00")
        ) {
          console.log(`✅ Order ${orderCode} has been paid successfully.`);

          // Update payment record first
          const updateResult = await Payment.updateOne(
            { orderCode: String(orderCode) },
            {
              status: "PAID",
              paidAt: new Date(),
              paymentData: webhookData,
            }
          );
          console.log("📝 Payment update result:", updateResult);

          // Then find the updated payment to get full details
          const payment = await Payment.findOne({
            orderCode: String(orderCode),
          });
          console.log(
            "📋 Found payment record:",
            payment ? payment._id : "not found"
          );

          if (payment && payment.slotId) {
            // Get the teaching slot
            const slot = await TeachingSlot.findById(payment.slotId);
            if (slot) {
              // Update teaching slot status
              slot.status = "booked";
              slot.bookings = slot.bookings || [];
              slot.bookings.push({
                userId: payment.userId,
                paymentId: payment._id,
                bookedAt: new Date(),
              });
              await slot.save();
              console.log("📚 Slot update result:", slot._id);

              // Create booking from slot
              try {
                const roomId = generateRoomId();
                const booking = await Booking.create({
                  tutorProfile: slot.tutorProfile,
                  student: payment.userId,
                  start: slot.start,
                  end: slot.end,
                  mode: slot.mode,
                  price: slot.price,
                  notes: `Đặt từ slot: ${slot.courseName}`,
                  slotId: slot._id,
                  roomId: roomId,
                  status: "accepted" // Auto-accept since payment is completed
                });

                // Create teaching session
                const session = await TeachingSession.create({
                  booking: booking._id,
                  tutorProfile: slot.tutorProfile,
                  student: payment.userId,
                  startTime: slot.start,
                  endTime: slot.end,
                  courseName: slot.courseName,
                  mode: slot.mode,
                  location: slot.location,
                  status: "scheduled",
                  roomId: roomId,
                });

                booking.sessionId = session._id;
                await booking.save();

                console.log("📝 Booking created:", booking._id);
                console.log("📝 Teaching session created:", session._id);

                // Send payment success notifications
                try {
                  const studentNotification = await notifyStudentPaymentSuccess(booking);
                  console.log("📧 Student payment success notification sent:", studentNotification);

                  const tutorNotification = await notifyTutorPaymentSuccess(booking);
                  console.log("📧 Tutor payment success notification sent:", tutorNotification);
                } catch (notificationError) {
                  console.error("❌ Failed to send payment notifications:", notificationError);
                  // Don't fail the payment processing if notification fails
                }

              } catch (bookingError) {
                console.error("❌ Error creating booking from slot:", bookingError);
                // Don't fail the payment processing if booking creation fails
              }
            }
          }
        } else {
          console.log(`❕ Order ${orderCode} status is: ${status}`);
          // Map other statuses appropriately
          const mappedStatus =
            status === "CANCELLED" || status === "CANCEL"
              ? "CANCELLED"
              : status === "FAILED" || status === "FAILURE"
              ? "FAILED"
              : "PENDING";

          const updateResult = await Payment.updateOne(
            { orderCode: String(orderCode) },
            {
              status: mappedStatus,
              updatedAt: new Date(),
              paymentData: webhookData,
            }
          );
          console.log(
            "📝 Payment update result for non-success:",
            updateResult
          );
        }
      } catch (updateError) {
        console.error("Error updating payment status:", updateError);
        throw updateError;
      }
    }

    res.status(200).json({ success: true, message: "Webhook received" });
  } catch (error) {
    console.error("⚠️ Lỗi xử lý webhook:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// List payments for current user (if req.user exists) or all payments for admin
const listPayments = async (req, res) => {
  try {
    const filter = {};
    // If authentication middleware sets req.user._id, filter by that user
    if (req.user && req.user._id) {
      filter.userId = req.user._id;
    }

    // Basic pagination
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.max(1, parseInt(req.query.limit || "20", 10));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Payment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments(filter),
    ]);

    return res.json({ success: true, items, total, page, limit });
  } catch (error) {
    console.error("Error listing payments:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get single payment by id
const getPaymentById = async (req, res) => {
  try {
    const id = req.params.id;
    const payment = await Payment.findById(id).lean();
    if (!payment)
      return res
        .status(404)
        .json({ success: false, message: "Payment not found" });

    // Optionally check ownership
    if (
      req.user &&
      req.user._id &&
      payment.userId &&
      String(payment.userId) !== String(req.user._id)
    ) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    return res.json({ success: true, item: payment });
  } catch (error) {
    console.error("Error fetching payment:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Cancel a pending payment
const cancelPayment = async (req, res) => {
  try {
    const id = req.params.id;
    const payment = await Payment.findById(id);
    if (!payment)
      return res
        .status(404)
        .json({ success: false, message: "Payment not found" });

    // Only allow cancel if currently pending
    if (payment.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể hủy giao dịch ở trạng thái PENDING",
      });
    }

    // Optionally check ownership
    if (
      req.user &&
      req.user._id &&
      payment.userId &&
      String(payment.userId) !== String(req.user._id)
    ) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    payment.status = "CANCELLED";
    await payment.save();

    return res.json({ success: true, item: payment });
  } catch (error) {
    console.error("Error cancelling payment:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Verify payment status
const verifyPayment = async (req, res) => {
  try {
    const { orderCode } = req.params;
    if (!orderCode) {
      return res.status(400).json({
        success: false,
        message: "Thiếu mã đơn hàng",
      });
    }

    // Find the payment record
    const payment = await Payment.findOne({ orderCode: String(orderCode) });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }

    // Check with PayOS for current status
    try {
      const paymentStatus = await payOS.paymentRequests.getStatus(orderCode);
      console.log("PayOS status check result:", paymentStatus);

      if (
        paymentStatus.code === "00" &&
        paymentStatus.data?.status === "PAID"
      ) {
        // Update payment record
        payment.status = "PAID";
        payment.paidAt = new Date();
        payment.paymentData = paymentStatus;
        await payment.save();

        // Update teaching slot if applicable
        if (payment.slotId) {
          const slot = await TeachingSlot.findById(payment.slotId);
          if (slot) {
            slot.status = "booked";
            slot.bookings = slot.bookings || [];
            slot.bookings.push({
              userId: payment.userId,
              paymentId: payment._id,
              bookedAt: new Date(),
            });
            await slot.save();

            // Create booking from slot if not exists
            const existingBooking = await Booking.findOne({ slotId: slot._id });
            if (!existingBooking) {
              try {
                const roomId = generateRoomId();
                const booking = await Booking.create({
                  tutorProfile: slot.tutorProfile,
                  student: payment.userId,
                  start: slot.start,
                  end: slot.end,
                  mode: slot.mode,
                  price: slot.price,
                  notes: `Đặt từ slot: ${slot.courseName}`,
                  slotId: slot._id,
                  roomId: roomId,
                  status: "accepted"
                });

                const session = await TeachingSession.create({
                  booking: booking._id,
                  tutorProfile: slot.tutorProfile,
                  student: payment.userId,
                  startTime: slot.start,
                  endTime: slot.end,
                  courseName: slot.courseName,
                  mode: slot.mode,
                  location: slot.location,
                  status: "scheduled",
                  roomId: roomId,
                });

                booking.sessionId = session._id;
                await booking.save();

                // Send notifications
                try {
                  await notifyStudentPaymentSuccess(booking);
                  await notifyTutorPaymentSuccess(booking);
                } catch (notificationError) {
                  console.error("❌ Failed to send payment notifications:", notificationError);
                }
              } catch (bookingError) {
                console.error("❌ Error creating booking from slot:", bookingError);
              }
            }
          }
        }

        return res.json({
          success: true,
          status: "PAID",
          message: "Thanh toán thành công",
        });
      }

      // Return current status
      return res.json({
        success: true,
        status: payment.status,
        message: "Trạng thái thanh toán hiện tại",
      });
    } catch (verifyError) {
      console.error("Error verifying with PayOS:", verifyError);
      return res.json({
        success: true,
        status: payment.status,
        message: "Không thể kiểm tra trạng thái với PayOS",
      });
    }
  } catch (error) {
    console.error("Error in verifyPayment:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi kiểm tra trạng thái thanh toán",
    });
  }
};

module.exports = {
  createPaymentLink,
  receiveWebhook,
  verifyPayment,
  listPayments,
  getPaymentById,
  cancelPayment,
};
