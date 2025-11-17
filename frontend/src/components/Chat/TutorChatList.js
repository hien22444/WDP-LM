import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useChat } from "../../contexts/ChatContext";
import "./TutorChatList.scss";

const TutorChatList = () => {
  const currentUser = useSelector((state) => state.user.user);
  const { socket, openChat } = useChat();
  const [chatList, setChatList] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});

  useEffect(() => {
    if (!socket) return;

    // const handleChatList = (data) => {
    //   console.log("Received chat list:", data);
    //   if (data.chats && Array.isArray(data.chats)) {
    //     setChatList(data.chats);
    //   }
    // };

    const handleChatList = (data) => {
      console.log("==========================================");
      console.log("🔴 TÔI CẦN XEM CÁI NÀY - DATA CHAT LIST:", data);
      console.log("==========================================");

      // console.log("Received chat list:", data); // Dòng cũ
      if (data.chats && Array.isArray(data.chats)) {
        setChatList(data.chats);
      }
    };

    const handleNewMessage = (data) => {
      console.log("Received new message:", data);
      const { senderId, receiverId, roomId } = data;

      // Update unread count for the appropriate chat
      setUnreadCounts((prev) => ({
        ...prev,
        [senderId]: (prev[senderId] || 0) + 1,
      }));

      // Update chat list with new message
      setChatList((prevList) => {
        const updatedList = [...prevList];
        const chatIndex = updatedList.findIndex(
          (chat) => chat.roomId === roomId || chat.userId === senderId
        );

        if (chatIndex > -1) {
          updatedList[chatIndex] = {
            ...updatedList[chatIndex],
            lastMessage: {
              text: data.message,
              timestamp: new Date().toISOString(),
            },
          };
        }
        return updatedList;
      });
    };

    const handleMessagesRead = (data) => {
      console.log("Messages read:", data);
      const { readBy, roomId } = data;
      // Clear unread count for the chat
      setUnreadCounts((prev) => ({
        ...prev,
        [readBy]: 0,
      }));
    };

    // Request chat list when component mounts
    console.log("Requesting chat list...");
    socket.emit("get_chat_list");

    // Listen for updates to chat list
    socket.on("chat_list", handleChatList);
    socket.on("new_chat_message", handleNewMessage);
    socket.on("messages_read_by", handleMessagesRead);

    return () => {
      socket.off("chat_list", handleChatList);
      socket.off("new_chat_message", handleNewMessage);
      socket.off("messages_read_by", handleMessagesRead);
    };
  }, [socket]);

  const handleChatClick = (chat) => {
    setActiveChat(chat);
    // Reset unread count for this chat
    setUnreadCounts((prev) => ({
      ...prev,
      [chat.userId]: 0,
    }));
    // Open chat window
    openChat(chat);
  };

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return "Offline";
    const now = new Date();
    const lastSeen = new Date(timestamp);
    const diffMinutes = Math.floor((now - lastSeen) / (1000 * 60));

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return lastSeen.toLocaleDateString("vi-VN");
  };

  // Helper function to generate default avatar

  const getDefaultAvatar = (name) => {
    const encodedName = encodeURIComponent(name || "User");
    return `https://ui-avatars.com/api/?name=${encodedName}&background=667eea&color=fff&bold=true&length=1&rounded=true&size=56`;
  };

  // Helper function to get proper avatar URL with fallback
  // const getAvatarUrl = (chat) => {
  //   if (!chat) return getDefaultAvatar("User");

  //   // Check multiple possible avatar field names from different data sources
  //   const avatar =
  //     chat.student?.profileImage ||
  //     chat.avatar ||
  //     chat.profile?.image ||
  //     chat.image ||
  //     chat.studentProfile?.avatar ||
  //     chat.profile?.avatar;

  //   // If avatar exists and is a valid URL, return it
  //   if (avatar && typeof avatar === "string" && avatar.trim().length > 0) {
  //     return avatar;
  //   }

  //   // Otherwise return default avatar with student name
  //   return getDefaultAvatar(chat.name || "Học sinh");
  // };
  // Helper function to get proper avatar URL with fallback
  const getAvatarUrl = (chat) => {
    if (!chat) return getDefaultAvatar("User");

    // Dựa trên user.model.js, chúng ta chỉ cần tìm trường 'image'.
    // Nó có thể nằm trực tiếp trên chat, hoặc lồng trong 1 object (ví dụ: student)
    const avatar =
      chat.image || // Khả năng 1: { ...chat, image: "url..." }
      chat.student?.image || // Khả năng 2: { ...chat, student: { image: "url..." } }
      chat.participant?.image; // Khả năng 3: { ...chat, participant: { image: "url..." } }

    // Nếu tìm thấy avatar hợp lệ, trả về nó
    if (avatar && typeof avatar === "string" && avatar.trim().length > 0) {
      return avatar;
    }

    // Nếu không, trả về avatar mặc định
    return getDefaultAvatar(chat.name || "Học sinh");
  };

  return (
    <div className="tutor-chat-list">
      <div className="chat-list-header">
        <h3>Chat với học sinh</h3>
      </div>

      <div className="chat-list-content">
        {chatList.map((chat) => (
          <div
            key={chat.userId}
            className={`chat-item ${
              activeChat?.userId === chat.userId ? "active" : ""
            }`}
            onClick={() => handleChatClick(chat)}
          >
            <div className="chat-item-avatar">
              <img
                src={getAvatarUrl(chat)}
                alt={chat.name || "Học sinh"}
                loading="lazy"
                onError={(e) => {
                  // If image fails to load, use default avatar
                  const defaultUrl = getDefaultAvatar(chat.name || "Học sinh");
                  if (e.target.src !== defaultUrl) {
                    e.target.src = defaultUrl;
                  }
                }}
                title={chat.name || "Học sinh"}
              />
              {chat.isOnline && <div className="online-indicator" />}
            </div>

            <div className="chat-item-info">
              <div className="chat-item-header">
                <h4>{chat.name}</h4>
                <span className="last-seen">
                  {formatLastSeen(chat.lastSeen)}
                </span>
              </div>

              <div className="chat-item-preview">
                <p>{chat.lastMessage?.text || "Chưa có tin nhắn"}</p>
                {unreadCounts[chat.userId] > 0 && (
                  <span className="unread-count">
                    {unreadCounts[chat.userId]}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TutorChatList;
