const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    // Mảng chứa ID của 2 người tham gia (1 learner, 1 tutor)
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    // Đánh dấu loại conversation (learner-tutor)
    type: {
      type: String,
      enum: ["learner-tutor", "group"],
      default: "learner-tutor",
    },
    // Tin nhắn cuối cùng để sắp xếp danh sách
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    // Tin nhắn cuối cùng (preview)
    lastMessage: {
      type: String,
      default: null,
    },
    // Đánh dấu conversation có bị xóa không
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index để tìm conversation nhanh hơn
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ participants: 1, type: 1 });

// Static method: Tìm hoặc tạo conversation giữa 2 users
conversationSchema.statics.findOrCreate = async function (
  participant1Id,
  participant2Id
) {
  const mongoose = require("mongoose");
  
  // Convert sang ObjectId nếu cần
  const p1 = mongoose.Types.ObjectId.isValid(participant1Id) 
    ? new mongoose.Types.ObjectId(participant1Id) 
    : participant1Id;
  const p2 = mongoose.Types.ObjectId.isValid(participant2Id) 
    ? new mongoose.Types.ObjectId(participant2Id) 
    : participant2Id;
  
  // Đảm bảo thứ tự participants để tránh duplicate
  // So sánh string representation để sort
  const participants = [String(p1), String(p2)].sort().map(id => {
    return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;
  });

  console.log("🔍 findOrCreate: Looking for conversation with participants:", participants.map(p => String(p)));

  let conversation = await this.findOne({
    participants: { $all: participants },
    isDeleted: false,
  }).populate("participants", "full_name email profile");

  if (!conversation) {
    console.log("✅ findOrCreate: Creating new conversation");
    conversation = await this.create({
      participants: participants,
      type: "learner-tutor",
    });
    // Populate sau khi tạo
    await conversation.populate("participants", "full_name email profile");
    console.log("✅ findOrCreate: Created conversation:", conversation._id);
  } else {
    console.log("✅ findOrCreate: Found existing conversation:", conversation._id);
  }

  return conversation;
};

// Static method: Lấy danh sách conversations của một user
conversationSchema.statics.getUserConversations = async function (userId) {
  const mongoose = require("mongoose");
  
  // Convert userId to ObjectId nếu cần
  let userIdObj;
  try {
    if (mongoose.Types.ObjectId.isValid(userId)) {
      userIdObj = new mongoose.Types.ObjectId(userId);
    } else {
      userIdObj = userId;
    }
  } catch (e) {
    userIdObj = userId;
  }
  
  console.log("🔍 getUserConversations: Querying for userId:", userId, "as ObjectId:", userIdObj);
  
  // Với array field participants, dùng $in để match bất kỳ giá trị nào trong array
  // Nhưng cần query với ObjectId để match đúng
  const conversations = await this.find({
    participants: userIdObj, // Match ObjectId trong array
    isDeleted: false,
  })
    .populate("participants", "full_name email profile")
    .sort({ lastMessageAt: -1 })
    .lean();
  
  console.log(`✅ getUserConversations: Found ${conversations.length} conversations`);
  
  // Nếu không tìm thấy với ObjectId, thử với string
  if (conversations.length === 0 && String(userIdObj) !== String(userId)) {
    console.log("🔍 getUserConversations: Retrying with string userId");
    const conversationsByString = await this.find({
      participants: userId,
      isDeleted: false,
    })
      .populate("participants", "full_name email profile")
      .sort({ lastMessageAt: -1 })
      .lean();
    
    console.log(`✅ getUserConversations: Found ${conversationsByString.length} conversations with string`);
    return conversationsByString;
  }
  
  return conversations;
};

// Instance method: Lấy user còn lại (không phải userId)
conversationSchema.methods.getOtherParticipant = function (userId) {
  const userIdStr = String(userId);
  return this.participants.find(
    (p) => String(p._id || p) !== userIdStr
  );
};

// Pre-save: Đảm bảo participants là array có 2 phần tử
conversationSchema.pre("save", function (next) {
  if (this.participants.length !== 2) {
    return next(new Error("Conversation must have exactly 2 participants"));
  }
  // Sort participants để tránh duplicate
  this.participants.sort();
  next();
});

module.exports = mongoose.model("Conversation", conversationSchema);

