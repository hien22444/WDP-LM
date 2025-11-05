const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // ID của conversation (phòng chat) mà tin nhắn này thuộc về
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  // Backward compatibility: giữ roomId để migrate dần
  roomId: {
    type: String,
    index: true,
    sparse: true // Cho phép null
  },
  // ID của người gửi (ObjectId reference)
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  senderName: {
    type: String,
    required: true
  },
  // ID của người nhận (ObjectId reference)
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Nội dung tin nhắn (giữ tên field 'message' để backward compatibility)
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  // Alias cho message để code mới dễ đọc hơn (tự động sync với message)
  content: {
    type: String,
    maxlength: 1000
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  editedAt: {
    type: Date
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better performance
messageSchema.index({ conversationId: 1, timestamp: -1 });
messageSchema.index({ roomId: 1, timestamp: -1 }); // Backward compatibility
messageSchema.index({ senderId: 1, timestamp: -1 });
messageSchema.index({ receiverId: 1, timestamp: -1 });
messageSchema.index({ isRead: 1, receiverId: 1 });
messageSchema.index({ conversationId: 1, isRead: 1 });

// Virtual for formatted timestamp
messageSchema.virtual('formattedTime').get(function() {
  return this.timestamp.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Virtual for formatted date
messageSchema.virtual('formattedDate').get(function() {
  return this.timestamp.toLocaleDateString('vi-VN');
});

// Static method to get messages for a conversation
messageSchema.statics.getConversationMessages = async function(conversationId, limit = 50, skip = 0) {
  return this.find({
    conversationId,
    isDeleted: false
  })
  .sort({ timestamp: 1 }) // Sắp xếp từ cũ đến mới
  .limit(limit)
  .skip(skip)
  .populate('senderId', 'full_name email profile')
  .populate('receiverId', 'full_name email profile')
  .lean();
};

// Static method to get messages for a room (backward compatibility)
messageSchema.statics.getRoomMessages = async function(roomId, limit = 50, skip = 0) {
  return this.find({
    roomId,
    isDeleted: false
  })
  .sort({ timestamp: -1 })
  .limit(limit)
  .skip(skip)
  .lean();
};

// Static method to mark messages as read (by conversation)
messageSchema.statics.markAsReadByConversation = async function(conversationId, userId) {
  return this.updateMany(
    {
      conversationId,
      receiverId: userId,
      isRead: false
    },
    {
      $set: {
        isRead: true,
        readAt: new Date()
      }
    }
  );
};

// Static method to mark messages as read (by roomId - backward compatibility)
messageSchema.statics.markAsRead = async function(roomId, userId) {
  return this.updateMany(
    {
      roomId,
      receiverId: userId,
      isRead: false
    },
    {
      $set: {
        isRead: true,
        readAt: new Date()
      }
    }
  );
};

// Static method to get unread count
messageSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({
    receiverId: userId,
    isRead: false,
    isDeleted: false
  });
};

// Instance method to mark as read
messageSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Instance method to soft delete
messageSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Pre-save middleware
messageSchema.pre('save', function(next) {
  // Sync content với message để backward compatibility
  if (this.isNew && this.message && !this.content) {
    this.content = this.message;
  }
  if (this.isNew && this.content && !this.message) {
    this.message = this.content;
  }
  
  if (this.isModified('message') || this.isModified('content')) {
    if (!this.isNew) {
      this.isEdited = true;
      this.editedAt = new Date();
    }
  }
  next();
});

module.exports = mongoose.model('Message', messageSchema);
