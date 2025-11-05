const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");

// POST /api/chat/initiate - Tạo hoặc lấy conversation giữa learner và tutor
exports.initiateConversation = async (req, res) => {
  try {
    const { tutorId } = req.body;
    const learnerId = req.user._id || req.user.id || req.user.userId;

    if (!tutorId) {
      return res.status(400).json({ message: "tutorId là bắt buộc" });
    }

    // Kiểm tra tutor có tồn tại không
    const tutor = await User.findById(tutorId);
    if (!tutor) {
      return res.status(404).json({ message: "Không tìm thấy gia sư" });
    }

    // Kiểm tra user có phải là learner không
    const learner = await User.findById(learnerId);
    if (!learner || learner.role !== "learner") {
      return res.status(403).json({ message: "Chỉ học sinh mới có thể liên hệ gia sư" });
    }

    // Kiểm tra tutor có phải là tutor không
    if (tutor.role !== "tutor") {
      return res.status(400).json({ message: "Người dùng này không phải là gia sư" });
    }

    // Tìm hoặc tạo conversation
    const conversation = await Conversation.findOrCreate(learnerId, tutorId);

    // Lấy thông tin người tham gia
    const otherParticipant = conversation.getOtherParticipant(learnerId);
    const otherUser = await User.findById(otherParticipant)
      .select("full_name email profile")
      .lean();

    res.json({
      success: true,
      conversation: {
        _id: conversation._id,
        participants: conversation.participants,
        lastMessage: conversation.lastMessage,
        lastMessageAt: conversation.lastMessageAt,
        otherParticipant: otherUser,
      },
    });
  } catch (error) {
    console.error("Error initiating conversation:", error);
    res.status(500).json({ message: "Lỗi server khi tạo conversation" });
  }
};

// GET /api/chat/conversations - Lấy danh sách conversations của user hiện tại
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id || req.user.userId;
    
    console.log("🔍 getConversations called for userId:", userId);
    console.log("🔍 req.user:", {
      _id: req.user._id,
      id: req.user.id,
      userId: req.user.userId,
      role: req.user.role,
    });

    if (!userId) {
      console.error("❌ No userId found in req.user");
      return res.status(400).json({ 
        success: false,
        message: "User ID not found",
        conversations: [] 
      });
    }

    // Lấy tất cả conversations của user
    const conversations = await Conversation.getUserConversations(userId);
    console.log(`✅ Found ${conversations.length} conversations for user ${userId}`);

    // Lấy thông tin chi tiết cho mỗi conversation
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        // Lấy user còn lại
        const otherParticipantId = conv.participants.find(
          (p) => String(p._id) !== String(userId)
        )?._id;

        if (!otherParticipantId) return null;

        // Lấy tin nhắn cuối cùng
        const lastMessage = await Message.findOne({
          conversationId: conv._id,
          isDeleted: false,
        })
          .sort({ timestamp: -1 })
          .lean();

        // Đếm số tin nhắn chưa đọc
        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          receiverId: userId,
          isRead: false,
          isDeleted: false,
        });

        // Lấy thông tin user còn lại
        const otherUser = await User.findById(otherParticipantId)
          .select("full_name email profile")
          .lean();

        return {
          _id: conv._id,
          otherParticipant: otherUser,
          lastMessage: lastMessage
            ? {
                _id: lastMessage._id,
                content: lastMessage.message || lastMessage.content,
                senderId: lastMessage.senderId,
                timestamp: lastMessage.timestamp,
                isRead: lastMessage.isRead,
              }
            : null,
          unreadCount,
          lastMessageAt: conv.lastMessageAt || conv.createdAt,
        };
      })
    );

    // Lọc null và sắp xếp theo thời gian tin nhắn cuối
    const validConversations = conversationsWithDetails
      .filter((c) => c !== null)
      .sort((a, b) => {
        const timeA = new Date(a.lastMessageAt).getTime();
        const timeB = new Date(b.lastMessageAt).getTime();
        return timeB - timeA;
      });

    console.log(`✅ Returning ${validConversations.length} valid conversations`);
    console.log("🔍 Sample conversation:", validConversations[0] ? {
      _id: validConversations[0]._id,
      otherParticipant: validConversations[0].otherParticipant?._id,
      hasLastMessage: !!validConversations[0].lastMessage,
      unreadCount: validConversations[0].unreadCount,
    } : "No conversations");

    res.json({
      success: true,
      conversations: validConversations,
    });
  } catch (error) {
    console.error("Error getting conversations:", error);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách conversations" });
  }
};

// GET /api/chat/messages - Lấy lịch sử tin nhắn của một conversation
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.query;
    const userId = req.user._id || req.user.id || req.user.userId;

    if (!conversationId) {
      return res.status(400).json({ message: "conversationId là bắt buộc" });
    }

    // Kiểm tra user có quyền truy cập conversation này không
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Không tìm thấy conversation" });
    }

    // BẢO MẬT: Kiểm tra user có trong participants không
    const isParticipant = conversation.participants.some(
      (p) => String(p._id || p) === String(userId)
    );

    if (!isParticipant) {
      return res.status(403).json({ message: "Không có quyền truy cập conversation này" });
    }

    // Lấy tin nhắn
    const limit = parseInt(req.query.limit) || 50;
    const skip = parseInt(req.query.skip) || 0;

    const messages = await Message.getConversationMessages(conversationId, limit, skip);

    // Đánh dấu tin nhắn là đã đọc
    await Message.markAsReadByConversation(conversationId, userId);

    res.json({
      success: true,
      messages: messages.map((msg) => ({
        _id: msg._id,
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        content: msg.message || msg.content,
        message: msg.message || msg.content, // Backward compatibility
        timestamp: msg.timestamp,
        isRead: true, // Đã đánh dấu đọc ở trên
        messageType: msg.messageType,
      })),
    });
  } catch (error) {
    console.error("Error getting messages:", error);
    res.status(500).json({ message: "Lỗi server khi lấy tin nhắn" });
  }
};

// POST /api/chat/mark-read - Đánh dấu tin nhắn là đã đọc
exports.markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.body;
    const userId = req.user._id || req.user.id || req.user.userId;

    if (!conversationId) {
      return res.status(400).json({ message: "conversationId là bắt buộc" });
    }

    // Kiểm tra quyền truy cập
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Không tìm thấy conversation" });
    }

    const isParticipant = conversation.participants.some(
      (p) => String(p._id || p) === String(userId)
    );

    if (!isParticipant) {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }

    // Đánh dấu đọc
    await Message.markAsReadByConversation(conversationId, userId);

    res.json({ success: true, message: "Đã đánh dấu đọc" });
  } catch (error) {
    console.error("Error marking as read:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

