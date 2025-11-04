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

    const handleChatList = (data) => {
      console.log("Received chat list:", data);
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
                src={chat.avatar || "https://via.placeholder.com/40"}
                alt={chat.name}
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
