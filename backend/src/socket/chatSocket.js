const Message = require('../models/Message');

class ChatSocket {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map();
    this.userRooms = new Map();
    this.typingUsers = new Map();
  }

  initializeChatNamespace() {
    // Create a dedicated chat namespace
    const chatNamespace = this.io.of('/chat');
    
    chatNamespace.on('connection', (socket) => {
      console.log(`Chat user connected: ${socket.id}`);
      
      // Handle user authentication
      socket.on('authenticate', (data) => {
        const { userId, userName, userRole } = data;
        socket.userId = userId;
        socket.userName = userName;
        socket.userRole = userRole;
        
        // Store socketId on socket for easy lookup
        socket.socketId = socket.id;
        
        this.connectedUsers.set(userId, {
          socketId: socket.id,
          userName,
          userRole,
          connectedAt: new Date()
        });
        
        console.log(`User authenticated: ${userName} (${userId})`);
        socket.emit('authenticated', { success: true });
      });

      // Handle joining chat room
      socket.on('join_chat_room', async (data) => {
        const { roomId, tutorId } = data;
        
        if (!socket.userId) {
          socket.emit('error', { message: 'User not authenticated' });
          return;
        }

        try {
          // Join socket room
          socket.join(roomId);
          this.userRooms.set(socket.userId, roomId);
          
          // Load chat history
          const messages = await Message.find({
            roomId: roomId
          }).sort({ timestamp: 1 }).limit(50);
          
          socket.emit('chat_history', messages);
          
          // Notify other users in room
          socket.to(roomId).emit('user_joined', {
            userId: socket.userId,
            userName: socket.userName
          });
          
          console.log(`User ${socket.userName} joined room ${roomId}`);
        } catch (error) {
          console.error('Error joining chat room:', error);
          socket.emit('error', { message: 'Failed to join chat room' });
        }
      });

      // Handle sending messages
      socket.on('send_message', async (data) => {
        const { message, receiverId, roomId } = data;
        
        if (!socket.userId) {
          socket.emit('error', { message: 'User not authenticated' });
          return;
        }

        try {
          // Save message to database
          const newMessage = new Message({
            roomId,
            senderId: socket.userId,
            senderName: socket.userName,
            receiverId,
            message: message.trim(),
            timestamp: new Date()
          });
          
          await newMessage.save();
          
        const messageData = {
          _id: newMessage._id,
          roomId,
          senderId: socket.userId,
          senderName: socket.userName,
          receiverId,
          message: message.trim(),
          timestamp: newMessage.timestamp
        };
        
        // Broadcast to room for chat widget
        chatNamespace.to(roomId).emit('chat_message', messageData);
        
        // IMPORTANT: Also emit directly to receiver socket for notifications
        // Find all sockets for this receiver (they might have multiple tabs)
        console.log(`🔍 Looking for receiver ${receiverId} in connected sockets:`);
        let notificationSent = false;
        chatNamespace.sockets.forEach((receiverSocket) => {
          console.log(`  Socket ${receiverSocket.id}: userId=${receiverSocket.userId}, userName=${receiverSocket.userName}`);
          // Use String() to ensure type-safe comparison
          if (String(receiverSocket.userId) === String(receiverId)) {
            receiverSocket.emit('new_chat_message', messageData);
            console.log(`✅ Notified receiver ${receiverId} (socket ${receiverSocket.id}) for notification`);
            notificationSent = true;
          }
        });
        
        if (!notificationSent) {
          console.log(`❌ No socket found for receiver ${receiverId}. Available sockets:`);
          chatNamespace.sockets.forEach((socket) => {
            console.log(`  - Socket ${socket.id}: userId=${socket.userId} (type: ${typeof socket.userId})`);
          });
        }
        
        console.log(`Broadcasting message to room ${roomId}:`, {
          senderId: socket.userId,
          senderName: socket.userName,
          receiverId,
          message: message.trim()
        });
          
          console.log(`Message sent in room ${roomId} by ${socket.userName}`);
        } catch (error) {
          console.error('Error sending message:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Handle typing indicators
      socket.on('typing', (data) => {
        const { isTyping, roomId } = data;
        
        if (!socket.userId) return;
        
        if (isTyping) {
          this.typingUsers.set(socket.userId, {
            roomId,
            timestamp: new Date()
          });
        } else {
          this.typingUsers.delete(socket.userId);
        }
        
        // Broadcast typing status to room
        socket.to(roomId).emit('user_typing', {
          userId: socket.userId,
          userName: socket.userName,
          isTyping
        });
      });

      // Handle user status updates
      socket.on('update_status', (data) => {
        const { status } = data;
        if (socket.userId) {
          const user = this.connectedUsers.get(socket.userId);
          if (user) {
            user.status = status;
            user.lastSeen = new Date();
          }
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`Chat user disconnected: ${socket.id}`);
        
        if (socket.userId) {
          // Remove from connected users
          this.connectedUsers.delete(socket.userId);
          
          // Remove from typing users
          this.typingUsers.delete(socket.userId);
          
          // Notify rooms about user leaving
          const roomId = this.userRooms.get(socket.userId);
          if (roomId) {
            socket.to(roomId).emit('user_left', {
              userId: socket.userId,
              userName: socket.userName
            });
            this.userRooms.delete(socket.userId);
          }
        }
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error('Chat socket error:', error);
      });
    });

    return chatNamespace;
  }

  // Get connected users
  getConnectedUsers() {
    return Array.from(this.connectedUsers.values());
  }

  // Get user status
  getUserStatus(userId) {
    return this.connectedUsers.has(userId);
  }

  // Get typing users in room
  getTypingUsers(roomId) {
    const typingUsers = [];
    for (const [userId, data] of this.typingUsers.entries()) {
      if (data.roomId === roomId) {
        const user = this.connectedUsers.get(userId);
        if (user) {
          typingUsers.push({
            userId,
            userName: user.userName,
            timestamp: data.timestamp
          });
        }
      }
    }
    return typingUsers;
  }
}

module.exports = ChatSocket;
