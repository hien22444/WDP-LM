import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useChat } from "../../contexts/ChatContext";
import TutorChatList from "../../components/Chat/TutorChatList";
import ChatWidget from "../../components/Chat/ChatWidget";
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
      console.log("🔍 Checking auth state:", {
        isAuthenticated,
        userRole,
        loading,
        initialized,
        authLoading,
      });

      // If still loading auth state, wait
      if (authLoading) {
        console.log("⏳ Auth state still loading...");
        return;
      }

      try {
        // First try to get user from localStorage
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          const storedRole = parsedUser?.role || parsedUser?.account?.role;

          if (storedRole === "tutor") {
            console.log("✅ Found valid tutor in localStorage");
            setLoading(false);
            setInitialized(true);
            // Store the user data for socket connection
            setStoredUserData(parsedUser);
            return;
          }
        }

        // Then check Redux state
        if (isAuthenticated && userRole === "tutor") {
          console.log("✅ Found authenticated tutor in Redux state");
          setLoading(false);
          setInitialized(true);
          return;
        }

        // Only redirect if we're sure no valid auth exists
        if (!authLoading && !isAuthenticated) {
          console.log("❌ No valid authentication found");
          navigate("/login", { replace: true });
          return;
        }

        // Only redirect non-tutors if we're sure about their role
        if (!authLoading && userRole && userRole !== "tutor") {
          console.log("❌ User is not a tutor");
          navigate("/dashboard", { replace: true });
          return;
        }
      } catch (error) {
        console.error("Error during auth check:", error);
      }
    };

    checkAuth();

    checkAuth();
  }, [isAuthenticated, userRole, authLoading, loading, initialized, navigate]);

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

    const handleConnect = () => {
      console.log("Socket connected in MessagesPage");
      setReconnecting(false);

      // Join tutor's personal room for direct messages
      if (tutorId) {
        console.log("🔍 Joining tutor room:", tutorId);
        socket.emit("join_tutor_room", { tutorId });
        socket.emit("join_personal_room", { userId: tutorId }); // Join personal room for updates

        // Get initial chat list
        socket.emit("get_tutor_chats", { tutorId });
        socket.emit("get_chat_list"); // Get all chats including new ones

        console.log("🔄 Requested chat lists for tutor:", tutorId);
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
            const newChat = {
              roomId: data.roomId,
              userId: senderIdStr === tutorIdStr ? receiverIdStr : senderIdStr,
              name: data.senderName,
              avatar: data.senderAvatar || "https://via.placeholder.com/40",
              lastMessage: {
                text: data.message,
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
    socket.on("chat_list_updated", () => {
      // Refresh chat list when notified of updates
      const tutorId = currentUser?._id || currentUser?.account?._id;
      socket.emit("get_tutor_chats", { tutorId });
    });

    // Initial fetch of chat list
    handleConnect();

    // Clean up
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("reconnect", handleReconnect);
      socket.off("chat_list", handleChatList);
      socket.off("student_chat_list", handleChatList);
      socket.off("new_chat_message", handleNewMessage);
      socket.off("chat_message", handleNewMessage);
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
                <div className="chat-item-avatar">
                  <img
                    src={chat.avatar || "https://via.placeholder.com/40"}
                    alt={chat.name}
                  />
                  {chat.isOnline && <div className="online-indicator" />}
                </div>

                <div className="chat-item-info">
                  <div className="chat-item-header">
                    <h4>{chat.name}</h4>
                    <span className="last-seen">
                      {chat.isOnline ? "Online" : "Offline"}
                    </span>
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
              key={activeChat.roomId || activeChat.userId}
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
