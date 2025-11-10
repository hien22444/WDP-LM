const payOS = require("../config/payos");
const mongoose = require("mongoose");
const TeachingSlot = require("../models/TeachingSlot");
const Payment = require("../models/Payment");
const Booking = require("../models/Booking");
const TeachingSession = require("../models/TeachingSession");
const TutorProfile = require("../models/TutorProfile");
const Notification = require("../models/Notification");
const { generateRoomId } = require("../services/WebRTCService");
const {
  notifyStudentPaymentSuccess,
  notifyTutorPaymentSuccess,
  notifyTutorBookingCreated,
} = require("../services/NotificationService");

// Tạo link thanh toán
const createPaymentLink = async (req, res) => {
  let paymentRecord = null;
  try {
    console.log(
      "📝 [Payment] Creating payment link - Request body:",
      JSON.stringify(req.body, null, 2)
    );
    console.log("📝 [Payment] User ID:", req.user?.id || "No user");

    // Create simple order code
    const orderCode = Date.now();

    // Initialize variables
    let slotId = null;
    let amount = null;
    let productName = "Thanh toán khóa học";

    try {
      const payload = req.body || {};
      const product = payload.product || {};
      const metadata = payload.metadata || {};

      console.log(
        "📝 [Payment] Parsed - product:",
        product,
        "metadata:",
        metadata
      );

      // Try to resolve slotId from metadata.slotId or product.id
      slotId = metadata.slotId || product.id;
      console.log("📝 [Payment] Resolved slotId:", slotId);

      // Validate slotId - must be valid ObjectId
      if (slotId) {
        // Kiểm tra xem slotId có phải ObjectId hợp lệ không
        if (!mongoose.Types.ObjectId.isValid(slotId)) {
          console.warn(
            "⚠️ [Payment] Invalid ObjectId format for slotId:",
            slotId
          );
          console.warn(
            "⚠️ [Payment] Setting slotId to null (will use client-provided price)"
          );
          slotId = null; // Set null nếu không phải ObjectId hợp lệ
        } else {
          try {
            const slot = await TeachingSlot.findById(slotId).lean();
            console.log("📝 [Payment] Found slot:", slot ? "yes" : "no");
            if (slot && typeof slot.price === "number" && slot.price > 0) {
              amount = slot.price;
              productName = slot.courseName || product.name || productName;
              console.log("📝 [Payment] Using slot price:", amount);
            } else {
              console.warn(
                "⚠️ [Payment] Slot found but price invalid:",
                slot?.price
              );
            }
          } catch (e) {
            console.warn(
              "⚠️ [Payment] Unable to load TeachingSlot:",
              e.message
            );
            slotId = null; // Set null nếu không tìm thấy slot
          }
        }
      }

      // fallback to client-provided unitPrice (in VND integer)
      if (amount === null && product && typeof product.unitPrice === "number") {
        amount = product.unitPrice;
        productName = product.name || productName;
        console.log("📝 [Payment] Using client-provided price:", amount);
      }

      // If still no valid amount, return 400
      if (!amount || typeof amount !== "number" || amount <= 0) {
        console.error("❌ [Payment] Invalid amount:", amount);
        return res.status(400).json({
          success: false,
          message: "Không xác định được số tiền thanh toán cho sản phẩm.",
        });
      }
    } catch (err) {
      console.error("❌ [Payment] Error resolving payment amount:", err);
      console.error("❌ [Payment] Error stack:", err.stack);
      return res.status(500).json({
        success: false,
        message: "Lỗi máy chủ khi xử lý thanh toán.",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }

    // Create order object for PayOS
    const order = {
      orderCode: orderCode,
      amount: amount,
      // PayOS giới hạn 25 ký tự cho description
      description: String(productName || "Thanh toán").slice(0, 25),
      returnUrl: `${
        process.env.FRONTEND_URL || "http://localhost:3000"
      }/payment-success`,
      cancelUrl: `${
        process.env.FRONTEND_URL || "http://localhost:3000"
      }/payment-cancel`,
    };

    console.log("📝 [Payment] Order object:", order);

    try {
      // Kiểm tra PayOS config
      if (!payOS) {
        console.error("❌ [Payment] PayOS is not initialized");
        throw new Error(
          "PayOS SDK chưa được khởi tạo. Vui lòng kiểm tra cấu hình PayOS."
        );
      }

      if (typeof payOS.paymentRequests?.create !== "function") {
        console.error(
          "❌ [Payment] PayOS.paymentRequests.create is not a function"
        );
        console.error("❌ [Payment] PayOS object keys:", Object.keys(payOS));
        throw new Error("PayOS SDK chưa được khởi tạo đúng cách.");
      }

      // Validate PayOS credentials
      if (
        !process.env.PAYOS_CLIENT_ID ||
        !process.env.PAYOS_API_KEY ||
        !process.env.PAYOS_CHECKSUM_KEY
      ) {
        console.error("❌ [Payment] Missing PayOS credentials");
        throw new Error(
          "Thiếu cấu hình PayOS. Vui lòng kiểm tra biến môi trường."
        );
      }

      console.log("📝 [Payment] Creating Payment record...");
      // Persist a Payment record before calling PayOS
      try {
        // Đảm bảo slotId là ObjectId hợp lệ hoặc null
        let validSlotId = null;
        if (slotId && mongoose.Types.ObjectId.isValid(slotId)) {
          validSlotId = new mongoose.Types.ObjectId(slotId);
        }

        paymentRecord = await Payment.create({
          orderCode: String(orderCode),
          vnp_txnref: String(orderCode),
          userId: req.user?.id
            ? new mongoose.Types.ObjectId(req.user.id)
            : null,
          slotId: validSlotId,
          amount,
          productName,
          status: "PENDING",
          metadata: {
            metadata: req.body.metadata || {},
            product: req.body.product || {},
          },
        });
        console.log("✅ [Payment] Payment record created:", paymentRecord._id);
      } catch (dbError) {
        console.error("❌ [Payment] Database error:", dbError);
        console.error("❌ [Payment] DB Error details:", dbError.message);
        throw new Error(`Không thể tạo payment record: ${dbError.message}`);
      }

      console.log("📝 [Payment] Calling PayOS API...");
      let paymentLink;
      try {
        paymentLink = await payOS.paymentRequests.create(order);
        console.log(
          "✅ [Payment] PayOS response received:",
          paymentLink.checkoutUrl ? "has checkoutUrl" : "no checkoutUrl"
        );
      } catch (payosError) {
        console.error("❌ [Payment] PayOS API error:", payosError);
        console.error("❌ [Payment] PayOS error message:", payosError.message);
        console.error(
          "❌ [Payment] PayOS error response:",
          payosError.response?.data || payosError.response
        );
        throw new Error(
          `Lỗi PayOS: ${payosError.message || "Không thể tạo link thanh toán"}`
        );
      }

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
        "✅ [Payment] Payment link created successfully for orderCode:",
        orderCode
      );
      return res.json(payload);
    } catch (error) {
      // Enhanced logging to help debug 500 errors
      console.error("❌ [Payment] Error creating payment link:", {
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
          console.log("⚠️ [Payment] Payment record marked as CANCELLED");
        }
      } catch (e2) {
        console.error(
          "❌ [Payment] Error updating paymentRecord after failure:",
          e2
        );
      }

      // Return a clearer message for the frontend
      const safeMessage =
        error && error.message
          ? error.message
          : "Lỗi máy chủ khi tạo link thanh toán";
      return res.status(500).json({
        success: false,
        message: `Không thể tạo link thanh toán: ${safeMessage}`,
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  } catch (error) {
    // Outer catch for any unexpected errors
    console.error("❌ [Payment] Unexpected error in createPaymentLink:", error);
    console.error("❌ [Payment] Error stack:", error.stack);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ không xác định khi tạo link thanh toán",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
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
        // PayOS can send either "PAID" or "COMPLETED" for successful payments
        // Check both the status and the response code
        // IMPORTANT: Some PayOS webhooks only send code='00' without data.status field
        const isSuccess = 
          (webhookData.code === "00" && webhookData.success === true) ||
          (webhookData.code === "00" &&
            webhookData.data?.status &&
            (status.toUpperCase() === "PAID" ||
              status.toUpperCase() === "COMPLETED" ||
              status.toUpperCase() === "SUCCESS" ||
              status.toUpperCase() === "PROCESSED" ||
              status === "00"));
        
        if (isSuccess) {
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

          if (!payment) {
            console.error("❌ Payment record not found for orderCode:", orderCode);
            return res.status(200).json({ success: true, message: "Payment not found but webhook received" });
          }

          console.log("🔍 Payment details:", {
            paymentId: payment._id.toString(),
            userId: payment.userId?.toString() || 'NULL',
            slotId: payment.slotId?.toString() || 'NULL',
            amount: payment.amount,
            status: payment.status
          });

          // Extract metadata early so both primary webhook flow and
          // offline-reconciliation flow can reuse the same variables.
          // This avoids ReferenceError when incomingContract is used
          // later in the primary success path.
          const rawMeta = payment?.metadata || {};
          const meta = rawMeta?.metadata || rawMeta;
          const incomingContract = meta?.contractData || null;
          const incomingStudentSignature = meta?.studentSignature || null;

          if (payment && payment.slotId) {
            console.log("✅ Payment has slotId - will create booking from slot:", payment.slotId.toString());
            // Get the teaching slot
            const slot = await TeachingSlot.findById(payment.slotId);
            if (slot) {
              console.log("📚 Found slot:", {
                slotId: slot._id.toString(),
                tutorProfile: slot.tutorProfile?.toString() || 'NULL',
                price: slot.price,
                status: slot.status,
                courseName: slot.courseName
              });
              // Update teaching slot status
              slot.status = "booked";
              slot.bookings = slot.bookings || [];
              slot.bookings.push({
                userId: payment.userId,
                paymentId: payment._id,
                bookedAt: new Date(),
              });
              await slot.save();
              console.log("✅ Slot status updated to 'booked':", slot._id.toString());

              // Create booking from slot (kiểm tra tránh duplicate)
              try {
                // Kiểm tra xem đã có booking từ slot này chưa
                const existingBooking = await Booking.findOne({
                  slotId: slot._id,
                  status: { $in: ["accepted", "pending", "completed"] },
                });

                if (existingBooking) {
                  console.log(
                    "⚠️ Booking already exists for this slot:",
                    existingBooking._id
                  );
                  // Không tạo booking mới nếu đã có, nhưng vẫn gửi notification
                  try {
                    const studentNotification =
                      await notifyStudentPaymentSuccess(existingBooking);
                    console.log(
                      "📧 Student payment success notification sent:",
                      studentNotification
                    );

                    const tutorNotification = await notifyTutorPaymentSuccess(
                      existingBooking
                    );
                    console.log(
                      "📧 Tutor payment success notification sent:",
                      tutorNotification
                    );
                  } catch (notificationError) {
                    console.error(
                      "❌ Failed to send payment notifications:",
                      notificationError
                    );
                  }
                } else {
                  console.log("🆕 No existing booking found - creating new booking...");
                  // Create booking from slot
                  const booking = await Booking.create({
                    tutorProfile: slot.tutorProfile,
                    student: payment.userId,
                    start: slot.start,
                    end: slot.end,
                    mode: slot.mode,
                    price: slot.price,
                    notes: `Đặt từ slot: ${slot.courseName}`,
                    slotId: slot._id,
                    status: "pending",
                    paymentStatus: "paid", // Đã thanh toán
                    // Attach contract data if present from payment metadata
                    contractData: incomingContract || undefined,
                    studentSignature: incomingStudentSignature || undefined,
                    studentSignedAt: incomingStudentSignature
                      ? new Date()
                      : undefined,
                    contractNumber: incomingContract
                      ? `HD-${Date.now()}`
                      : undefined,
                  });
                  console.log("✅ Booking created successfully:", {
                    bookingId: booking._id.toString(),
                    status: booking.status,
                    paymentStatus: booking.paymentStatus,
                    tutorProfile: booking.tutorProfile?.toString() || 'NULL',
                    student: booking.student?.toString() || 'NULL',
                    price: booking.price
                  });

                  // Notify tutor about new pending request with payment info (email + in-app)
                  try {
                    console.log("📧 Sending notifications to tutor...");
                    await notifyTutorBookingCreated(booking);
                    const tProfile = await TutorProfile.findById(
                      slot.tutorProfile
                    ).populate("user", "_id full_name");
                    if (tProfile?.user?._id) {
                      await Notification.create({
                        recipient: tProfile.user._id,
                        type: "booking_created",
                        title: "💰 Học viên đã thanh toán - Cần chấp nhận đơn",
                        message: `Học viên đã thanh toán ${(
                          slot.price || 0
                        ).toLocaleString()} VNĐ cho khóa học "${
                          slot.courseName || ""
                        }". Vui lòng xem hợp đồng và chấp nhận đơn.`,
                        link: `${
                          process.env.FRONTEND_URL || "http://localhost:3000"
                        }/bookings/tutor`,
                        data: {
                          bookingId: booking._id,
                          slotId: String(slot._id),
                          paymentAmount: slot.price,
                        },
                      });
                      console.log(
                        "✅ In-app notification sent to tutor about payment received - tutorUserId:",
                        tProfile.user._id.toString()
                      );
                    } else {
                      console.warn("⚠️ Could not find tutor user to send notification");
                    }
                  } catch (notificationError) {
                    console.error(
                      "❌ Failed to send booking created notifications:",
                      notificationError
                    );
                  }
                }
                } catch (bookingError) {
                console.error(
                  "❌ Error creating booking from slot:",
                  bookingError
                );
                console.error("❌ Booking error stack:", bookingError.stack);
                // Don't fail the payment processing if booking creation fails
              }
            } else {
              console.warn("⚠️ Slot not found for payment.slotId:", payment.slotId?.toString());
            }
          } else {
            console.warn("⚠️ Payment record has no slotId - cannot create booking. PaymentId:", payment?._id?.toString());
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
    // If authentication middleware sets req.user.id, filter by that user
    if (req.user && req.user.id) {
      filter.userId = req.user.id;
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
      req.user.id &&
      payment.userId &&
      String(payment.userId) !== String(req.user.id)
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
      req.user.id &&
      payment.userId &&
      String(payment.userId) !== String(req.user.id)
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
    let { orderCode } = req.params;
    if (orderCode) orderCode = String(orderCode).trim();
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
      const numericOrder = Number(orderCode);
      console.log(
        "🔍 [Verify] Checking PayOS status for orderCode:",
        orderCode,
        "numeric:",
        numericOrder
      );

      const paymentStatus = await payOS.paymentRequests.getStatus(
        Number.isFinite(numericOrder) ? numericOrder : orderCode
      );

      console.log(
        "📋 [Verify] PayOS status check result (full):",
        JSON.stringify(paymentStatus, null, 2)
      );
      console.log("📋 [Verify] PaymentStatus.code:", paymentStatus?.code);
      console.log("📋 [Verify] PaymentStatus.data:", paymentStatus?.data);
      console.log(
        "📋 [Verify] PaymentStatus.data?.status:",
        paymentStatus?.data?.status
      );
      console.log("📋 [Verify] PaymentStatus.status:", paymentStatus?.status);

      // Mở rộng điều kiện kiểm tra: kiểm tra nhiều format response từ PayOS
      const statusCode = String(paymentStatus?.code || "").toUpperCase();
      const dataStatus = String(
        paymentStatus?.data?.status || ""
      ).toUpperCase();
      const directStatus = String(paymentStatus?.status || "").toUpperCase();
      const responseCode = String(
        paymentStatus?.responseCode || ""
      ).toUpperCase();

      console.log("🔍 [Verify] Parsed statuses:", {
        statusCode,
        dataStatus,
        directStatus,
        responseCode,
      });

      // Kiểm tra nhiều điều kiện success
      const isSuccess =
        // Điều kiện 1: code === "00" và status là PAID/COMPLETED/SUCCESS
        (statusCode === "00" &&
          (dataStatus === "PAID" ||
            dataStatus === "COMPLETED" ||
            dataStatus === "SUCCESS" ||
            dataStatus === "PROCESSED" ||
            dataStatus === "00")) ||
        // Điều kiện 2: responseCode === "00"
        responseCode === "00" ||
        // Điều kiện 3: directStatus là success
        directStatus === "PAID" ||
        directStatus === "COMPLETED" ||
        directStatus === "SUCCESS" ||
        // Điều kiện 4: có checkoutUrl và không có lỗi
        (paymentStatus?.checkoutUrl && !paymentStatus?.error);

      console.log("🔍 [Verify] Is success?", isSuccess);

      if (paymentStatus && isSuccess) {
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

            // Create booking from slot if not exists (kiểm tra tránh duplicate)
            const existingBooking = await Booking.findOne({
              slotId: slot._id,
              status: { $in: ["accepted", "pending", "completed"] },
            });
            if (!existingBooking) {
              try {
                // Create booking without escrow calculation
                const booking = await Booking.create({
                  tutorProfile: slot.tutorProfile,
                  student: payment.userId,
                  start: slot.start,
                  end: slot.end,
                  mode: slot.mode,
                  price: slot.price,
                  notes: `Đặt từ slot: ${slot.courseName}`,
                  slotId: slot._id,
                  status: "pending",
                });
                // Notify tutor of new pending request with payment info (email + in-app)
                try {
                  await notifyTutorBookingCreated(booking);
                  const tProfile = await TutorProfile.findById(
                    slot.tutorProfile
                  ).populate("user", "_id full_name");
                  if (tProfile?.user?._id) {
                    await Notification.create({
                      recipient: tProfile.user._id,
                      type: "booking_created",
                      title: "💰 Học viên đã thanh toán - Cần chấp nhận đơn",
                      message: `Học viên đã thanh toán ${(
                        slot.price || 0
                      ).toLocaleString()} VNĐ cho khóa học "${
                        slot.courseName || ""
                      }". Vui lòng xem hợp đồng và chấp nhận đơn.`,
                      link: `${
                        process.env.FRONTEND_URL || "http://localhost:3000"
                      }/bookings/tutor`,
                      data: {
                        bookingId: booking._id,
                        slotId: String(slot._id),
                        paymentAmount: slot.price,
                      },
                    });
                    console.log(
                      "✅ In-app notification sent to tutor about payment received"
                    );
                  }
                } catch (notificationError) {
                  console.error(
                    "❌ Failed to send booking created notifications:",
                    notificationError
                  );
                }
              } catch (bookingError) {
                console.error(
                  "❌ Error creating booking from slot:",
                  bookingError
                );
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

      // Return current status (and attempt offline reconciliation)
      // Fallback: if we previously received a successful webhook for this order, trust local record
      console.log(
        "⚠️ [Verify] PayOS response không match điều kiện success, kiểm tra offline reconciliation..."
      );
      console.log("⚠️ [Verify] Payment.paymentData:", payment.paymentData);

      const localCode = String(payment.paymentData?.code || "").toUpperCase();
      const localDataStatus = String(
        payment.paymentData?.data?.status || ""
      ).toUpperCase();
      const localDirectStatus = String(
        payment.paymentData?.status || ""
      ).toUpperCase();
      const localResponseCode = String(
        payment.paymentData?.responseCode || ""
      ).toUpperCase();

      console.log("🔍 [Verify] Local statuses:", {
        localCode,
        localDataStatus,
        localDirectStatus,
        localResponseCode,
      });

      const localSuccess =
        localCode === "00" ||
        localResponseCode === "00" ||
        ["PAID", "COMPLETED", "SUCCESS", "PROCESSED"].includes(
          localDataStatus
        ) ||
        ["PAID", "COMPLETED", "SUCCESS", "PROCESSED"].includes(
          localDirectStatus
        );

      console.log(
        "🔍 [Verify] Local success?",
        localSuccess,
        "Current status:",
        payment.status
      );

      if (localSuccess && payment.status !== "PAID") {
        console.log(
          "✅ [Verify] Offline reconciliation: Updating status to PAID"
        );
        payment.status = "PAID";
        payment.paidAt = payment.paidAt || new Date();
        payment.paymentData = payment.paymentData || paymentStatus; // Update với data mới nhất
        await payment.save();

        // Trigger booking creation nếu chưa có
        if (payment.slotId) {
          try {
            const slot = await TeachingSlot.findById(payment.slotId);
            if (slot) {
              const existingBooking = await Booking.findOne({
                slotId: slot._id,
                status: { $in: ["accepted", "pending", "completed"] },
              });
              if (!existingBooking) {
                // Extract contract metadata if provided during payment creation
                const rawMeta = payment?.metadata || {};
                const meta = rawMeta?.metadata || rawMeta;
                const incomingContract = meta?.contractData || null;
                const incomingStudentSignature = meta?.studentSignature || null;
                
                const booking = await Booking.create({
                  tutorProfile: slot.tutorProfile,
                  student: payment.userId,
                  start: slot.start,
                  end: slot.end,
                  mode: slot.mode,
                  price: slot.price,
                  notes: `Đặt từ slot: ${slot.courseName}`,
                  slotId: slot._id,
                  status: "pending",
                  paymentStatus: "paid", // Đã thanh toán
                  contractData: incomingContract || undefined,
                  studentSignature: incomingStudentSignature || undefined,
                  studentSignedAt: incomingStudentSignature ? new Date() : undefined,
                  contractNumber: incomingContract ? `HD-${Date.now()}` : undefined,
                });
                await notifyTutorBookingCreated(booking);
                console.log(
                  "✅ [Verify] Booking created from offline reconciliation"
                );
              }
            }
          } catch (bookingError) {
            console.error(
              "❌ [Verify] Error creating booking in offline reconciliation:",
              bookingError
            );
          }
        }
      }

      return res.json({
        success: true,
        status: payment.status,
        message:
          payment.status === "PAID"
            ? "Thanh toán đã được xác nhận (offline reconciliation)"
            : "Trạng thái thanh toán hiện tại",
        paymentStatus: paymentStatus, // Trả về để frontend có thể debug
      });
    } catch (verifyError) {
      console.error("❌ [Verify] Error verifying with PayOS:", verifyError);
      console.error("❌ [Verify] Error message:", verifyError.message);
      console.error("❌ [Verify] Error stack:", verifyError.stack);

      // As a last resort, try to reconcile using local webhook data
      console.log(
        "🔍 [Verify] Attempting offline reconciliation from error handler..."
      );
      const localCode = String(payment.paymentData?.code || "").toUpperCase();
      const localDataStatus = String(
        payment.paymentData?.data?.status || ""
      ).toUpperCase();
      const localDirectStatus = String(
        payment.paymentData?.status || ""
      ).toUpperCase();
      const localResponseCode = String(
        payment.paymentData?.responseCode || ""
      ).toUpperCase();

      const localSuccess =
        localCode === "00" ||
        localResponseCode === "00" ||
        ["PAID", "COMPLETED", "SUCCESS", "PROCESSED"].includes(
          localDataStatus
        ) ||
        ["PAID", "COMPLETED", "SUCCESS", "PROCESSED"].includes(
          localDirectStatus
        );

      if (localSuccess && payment.status !== "PAID") {
        console.log(
          "✅ [Verify] Offline reconciliation (error handler): Updating status to PAID"
        );
        payment.status = "PAID";
        payment.paidAt = payment.paidAt || new Date();
        await payment.save();
      }

      return res.json({
        success: true,
        status: payment.status,
        message:
          payment.status === "PAID"
            ? "Thanh toán đã được xác nhận (offline reconciliation)"
            : "Không thể kiểm tra trạng thái với PayOS. Vui lòng thử lại sau.",
        error:
          process.env.NODE_ENV === "development"
            ? verifyError.message
            : undefined,
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
