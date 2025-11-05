import React, { createContext, useContext, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import io from "socket.io-client";
import Cookies from "js-cookie";
import { getCurrentUserApi, initiateConversationApi } from "../services/ApiService";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [activeChats, setActiveChats] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const [previousUserId, setPreviousUserId] = useState(null);
  const currentUser = useSelector((state) => state.user.user);

  // 🔴 DEBUG: Kiểm tra currentUser từ Redux
  console.log("🔴 DEBUG: currentUser from Redux in ChatContext:", currentUser);

  // 🔴 DEBUG: Kiểm tra localStorage
  try {
    const localStorageUser = localStorage.getItem("user");
    console.log("🔴 DEBUG: localStorage user:", localStorageUser);
    if (localStorageUser) {
      const parsedUser = JSON.parse(localStorageUser);
      console.log("🔴 DEBUG: parsed localStorage user:", parsedUser);
    }
  } catch (error) {
    console.error("🔴 DEBUG: Error parsing localStorage user:", error);
  }

  const openChat = async (tutor, userData) => {
    console.log("🔍 openChat called with:", { tutor, currentUser: userData });
    console.log("🔍 Tutor object keys:", tutor ? Object.keys(tutor) : "tutor is null");
    console.log("🔍 UserData object keys:", userData ? Object.keys(userData) : "userData is null");

    // Extract userId từ nhiều nguồn
    // userData có thể là currentUser từ Redux với structure: { account: { _id, ... } }
    let userId =
      userData?._id ||
      userData?.id ||
      userData?.account?._id || // Redux structure: user.account._id
      userData?.account?.id ||
      userData?.account?.userId ||
      userData?.user?._id ||
      userData?.user?.id;
    
    // Debug: log chi tiết userData structure
    console.log("🔍 UserData structure:", {
      has_id: !!userData?._id,
      has_id_value: userData?._id,
      has_id_string: String(userData?._id),
      has_account: !!userData?.account,
      account_keys: userData?.account ? Object.keys(userData.account) : null,
      account_values: userData?.account ? userData.account : null,
      account_id: userData?.account?._id,
      account_id_string: userData?.account?._id ? String(userData.account._id) : null,
      full_userData: userData,
    });
    
    // Thử lấy userId từ account trực tiếp (có thể account chính là user object)
    if (!userId && userData?.account) {
      // Kiểm tra xem account có phải là user object không
      const account = userData.account;
      userId = account._id || account.id || account.userId || account.user?._id;
      if (userId) {
        console.log("✅ Got userId from account object:", userId);
      }
    }

    // Extract tutorId từ nhiều nguồn
    // Ưu tiên userId (User ID) vì đó là ID cần dùng cho conversation
    // Nếu không có, mới dùng profile ID
    let tutorId =
      tutor?.userId || // User ID (từ backend API)
      tutor?.user?._id || // User ID từ user object
      (typeof tutor?.user === 'string' ? tutor.user : null) || // User ID nếu là string
      tutor?.user?.id || // User ID từ user object
      tutor?._id || // Profile ID (fallback)
      tutor?.id; // Profile ID (fallback)

    // Nếu vẫn chưa có userId, thử lấy từ localStorage
    if (!userId) {
      try {
        const localStorageUserStr = localStorage.getItem("user");
        if (localStorageUserStr) {
          const localStorageUser = JSON.parse(localStorageUserStr);
          console.log("🔍 localStorage user:", localStorageUser);
          console.log("🔍 localStorage user keys:", localStorageUser ? Object.keys(localStorageUser) : null);
          
          // Thử nhiều cách để lấy userId
          userId =
            localStorageUser?._id ||
            localStorageUser?.id ||
            localStorageUser?.account?._id ||
            localStorageUser?.account?.id ||
            localStorageUser?.account?.userId ||
            (localStorageUser?.account && typeof localStorageUser.account === 'object' && !Array.isArray(localStorageUser.account) 
              ? (localStorageUser.account._id || localStorageUser.account.id) 
              : null);
          
          if (userId) {
            console.log("✅ Got userId from localStorage:", userId);
          } else {
            console.log("⚠️ localStorage user exists but no userId found:", localStorageUser);
          }
        } else {
          console.log("⚠️ No user found in localStorage");
        }
      } catch (error) {
        console.error("❌ Error parsing localStorage user:", error);
      }
    }

    // Nếu vẫn chưa có userId, thử decode từ JWT token (ưu tiên cao vì luôn có khi đã login)
    if (!userId) {
      try {
        const token = Cookies.get("accessToken");
        if (token) {
          console.log("🔍 Attempting to decode JWT token...");
          // Decode JWT token để lấy userId (sub field chứa userId)
          const base64Url = token.split('.')[1];
          if (base64Url) {
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
            );
            const decoded = JSON.parse(jsonPayload);
            console.log("🔍 Decoded JWT payload:", decoded);
            userId = decoded.sub || decoded.userId || decoded.id || decoded._id;
            if (userId) {
              console.log("✅ Got userId from JWT token (sub field):", userId);
            } else {
              console.log("⚠️ JWT token decoded but no userId found in:", decoded);
            }
          } else {
            console.log("⚠️ Invalid JWT token format (no payload)");
          }
        } else {
          console.log("⚠️ No accessToken in cookies");
        }
      } catch (error) {
        console.error("❌ Error decoding JWT token:", error);
      }
    }

    // Nếu vẫn chưa có userId, thử fetch từ API (nhưng không block nếu fail)
    if (!userId) {
      try {
        console.log("🔍 Trying to fetch userId from API...");
        const response = await getCurrentUserApi();
        console.log("🔍 API response:", response);
        if (response?.user) {
          userId =
            response.user._id ||
            response.user.id ||
            response.user.account?._id ||
            response.user.account?.id;
          
          if (userId) {
            console.log("✅ Got userId from API:", userId);
          }
        }
      } catch (error) {
        console.error("❌ Error fetching user from API:", error);
        console.log("⚠️ API call failed, will try to proceed with other sources");
        // Không throw error, tiếp tục với các nguồn khác
      }
    }

    // Nếu vẫn chưa có tutorId, thử lấy từ tutor.user nếu là string
    if (!tutorId && tutor?.user && typeof tutor.user === 'string') {
      tutorId = tutor.user;
    }

    console.log("🔍 Extracted IDs:", { userId, tutorId, tutorUser: tutor?.user });

    if (!userId || !tutorId) {
      console.error("❌ Missing userId or tutorId:", { 
        userId, 
        tutorId, 
        tutor: tutor ? {
          userId: tutor.userId,
          _id: tutor._id,
          id: tutor.id,
          user: tutor.user
        } : null,
        userData: userData ? {
          _id: userData._id,
          id: userData.id,
          account: userData.account,
          account_keys: userData.account ? Object.keys(userData.account) : null,
          account_values: userData.account
        } : null,
        localStorageUser: (() => {
          try {
            const str = localStorage.getItem("user");
            return str ? JSON.parse(str) : null;
          } catch {
            return null;
          }
        })(),
        token: Cookies.get("accessToken") ? "exists" : "missing"
      });
      
      // Hiển thị alert cho user với thông tin chi tiết hơn
      if (!userId) {
        alert("Không thể lấy thông tin người dùng. Vui lòng đăng nhập lại.");
      } else if (!tutorId) {
        alert("Không thể lấy thông tin gia sư. Vui lòng thử lại sau.");
      } else {
        alert("Không thể lấy thông tin người dùng hoặc gia sư. Vui lòng thử lại sau.");
      }
      return;
    }

    // Kiến trúc mới: Gọi API để tạo/get conversation
    try {
      console.log("🔍 Initiating conversation with tutor:", tutorId);
      const response = await initiateConversationApi(tutorId);
      const conversation = response.conversation;
      const conversationId = conversation._id;

      console.log("✅ Conversation initiated:", conversationId);

      // Tạo chatId từ conversationId
      const chatId = conversationId;

      // Check if chat already exists
      const existingChat = activeChats.find((chat) => chat.id === chatId || chat.conversationId === conversationId);
      if (existingChat) {
        maximizeChat(existingChat.id);
        return;
      }

      // Create new chat với conversationId
      const newChat = {
        id: chatId,
        conversationId: conversationId,
        tutor: tutor,
        currentUser: userData,
        isMinimized: false,
      };

      setActiveChats((prev) => [...prev, newChat]);
    } catch (error) {
      console.error("❌ Failed to initiate conversation:", error);
      // Fallback: dùng roomId cũ nếu API fail
      const chatId = `chat_${userId}_${tutorId}`;
      const existingChat = activeChats.find((chat) => chat.id === chatId);
      if (existingChat) {
        maximizeChat(chatId);
        return;
      }
      const newChat = {
        id: chatId,
        tutor: tutor,
        currentUser: userData,
        isMinimized: false,
      };
      setActiveChats((prev) => [...prev, newChat]);
    }
  };

  const closeChat = (chatId) => {
    setActiveChats((prev) => prev.filter((chat) => chat.id !== chatId));
  };

  const minimizeChat = (chatId) => {
    setActiveChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId ? { ...chat, isMinimized: true } : chat
      )
    );
  };

  const maximizeChat = (chatId) => {
    setActiveChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId ? { ...chat, isMinimized: false } : chat
      )
    );
  };

  // Initialize socket connection for notifications and chat
  useEffect(() => {
    console.log(
      "🔍 ChatContext useEffect triggered with currentUser:",
      currentUser
    );

    // 🔴 FIX: Nếu currentUser không có userId, thử lấy từ API
    const initializeWithUserId = async (userId) => {
      if (!userId) {
        console.log("🔴 FIX: No userId, trying to fetch from API...");
        try {
          const response = await getCurrentUserApi();
          console.log("🔴 FIX: API response:", response);
          if (response?.user?._id || response?.user?.id) {
            const apiUserId = response.user._id || response.user.id;
            console.log("🔴 FIX: Got userId from API:", apiUserId);
            initializeSocket(apiUserId, response.user);
            return;
          }
        } catch (error) {
          console.error("🔴 FIX: Failed to fetch userId from API:", error);
        }
        return;
      }

      initializeSocket(userId, currentUser);
    };

    const initializeSocket = (userId, userData) => {
      console.log("🔍 ChatContext: Initializing socket with userId:", userId);

      // Nếu socket đã tồn tại và connected, không tạo mới
      if (socket && socket.connected && previousUserId === userId) {
        console.log(
          "✅ ChatContext: Socket already connected for same user, skipping"
        );
        return;
      }

      // Check if user has changed (login/logout)
      if (previousUserId && previousUserId !== userId) {
        console.log("ChatContext: User changed, clearing chat state");
        setActiveChats([]);
        setNotifications([]);
        setUnreadCount(0);

        if (socket) {
          console.log("ChatContext: Disconnecting socket for user change");
          socket.disconnect();
          setSocket(null);
        }
      }

      setPreviousUserId(userId);

      // Disconnect existing socket if any
      if (socket) {
        console.log("ChatContext: Disconnecting existing socket");
        socket.disconnect();
      }

      const socketUrl =
        process.env.REACT_APP_API_URL || "http://localhost:5000/chat";
      console.log("🔍 ChatContext: Connecting to socket:", socketUrl);

      const newSocket = io(socketUrl, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        autoConnect: true,
      });

      setSocket(newSocket);

      newSocket.on("connect", () => {
        console.log("✅ ChatContext: Connected to notification server");

        const userName =
          userData?.profile?.full_name ||
          userData?.name ||
          userData?.account?.email ||
          "User";
        const userRole = userData?.account?.role || "student";

        console.log("🔍 ChatContext: Authenticating with:", {
          userId,
          userName,
          userRole,
        });
        console.log("🔍 ChatContext: userData for userName extraction:", {
          "profile.full_name": userData?.profile?.full_name,
          name: userData?.name,
          "account.email": userData?.account?.email,
          "account.role": userData?.account?.role,
        });

        if (userId) {
          newSocket.emit("authenticate", { userId, userName, userRole });
        }
      });

      newSocket.on("authenticated", () => {
        console.log("✅ ChatContext: Notification authentication successful");
      });

      newSocket.on("connect_error", (error) => {
        console.error("❌ ChatContext: Socket connection error:", error);
      });

      newSocket.on("disconnect", (reason) => {
        console.log("⚠️ ChatContext: Socket disconnected:", reason);
      });

      // Listen for new messages (notifications)
      const handleChatNotification = (data) => {
        const notificationUserId = userId;
        const isOwnMessage =
          String(data.senderId) === String(notificationUserId);

        console.log("📨 ChatContext: Received chat_message for notification:", {
          senderId: data.senderId,
          currentUserId: notificationUserId,
          isOwnMessage,
          message: data.message,
        });

        if (!isOwnMessage) {
          const notification = {
            id: Date.now() + Math.random(),
            type: "message",
            senderId: data.senderId,
            senderName: data.senderName,
            message: data.message,
            timestamp: data.timestamp,
            chatId: data.roomId,
            isRead: false,
          };

          setNotifications((prev) => [notification, ...prev]);
          setUnreadCount((prev) => prev + 1);

          console.log("✅ ChatContext: Added notification:", notification);

          if (Notification.permission === "granted") {
            new Notification(`Tin nhắn từ ${data.senderName}`, {
              body: data.message,
              icon: "/favicon.ico",
            });
          }
        } else {
          console.log(
            "✅ ChatContext: This is my own message, skipping notification"
          );
        }
      };

      newSocket.on("chat_message", handleChatNotification);
      newSocket.on("new_chat_message", handleChatNotification);

      return () => {
        newSocket.close();
      };
    };

    if (!currentUser) {
      console.log("❌ ChatContext: No currentUser, trying API fallback");
      initializeWithUserId(null);
      return;
    }

    const userId =
      currentUser?._id ||
      currentUser?.id ||
      currentUser?.account?._id ||
      currentUser?.account?.id ||
      currentUser?.user?._id ||
      currentUser?.user?.id;

    console.log("🔍 ChatContext: Extracted userId:", userId);

    if (!userId) {
      console.warn("❌ ChatContext: No userId found, trying API fallback");
      initializeWithUserId(null);
      return;
    }

    initializeSocket(userId, currentUser);

    // Cleanup function
    return () => {
      if (socket) {
        console.log("🔍 ChatContext: Cleaning up socket on unmount");
        socket.disconnect();
      }
    };
  }, [currentUser]); // CHỈ depend vào currentUser, bỏ socket và các setter functions

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const markNotificationAsRead = (notificationId) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, isRead: true }))
    );
    setUnreadCount(0);
  };

  const openChatFromNotification = (notification) => {
    // Find or create chat for this notification
    const chatId = notification.chatId;
    const existingChat = activeChats.find((chat) => chat.id === chatId);

    if (!existingChat) {
      // Create new chat from notification
      const newChat = {
        id: chatId,
        conversationId: notification.chatId, // Có thể là conversationId hoặc roomId
        tutor: {
          userId: notification.senderId,
          name: notification.senderName,
          avatar: "https://via.placeholder.com/40",
        },
        currentUser: currentUser,
        isMinimized: false,
      };
      setActiveChats((prev) => [...prev, newChat]);
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
    openChatFromNotification,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};

export default ChatContext;
