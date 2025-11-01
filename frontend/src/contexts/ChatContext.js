import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';
import { getCurrentUserApi } from '../services/ApiService';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [activeChats, setActiveChats] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const [previousUserId, setPreviousUserId] = useState(null);
  const currentUser = useSelector(state => state.user.user);

  // 🔴 DEBUG: Kiểm tra currentUser từ Redux
  console.log('🔴 DEBUG: currentUser from Redux in ChatContext:', currentUser);
  
  // 🔴 DEBUG: Kiểm tra localStorage
  try {
    const localStorageUser = localStorage.getItem('user');
    console.log('🔴 DEBUG: localStorage user:', localStorageUser);
    if (localStorageUser) {
      const parsedUser = JSON.parse(localStorageUser);
      console.log('🔴 DEBUG: parsed localStorage user:', parsedUser);
    }
  } catch (error) {
    console.error('🔴 DEBUG: Error parsing localStorage user:', error);
  }

  const openChat = (tutor, userData) => {
    console.log('🔍 openChat called with:', { tutor, currentUser: userData });
    
    const userId = userData?._id || userData?.id || 
                   userData?.account?._id || userData?.account?.id ||
                   userData?.user?._id || userData?.user?.id;
    const tutorId = tutor?.userId || tutor?._id || tutor?.id ||
                    tutor?.user?._id || tutor?.user?.id;
    
    console.log('🔍 Extracted IDs:', { userId, tutorId });
    
    if (!userId || !tutorId) {
      console.error('❌ Missing userId or tutorId:', { userId, tutorId });
      
      // Try to fetch userId from multiple sources if missing
      if (!userId) {
        console.log('🔍 Attempting to fetch userId from multiple sources...');
        
        // Try localStorage first
        try {
          const localStorageUserStr = localStorage.getItem('user');
          if (localStorageUserStr) {
            const localStorageUser = JSON.parse(localStorageUserStr);
            const localUserId = localStorageUser?._id || localStorageUser?.id || localStorageUser?.account?._id || localStorageUser?.account?.id;
            if (localUserId && tutorId) {
              console.log('🔍 Got userId from localStorage:', localUserId);
              const chatId = `chat_${localUserId}_${tutorId}`;
              console.log('🔍 Generated chatId with localStorage userId:', chatId);
              const newCurrentUser = { ...userData, _id: localUserId };
              openChat(tutor, newCurrentUser);
              return;
            }
          }
        } catch (error) {
          console.error('❌ Error parsing localStorage user:', error);
        }
        
        // Try API as fallback
        try {
          getCurrentUserApi().then(response => {
            if (response?.user) {
              const apiUserId = response.user._id || response.user.id;
              console.log('🔍 Got userId from API:', apiUserId);
              if (apiUserId && tutorId) {
                const chatId = `chat_${apiUserId}_${tutorId}`;
                console.log('🔍 Generated chatId with API userId:', chatId);
                const newCurrentUser = { ...userData, _id: apiUserId };
                openChat(tutor, newCurrentUser);
              }
            }
          }).catch(error => {
            console.error('❌ Failed to fetch userId from API:', error);
          });
        } catch (error) {
          console.error('❌ Error in API fallback:', error);
        }
      }
      return;
    }
    
    const chatId = `chat_${userId}_${tutorId}`;
    console.log('🔍 Generated chatId:', chatId);
    
    // Check if chat already exists
    const existingChat = activeChats.find(chat => chat.id === chatId);
    if (existingChat) {
      // If chat exists, just maximize it
      maximizeChat(chatId);
      return;
    }

    // Create new chat
    const newChat = {
      id: chatId,
      tutor: tutor,
      currentUser: userData,
      isMinimized: false
    };

    setActiveChats(prev => [...prev, newChat]);
  };

  const closeChat = (chatId) => {
    setActiveChats(prev => prev.filter(chat => chat.id !== chatId));
  };

  const minimizeChat = (chatId) => {
    setActiveChats(prev => 
      prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, isMinimized: true }
          : chat
      )
    );
  };

  const maximizeChat = (chatId) => {
    setActiveChats(prev => 
      prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, isMinimized: false }
          : chat
      )
    );
  };

  // Initialize socket connection for notifications and chat
  useEffect(() => {
    console.log('🔍 ChatContext useEffect triggered with currentUser:', currentUser);
    
    // 🔴 FIX: Nếu currentUser không có userId, thử lấy từ API
    const initializeWithUserId = async (userId) => {
      if (!userId) {
        console.log('🔴 FIX: No userId, trying to fetch from API...');
        try {
          const response = await getCurrentUserApi();
          console.log('🔴 FIX: API response:', response);
          if (response?.user?._id || response?.user?.id) {
            const apiUserId = response.user._id || response.user.id;
            console.log('🔴 FIX: Got userId from API:', apiUserId);
            initializeSocket(apiUserId, response.user);
            return;
          }
        } catch (error) {
          console.error('🔴 FIX: Failed to fetch userId from API:', error);
        }
        return;
      }
      
      initializeSocket(userId, currentUser);
    };

    const initializeSocket = (userId, userData) => {
      console.log('🔍 ChatContext: Initializing socket with userId:', userId);
      
      // Nếu socket đã tồn tại và connected, không tạo mới
      if (socket && socket.connected && previousUserId === userId) {
        console.log('✅ ChatContext: Socket already connected for same user, skipping');
        return;
      }
      
      // Check if user has changed (login/logout)
      if (previousUserId && previousUserId !== userId) {
        console.log('ChatContext: User changed, clearing chat state');
        setActiveChats([]);
        setNotifications([]);
        setUnreadCount(0);
        
        if (socket) {
          console.log('ChatContext: Disconnecting socket for user change');
          socket.disconnect();
          setSocket(null);
        }
      }

      setPreviousUserId(userId);

      // Disconnect existing socket if any
      if (socket) {
        console.log('ChatContext: Disconnecting existing socket');
        socket.disconnect();
      }

      const socketUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/chat';
      console.log('🔍 ChatContext: Connecting to socket:', socketUrl);
      
      const newSocket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: false // Tắt auto-reconnect để tránh vòng lặp
      });

      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('✅ ChatContext: Connected to notification server');
        
        const userName = userData?.profile?.full_name || userData?.name || userData?.account?.email || 'User';
        const userRole = userData?.account?.role || 'student';
        
        console.log('🔍 ChatContext: Authenticating with:', { userId, userName, userRole });
        console.log('🔍 ChatContext: userData for userName extraction:', {
          'profile.full_name': userData?.profile?.full_name,
          'name': userData?.name,
          'account.email': userData?.account?.email,
          'account.role': userData?.account?.role
        });
        
        if (userId) {
          newSocket.emit('authenticate', { userId, userName, userRole });
        }
      });

      newSocket.on('authenticated', () => {
        console.log('✅ ChatContext: Notification authentication successful');
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ ChatContext: Socket connection error:', error);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('⚠️ ChatContext: Socket disconnected:', reason);
      });

      // Listen for new messages (notifications)
      const handleChatNotification = (data) => {
        const notificationUserId = userId;
        const isOwnMessage = String(data.senderId) === String(notificationUserId);
        
        console.log('📨 ChatContext: Received chat_message for notification:', {
          senderId: data.senderId,
          currentUserId: notificationUserId,
          isOwnMessage,
          message: data.message
        });
        
        if (!isOwnMessage) {
          const notification = {
            id: Date.now() + Math.random(),
            type: 'message',
            senderId: data.senderId,
            senderName: data.senderName,
            message: data.message,
            timestamp: data.timestamp,
            chatId: data.roomId,
            isRead: false
          };
          
          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          console.log('✅ ChatContext: Added notification:', notification);
          
          if (Notification.permission === 'granted') {
            new Notification(`Tin nhắn từ ${data.senderName}`, {
              body: data.message,
              icon: '/favicon.ico'
            });
          }
        } else {
          console.log('✅ ChatContext: This is my own message, skipping notification');
        }
      };
      
      newSocket.on('chat_message', handleChatNotification);
      newSocket.on('new_chat_message', handleChatNotification);

      return () => {
        newSocket.close();
      };
    };

    if (!currentUser) {
      console.log('❌ ChatContext: No currentUser, trying API fallback');
      initializeWithUserId(null);
      return;
    }

    const userId = currentUser?._id || currentUser?.id || 
                   currentUser?.account?._id || currentUser?.account?.id ||
                   currentUser?.user?._id || currentUser?.user?.id;
    
    console.log('🔍 ChatContext: Extracted userId:', userId);
    
    if (!userId) {
      console.warn('❌ ChatContext: No userId found, trying API fallback');
      initializeWithUserId(null);
      return;
    }

    initializeSocket(userId, currentUser);
    
    // Cleanup function
    return () => {
      if (socket) {
        console.log('🔍 ChatContext: Cleaning up socket on unmount');
        socket.disconnect();
      }
    };
  }, [currentUser]); // CHỈ depend vào currentUser, bỏ socket và các setter functions

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, isRead: true }
          : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
    );
    setUnreadCount(0);
  };

  const openChatFromNotification = (notification) => {
    // Find or create chat for this notification
    const chatId = notification.chatId;
    const existingChat = activeChats.find(chat => chat.id === chatId);
    
    if (!existingChat) {
      // Create new chat from notification
      const newChat = {
        id: chatId,
        tutor: {
          userId: notification.senderId,
          name: notification.senderName,
          avatar: 'https://via.placeholder.com/40'
        },
        currentUser: currentUser,
        isMinimized: false
      };
      setActiveChats(prev => [...prev, newChat]);
    } else {
      // Maximize existing chat
      maximizeChat(chatId);
    }
    
    // Mark notification as read
    markNotificationAsRead(notification.id);
  };

  const value = {
    activeChats,
    notifications,
    unreadCount,
    socket,
    openChat,
    closeChat,
    minimizeChat,
    maximizeChat,
    markNotificationAsRead,
    markAllAsRead,
    openChatFromNotification
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export default ChatContext;
