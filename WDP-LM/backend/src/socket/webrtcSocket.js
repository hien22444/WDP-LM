const { Server } = require('socket.io');
const { verifyRoomToken, roomManager, getIceServers } = require('../services/WebRTCService');

class WebRTCSocket {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupWebRTCNamespace();
  }

  setupWebRTCNamespace() {
    const webrtcNamespace = this.io.of('/webrtc');

    webrtcNamespace.use((socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        // Allow direct access for demo purposes
        if (!token) {
          console.log('🔓 Direct access mode - no authentication token');
          socket.userId = null;
          socket.roomId = null;
          socket.role = 'guest';
          return next();
        }

        const decoded = verifyRoomToken(token);
        socket.userId = decoded.userId;
        socket.roomId = decoded.roomId;
        socket.role = decoded.role;
        
        next();
      } catch (error) {
        console.log('🔓 Direct access mode - invalid token, allowing connection');
        socket.userId = null;
        socket.roomId = null;
        socket.role = 'guest';
        next();
      }
    });

    webrtcNamespace.on('connection', (socket) => {
      console.log(`🔌 User ${socket.userId || 'anonymous'} (${socket.role || 'guest'}) connected to room ${socket.roomId || 'unknown'}`);

      // Direct room join (for demo purposes)
      socket.on('join-room-direct', async (data) => {
        try {
          const { roomId } = data;
          if (!roomId) {
            socket.emit('error', { message: 'Room ID is required' });
            return;
          }

          // Generate a temporary user ID for direct access
          const tempUserId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Join room without authentication
          socket.join(roomId);
          
          // Notify room about new participant
          socket.to(roomId).emit('user-joined', {
            userId: tempUserId,
            role: 'guest',
            roomInfo: {
              participants: [tempUserId],
              status: 'active'
            }
          });

          // Send room info to the joining user
          socket.emit('room-joined-direct', {
            roomId: roomId,
            userId: tempUserId,
            role: 'guest',
            iceServers: getIceServers(),
            roomInfo: {
              participants: [tempUserId],
              status: 'active',
              chatHistory: []
            }
          });

          console.log(`✅ Guest user ${tempUserId} joined room ${roomId} (direct access)`);
        } catch (error) {
          console.error('Error in direct room join:', error);
          socket.emit('error', { message: 'Failed to join room' });
        }
      });

      // Join room (authenticated)
      socket.on('join-room', async () => {
        try {
          const room = roomManager.joinRoom(socket.roomId, socket.userId);
          socket.join(socket.roomId);
          
          // Notify room about new participant
          socket.to(socket.roomId).emit('user-joined', {
            userId: socket.userId,
            role: socket.role,
            roomInfo: {
              participants: Array.from(room.participants),
              status: room.status
            }
          });

          // Send room info to the joining user
          socket.emit('room-joined', {
            roomId: socket.roomId,
            role: socket.role,
            iceServers: getIceServers(),
            roomInfo: {
              participants: Array.from(room.participants),
              status: room.status,
              chatHistory: roomManager.getChatHistory(socket.roomId)
            }
          });

          console.log(`✅ User ${socket.userId} joined room ${socket.roomId}`);
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      // WebRTC signaling
      socket.on('offer', (data) => {
        console.log(`📤 Offer from ${socket.userId} to room ${socket.roomId}`);
        socket.to(socket.roomId).emit('offer', {
          offer: data.offer,
          from: socket.userId,
          role: socket.role
        });
      });

      socket.on('answer', (data) => {
        console.log(`📤 Answer from ${socket.userId} to room ${socket.roomId}`);
        socket.to(socket.roomId).emit('answer', {
          answer: data.answer,
          from: socket.userId,
          role: socket.role
        });
      });

      socket.on('ice-candidate', (data) => {
        console.log(`🧊 ICE candidate from ${socket.userId} to room ${socket.roomId}`);
        socket.to(socket.roomId).emit('ice-candidate', {
          candidate: data.candidate,
          from: socket.userId,
          role: socket.role
        });
      });

      // Chat messages
      socket.on('chat-message', (data) => {
        try {
          const message = roomManager.addChatMessage(
            socket.roomId,
            socket.userId,
            data.message,
            data.type || 'text'
          );

          // Broadcast to all participants in the room
          webrtcNamespace.to(socket.roomId).emit('chat-message', message);
          
          console.log(`💬 Chat message from ${socket.userId} in room ${socket.roomId}`);
        } catch (error) {
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Screen sharing
      socket.on('screen-share-start', () => {
        console.log(`🖥️ Screen sharing started by ${socket.userId} in room ${socket.roomId}`);
        socket.to(socket.roomId).emit('screen-share-start', {
          from: socket.userId,
          role: socket.role
        });
      });

      socket.on('screen-share-stop', () => {
        console.log(`🖥️ Screen sharing stopped by ${socket.userId} in room ${socket.roomId}`);
        socket.to(socket.roomId).emit('screen-share-stop', {
          from: socket.userId,
          role: socket.role
        });
      });

      // Media controls
      socket.on('toggle-audio', (data) => {
        socket.to(socket.roomId).emit('user-audio-toggle', {
          userId: socket.userId,
          role: socket.role,
          enabled: data.enabled
        });
      });

      socket.on('toggle-video', (data) => {
        socket.to(socket.roomId).emit('user-video-toggle', {
          userId: socket.userId,
          role: socket.role,
          enabled: data.enabled
        });
      });

      // Room events
      socket.on('request-room-info', () => {
        const room = roomManager.getRoom(socket.roomId);
        if (room) {
          socket.emit('room-info', {
            roomId: socket.roomId,
            participants: Array.from(room.participants),
            status: room.status,
            startTime: room.startTime,
            chatHistory: roomManager.getChatHistory(socket.roomId)
          });
        }
      });

      // Disconnect
      socket.on('disconnect', () => {
        console.log(`🔌 User ${socket.userId} disconnected from room ${socket.roomId}`);
        
        try {
          const room = roomManager.leaveRoom(socket.roomId, socket.userId);
          
          // Notify other participants
          socket.to(socket.roomId).emit('user-left', {
            userId: socket.userId,
            role: socket.role,
            roomInfo: room ? {
              participants: Array.from(room.participants),
              status: room.status
            } : null
          });

          // End room if no participants left
          if (room && room.participants.size === 0) {
            roomManager.endRoom(socket.roomId);
            console.log(`🏁 Room ${socket.roomId} ended - no participants`);
          }
        } catch (error) {
          console.error('Error handling disconnect:', error);
        }
      });

      // Error handling
      socket.on('error', (error) => {
        console.error(`❌ Socket error for user ${socket.userId}:`, error);
      });
    });

    console.log('🚀 WebRTC Socket.io namespace initialized');
  }

  // Get room statistics
  getRoomStats() {
    const rooms = Array.from(roomManager.rooms.values());
    return {
      totalRooms: rooms.length,
      activeRooms: rooms.filter(r => r.status === 'active').length,
      waitingRooms: rooms.filter(r => r.status === 'waiting').length,
      endedRooms: rooms.filter(r => r.status === 'ended').length,
      totalParticipants: rooms.reduce((sum, room) => sum + room.participants.size, 0)
    };
  }

  // Broadcast to all rooms
  broadcastToAll(event, data) {
    this.io.of('/webrtc').emit(event, data);
  }

  // Broadcast to specific room
  broadcastToRoom(roomId, event, data) {
    this.io.of('/webrtc').to(roomId).emit(event, data);
  }
}

module.exports = WebRTCSocket;
