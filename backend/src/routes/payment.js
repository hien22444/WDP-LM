const express = require("express");
const {
  createPaymentLink,
  receiveWebhook,
} = require("../controllers/paymentController");

const router = express.Router();

// Endpoint để frontend gọi để tạo link thanh toán
router.post("/create-payment-link", createPaymentLink);

// Endpoint để PayOS gọi về (webhook)
// Lưu ý: URL này bạn cần phải cấu hình trong Dashboard của PayOS
router.post("/payos-webhook", receiveWebhook);

module.exports = router;
