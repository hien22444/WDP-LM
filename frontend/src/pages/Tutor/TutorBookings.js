import React, { useEffect, useState } from "react";
import BookingService from "../../services/BookingService";
import "./TutorBookings.scss";

const TutorBookings = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [signingBookingId, setSigningBookingId] = useState(null);
  const [tutorSignature, setTutorSignature] = useState("");
  const [viewing, setViewing] = useState(null);
  const [showContract, setShowContract] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const bookings = await BookingService.listMyBookings("tutor");
      console.log("📋 Tutor bookings loaded:", bookings);
      setItems(bookings);
    } catch (error) {
      console.error("❌ Error loading tutor bookings:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAcceptClick = (id) => {
    setSigningBookingId(id);
    setTutorSignature("");
  };

  const handleSignatureSubmit = async (id, decision) => {
    if (!tutorSignature.trim()) {
      alert("Vui lòng nhập tên của bạn để ký hợp đồng!");
      return;
    }

    console.log(
      `✍️ Tutor signing contract for booking ${id} with signature: ${tutorSignature}`
    );
    setLoading(true);
    setSigningBookingId(null);

    try {
      await BookingService.tutorDecision(id, decision, tutorSignature.trim());
      await load();
      alert("🎉 Đã ký hợp đồng và chấp nhận booking thành công!");
    } catch (error) {
      console.error("❌ Error making tutor decision:", error);
      alert("❌ Có lỗi xảy ra khi chấp nhận booking!");
    } finally {
      setLoading(false);
      setTutorSignature("");
    }
  };

  const decide = async (id, decision) => {
    if (decision === "accept") {
      // Nếu chấp nhận, mở modal ký tên
      handleAcceptClick(id);
    } else {
      // Nếu từ chối, không cần ký tên
      console.log(`🎯 Tutor decision: ${decision} for booking ${id}`);
      setLoading(true);
      try {
        await BookingService.tutorDecision(id, decision);
        await load();
      } catch (error) {
        console.error("❌ Error making tutor decision:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  console.log("🎨 TutorBookings render - items:", items, "loading:", loading);

  const pendingCount = items.filter((b) => b.status === "pending").length;

  return (
    <div style={{ padding: 24 }}>
      <h2>Đơn yêu cầu</h2>
      <div style={{
        marginBottom: "16px",
        fontSize: "14px",
        color: "#374151",
        background: "#F3F4F6",
        padding: "12px 16px",
        borderRadius: 8,
      }}>
        Có {pendingCount} yêu cầu đang chờ duyệt · Tổng {items.length}
      </div>
      {loading && items.length === 0 ? (
        <div>Đang tải...</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Học sinh</th>
              <th>Thời gian</th>
              <th>Hình thức</th>
              <th>Giá</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {items.map((b) => (
              <tr key={b._id}>
                <td title={b.student}>{String(b.student).slice(0,8)}...</td>
                <td>
                  {new Date(b.start).toLocaleString()} –{" "}
                  {new Date(b.end).toLocaleString()}
                </td>
                <td>{b.mode}</td>
                <td>{(b.price || 0).toLocaleString()} đ</td>
                <td>
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: 12,
                      background:
                        b.status === "pending"
                          ? "#FEF3C7"
                          : b.status === "accepted"
                          ? "#DCFCE7"
                          : "#E5E7EB",
                      color:
                        b.status === "pending"
                          ? "#92400E"
                          : b.status === "accepted"
                          ? "#065F46"
                          : "#374151",
                      fontWeight: 600,
                      fontSize: 12,
                    }}
                  >
                    {b.status}
                  </span>
                </td>
                <td>
                  {b.status === "pending" ? (
                    <>
                      <button onClick={() => { setViewing(b); setShowContract(true); }}>
                        Xem hợp đồng
                      </button>
                      <button
                        onClick={() => decide(b._id, "reject")}
                        style={{ marginLeft: 8 }}
                      >
                        Từ chối
                      </button>
                    </>
                  ) : (
                    <button onClick={() => { setViewing(b); setShowContract(true); }}>
                      Xem hợp đồng
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Signature Modal */}
      {signingBookingId && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "32px",
              borderRadius: "12px",
              maxWidth: "500px",
              width: "90%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ marginTop: 0, color: "#1e293b", fontSize: "24px" }}>
              ✍️ Ký hợp đồng thuê gia sư
            </h3>
            <p style={{ color: "#6b7280", marginBottom: "24px" }}>
              Vui lòng nhập tên của bạn để ký hợp đồng
            </p>

            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  color: "#374151",
                }}
              >
                Tên của bạn *
              </label>
              <input
                type="text"
                value={tutorSignature}
                onChange={(e) => setTutorSignature(e.target.value)}
                placeholder="Nhập tên đầy đủ của bạn"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "16px",
                }}
                autoFocus
              />
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => {
                  setSigningBookingId(null);
                  setTutorSignature("");
                }}
                style={{
                  padding: "12px 24px",
                  border: "2px solid #e5e7eb",
                  background: "white",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#374151",
                }}
              >
                Hủy
              </button>
              <button
                onClick={() =>
                  handleSignatureSubmit(signingBookingId, "accept")
                }
                disabled={!tutorSignature.trim()}
                style={{
                  padding: "12px 24px",
                  border: "none",
                  background: tutorSignature.trim() ? "#667eea" : "#e5e7eb",
                  borderRadius: "8px",
                  cursor: tutorSignature.trim() ? "pointer" : "not-allowed",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "white",
                }}
              >
                ✍️ Ký và chấp nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contract View Modal */}
      {showContract && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              padding: 24,
              borderRadius: 12,
              width: "95%",
              maxWidth: 800,
            }}
          >
            <h3 style={{ marginTop: 0 }}>Hợp đồng thuê gia sư</h3>
            {!viewing?.contractData ? (
              <div style={{ color: "#6b7280", marginBottom: 16 }}>
                Chưa có dữ liệu hợp đồng do học viên gửi. Vui lòng liên hệ học viên nếu cần bổ sung.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><strong>Học viên</strong><div>{viewing.contractData.studentName || "—"}</div></div>
                <div><strong>Điện thoại</strong><div>{viewing.contractData.studentPhone || "—"}</div></div>
                <div><strong>Email</strong><div>{viewing.contractData.studentEmail || "—"}</div></div>
                <div><strong>Địa chỉ</strong><div>{viewing.contractData.studentAddress || "—"}</div></div>
                <div><strong>Môn học</strong><div>{viewing.contractData.subject || "—"}</div></div>
                <div><strong>Số buổi</strong><div>{viewing.contractData.totalSessions || 1}</div></div>
                <div><strong>Thời lượng/buổi</strong><div>{viewing.contractData.sessionDuration || 60} phút</div></div>
                <div><strong>Ngày bắt đầu</strong><div>{viewing.contractData.startDate ? new Date(viewing.contractData.startDate).toLocaleDateString() : new Date(viewing.start).toLocaleDateString()}</div></div>
                <div><strong>Ngày kết thúc</strong><div>{viewing.contractData.endDate ? new Date(viewing.contractData.endDate).toLocaleDateString() : new Date(viewing.end).toLocaleDateString()}</div></div>
                <div><strong>Ghi chú</strong><div>{viewing.notes || viewing.contractData.notes || "—"}</div></div>
              </div>
            )}

            {viewing?.status === "pending" && (
              <div style={{ marginTop: 16 }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Chữ ký xác nhận (tên của bạn)</label>
                <input
                  type="text"
                  value={tutorSignature}
                  onChange={(e) => setTutorSignature(e.target.value)}
                  placeholder="Nhập tên đầy đủ"
                  style={{ width: "100%", padding: 12, border: "1px solid #e5e7eb", borderRadius: 8 }}
                />
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
              <button onClick={() => { setShowContract(false); setViewing(null); setTutorSignature(""); }}
                style={{ padding: "10px 16px", border: "1px solid #e5e7eb", background: "white", borderRadius: 8 }}>
                Đóng
              </button>
              {viewing?.status === "pending" && (
                <button
                  onClick={() => handleSignatureSubmit(viewing._id, "accept")}
                  disabled={!tutorSignature.trim()}
                  style={{ padding: "10px 16px", border: "none", background: tutorSignature.trim() ? "#4f46e5" : "#a5b4fc", color: "white", borderRadius: 8 }}
                >
                  ✍️ Ký và chấp nhận
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorBookings;
