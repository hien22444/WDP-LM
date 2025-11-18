import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useChat } from "../../contexts/ChatContext";
import TutorChatList from "../../components/Chat/TutorChatList";
import ChatWidget from "../../components/Chat/ChatWidget";
import { getConversationsApi } from "../../services/ApiService";
import "./Messages.scss";

const MessagesPage = () => {
  const navigate = useNavigate();
  const { socket } = useChat();
  const {
    isAuthenticated,
    user: currentUser,
    loading: authLoading,
  } = useSelector((state) => state.user);

  const userRole = currentUser?.role || currentUser?.account?.role;
  const [storedUserData, setStoredUserData] = useState(null);

  const [activeChat, setActiveChat] = useState(null);
  const [reconnecting, setReconnecting] = useState(false);
  const [chatList, setChatList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Initial authentication and role check with persistence
  useEffect(() => {
    const checkAuth = async () => {
      console.log("🔍 Auth Check State:", {
        isAuthenticated,
        userRole,
        loading,
        initialized,
        authLoading,
        currentUser,
      });

      // Nếu đang loading, đợi
      if (authLoading) {
        console.log("⏳ Đang đợi auth state...");
        return;
      }

      try {
        // Kiểm tra Redux state trước
        if (isAuthenticated && userRole === "tutor") {
          console.log("✅ Xác thực thành công từ Redux:", currentUser);
          setInitialized(true);
          setStoredUserData(currentUser);
          setLoading(false);
          return;
        }

        // Sau đó kiểm tra localStorage
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          console.log("📦 User data từ localStorage:", parsedUser);

          const storedRole = parsedUser?.role || parsedUser?.account?.role;
          if (storedRole === "tutor") {
            console.log("✅ Tìm thấy gia sư trong localStorage");
            setInitialized(true);
            setStoredUserData(parsedUser);
            setLoading(false);
            return;
          }
        }

        // Nếu không có xác thực hợp lệ
        if (!authLoading && !isAuthenticated) {
          console.log("❌ Không tìm thấy thông tin xác thực");
          navigate("/login", { replace: true });
          return;
        }

        // Kiểm tra role
        if (!authLoading && userRole && userRole !== "tutor") {
          console.log("❌ Người dùng không phải gia sư");
          navigate("/dashboard", { replace: true });
          return;
        }
      } catch (error) {
        console.error("Lỗi kiểm tra xác thực:", error);
      }
    };

    checkAuth();
  }, [isAuthenticated, userRole, authLoading, initialized, navigate]);

  // Load conversations independently khi đã initialized
  useEffect(() => {
    if (!initialized) {
      return;
    }

    const loadConversations = async () => {
      const effectiveUser = currentUser || storedUserData;
      const userId = effectiveUser?._id || effectiveUser?.account?._id;

      if (!userId) {
        console.warn("⚠️ No userId available for loading conversations");
        setLoading(false);
        return;
      }

      try {
        console.log("🔄 Loading conversations on mount for userId:", userId);
        const response = await getConversationsApi();
        console.log("📨 API Response on mount:", {
          success: response.success,
          conversationsCount: response.conversations?.length || 0,
        });

        if (response.success && response.conversations) {
          if (response.conversations.length === 0) {
            console.warn("⚠️ No conversations found");
            setChatList([]);
            setLoading(false);
            return;
          }

          const mappedChats = response.conversations
            .map((conv) => {
              const otherParticipant = conv.otherParticipant;
              if (!otherParticipant) {
                return null;
              }

              const otherParticipantId =
                otherParticipant._id || otherParticipant;
              const [id1, id2] = [
                String(userId),
                String(otherParticipantId),
              ].sort();
              const roomId = `chat_${id1}_${id2}`;

              return {
                conversationId: conv._id,
                roomId,
                userId: String(otherParticipantId),
                name:
                  otherParticipant?.full_name ||
                  otherParticipant?.email ||
                  "Unknown Student",
                avatar: otherParticipant?.profile?.avatar || null,
                isOnline: false,
                lastMessage: conv.lastMessage
                  ? {
                      text:
                        conv.lastMessage.content || conv.lastMessage.message,
                      timestamp: conv.lastMessage.timestamp,
                      isRead: conv.lastMessage.isRead,
                    }
                  : null,
                unreadCount: conv.unreadCount || 0,
              };
            })
            .filter((chat) => chat !== null);

          console.log(`✅ Loaded ${mappedChats.length} conversations on mount`);
          setChatList(mappedChats);
        }
        setLoading(false);
      } catch (error) {
        console.error("❌ Error loading conversations on mount:", error);
        setLoading(false);
      }
    };

    loadConversations();
  }, [initialized, currentUser, storedUserData]);

  // Load saved messages from localStorage
  useEffect(() => {
    if (activeChat?.roomId) {
      const savedMessages = localStorage.getItem(
        `chat_messages_${activeChat.roomId}`
      );
      if (savedMessages) {
        try {
          const parsedMessages = JSON.parse(savedMessages);
          console.log("🔄 Loaded saved messages:", parsedMessages);
          setChatList((prevList) => {
            return prevList.map((chat) => {
              if (chat.roomId === activeChat.roomId) {
                const lastMessage = parsedMessages[parsedMessages.length - 1];
                return {
                  ...chat,
                  lastMessage: lastMessage
                    ? {
                        text: lastMessage.text,
                        timestamp: lastMessage.timestamp,
                      }
                    : chat.lastMessage,
                };
              }
              return chat;
            });
          });
        } catch (err) {
          console.error("Error loading saved messages:", err);
        }
      }
    }
  }, [activeChat]);

  useEffect(() => {
    // Don't try to connect socket until authentication is confirmed
    if (!initialized) {
      console.log("Waiting for auth initialization...");
      return;
    }

    // Check either Redux state or stored user data
    const effectiveUser = currentUser || storedUserData;
    const effectiveRole = effectiveUser?.role || effectiveUser?.account?.role;

    if (
      !socket ||
      (!currentUser && !storedUserData) ||
      effectiveRole !== "tutor"
    ) {
      console.log("Not ready for socket connection", {
        hasSocket: !!socket,
        hasCurrentUser: !!currentUser,
        hasStoredUser: !!storedUserData,
        effectiveRole,
      });
      return;
    }

    const tutorId = currentUser?._id || currentUser?.account?._id;
    console.log("🔍 Current tutor ID:", tutorId);

    const handleConnect = async () => {
      console.log("🔌 Socket kết nối thành công");
      setReconnecting(false);

      const userId =
        currentUser?._id ||
        currentUser?.account?._id ||
        storedUserData?._id ||
        storedUserData?.account?._id;

      if (!userId) {
        console.error("❌ Không tìm thấy userId cho socket");
        return;
      }

      console.log("🔍 Thông tin user cho socket:", {
        userId,
        role: userRole,
        currentUser,
        storedUserData,
      });

      // Join all necessary rooms
      socket.emit("authenticate", {
        userId,
        userRole,
        userName:
          currentUser?.name || currentUser?.profile?.full_name || "Gia sư",
      });

      socket.emit("join_tutor_room", { tutorId: userId });
      socket.emit("join_user_room", { userId });
      socket.emit("get_chat_list");

      console.log("🔄 Đã yêu cầu danh sách chat từ socket");

      // Gửi trạng thái online
      socket.emit("user_status", {
        userId,
        status: "online",
        userRole,
      });

      // Load conversations từ REST API (fallback và primary source)
      try {
        console.log("🔄 Loading conversations from REST API...");
        console.log("🔍 Current userId for API call:", userId);
        const response = await getConversationsApi();
        console.log("📨 API Response:", {
          success: response.success,
          conversationsCount: response.conversations?.length || 0,
          conversations: response.conversations,
        });

        if (response.success && response.conversations) {
          console.log(
            "✅ Loaded conversations from API:",
            response.conversations.length
          );

          if (response.conversations.length === 0) {
            console.warn("⚠️ API returned empty conversations array");
            setLoading(false);
            return;
          }

          // Map API response to chat list format
          const mappedChats = response.conversations
            .map((conv) => {
              const otherParticipant = conv.otherParticipant;
              if (!otherParticipant) {
                console.warn(
                  "⚠️ Conversation missing otherParticipant:",
                  conv._id
                );
                return null;
              }

              const otherParticipantId =
                otherParticipant._id || otherParticipant;
              const [id1, id2] = [
                String(userId),
                String(otherParticipantId),
              ].sort();
              const roomId = `chat_${id1}_${id2}`;

              const mappedChat = {
                conversationId: conv._id,
                roomId, // Backward compatibility
                userId: String(otherParticipantId),
                name:
                  otherParticipant?.full_name ||
                  otherParticipant?.email ||
                  "Unknown Student",
                avatar: otherParticipant?.profile?.avatar || null,
                isOnline: false, // Will be updated by socket
                lastMessage: conv.lastMessage
                  ? {
                      text:
                        conv.lastMessage.content || conv.lastMessage.message,
                      timestamp: conv.lastMessage.timestamp,
                      isRead: conv.lastMessage.isRead,
                    }
                  : null,
                unreadCount: conv.unreadCount || 0,
              };

              console.log("📋 Mapped chat:", {
                conversationId: mappedChat.conversationId,
                userId: mappedChat.userId,
                name: mappedChat.name,
                hasLastMessage: !!mappedChat.lastMessage,
              });

              return mappedChat;
            })
            .filter((chat) => chat !== null); // Filter out null entries

          console.log(`✅ Mapped ${mappedChats.length} chats from API`);
          setChatList(mappedChats);
          setLoading(false);
        } else {
          console.warn(
            "⚠️ API response not successful or missing conversations:",
            response
          );
          setLoading(false);
        }
      } catch (error) {
        console.error("❌ Error loading conversations from API:", error);
        console.error("❌ Error details:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        setLoading(false);
        // Continue with socket-based loading
      }
    };
    const handleDisconnect = () => {
      console.log("Socket disconnected in MessagesPage");
      setReconnecting(true);
    };

    const handleReconnect = () => {
      console.log("Socket reconnected in MessagesPage");
      setReconnecting(false);
      // Re-fetch chat list
      socket.emit(userRole === "tutor" ? "get_chat_list" : "get_student_chats");
    };

    const handleChatList = (data) => {
      console.log("🔍 Received chat list:", data);
      if (data.chats && Array.isArray(data.chats)) {
        // Merge với danh sách hiện tại và loại bỏ trùng lặp
        setChatList((prevList) => {
          const combinedChats = [...prevList];

          data.chats.forEach((newChat) => {
            const existingIndex = combinedChats.findIndex(
              (existing) =>
                existing.roomId === newChat.roomId ||
                existing.userId === newChat.userId
            );

            if (existingIndex === -1) {
              // Thêm chat mới
              combinedChats.push(newChat);
            } else {
              // Cập nhật chat hiện có với thông tin mới nhất
              combinedChats[existingIndex] = {
                ...combinedChats[existingIndex],
                ...newChat,
                lastMessage:
                  newChat.lastMessage ||
                  combinedChats[existingIndex].lastMessage,
                unreadCount: Math.max(
                  newChat.unreadCount || 0,
                  combinedChats[existingIndex].unreadCount || 0
                ),
              };
            }
          });

          // Sắp xếp theo thời gian tin nhắn mới nhất
          const sortedChats = combinedChats.sort((a, b) => {
            const timeA = new Date(a.lastMessage?.timestamp || 0);
            const timeB = new Date(b.lastMessage?.timestamp || 0);
            return timeB - timeA;
          });

          console.log("✅ Updated chat list:", sortedChats);
          return sortedChats;
        });
      }
    };

    const handleNewMessage = (data) => {
      console.log("📨 New message received:", data);
      const tutorId = currentUser?._id || currentUser?.account?._id;

      console.log("🔍 Checking message relevance:", {
        tutorId,
        senderId: data.senderId,
        receiverId: data.receiverId,
        messageData: data,
      });

      // Kiểm tra xem tin nhắn có liên quan đến gia sư này không
      const isRelevant =
        data.receiverId === tutorId || data.senderId === tutorId;
      console.log("Message relevant to tutor?", isRelevant);

      if (isRelevant) {
        console.log("📨 Processing new message for chat list");

        // Cập nhật chat hiện có hoặc thêm chat mới
        setChatList((prevList) => {
          // Convert IDs to strings for comparison
          const senderIdStr = String(data.senderId);
          const receiverIdStr = String(data.receiverId);
          const tutorIdStr = String(tutorId);

          // Tìm chat trong danh sách
          const chatIndex = prevList.findIndex((chat) => {
            const chatUserId = String(chat.userId);
            const chatRoomId = String(chat.roomId);
            const messageRoomId = String(data.roomId);

            return (
              chatRoomId === messageRoomId ||
              chatUserId ===
                (senderIdStr === tutorIdStr ? receiverIdStr : senderIdStr)
            );
          });

          if (chatIndex > -1) {
            // Cập nhật chat hiện có
            console.log("📨 Updating existing chat at index:", chatIndex);
            const updatedList = [...prevList];
            updatedList[chatIndex] = {
              ...updatedList[chatIndex],
              lastMessage: {
                text: data.message,
                timestamp: new Date().toISOString(),
              },
              unreadCount: (updatedList[chatIndex].unreadCount || 0) + 1,
            };
            return updatedList;
          } else {
            // Thêm chat mới vào đầu danh sách
            console.log("📨 Adding new chat from message:", data);
            const [id1, id2] = [
              String(tutorId),
              senderIdStr === tutorIdStr ? receiverIdStr : senderIdStr,
            ].sort();
            const roomId = data.roomId || `chat_${id1}_${id2}`;

            const newChat = {
              conversationId: data.conversationId || null, // Kiến trúc mới
              roomId: roomId, // Backward compatibility
              userId: senderIdStr === tutorIdStr ? receiverIdStr : senderIdStr,
              name: data.senderName,
              avatar: data.senderAvatar || null,
              lastMessage: {
                text: data.message || data.content,
                timestamp: new Date().toISOString(),
              },
              unreadCount: 1,
              isOnline: true, // Assume sender is online since they just sent a message
            };
            return [newChat, ...prevList];
          }
        });

        // Ngay lập tức yêu cầu danh sách chat mới
        console.log("🔄 Requesting fresh chat list after new message");
        socket.emit("get_tutor_chats", { tutorId });
        socket.emit("get_chat_list");
      }
    };

    // Socket event listeners
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("reconnect", handleReconnect);
    socket.on("chat_list", handleChatList);
    socket.on("tutor_chats", handleChatList);
    socket.on("new_chat_message", handleNewMessage);
    socket.on("chat_message", handleNewMessage);
    socket.on("student_message", handleNewMessage); // Listen for direct student messages

    // Listen for specific events about new student messages
    socket.on("new_student_message", (data) => {
      console.log("📨 New student message received:", data);
      handleNewMessage(data);
      // Force refresh chat list
      socket.emit("get_tutor_chats", { tutorId });
    });
    socket.on("chat_list_updated", async () => {
      // Refresh chat list when notified of updates
      const tutorId = currentUser?._id || currentUser?.account?._id;
      socket.emit("get_tutor_chats", { tutorId });

      // Also reload from REST API
      try {
        console.log("🔄 Refreshing conversations from API after update...");
        const response = await getConversationsApi();
        if (response.success && response.conversations) {
          const userId =
            currentUser?._id ||
            currentUser?.account?._id ||
            storedUserData?._id ||
            storedUserData?.account?._id;
          const mappedChats = response.conversations.map((conv) => {
            const otherParticipant = conv.otherParticipant;
            const [id1, id2] = [
              String(userId),
              String(otherParticipant._id || otherParticipant),
            ].sort();
            const roomId = `chat_${id1}_${id2}`;

            return {
              conversationId: conv._id,
              roomId,
              userId: String(otherParticipant._id || otherParticipant),
              name:
                otherParticipant?.full_name ||
                otherParticipant?.email ||
                "Unknown Student",
              avatar:
                otherParticipant?.profile?.avatar ||
                "https://via.placeholder.com/40",
              isOnline: false,
              lastMessage: conv.lastMessage
                ? {
                    text: conv.lastMessage.content || conv.lastMessage.message,
                    timestamp: conv.lastMessage.timestamp,
                    isRead: conv.lastMessage.isRead,
                  }
                : null,
              unreadCount: conv.unreadCount || 0,
            };
          });
          setChatList(mappedChats);
          console.log("✅ Chat list refreshed from API");
        }
      } catch (error) {
        console.error("❌ Error refreshing conversations:", error);
      }
    });

    // Initial fetch of chat list
    handleConnect();

    // Clean up
    return () => {
      const userId =
        currentUser?._id ||
        currentUser?.account?._id ||
        storedUserData?._id ||
        storedUserData?.account?._id;

      if (userId) {
        socket.emit("user_status", {
          userId,
          status: "offline",
          userRole,
        });
      }

      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("reconnect", handleReconnect);
      socket.off("chat_list", handleChatList);
      socket.off("student_chat_list", handleChatList);
      socket.off("new_chat_message", handleNewMessage);
      socket.off("chat_message", handleNewMessage);
      socket.off("new_student_message");
      socket.off("chat_list_updated");

      console.log("🔌 Đã ngắt kết nối socket");
    };
  }, [socket, currentUser, userRole]);

  return (
    <div className="messages-page">
      <div className="messages-container">
        {/* Left sidebar with chat list */}
        <div className="chat-list-sidebar">
          <div className="chat-list-header">
            <h3>
              {userRole === "tutor" ? "Chat với học sinh" : "Chat với gia sư"}
            </h3>
          </div>
          <div className="chat-list-content">
            {chatList.map((chat) => (
              <div
                key={chat.roomId || chat.userId}
                className={`chat-item ${
                  activeChat?.roomId === chat.roomId ? "active" : ""
                }`}
                onClick={() => setActiveChat(chat)}
              >
                {/* <div className="chat-item-avatar">
                  <img src={chat.image || ""} alt={chat.name} />
                  {chat.isOnline && <div className="online-indicator" />}
                </div> */}

                <div className="chat-item-info">
                  <div className="chat-item-header">
                    <h4>{chat.name}</h4>
                    {/* <span className="last-seen">
                      {chat.isOnline ? "Online" : "Offline"}
                    </span> */}
                  </div>

                  <div className="chat-item-preview">
                    <p>{chat.lastMessage?.text || "Chưa có tin nhắn"}</p>
                    {chat.unreadCount > 0 && (
                      <span className="unread-count">{chat.unreadCount}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main chat area */}
        <div className="chat-area">
          {reconnecting && (
            <div className="reconnecting-overlay">
              <div className="spinner"></div>
              <p>Đang kết nối lại...</p>
            </div>
          )}

          {activeChat ? (
            <ChatWidget
              tutor={userRole === "student" ? activeChat : null}
              student={userRole === "tutor" ? activeChat : null}
              isOpen={true}
              onClose={() => setActiveChat(null)}
              style={{ position: "relative", height: "100%", margin: 0 }}
              embedded={true}
              conversationId={activeChat.conversationId || activeChat._id}
              key={
                activeChat.conversationId ||
                activeChat.roomId ||
                activeChat.userId
              }
            />
          ) : (
            <div className="no-chat-selected">
              <i className="fas fa-comments"></i>
              <h3>Chọn một cuộc trò chuyện</h3>
              <p>
                {userRole === "tutor"
                  ? "Chọn học sinh từ danh sách bên trái để bắt đầu trò chuyện"
                  : "Chọn gia sư từ danh sách bên trái để bắt đầu trò chuyện"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
