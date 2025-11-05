const express = require("express");
const {
  createPaymentLink,
  receiveWebhook,
  verifyPayment,
  listPayments,
  getPaymentById,
  cancelPayment,
} = require("../controllers/paymentController");
const { auth } = require("../middlewares/auth");

const router = express.Router();

// Endpoint để frontend gọi để tạo link thanh toán (cần auth)
router.post("/create-payment-link", auth(), createPaymentLink);

// Endpoint để PayOS gọi về (webhook) - không cần auth
// Lưu ý: URL này bạn cần phải cấu hình trong Dashboard của PayOS
router.post("/payos-webhook", receiveWebhook);

// Frontend: list payments for the current user (cần auth)
router.get("/", auth(), listPayments);
// Verify payment status with PayOS (có thể public hoặc cần auth)
router.get("/verify/:orderCode", verifyPayment);

// Get single payment detail (cần auth)
router.get("/:id", auth(), getPaymentById);

// Cancel a payment (cần auth)
router.post("/:id/cancel", auth(), cancelPayment);

module.exports = router;
