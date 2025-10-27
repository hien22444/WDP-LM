const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    index: true
  },
  senderId: {
    type: String,
    required: true,
    index: true
  },
  senderName: {
    type: String,
    required: true
  },
  receiverId: {
    type: String,
    required: true,
    index: true
  },
  message: {
    type: String,
    required: true,
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
messageSchema.index({ roomId: 1, timestamp: -1 });
messageSchema.index({ senderId: 1, timestamp: -1 });
messageSchema.index({ receiverId: 1, timestamp: -1 });
messageSchema.index({ isRead: 1, receiverId: 1 });

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

// Static method to get messages for a room
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

// Static method to mark messages as read
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
  if (this.isModified('message') && !this.isNew) {
    this.isEdited = true;
    this.editedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Message', messageSchema);
