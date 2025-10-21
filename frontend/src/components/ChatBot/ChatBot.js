import React, { useState, useRef, useEffect } from "react";
import "./ChatBot.scss";
import { BsChatDots } from "react-icons/bs";
import { IoMdClose } from "react-icons/io";
import { IoSend } from "react-icons/io5";
import AIService from "../../services/AIService";

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: "bot",
      text: "Xin chào! Tôi có thể giúp bạn tìm kiếm gia sư phù hợp. Hãy cho tôi biết bạn cần tìm gia sư môn gì hoặc các yêu cầu khác.",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    const trimmed = inputMessage.trim();
    if (!trimmed) return;

    // Thêm tin nhắn người dùng
    setMessages((prev) => [...prev, { type: "user", text: trimmed }]);
    setIsLoading(true);

    try {
      // Gọi API AIService (chat completion) - send raw string
      const response = await AIService.chatCompletion(trimmed);
      console.log(
        "✅ [ChatBot] chatCompletion response.message:",
        response?.message
      );
      console.log("✅ [ChatBot] chatCompletion items:", response?.items);

      const aiMessage =
        (response && response.message) ||
        "Xin lỗi, tôi chưa nhận được phản hồi.";
      setMessages((prev) => [...prev, { type: "bot", text: aiMessage }]);

      // Nếu backend trả items (danh sách gia sư), append một tin nhắn hiển thị danh sách
      if (
        response &&
        Array.isArray(response.items) &&
        response.items.length > 0
      ) {
        const listText =
          `\n\nDanh sách gia sư tìm được (${response.items.length}):\n` +
          response.items
            .map(
              (t, i) =>
                `${i + 1}. ${t.name} — ${
                  t.subjects?.join(", ") || "Chưa cập nhật"
                }`
            )
            .join("\n");
        setMessages((prev) => [...prev, { type: "bot", text: listText }]);
      }
    } catch (error) {
      console.error(
        "❌ [ChatBot] Error searching tutors:",
        error?.message || error
      );

      if (error?.response) {
        console.error("🔴 [ChatBot] Response status:", error.response.status);
        console.error("🔴 [ChatBot] Response data:", error.response.data);
      } else if (error?.request) {
        console.error("🟠 [ChatBot] No response received from server");
      } else {
        console.error("⚠️ [ChatBot] Unexpected error:", error);
      }

      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          text: "Xin lỗi, đã có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại sau.",
        },
      ]);
    }

    setIsLoading(false);
    setInputMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chatbot-container">
      <button
        className={`chat-button ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <IoMdClose /> : <BsChatDots />}
      </button>

      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <h3>Tìm kiếm gia sư</h3>
          </div>

          <div className="messages-container">
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.type}`}>
                <div className="message-content">
                  {message.text.split("\n").map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="message bot">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập tin nhắn..."
              rows="1"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
            >
              <IoSend />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
