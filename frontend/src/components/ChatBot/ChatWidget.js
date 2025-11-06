import { useState } from "react";

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Xin chào 👋 Tôi có thể giúp gì cho bạn?" },
  ]);
  const [sending, setSending] = useState(false);

  const apiBase = process.env.REACT_APP_API_URL || "http://localhost:5000/api/v1";

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;
    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      const res = await fetch(`${apiBase}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      const reply = data?.message || "Xin lỗi, mình chưa trả lời được.";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Có lỗi kết nối, bạn thử lại nhé." },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          position: "fixed",
          right: 20,
          bottom: 20,
          zIndex: 9999,
          background: "#6f42c1",
          color: "#fff",
          borderRadius: 24,
          border: "none",
          padding: "10px 16px",
          boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
          cursor: "pointer",
        }}
      >
        {open ? "Đóng chat" : "Hỏi trợ lý"}
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            right: 20,
            bottom: 76,
            width: 360,
            maxHeight: 520,
            display: "flex",
            flexDirection: "column",
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 12px 30px rgba(0,0,0,0.2)",
            overflow: "hidden",
            zIndex: 9999,
          }}
        >
          <div style={{ padding: 12, background: "#6f42c1", color: "#fff" }}>
            Trợ lý tự động
          </div>
          <div
            style={{
              padding: 12,
              overflowY: "auto",
              flex: 1,
              background: "#f8f9fa",
            }}
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: 10,
                  display: "flex",
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: 12,
                    maxWidth: "80%",
                    background: m.role === "user" ? "#d6bbfb" : "#ffffff",
                    border: "1px solid #e9ecef",
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", padding: 8, gap: 8, background: "#fff" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
              placeholder="Nhập câu hỏi..."
              disabled={sending}
              style={{ flex: 1, border: "1px solid #ced4da", borderRadius: 8, padding: "8px 10px" }}
            />
            <button
              onClick={sendMessage}
              disabled={sending || !input.trim()}
              className="btn btn-primary"
              style={{ borderRadius: 8 }}
            >
              Gửi
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;


