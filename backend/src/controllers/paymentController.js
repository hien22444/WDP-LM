const payOS = require("../config/payos");

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

  const order = {
    orderCode: orderCode, // Mã đơn hàng duy nhất, là số nguyên
    amount: 2000,
    description: "Thanh toán đơn hàng WDP-LM",
    returnUrl: `${process.env.FRONTEND_URL}/payment-success`,
    cancelUrl: `${process.env.FRONTEND_URL}/payment-cancel`,
    // partnerReference: `WDP-${orderCode}`, // Không bắt buộc, có thể thêm nếu cần
  };

  try {
    if (!payOS || typeof payOS.paymentRequests.create !== "function") {
      throw new Error("PayOS SDK chưa được khởi tạo đúng cách.");
    }

    console.log("Creating payment link with order:", order);
    const paymentLink = await payOS.paymentRequests.create(order);

    const payload = {
      success: true,
      checkoutUrl: paymentLink.checkoutUrl,
      qrUrl: paymentLink.qrUrl || null,
      qrBase64: paymentLink.qrBase64 || null,
    };

    console.log(
      "✅ Payment link created successfully for orderCode:",
      orderCode
    );
    return res.json(payload);
  } catch (error) {
    // IMPROVEMENT: Log toàn bộ lỗi để có nhiều thông tin debug hơn
    console.error("❌ Lỗi tạo link thanh toán:", error);

    // Trả về cấu trúc lỗi chuẩn cho client
    return res.status(500).json({
      success: false,
      message: error.message || "Đã xảy ra lỗi không mong muốn.",
      // Có thể thêm error.code nếu API trả về
      errorCode: error.code || null,
    });
  }
};

// Nhận webhook từ PayOS
const receiveWebhook = async (req, res) => {
  try {
    const webhookData = req.body;
    console.log("📩 Webhook received:", webhookData);

    // TODO: Thêm logic xác thực webhook (nếu PayOS cung cấp checksum)

    // TODO: XỬ LÝ LOGIC KINH DOANH TẠI ĐÂY
    // Dựa vào `webhookData`, đặc biệt là `data.orderCode` và `data.status`
    // 1. Tìm đơn hàng trong database của bạn với `webhookData.data.orderCode`.
    // 2. Kiểm tra trạng thái thanh toán (`webhookData.data.status === 'PAID'`).
    // 3. Nếu đã thanh toán thành công, cập nhật trạng thái đơn hàng trong database.
    // 4. Có thể gửi email xác nhận cho khách hàng.

    // Ví dụ logic:
    if (webhookData.code === "00" && webhookData.data) {
      const orderCode = webhookData.data.orderCode;
      const status = webhookData.data.status;

      if (status === "PAID") {
        console.log(`✅ Order ${orderCode} has been paid successfully.`);
        // await OrderModel.updateOne({ code: orderCode }, { status: 'PAID' });
      } else {
        console.log(`❕ Order ${orderCode} status is: ${status}`);
        // await OrderModel.updateOne({ code: orderCode }, { status: 'CANCELLED' });
      }
    }

    // Luôn trả về status 200 cho PayOS để xác nhận đã nhận được webhook
    res.status(200).json({ success: true, message: "Webhook received" });
  } catch (error) {
    console.error("⚠️ Lỗi xử lý webhook:", error);
    // Trả về lỗi để PayOS có thể thử gửi lại (nếu có cơ chế retry)
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  createPaymentLink,
  receiveWebhook,
};
