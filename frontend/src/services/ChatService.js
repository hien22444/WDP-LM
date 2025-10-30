import io from 'socket.io-client';

class ChatService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  connect(userId, userName, userRole) {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    this.socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      auth: {
        userId,
        userName,
        userRole
      },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Connected to chat server');
      this.isConnected = true;
      this.emit('connection_status', { connected: true });
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from chat server');
      this.isConnected = false;
      this.emit('connection_status', { connected: false });
    });

    this.socket.on('connect_error', (error) => {
      console.error('Chat connection error:', error);
      this.emit('connection_error', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  joinChatRoom(roomId, tutorId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_chat_room', { roomId, tutorId });
    }
  }

  sendMessage(message, receiverId, roomId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('send_message', {
        message,
        receiverId,
        roomId
      });
    }
  }

  sendTyping(isTyping, roomId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing', { isTyping, roomId });
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    }
  }

  // Event listener management
  addListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  removeListener(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socket: this.socket
    };
  }

  // Create room ID for two users
  static createRoomId(userId1, userId2) {
    return `chat_${Math.min(userId1, userId2)}_${Math.max(userId1, userId2)}`;
  }
}

// Create singleton instance
const chatService = new ChatService();

export default chatService;
