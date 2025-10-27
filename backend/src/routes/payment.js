const express = require("express");
const {
  createPaymentLink,
  receiveWebhook,
  verifyPayment,
  listPayments,
  getPaymentById,
  cancelPayment,
} = require("../controllers/paymentController");

const router = express.Router();

// Endpoint để frontend gọi để tạo link thanh toán
router.post("/create-payment-link", createPaymentLink);

// Endpoint để PayOS gọi về (webhook)
// Lưu ý: URL này bạn cần phải cấu hình trong Dashboard của PayOS
router.post("/payos-webhook", receiveWebhook);

// Frontend: list payments for the current user (requires auth middleware upstream)
router.get("/", listPayments);
// Verify payment status with PayOS
router.get("/verify/:orderCode", verifyPayment);

// Get single payment detail
router.get("/:id", getPaymentById);

// Cancel a payment
router.post("/:id/cancel", cancelPayment);

module.exports = router;
