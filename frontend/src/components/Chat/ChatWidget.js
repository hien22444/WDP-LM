import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
// import { useChat } from "../../contexts/ChatContext"; // Removed - not used
import io from "socket.io-client";
import Cookies from "js-cookie";
import { getMessagesApi } from "../../services/ApiService";
import "./ChatWidget.scss";

const ChatWidget = ({
  tutor,
  student,
  isOpen,
  onClose,
  style = {},
  embedded = false,
  conversationId, // Kiến trúc mới: conversationId từ ChatContext
  isMinimized: propIsMinimized, // Nhận isMinimized từ props
  onMinimize, // Nhận onMinimize từ props
  onMaximize, // Nhận onMaximize từ props
}) => {
  // Get chat partner info based on role
  const chatPartner = tutor || student;
  const currentUser = useSelector((state) => state.user.user);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [socketAuthenticated, setSocketAuthenticated] = useState(false);
  // Sử dụng prop isMinimized nếu có, nếu không thì dùng state local
  const [localIsMinimized, setLocalIsMinimized] = useState(false);
  const isMinimized =
    propIsMinimized !== undefined ? propIsMinimized : localIsMinimized;
  const [unreadCount, setUnreadCount] = useState(0);
  const [previousUserId, setPreviousUserId] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Helper function to get user ID with fallbacks
  const getUserId = () => {
    console.log("🔍 getUserId: Checking currentUser:", currentUser);

    let userId =
      currentUser?._id ||
      currentUser?.id ||
      currentUser?.account?._id ||
      currentUser?.account?.id ||
      currentUser?.user?._id ||
      currentUser?.user?.id;

    console.log("🔍 getUserId: After checking currentUser, userId =", userId);

    // Fallback to localStorage if still not found
    if (!userId) {
      console.log(
        "🔍 getUserId: Not found in currentUser, checking localStorage..."
      );
      try {
        const localStorageUserStr = localStorage.getItem("user");
        console.log(
          "🔍 getUserId: localStorage user string:",
          localStorageUserStr
        );

        if (localStorageUserStr) {
          const localStorageUser = JSON.parse(localStorageUserStr);
          console.log(
            "🔍 getUserId: Parsed localStorage user:",
            localStorageUser
          );

          userId =
            localStorageUser?._id ||
            localStorageUser?.id ||
            localStorageUser?.account?._id ||
            localStorageUser?.account?.userId;
          console.log("🔍 getUserId: Found userId from localStorage:", userId);
        } else {
          console.warn("🔍 getUserId: No user in localStorage");
        }
      } catch (e) {
        console.error("❌ getUserId: Failed to parse localStorage user:", e);
      }
    }

    // Nếu vẫn chưa có userId, thử decode từ JWT token (ưu tiên cao vì luôn có khi đã login)
    if (!userId) {
      try {
        const token = Cookies.get("accessToken");
        if (token) {
          console.log("🔍 getUserId: Attempting to decode JWT token...");
          // Decode JWT token để lấy userId (sub field chứa userId)
          const base64Url = token.split(".")[1];
          if (base64Url) {
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split("")
                .map(
                  (c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
                )
                .join("")
            );
            const decoded = JSON.parse(jsonPayload);
            userId = decoded.sub || decoded.userId || decoded.id;
            if (userId) {
              console.log("✅ getUserId: Got userId from JWT token:", userId);
            } else {
              console.warn(
                "⚠️ getUserId: JWT decoded but no userId found:",
                decoded
              );
            }
          }
        } else {
          console.warn("🔍 getUserId: No accessToken in cookies");
        }
      } catch (error) {
        console.error("❌ getUserId: Error decoding JWT token:", error);
      }
    }

    console.log("🔍 getUserId: Final userId =", userId);
    return userId;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Generate stable room id for two string IDs
  const generateRoomId = (idA, idB) => {
    const [a, b] = [String(idA), String(idB)].sort();
    return `chat_${a}_${b}`;
  };

  // Clear chat state when user changes (không clear khi đóng/mở chat)
  useEffect(() => {
    const userId = getUserId();
    if (previousUserId && previousUserId !== userId) {
      console.log("ChatWidget: User changed, clearing chat state");
      setMessages([]);
      setNewMessage("");
      setIsTyping(false);
      setOtherUserTyping(false);
      setUnreadCount(0);

      // Disconnect existing socket
      if (socket) {
        console.log("ChatWidget: Disconnecting socket for user change");
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    }
    setPreviousUserId(userId);
  }, [currentUser, previousUserId]);

  // KHÔNG clear messages khi đóng/mở chat - giữ lại để khi mở lại vẫn thấy
  // Messages sẽ được load lại từ API khi mở lại

  // Clear messages khi conversationId thay đổi (chuyển sang conversation khác)
  useEffect(() => {
    if (conversationId) {
      // Không clear ngay, đợi load messages mới
      console.log("ChatWidget: Conversation changed to:", conversationId);
    }
  }, [conversationId]);

  useEffect(() => {
    // Chỉ tạo socket mới nếu chưa có hoặc đã disconnect
    if (socket && isConnected && socket.connected) {
      console.log(
        "ChatWidget: Socket already connected, skipping reconnection"
      );
      return;
    }

    // Nếu socket tồn tại nhưng không connected, disconnect và tạo mới
    if (socket && !socket.connected) {
      console.log(
        "ChatWidget: Socket exists but not connected, disconnecting and recreating..."
      );
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }

    if (isOpen && (tutor || student)) {
      let chatSocket = null;
      let cachedUserId = null; // Cache userId for this socket session

      // Fetch user data directly from API if not available
      const fetchUserAndConnect = async () => {
        // Create new socket connection to chat namespace
        const socketUrl = process.env.REACT_APP_API_URL
          ? process.env.REACT_APP_API_URL.replace("/api/v1", "/chat")
          : "http://localhost:5000/chat";

        console.log("🔌 ChatWidget: Connecting to socket:", socketUrl);

        chatSocket = io(socketUrl, {
          transports: ["websocket", "polling"],
          reconnection: true, // Enable reconnection
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
        });

        setSocket(chatSocket);

        chatSocket.on("connect", async () => {
          console.log(
            "✅ ChatWidget: Connected to chat server, socket.connected:",
            chatSocket.connected
          );
          setIsConnected(true);

          // Get user ID using helper function
          let userId = getUserId();

          console.log("ChatWidget: Current user object:", currentUser);
          console.log("ChatWidget: Extracted userId:", userId);

          // If still no userId, try to fetch from API
          if (!userId) {
            console.log("🔍 ChatWidget: No userId found, fetching from API...");
            try {
              const { getCurrentUserApi } = await import(
                "../../services/ApiService"
              );
              const response = await getCurrentUserApi();
              console.log("🔍 ChatWidget: API response:", response);

              if (response?.user) {
                userId =
                  response.user._id ||
                  response.user.id ||
                  response.user.account?._id;
                console.log("🔍 ChatWidget: Got userId from API:", userId);
              }
            } catch (error) {
              console.error(
                "❌ ChatWidget: Failed to fetch user from API:",
                error
              );
            }
          }

          if (!userId) {
            console.error(
              "ChatWidget: No user ID found in currentUser or localStorage or API"
            );
            console.error(
              "ChatWidget: Full currentUser object:",
              JSON.stringify(currentUser, null, 2)
            );
            alert(
              "Lỗi: Không thể xác định người dùng. Vui lòng đăng nhập lại."
            );
            chatSocket.disconnect();
            return;
          }

          // Cache userId for this session
          cachedUserId = userId;
          chatSocket.userId = userId; // Store on socket

          // Authenticate first
          const userName =
            currentUser?.profile?.full_name ||
            currentUser?.name ||
            currentUser?.full_name ||
            currentUser?.account?.email ||
            "User";
          const userRole =
            currentUser?.account?.role || currentUser?.role || "student";

          console.log("ChatWidget: Authenticating with:", {
            userId,
            userName,
            userRole,
          });
          console.log("ChatWidget: currentUser for userName extraction:", {
            "profile.full_name": currentUser?.profile?.full_name,
            name: currentUser?.name,
            full_name: currentUser?.full_name,
            "account.email": currentUser?.account?.email,
          });

          chatSocket.emit("authenticate", {
            userId: userId,
            userName: userName,
            userRole: userRole,
          });
        });

        chatSocket.on("authenticated", async () => {
          console.log("ChatWidget: Authentication successful");
          setSocketAuthenticated(true);

          // Get user ID using helper function
          const userId = getUserId();

          // Kiến trúc mới: Ưu tiên dùng conversationId
          if (conversationId) {
            console.log("ChatWidget: Joining conversation:", conversationId);
            chatSocket.emit("join_chat_room", { conversationId });

            // Note: Messages sẽ được load bởi useEffect riêng để đảm bảo load lại khi mở lại
            // Không load ở đây để tránh duplicate
          } else {
            // Fallback: dùng roomId cũ
            const partnerId =
              chatPartner?.userId ||
              chatPartner?.id ||
              chatPartner?._id ||
              tutor?.userId ||
              student?.userId;
            if (!partnerId) {
              console.error(
                "❌ ChatWidget: Cannot join room - no partner ID found"
              );
              return;
            }
            const roomId = generateRoomId(userId, partnerId);
            console.log(
              "ChatWidget: Joining room (fallback):",
              roomId,
              "with partner:",
              partnerId
            );
            chatSocket.emit("join_chat_room", {
              roomId,
              tutorId: tutor?.userId,
            });
          }
        });

        // Listen for chat-specific events
        const handleChatMessage = (data) => {
          // Use cached userId or socket.userId first. Fall back to Redux currentUser id
          // which is typically the most reliable source when the socket is not yet
          // authenticated (this prevents mis-classifying messages after close/open).
          const userId =
            chatSocket?.userId ||
            cachedUserId ||
            (currentUser && (currentUser._id || currentUser.id)) ||
            getUserId();
          // Convert to string and compare strictly
          const isOwnMessage = String(data.senderId) === String(userId);

          console.log("📨 ChatWidget: Received chat_message:", {
            senderId: data.senderId,
            senderIdType: typeof data.senderId,
            currentUserId: userId,
            currentUserIdType: typeof userId,
            isOwnMessage,
            message: data.message,
            comparison: `"${String(data.senderId)}" === "${String(userId)}"`,
          });

          // CRITICAL FIX: If this is own message, SKIP adding to messages
          // because optimistic update already added it
          if (isOwnMessage) {
            console.log(
              "✅ ChatWidget: This is my own message, skipping (already have optimistic update)"
            );
            return; // DON'T add to messages
          }

          const newMsg = {
            id: Date.now() + Math.random(),
            text: data.message,
            senderId: data.senderId,
            senderName: data.senderName,
            timestamp: data.timestamp,
            isOwn: false, // Always false since we're here
          };

          setMessages((prev) => {
            // Check if message already exists (avoid duplicates)
            const exists = prev.some((msg) => {
              // Match by text and sender
              const textMatch = msg.text === data.message;
              const senderMatch = msg.senderId === data.senderId;
              // Check timestamp is within 2 seconds (for optimistic updates)
              const timestampMatch =
                Math.abs(new Date(msg.timestamp) - new Date(data.timestamp)) <
                2000;

              return textMatch && senderMatch && timestampMatch;
            });

            if (exists) {
              console.log(
                "⚠️ ChatWidget: Duplicate message detected, skipping"
              );
              return prev;
            }

            console.log("✅ ChatWidget: Adding new message from other user");
            return [...prev, newMsg];
          });

          // Increase unread count if widget is minimized
          if (isMinimized) {
            setUnreadCount((prev) => prev + 1);
          }
        };

        const handleUserTyping = (data) => {
          const userId =
            chatSocket?.userId ||
            cachedUserId ||
            (currentUser && (currentUser._id || currentUser.id)) ||
            getUserId();
          if (String(data.userId) !== String(userId)) {
            setOtherUserTyping(data.isTyping);
          }
        };

        const handleChatHistory = (history) => {
          if (!Array.isArray(history)) {
            console.error("Invalid chat history format:", history);
            return;
          }

          const userId =
            chatSocket?.userId ||
            cachedUserId ||
            (currentUser && (currentUser._id || currentUser.id)) ||
            getUserId();

          // Sort messages by timestamp to ensure correct order
          const sortedHistory = [...history].sort(
            (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
          );

          const formattedMessages = sortedHistory.map((msg) => ({
            id: msg._id,
            text: msg.message,
            senderId: msg.senderId,
            senderName: msg.senderName,
            timestamp: msg.timestamp,
            isRead: msg.isRead,
            isOwn: String(msg.senderId) === String(userId),
          }));

          setMessages(formattedMessages);

          // Mark messages as read - sử dụng chatPartner thay vì tutor để tránh null
          const partnerId =
            chatPartner?.userId ||
            chatPartner?.id ||
            chatPartner?._id ||
            tutor?.userId ||
            student?.userId;
          if (partnerId && userId) {
            const roomId = generateRoomId(userId, partnerId);
            chatSocket.emit("mark_messages_read", { roomId });
            console.log("✅ Marked messages as read for room:", roomId);
          } else {
            console.warn(
              "⚠️ Cannot mark messages as read: Missing partnerId or userId",
              {
                partnerId,
                userId,
                chatPartner,
                tutor,
                student,
              }
            );
          }
        };

        const handleDisconnect = (reason) => {
          console.log("⚠️ ChatWidget: Socket disconnected, reason:", reason);
          setIsConnected(false);
          setSocketAuthenticated(false);

          // Nếu disconnect do lỗi, thử reconnect sau 2 giây
          if (
            reason === "io server disconnect" ||
            reason === "transport close"
          ) {
            console.log(
              "🔄 ChatWidget: Attempting to reconnect in 2 seconds..."
            );
            setTimeout(() => {
              if (isOpen && chatSocket && !chatSocket.connected) {
                console.log("🔄 ChatWidget: Reconnecting socket...");
                chatSocket.connect();
              }
            }, 2000);
          }
        };

        const handleReconnect = async (attemptNumber) => {
          console.log(
            `✅ ChatWidget: Socket reconnected after ${attemptNumber} attempts`
          );
          setIsConnected(true);

          // Re-authenticate sau khi reconnect
          const userId = getUserId();
          if (userId) {
            const userName =
              currentUser?.profile?.full_name ||
              currentUser?.name ||
              currentUser?.full_name ||
              currentUser?.account?.email ||
              "User";
            const userRole =
              currentUser?.account?.role || currentUser?.role || "student";

            console.log("🔄 ChatWidget: Re-authenticating after reconnect...");
            chatSocket.emit("authenticate", {
              userId: userId,
              userName: userName,
              userRole: userRole,
            });

            // Rejoin room sau khi authenticated
            chatSocket.once("authenticated", async () => {
              console.log("✅ ChatWidget: Re-authenticated, rejoining room...");
              if (conversationId) {
                chatSocket.emit("join_chat_room", { conversationId });
              } else if (tutor?.userId || chatPartner?.userId) {
                const roomId = generateRoomId(
                  userId,
                  tutor?.userId || chatPartner?.userId
                );
                chatSocket.emit("join_chat_room", {
                  roomId,
                  tutorId: tutor?.userId,
                });
              }
            });
          }
        };

        const handleReconnectError = (error) => {
          console.error("❌ ChatWidget: Socket reconnection error:", error);
          setIsConnected(false);
        };

        const handleError = (error) => {
          console.error("ChatWidget: Socket error:", error);
        };

        // Add event listeners
        chatSocket.on("chat_message", handleChatMessage);
        chatSocket.on("user_typing", handleUserTyping);
        chatSocket.on("chat_history", handleChatHistory);
        chatSocket.on("disconnect", handleDisconnect);
        chatSocket.on("reconnect", handleReconnect);
        chatSocket.on("reconnect_error", handleReconnectError);
        chatSocket.on("error", handleError);
        chatSocket.on("authenticated", () => setSocketAuthenticated(true));

        // Return cleanup function
        return () => {
          // Remove event listeners and close socket
          if (chatSocket) {
            chatSocket.off("chat_message", handleChatMessage);
            chatSocket.off("user_typing", handleUserTyping);
            chatSocket.off("chat_history", handleChatHistory);
            chatSocket.off("disconnect", handleDisconnect);
            chatSocket.off("error", handleError);
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
  }, [isOpen, currentUser, tutor, conversationId]); // Thêm conversationId vào dependency

  // Load messages khi conversationId thay đổi hoặc khi mở lại chat
  useEffect(() => {
    // Only load messages if chat is open and we have a conversationId and socket is authenticated
    if (!isOpen || !conversationId) {
      console.log(
        "🔒 ChatWidget: Chat closed or no conversationId, keeping messages in memory"
      );
      return;
    }

    if (!socketAuthenticated) {
      console.log(
        "🔒 ChatWidget: Waiting for socket authentication before loading history"
      );
      return;
    }

    const loadMessages = async () => {
      try {
        console.log(
          "🔄 ChatWidget: Loading messages for conversation:",
          conversationId
        );
        const response = await getMessagesApi(conversationId);
        console.log(
          "📨 ChatWidget: Messages loaded from API:",
          response.messages?.length || 0
        );

        if (response.messages && response.messages.length > 0) {
          // Prefer Redux currentUser._id as the authoritative local user id
          const userId =
            (currentUser && (currentUser._id || currentUser.id)) ||
            (socket && socket.userId) ||
            getUserId();
          console.log(
            "🔍 ChatWidget: Loading messages with resolved userId:",
            userId
          );

          const formattedMessages = response.messages.map((msg) => {
            const senderIdValue =
              msg.senderId?._id || msg.senderId?.id || msg.senderId;
            const senderNameValue =
              msg.senderId?.full_name || msg.senderName || "User";
            const isOwn = userId
              ? String(senderIdValue) === String(userId)
              : false;

            return {
              id: msg._id || msg.id,
              text: msg.content || msg.message,
              senderId: senderIdValue,
              senderName: senderNameValue,
              timestamp: msg.timestamp || msg.createdAt,
              isRead: msg.isRead !== false,
              isOwn,
            };
          });

          formattedMessages.sort(
            (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
          );
          setMessages(formattedMessages);
          console.log(
            "✅ ChatWidget: Messages set, total:",
            formattedMessages.length
          );
          setTimeout(scrollToBottom, 100);
        } else {
          console.log("📭 ChatWidget: No messages found for this conversation");
          setMessages((prev) => (prev.length === 0 ? [] : prev));
        }
      } catch (error) {
        console.error("❌ ChatWidget: Error loading messages:", error);
      }
    };

    // Load messages once (socketAuthenticated ensures userId is available)
    loadMessages();
  }, [conversationId, isOpen, socketAuthenticated]);

  useEffect(() => {
    if (!isMinimized) {
      scrollToBottom();
      setUnreadCount(0); // Clear unread count when opened
    }
  }, [messages, isMinimized]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const userId = getUserId();

      // Kiến trúc mới: Ưu tiên dùng conversationId
      const messageData = {
        message: newMessage.trim(),
        senderId: userId,
        senderName: currentUser?.name || currentUser?.full_name || "You",
        timestamp: new Date().toISOString(),
      };

      console.log("🔍 ChatWidget: Preparing to send message:", {
        conversationId,
        chatPartner: chatPartner
          ? {
              userId: chatPartner.userId,
              id: chatPartner.id,
              _id: chatPartner._id,
            }
          : null,
        tutor: tutor
          ? {
              userId: tutor.userId,
              id: tutor.id,
              _id: tutor._id,
            }
          : null,
        student: student
          ? {
              userId: student.userId,
              id: student.id,
              _id: student._id,
            }
          : null,
      });

      if (conversationId) {
        messageData.conversationId = conversationId;
        // receiverId không bắt buộc nếu có conversationId, nhưng thêm vào để đảm bảo
        const receiverId =
          chatPartner?.userId ||
          chatPartner?.id ||
          chatPartner?._id ||
          tutor?.userId ||
          student?.userId;
        if (receiverId) {
          messageData.receiverId = receiverId;
          console.log("✅ Added receiverId to messageData:", receiverId);
        } else {
          console.warn(
            "⚠️ No receiverId found, backend will extract from conversation"
          );
        }
      } else {
        // Fallback: dùng roomId
        const receiverId =
          chatPartner?.userId ||
          chatPartner?.id ||
          chatPartner?._id ||
          tutor?.userId ||
          student?.userId;
        if (!receiverId) {
          console.error(
            "❌ Cannot send message: No receiverId and no conversationId"
          );
          alert("Không thể gửi tin nhắn: Thiếu thông tin người nhận");
          return;
        }
        const roomId = generateRoomId(userId, receiverId);
        messageData.roomId = roomId;
        messageData.receiverId = receiverId;
        console.log("⚠️ Using fallback roomId:", roomId);
      }

      console.log("📤 ChatWidget: Đang gửi tin nhắn:", {
        ...messageData,
        messageLength: messageData.message.length,
      });

      // Clear input immediately for better UX
      const messageText = newMessage.trim();
      setNewMessage("");

      // Add message to local state immediately for optimistic update
      const optimisticMsg = {
        id: Date.now() + Math.random(),
        text: messageText,
        senderId: userId,
        senderName: messageData.senderName,
        timestamp: messageData.timestamp,
        isOwn: true,
        isOptimistic: true,
        status: "sending", // Add status tracking
      };

      // Add to messages state
      setMessages((prev) => [...prev, optimisticMsg]);

      // Function to retry sending message
      const sendMessageWithRetry = async (retryCount = 0) => {
        // Kiểm tra socket connection - nếu chưa connect, thử reconnect
        if (!socket || !socket.connected || !isConnected) {
          console.log(`⚠️ Socket not connected. Attempt: ${retryCount + 1}/5`);
          console.log("Socket state:", {
            socketExists: !!socket,
            socketConnected: socket?.connected,
            isConnected,
          });

          // Thử reconnect nếu socket tồn tại nhưng chưa connect
          if (socket && !socket.connected) {
            console.log("🔄 Attempting to reconnect socket...");
            socket.connect();
            // Đợi một chút để socket connect
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }

          if (retryCount < 5) {
            console.log(`Retry attempt ${retryCount + 1}/5...`);
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * (retryCount + 1))
            );
            return sendMessageWithRetry(retryCount + 1);
          }
          throw new Error(
            "Socket không kết nối sau 5 lần thử. Vui lòng tắt và mở lại chat."
          );
        }

        return new Promise((resolve, reject) => {
          socket.emit("send_message", messageData, (ack) => {
            if (ack && ack.status === "success") {
              resolve(ack);
            } else {
              reject(new Error(ack?.error || "Lỗi gửi tin nhắn"));
            }
          });

          // Timeout after 5 seconds
          setTimeout(() => reject(new Error("Timeout")), 5000);
        });
      };

      try {
        // Attempt to send message with retry
        await sendMessageWithRetry();

        // Update message status on success
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === optimisticMsg.id
              ? { ...msg, status: "sent", isOptimistic: false }
              : msg
          )
        );

        console.log("✅ Tin nhắn đã được gửi và lưu thành công");
      } catch (error) {
        console.error("❌ Lỗi khi gửi tin nhắn:", error);

        // Update message status on failure
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === optimisticMsg.id
              ? { ...msg, status: "failed", error: error.message }
              : msg
          )
        );

        // Save failed message to localStorage for retry later
        const failedMessages = JSON.parse(
          localStorage.getItem("failedMessages") || "[]"
        );
        failedMessages.push({
          ...messageData,
          id: optimisticMsg.id,
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem("failedMessages", JSON.stringify(failedMessages));
      }

      // Stop typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (socket && isConnected) {
        socket.emit("typing", {
          roomId: messageData.roomId,
          isTyping: false,
        });
      }
      setIsTyping(false);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!isTyping && socket && isConnected) {
      const userId = getUserId();
      const partnerId =
        chatPartner?.userId ||
        chatPartner?.id ||
        chatPartner?._id ||
        tutor?.userId ||
        student?.userId;
      if (!partnerId) {
        console.warn("⚠️ Cannot send typing indicator: No partner ID");
        return;
      }
      const roomId = generateRoomId(userId, partnerId);
      socket.emit("typing", { roomId, isTyping: true });
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
        const typingData = { isTyping: false };
        if (conversationId) {
          typingData.roomId = conversationId.toString();
        } else {
          const partnerId =
            chatPartner?.userId ||
            chatPartner?.id ||
            chatPartner?._id ||
            tutor?.userId ||
            student?.userId;
          if (partnerId) {
            const roomId = generateRoomId(userId, partnerId);
            typingData.roomId = roomId;
          } else {
            console.warn("⚠️ Cannot send typing indicator: No partner ID");
            return;
          }
        }
        socket.emit("typing", typingData);
        setIsTyping(false);
      }
    }, 1000);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className={`chat-widget ${isMinimized ? "minimized" : ""} ${
        embedded ? "embedded" : ""
      }`}
      style={style}
    >
      <div className="chat-header">
        <div className="chat-user-info">
          <img
            src={chatPartner.avatar || "https://via.placeholder.com/40"}
            alt={chatPartner.name}
            className="user-avatar"
          />
          <div className="user-details">
            <h4>{chatPartner.name}</h4>
            <span className={`status ${isConnected ? "online" : "offline"}`}>
              {isConnected ? "Online" : "Offline"}
            </span>
            <span className="role-badge">
              {chatPartner === tutor ? "Gia sư" : "Học sinh"}
            </span>
          </div>
        </div>
        <div className="chat-controls">
          <button
            className="minimize-btn"
            onClick={() => {
              if (propIsMinimized !== undefined) {
                // Nếu nhận từ props, gọi callback từ props
                if (isMinimized && onMaximize) {
                  onMaximize();
                } else if (!isMinimized && onMinimize) {
                  onMinimize();
                }
              } else {
                // Nếu không có props, dùng local state
                setLocalIsMinimized(!isMinimized);
              }
            }}
            aria-label={isMinimized ? "Mở rộng" : "Thu nhỏ"}
          >
            <i className={`fas fa-${isMinimized ? "expand" : "minus"}`}></i>
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
                className={`message ${message.isOwn ? "own" : "other"}`}
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
          {unreadCount > 99 ? "99+" : unreadCount}
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
