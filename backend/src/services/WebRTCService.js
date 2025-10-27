const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate unique room ID
const generateRoomId = () => {
  return crypto.randomBytes(16).toString('hex');
};

// Generate JWT token for room access
const generateRoomToken = (roomId, userId, role, duration = 60) => {
  const payload = {
    roomId,
    userId,
    role, // 'student' or 'tutor'
    exp: Math.floor(Date.now() / 1000) + (duration * 60), // duration in minutes
    iat: Math.floor(Date.now() / 1000)
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key');
};

// Verify room token
const verifyRoomToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  } catch (error) {
    throw new Error('Invalid or expired room token');
  }
};

// STUN/TURN servers configuration
const getIceServers = () => {
  return [
    // Free STUN servers
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    
    // Add TURN server if available (for production)
    // {
    //   urls: 'turn:your-turn-server.com:3478',
    //   username: 'username',
    //   credential: 'password'
    // }
  ];
};

// Room management
class RoomManager {
  constructor() {
    this.rooms = new Map(); // roomId -> room data
    this.userRooms = new Map(); // userId -> roomId
  }

  createRoom(roomId, tutorId, studentId, bookingId) {
    const room = {
      id: roomId,
      tutorId,
      studentId,
      bookingId,
      participants: new Set(),
      startTime: new Date(),
      status: 'waiting', // waiting, active, ended
      chatHistory: []
    };
    
    this.rooms.set(roomId, room);
    return room;
  }

  joinRoom(roomId, userId) {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    if (room.status !== 'waiting' && room.status !== 'active') {
      throw new Error('Room is not available');
    }

    // Check if user is authorized to join
    if (userId !== room.tutorId && userId !== room.studentId) {
      throw new Error('Unauthorized to join this room');
    }

    room.participants.add(userId);
    this.userRooms.set(userId, roomId);

    // Activate room if both participants joined
    if (room.participants.size === 2) {
      room.status = 'active';
    }

    return room;
  }

  leaveRoom(roomId, userId) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.participants.delete(userId);
    this.userRooms.delete(userId);

    // End room if no participants
    if (room.participants.size === 0) {
      room.status = 'ended';
    }

    return room;
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  getUserRoom(userId) {
    const roomId = this.userRooms.get(userId);
    return roomId ? this.rooms.get(roomId) : null;
  }

  addChatMessage(roomId, userId, message, type = 'text') {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const chatMessage = {
      id: crypto.randomBytes(8).toString('hex'),
      userId,
      message,
      type,
      timestamp: new Date(),
      role: userId === room.tutorId ? 'tutor' : 'student'
    };

    room.chatHistory.push(chatMessage);
    return chatMessage;
  }

  getChatHistory(roomId) {
    const room = this.rooms.get(roomId);
    return room ? room.chatHistory : [];
  }

  endRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.status = 'ended';
    room.endTime = new Date();
    
    // Clean up user room mappings
    room.participants.forEach(userId => {
      this.userRooms.delete(userId);
    });

    return room;
  }

  // Clean up old rooms (call periodically)
  cleanupOldRooms() {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [roomId, room] of this.rooms.entries()) {
      if (room.status === 'ended' && (now - room.startTime) > maxAge) {
        this.rooms.delete(roomId);
      }
    }
  }
}

// Global room manager instance
const roomManager = new RoomManager();

// Clean up old rooms every hour
setInterval(() => {
  roomManager.cleanupOldRooms();
}, 60 * 60 * 1000);

module.exports = {
  generateRoomId,
  generateRoomToken,
  verifyRoomToken,
  getIceServers,
  roomManager
};
