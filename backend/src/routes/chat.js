const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middlewares/auth");
const chatController = require("../controllers/chatController");

// POST /api/chat/initiate - Tạo hoặc lấy conversation
router.post("/initiate", authenticateToken, chatController.initiateConversation);

// GET /api/chat/conversations - Lấy danh sách conversations
router.get("/conversations", authenticateToken, chatController.getConversations);

// GET /api/chat/messages - Lấy lịch sử tin nhắn
router.get("/messages", authenticateToken, chatController.getMessages);

// POST /api/chat/mark-read - Đánh dấu tin nhắn đã đọc
router.post("/mark-read", authenticateToken, chatController.markAsRead);

module.exports = router;

