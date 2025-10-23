const router = require("express").Router();
const { auth } = require("../middlewares/auth");
const Notification = require("../models/Notification");

// Get all notifications for current user
router.get("/", auth(), async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ 
      success: false, 
      message: "Không thể tải thông báo" 
    });
  }
});

// Get unread count
router.get("/unread-count", auth(), async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      recipient: req.user.id, 
      read: false 
    });
    
    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ 
      success: false, 
      message: "Không thể tải số thông báo chưa đọc" 
    });
  }
});

// Mark notification as read
router.patch("/:id/read", auth(), async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy thông báo" 
      });
    }

    res.json({
      success: true,
      notification
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ 
      success: false, 
      message: "Không thể đánh dấu thông báo đã đọc" 
    });
  }
});

// Mark all notifications as read
router.patch("/mark-all-read", auth(), async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { read: true }
    );

    res.json({
      success: true,
      message: "Đã đánh dấu tất cả thông báo là đã đọc"
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ 
      success: false, 
      message: "Không thể đánh dấu tất cả thông báo đã đọc" 
    });
  }
});

// Delete notification
router.delete("/:id", auth(), async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user.id
    });

    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy thông báo" 
      });
    }

    res.json({
      success: true,
      message: "Đã xóa thông báo"
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ 
      success: false, 
      message: "Không thể xóa thông báo" 
    });
  }
});

module.exports = router;
