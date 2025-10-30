import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useChat } from '../../contexts/ChatContext';
import io from 'socket.io-client';
import './ChatWidget.scss';

const ChatWidget = ({ tutor, isOpen, onClose }) => {
  const currentUser = useSelector(state => state.user.user);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [previousUserId, setPreviousUserId] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Helper function to get user ID with fallbacks
  const getUserId = () => {
    console.log('🔍 getUserId: Checking currentUser:', currentUser);
    
    let userId = currentUser?._id || currentUser?.id || currentUser?.account?._id || currentUser?.account?.id || currentUser?.user?._id || currentUser?.user?.id;
    
    console.log('🔍 getUserId: After checking currentUser, userId =', userId);
    
    // Fallback to localStorage if still not found
    if (!userId) {
      console.log('🔍 getUserId: Not found in currentUser, checking localStorage...');
      try {
        const localStorageUserStr = localStorage.getItem('user');
        console.log('🔍 getUserId: localStorage user string:', localStorageUserStr);
        
        if (localStorageUserStr) {
          const localStorageUser = JSON.parse(localStorageUserStr);
          console.log('🔍 getUserId: Parsed localStorage user:', localStorageUser);
          
          userId = localStorageUser?._id || localStorageUser?.id || localStorageUser?.account?._id || localStorageUser?.account?.userId;
          console.log('🔍 getUserId: Found userId from localStorage:', userId);
        } else {
          console.warn('🔍 getUserId: No user in localStorage');
        }
      } catch (e) {
        console.error('❌ getUserId: Failed to parse localStorage user:', e);
      }
    }
    
    console.log('🔍 getUserId: Final userId =', userId);
    return userId;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Clear chat state when user changes
  useEffect(() => {
    const userId = getUserId();
    if (previousUserId && previousUserId !== userId) {
      console.log('ChatWidget: User changed, clearing chat state');
      setMessages([]);
      setNewMessage('');
      setIsTyping(false);
      setOtherUserTyping(false);
      setUnreadCount(0);
      
      // Disconnect existing socket
      if (socket) {
        console.log('ChatWidget: Disconnecting socket for user change');
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    }
    setPreviousUserId(userId);
  }, [currentUser, previousUserId]);

  useEffect(() => {
    if (isOpen && tutor) {
      let chatSocket = null;
      let cachedUserId = null; // Cache userId for this socket session
      
      // Fetch user data directly from API if not available
      const fetchUserAndConnect = async () => {
        // Create new socket connection to chat namespace
        chatSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000/chat', {
          transports: ['websocket', 'polling']
        });
        
        setSocket(chatSocket);
        
        chatSocket.on('connect', async () => {
          console.log('ChatWidget: Connected to chat server');
          setIsConnected(true);
          
          // Get user ID using helper function
          let userId = getUserId();
          
          console.log('ChatWidget: Current user object:', currentUser);
          console.log('ChatWidget: Extracted userId:', userId);
          
          // If still no userId, try to fetch from API
          if (!userId) {
            console.log('🔍 ChatWidget: No userId found, fetching from API...');
            try {
              const { getCurrentUserApi } = await import('../../services/ApiService');
              const response = await getCurrentUserApi();
              console.log('🔍 ChatWidget: API response:', response);
              
              if (response?.user) {
                userId = response.user._id || response.user.id || response.user.account?._id;
                console.log('🔍 ChatWidget: Got userId from API:', userId);
              }
            } catch (error) {
              console.error('❌ ChatWidget: Failed to fetch user from API:', error);
            }
          }
          
          if (!userId) {
            console.error('ChatWidget: No user ID found in currentUser or localStorage or API');
            console.error('ChatWidget: Full currentUser object:', JSON.stringify(currentUser, null, 2));
            alert('Lỗi: Không thể xác định người dùng. Vui lòng đăng nhập lại.');
            chatSocket.disconnect();
            return;
          }
          
          // Cache userId for this session
          cachedUserId = userId;
          chatSocket.userId = userId; // Store on socket
          
          // Authenticate first
          const userName = currentUser?.profile?.full_name || currentUser?.name || currentUser?.full_name || currentUser?.account?.email || 'User';
          const userRole = currentUser?.account?.role || currentUser?.role || 'student';
          
          console.log('ChatWidget: Authenticating with:', { userId, userName, userRole });
          console.log('ChatWidget: currentUser for userName extraction:', {
            'profile.full_name': currentUser?.profile?.full_name,
            'name': currentUser?.name,
            'full_name': currentUser?.full_name,
            'account.email': currentUser?.account?.email
          });
          
          chatSocket.emit('authenticate', {
            userId: userId,
            userName: userName,
            userRole: userRole
          });
        });
        
          chatSocket.on('authenticated', () => {
          console.log('ChatWidget: Authentication successful');
          
          // Get user ID using helper function
          const userId = getUserId();
          
          // Join chat room with tutor
          const roomId = `chat_${Math.min(userId, tutor.userId)}_${Math.max(userId, tutor.userId)}`;
          console.log('ChatWidget: Joining room:', roomId, 'with tutor:', tutor.userId);
          chatSocket.emit('join_chat_room', { roomId, tutorId: tutor.userId });
        });

        // Listen for chat-specific events
        const handleChatMessage = (data) => {
          // Use cached userId or socket.userId first
          const userId = chatSocket?.userId || cachedUserId || getUserId();
          // Convert to string and compare strictly
          const isOwnMessage = String(data.senderId) === String(userId);
          
          console.log('📨 ChatWidget: Received chat_message:', {
            senderId: data.senderId,
            senderIdType: typeof data.senderId,
            currentUserId: userId,
            currentUserIdType: typeof userId,
            isOwnMessage,
            message: data.message,
            comparison: `"${String(data.senderId)}" === "${String(userId)}"`
          });
          
          // CRITICAL FIX: If this is own message, SKIP adding to messages
          // because optimistic update already added it
          if (isOwnMessage) {
            console.log('✅ ChatWidget: This is my own message, skipping (already have optimistic update)');
            return; // DON'T add to messages
          }
          
          const newMsg = {
            id: Date.now() + Math.random(),
            text: data.message,
            senderId: data.senderId,
            senderName: data.senderName,
            timestamp: data.timestamp,
            isOwn: false // Always false since we're here
          };
          
          setMessages(prev => {
            // Check if message already exists (avoid duplicates)
            const exists = prev.some(msg => {
              // Match by text and sender
              const textMatch = msg.text === data.message;
              const senderMatch = msg.senderId === data.senderId;
              // Check timestamp is within 2 seconds (for optimistic updates)
              const timestampMatch = Math.abs(new Date(msg.timestamp) - new Date(data.timestamp)) < 2000;
              
              return textMatch && senderMatch && timestampMatch;
            });
            
            if (exists) {
              console.log('⚠️ ChatWidget: Duplicate message detected, skipping');
              return prev;
            }
            
            console.log('✅ ChatWidget: Adding new message from other user');
            return [...prev, newMsg];
          });
          
          // Increase unread count if widget is minimized
          if (isMinimized) {
            setUnreadCount(prev => prev + 1);
          }
        };

        const handleUserTyping = (data) => {
          const userId = chatSocket?.userId || cachedUserId || getUserId();
          if (String(data.userId) !== String(userId)) {
            setOtherUserTyping(data.isTyping);
          }
        };

        const handleChatHistory = (history) => {
          const userId = chatSocket?.userId || cachedUserId || getUserId();
          setMessages(history.map(msg => ({
            id: msg._id,
            text: msg.message,
            senderId: msg.senderId,
            senderName: msg.senderName,
            timestamp: msg.timestamp,
            isOwn: String(msg.senderId) === String(userId)
          })));
        };

        const handleDisconnect = () => {
          console.log('ChatWidget: Socket disconnected');
          setIsConnected(false);
        };

        const handleError = (error) => {
          console.error('ChatWidget: Socket error:', error);
        };

        // Add event listeners
        chatSocket.on('chat_message', handleChatMessage);
        chatSocket.on('user_typing', handleUserTyping);
        chatSocket.on('chat_history', handleChatHistory);
        chatSocket.on('disconnect', handleDisconnect);
        chatSocket.on('error', handleError);

        // Return cleanup function
        return () => {
          // Remove event listeners and close socket
          if (chatSocket) {
            chatSocket.off('chat_message', handleChatMessage);
            chatSocket.off('user_typing', handleUserTyping);
            chatSocket.off('chat_history', handleChatHistory);
            chatSocket.off('disconnect', handleDisconnect);
            chatSocket.off('error', handleError);
            chatSocket.close();
          }
        };
      };
      
      fetchUserAndConnect();
      
      // Cleanup on unmount
      return () => {
        if (chatSocket) {
          chatSocket.close();
        }
      };
    }
  }, [isOpen, currentUser, tutor]);

  useEffect(() => {
    if (!isMinimized) {
      scrollToBottom();
      setUnreadCount(0); // Clear unread count when opened
    }
  }, [messages, isMinimized]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const userId = getUserId();
      const messageData = {
        message: newMessage.trim(),
        receiverId: tutor.userId,
        roomId: `chat_${Math.min(userId, tutor.userId)}_${Math.max(userId, tutor.userId)}`
      };

      console.log('📤 ChatWidget: Sending message:', messageData);
      
      // Clear input immediately
      const messageText = newMessage.trim();
      setNewMessage('');
      
      // Try to send via socket if connected
      if (socket && isConnected) {
        socket.emit('send_message', messageData);
        
        // Add message to local state immediately for optimistic update
        const optimisticMsg = {
          id: Date.now() + Math.random(),
          text: messageText,
          senderId: userId,
          senderName: currentUser?.name || currentUser?.full_name || 'You',
          timestamp: new Date().toISOString(),
          isOwn: true,
          isOptimistic: true // Mark as optimistic
        };
        
        setMessages(prev => [...prev, optimisticMsg]);
        
        // Stop typing indicator
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        socket.emit('typing', { 
          roomId: messageData.roomId, 
          isTyping: false 
        });
        setIsTyping(false);
      } else {
        console.log('Socket not connected, message saved locally');
      }
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (!isTyping && socket && isConnected) {
      const userId = getUserId();
      const roomId = `chat_${Math.min(userId, tutor.userId)}_${Math.max(userId, tutor.userId)}`;
      socket.emit('typing', { roomId, isTyping: true });
      setIsTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (socket && isConnected) {
        const userId = getUserId();
        const roomId = `chat_${Math.min(userId, tutor.userId)}_${Math.max(userId, tutor.userId)}`;
        socket.emit('typing', { roomId, isTyping: false });
        setIsTyping(false);
      }
    }, 1000);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className={`chat-widget ${isMinimized ? 'minimized' : ''}`}>
      <div className="chat-header">
        <div className="chat-user-info">
          <img 
            src={tutor.avatar || 'https://via.placeholder.com/40'} 
            alt={tutor.name}
            className="user-avatar"
          />
          <div className="user-details">
            <h4>{tutor.name}</h4>
            <span className={`status ${isConnected ? 'online' : 'offline'}`}>
              {isConnected ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
        <div className="chat-controls">
          <button 
            className="minimize-btn"
            onClick={() => setIsMinimized(!isMinimized)}
            aria-label={isMinimized ? 'Mở rộng' : 'Thu nhỏ'}
          >
            <i className={`fas fa-${isMinimized ? 'expand' : 'minus'}`}></i>
          </button>
          <button 
            className="close-btn"
            onClick={onClose}
            aria-label="Đóng chat"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="chat-messages">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`message ${message.isOwn ? 'own' : 'other'}`}
              >
                <div className="message-content">
                  <p>{message.text}</p>
                  <span className="message-time">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
            ))}
            
            {otherUserTyping && (
              <div className="typing-indicator">
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span>Đang gõ...</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-form" onSubmit={handleSendMessage}>
            <div className="input-wrapper">
              <input
                type="text"
                value={newMessage}
                onChange={handleTyping}
                placeholder="Nhập tin nhắn..."
                className="message-input"
                disabled={false}
              />
              <button 
                type="submit" 
                className="send-btn"
                disabled={!newMessage.trim()}
              >
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
          </form>
        </>
      )}

      {unreadCount > 0 && (
        <div className="unread-badge">
          {unreadCount > 99 ? '99+' : unreadCount}
        </div>
      )}
    </div>
  );
};

export default ChatWidget;