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
      console.log("📊 Sample booking data:", bookings[0]);

      // Chỉ hiển thị booking đã thanh toán
      const paidBookings = bookings.filter((b) => b.paymentStatus === "paid");
      console.log(
        "💰 Filtered paid bookings:",
        paidBookings.length,
        "out of",
        bookings.length
      );

      setItems(paidBookings);
    } catch (error) {
      console.error("❌ Error loading tutor bookings:", error);
      console.error("Error details:", error.response?.data);
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
    // CRITICAL: Validate signature BEFORE API call
    if (!tutorSignature.trim()) {
      alert("Vui lòng nhập tên của bạn để ký hợp đồng!");
      return;
    }

    console.log(
      `✍️ Tutor signing contract for booking ${id} with signature: ${tutorSignature}`
    );

    setLoading(true);
    const previousSigningId = signingBookingId;
    setSigningBookingId(null);

    try {
      // Make the API call with proper error handling
      await BookingService.tutorDecision(id, decision, tutorSignature.trim());

      // Only reload if API call succeeded
      await load();
      alert("🎉 Đã ký hợp đồng và chấp nhận booking thành công!");
      setTutorSignature("");
    } catch (error) {
      console.error("❌ Error making tutor decision:", error);

      // Restore signing modal if error occurred
      setSigningBookingId(previousSigningId);

      // Get error message from backend or use default
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0] ||
        "Có lỗi xảy ra khi chấp nhận booking!";
      alert(`❌ ${errorMessage}`);

      // Keep signature filled in case user wants to retry
      // (don't clear tutorSignature)
    } finally {
      setLoading(false);
    }
  };

  const decide = async (id, decision) => {
    if (decision === "accept") {
      // Nếu chấp nhận, mở modal ký tên
      handleAcceptClick(id);
    } else if (decision === "reject") {
      // Nếu từ chối, không cần ký tên
      console.log(`🎯 Tutor decision: ${decision} for booking ${id}`);
      setLoading(true);
      try {
        await BookingService.tutorDecision(id, decision);
        await load();
        alert("✅ Đã từ chối yêu cầu đặt lịch thành công!");
      } catch (error) {
        console.error("❌ Error making tutor decision:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.errors?.[0] ||
          "Có lỗi xảy ra khi từ chối booking!";
        alert(`❌ ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    }
  };

  console.log("🎨 TutorBookings render - items:", items, "loading:", loading);

  const pendingCount = items.filter((b) => b.status === "pending").length;

  // Helper function to format recurring schedule
  const formatRecurringSchedule = (booking) => {
    if (!booking.recurrencePattern?.selectedSlots) return null;

    const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    const slots = booking.recurrencePattern.selectedSlots;

    return slots
      .map((slot) => {
        return `${dayNames[slot.dayOfWeek]} (${slot.start}-${slot.end})`;
      })
      .join(", ");
  };

  // Helper function to format date range
  const formatDateRange = (booking) => {
    if (booking.type === "recurring" && booking.recurrencePattern) {
      const startDate = booking.recurrencePattern.startDate;
      const endDate = booking.recurrencePattern.endDate;

      if (!startDate || !endDate) return "Chưa có thời gian";

      const start = new Date(startDate);
      const end = new Date(endDate);

      // Check if dates are valid
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return "Chưa có thời gian";
      }

      return `${start.toLocaleDateString("vi-VN")} - ${end.toLocaleDateString(
        "vi-VN"
      )}`;
    }

    // For single bookings
    if (!booking.start) return "Chưa có thời gian";
    const bookingDate = new Date(booking.start);
    if (isNaN(bookingDate.getTime())) return "Chưa có thời gian";

    return bookingDate.toLocaleDateString("vi-VN");
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ marginBottom: "24px" }}>
        <h2
          style={{
            fontSize: "28px",
            fontWeight: "700",
            color: "#111827",
            marginBottom: "8px",
          }}
        >
          Đơn yêu cầu
        </h2>
        <div
          style={{
            fontSize: "14px",
            color: "#6B7280",
            background: "#F9FAFB",
            padding: "12px 16px",
            borderRadius: "8px",
            border: "1px solid #E5E7EB",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ fontWeight: "600", color: "#374151" }}>
            {pendingCount > 0
              ? `🔔 ${pendingCount} yêu cầu đang chờ duyệt`
              : "✅ Không có yêu cầu chờ duyệt"}
          </span>
          <span>·</span>
          <span>Tổng {items.length} đơn đã thanh toán</span>
        </div>
      </div>

      {loading && items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#9CA3AF" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
          <div>Đang tải...</div>
        </div>
      ) : items.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px",
            background: "#F9FAFB",
            borderRadius: "12px",
            border: "2px dashed #E5E7EB",
          }}
        >
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>📭</div>
          <div
            style={{ fontSize: "18px", color: "#6B7280", fontWeight: "500" }}
          >
            Chưa có đơn yêu cầu nào đã thanh toán
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {items.map((b) => (
            <div
              key={b._id}
              style={{
                background: "white",
                border: "1px solid #E5E7EB",
                borderRadius: "12px",
                padding: "20px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                transition: "all 0.2s",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                e.currentTarget.style.borderColor = "#6366F1";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
                e.currentTarget.style.borderColor = "#E5E7EB";
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "16px",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "8px",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "18px",
                        fontWeight: "600",
                        color: "#111827",
                        margin: 0,
                      }}
                    >
                      👨‍🎓{" "}
                      {b.student?.full_name || b.student?.email || "Học sinh"}
                    </h3>
                    <span
                      style={{
                        padding: "4px 12px",
                        borderRadius: "16px",
                        fontSize: "12px",
                        fontWeight: "600",
                        background:
                          b.status === "pending"
                            ? "#FEF3C7"
                            : b.status === "accepted"
                            ? "#D1FAE5"
                            : "#F3F4F6",
                        color:
                          b.status === "pending"
                            ? "#92400E"
                            : b.status === "accepted"
                            ? "#065F46"
                            : "#374151",
                      }}
                    >
                      {b.status === "pending"
                        ? "⏳ Chờ duyệt"
                        : b.status === "accepted"
                        ? "✅ Đã chấp nhận"
                        : b.status}
                    </span>
                    <span
                      style={{
                        padding: "4px 12px",
                        borderRadius: "16px",
                        fontSize: "12px",
                        fontWeight: "600",
                        background: "#DCFCE7",
                        color: "#065F46",
                      }}
                    >
                      💰 Đã thanh toán
                    </span>
                  </div>

                  {b.type === "recurring" && (
                    <div
                      style={{
                        marginTop: "12px",
                        padding: "12px",
                        background: "#F0F9FF",
                        borderRadius: "8px",
                        border: "1px solid #BFDBFE",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#1E40AF",
                          fontWeight: "600",
                          marginBottom: "8px",
                        }}
                      >
                        📅 Lịch học định kỳ
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#1E3A8A",
                          marginBottom: "4px",
                        }}
                      >
                        <strong>Thời gian:</strong> {formatDateRange(b)}
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#1E3A8A",
                          marginBottom: "4px",
                        }}
                      >
                        <strong>Lịch trong tuần:</strong>{" "}
                        {formatRecurringSchedule(b) || "Chưa có lịch"}
                      </div>
                      <div style={{ fontSize: "14px", color: "#1E3A8A" }}>
                        <strong>Tổng buổi:</strong>{" "}
                        {b.totalSessionsPlanned || 0} buổi ·{" "}
                        <strong>Hoàn thành:</strong> {b.completedSessions || 0}{" "}
                        buổi
                      </div>
                    </div>
                  )}

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "12px",
                      marginTop: "12px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#6B7280",
                          marginBottom: "4px",
                        }}
                      >
                        Hình thức
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: "500",
                          color: "#374151",
                        }}
                      >
                        {b.mode === "offline" ? "📍 Trực tiếp" : "💻 Online"}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#6B7280",
                          marginBottom: "4px",
                        }}
                      >
                        Giá mỗi buổi
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#059669",
                        }}
                      >
                        {(b.price || 0).toLocaleString()} đ
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#6B7280",
                          marginBottom: "4px",
                        }}
                      >
                        Tổng tiền
                      </div>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: "700",
                          color: "#DC2626",
                        }}
                      >
                        {(b.totalPrice || b.price || 0).toLocaleString()} đ
                      </div>
                    </div>
                  </div>

                  {b.notes && (
                    <div
                      style={{
                        marginTop: "12px",
                        padding: "10px",
                        background: "#FFFBEB",
                        borderRadius: "6px",
                        borderLeft: "3px solid #F59E0B",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#92400E",
                          fontWeight: "600",
                          marginBottom: "4px",
                        }}
                      >
                        📝 Ghi chú:
                      </div>
                      <div style={{ fontSize: "13px", color: "#78350F" }}>
                        {b.notes}
                      </div>
                    </div>
                  )}
                </div>

                <div
                  style={{ display: "flex", gap: "8px", marginLeft: "20px" }}
                >
                  {b.status === "pending" ? (
                    <>
                      <button
                        onClick={() => {
                          setViewing(b);
                          setShowContract(true);
                        }}
                        style={{
                          padding: "10px 20px",
                          background: "#6366F1",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          fontWeight: "600",
                          cursor: "pointer",
                          fontSize: "14px",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) =>
                          (e.target.style.background = "#4F46E5")
                        }
                        onMouseLeave={(e) =>
                          (e.target.style.background = "#6366F1")
                        }
                      >
                        📄 Xem hợp đồng
                      </button>
                      <button
                        onClick={() => decide(b._id, "reject")}
                        style={{
                          padding: "10px 20px",
                          background: "#EF4444",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          fontWeight: "600",
                          cursor: "pointer",
                          fontSize: "14px",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) =>
                          (e.target.style.background = "#DC2626")
                        }
                        onMouseLeave={(e) =>
                          (e.target.style.background = "#EF4444")
                        }
                      >
                        ❌ Từ chối
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setViewing(b);
                        setShowContract(true);
                      }}
                      style={{
                        padding: "10px 20px",
                        background: "#F3F4F6",
                        color: "#374151",
                        border: "1px solid #D1D5DB",
                        borderRadius: "8px",
                        fontWeight: "600",
                        cursor: "pointer",
                        fontSize: "14px",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = "#E5E7EB";
                        e.target.style.borderColor = "#9CA3AF";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = "#F3F4F6";
                        e.target.style.borderColor = "#D1D5DB";
                      }}
                    >
                      📄 Xem hợp đồng
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
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
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)",
            padding: "20px",
          }}
          onClick={() => {
            setShowContract(false);
            setViewing(null);
            setTutorSignature("");
          }}
        >
          <div
            style={{
              background: "white",
              padding: "32px",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "900px",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                borderBottom: "2px solid #E5E7EB",
                paddingBottom: "20px",
                marginBottom: "24px",
                position: "relative",
              }}
            >
              <button
                onClick={() => {
                  setShowContract(false);
                  setViewing(null);
                  setTutorSignature("");
                }}
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#9CA3AF",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "6px",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#F3F4F6";
                  e.target.style.color = "#374151";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "none";
                  e.target.style.color = "#9CA3AF";
                }}
              >
                ×
              </button>
              <h2
                style={{
                  margin: 0,
                  fontSize: "28px",
                  fontWeight: "700",
                  color: "#111827",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                📜 Hợp đồng thuê gia sư
              </h2>
              <p
                style={{
                  margin: "8px 0 0 0",
                  color: "#6B7280",
                  fontSize: "14px",
                }}
              >
                {viewing?.type === "recurring"
                  ? "Khóa học định kỳ"
                  : "Buổi học đơn lẻ"}
              </p>
            </div>

            {!viewing?.contractData ? (
              <div
                style={{
                  background: "#FEF3C7",
                  border: "2px dashed #F59E0B",
                  borderRadius: "12px",
                  padding: "24px",
                  textAlign: "center",
                  color: "#92400E",
                  marginBottom: "24px",
                }}
              >
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>📋</div>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    marginBottom: "8px",
                  }}
                >
                  Chưa có dữ liệu hợp đồng
                </div>
                <div style={{ fontSize: "14px" }}>
                  Vui lòng liên hệ học viên nếu cần bổ sung thông tin hợp đồng
                </div>
              </div>
            ) : (
              <>
                {/* Thông tin học viên */}
                <div style={{ marginBottom: "24px" }}>
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "700",
                      color: "#374151",
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    👨‍🎓 Thông tin học viên
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(250px, 1fr))",
                      gap: "16px",
                      background: "#F9FAFB",
                      padding: "20px",
                      borderRadius: "12px",
                      border: "1px solid #E5E7EB",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#6B7280",
                          marginBottom: "6px",
                          fontWeight: "600",
                        }}
                      >
                        Họ và tên
                      </div>
                      <div
                        style={{
                          fontSize: "15px",
                          color: "#111827",
                          fontWeight: "500",
                        }}
                      >
                        {viewing.contractData.studentName ||
                          viewing.student?.full_name ||
                          "—"}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#6B7280",
                          marginBottom: "6px",
                          fontWeight: "600",
                        }}
                      >
                        Điện thoại
                      </div>
                      <div
                        style={{
                          fontSize: "15px",
                          color: "#111827",
                          fontWeight: "500",
                        }}
                      >
                        {viewing.contractData.studentPhone || "—"}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#6B7280",
                          marginBottom: "6px",
                          fontWeight: "600",
                        }}
                      >
                        Email
                      </div>
                      <div
                        style={{
                          fontSize: "15px",
                          color: "#111827",
                          fontWeight: "500",
                        }}
                      >
                        {viewing.contractData.studentEmail ||
                          viewing.student?.email ||
                          "—"}
                      </div>
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#6B7280",
                          marginBottom: "6px",
                          fontWeight: "600",
                        }}
                      >
                        Địa chỉ
                      </div>
                      <div
                        style={{
                          fontSize: "15px",
                          color: "#111827",
                          fontWeight: "500",
                        }}
                      >
                        {viewing.contractData.studentAddress || "—"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Thông tin khóa học */}
                <div style={{ marginBottom: "24px" }}>
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "700",
                      color: "#374151",
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    📚 Thông tin khóa học
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "16px",
                      background: "#EEF2FF",
                      padding: "20px",
                      borderRadius: "12px",
                      border: "1px solid #C7D2FE",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#4338CA",
                          marginBottom: "6px",
                          fontWeight: "600",
                        }}
                      >
                        Môn học
                      </div>
                      <div
                        style={{
                          fontSize: "15px",
                          color: "#1E1B4B",
                          fontWeight: "600",
                        }}
                      >
                        {viewing.contractData.subject || "—"}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#4338CA",
                          marginBottom: "6px",
                          fontWeight: "600",
                        }}
                      >
                        Số buổi
                      </div>
                      <div
                        style={{
                          fontSize: "15px",
                          color: "#1E1B4B",
                          fontWeight: "600",
                        }}
                      >
                        {viewing.totalSessionsPlanned ||
                          viewing.contractData.totalSessions ||
                          1}{" "}
                        buổi
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#4338CA",
                          marginBottom: "6px",
                          fontWeight: "600",
                        }}
                      >
                        Thời lượng/buổi
                      </div>
                      <div
                        style={{
                          fontSize: "15px",
                          color: "#1E1B4B",
                          fontWeight: "600",
                        }}
                      >
                        {viewing.contractData.sessionDuration || 60} phút
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#4338CA",
                          marginBottom: "6px",
                          fontWeight: "600",
                        }}
                      >
                        Hình thức
                      </div>
                      <div
                        style={{
                          fontSize: "15px",
                          color: "#1E1B4B",
                          fontWeight: "600",
                        }}
                      >
                        {viewing.mode === "offline"
                          ? "📍 Trực tiếp"
                          : "💻 Online"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lịch trình */}
                {viewing.type === "recurring" &&
                  viewing.recurrencePattern?.selectedSlots && (
                    <div style={{ marginBottom: "24px" }}>
                      <h3
                        style={{
                          fontSize: "18px",
                          fontWeight: "700",
                          color: "#374151",
                          marginBottom: "16px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        📅 Lịch trình
                      </h3>
                      <div
                        style={{
                          background: "#ECFDF5",
                          padding: "20px",
                          borderRadius: "12px",
                          border: "1px solid #A7F3D0",
                        }}
                      >
                        <div style={{ marginBottom: "12px" }}>
                          <span
                            style={{
                              fontSize: "13px",
                              color: "#065F46",
                              fontWeight: "600",
                            }}
                          >
                            Thời gian:{" "}
                          </span>
                          <span style={{ fontSize: "14px", color: "#047857" }}>
                            {(() => {
                              const startDate =
                                viewing.recurrencePattern.startDate;
                              const endDate = viewing.recurrencePattern.endDate;
                              if (!startDate || !endDate)
                                return "Chưa có thời gian";
                              const start = new Date(startDate);
                              const end = new Date(endDate);
                              if (
                                isNaN(start.getTime()) ||
                                isNaN(end.getTime())
                              )
                                return "Chưa có thời gian";
                              return `${start.toLocaleDateString(
                                "vi-VN"
                              )} - ${end.toLocaleDateString("vi-VN")}`;
                            })()}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: "13px",
                            color: "#065F46",
                            fontWeight: "600",
                            marginBottom: "8px",
                          }}
                        >
                          Lịch trong tuần:
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "8px",
                          }}
                        >
                          {viewing.recurrencePattern.selectedSlots.map(
                            (slot, idx) => (
                              <div
                                key={idx}
                                style={{
                                  background: "#10B981",
                                  color: "white",
                                  padding: "8px 16px",
                                  borderRadius: "8px",
                                  fontSize: "13px",
                                  fontWeight: "600",
                                }}
                              >
                                {
                                  ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][
                                    slot.dayOfWeek
                                  ]
                                }{" "}
                                ({slot.start}-{slot.end})
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                {/* Thanh toán */}
                <div style={{ marginBottom: "24px" }}>
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "700",
                      color: "#374151",
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    💰 Thông tin thanh toán
                  </h3>
                  <div
                    style={{
                      background: "#FEF3C7",
                      padding: "20px",
                      borderRadius: "12px",
                      border: "2px solid #FCD34D",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "16px",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: "13px",
                            color: "#92400E",
                            marginBottom: "6px",
                            fontWeight: "600",
                          }}
                        >
                          Giá mỗi buổi
                        </div>
                        <div
                          style={{
                            fontSize: "20px",
                            color: "#78350F",
                            fontWeight: "700",
                          }}
                        >
                          {(viewing.price || 0).toLocaleString()} đ
                        </div>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: "13px",
                            color: "#92400E",
                            marginBottom: "6px",
                            fontWeight: "600",
                          }}
                        >
                          Tổng thanh toán
                        </div>
                        <div
                          style={{
                            fontSize: "24px",
                            color: "#DC2626",
                            fontWeight: "700",
                          }}
                        >
                          {(
                            viewing.totalPrice ||
                            viewing.price ||
                            0
                          ).toLocaleString()}{" "}
                          đ
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        marginTop: "12px",
                        padding: "12px",
                        background: "#D1FAE5",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        border: "1px solid #6EE7B7",
                      }}
                    >
                      <span style={{ fontSize: "20px" }}>✅</span>
                      <span
                        style={{
                          fontSize: "14px",
                          color: "#065F46",
                          fontWeight: "600",
                        }}
                      >
                        Học viên đã thanh toán đầy đủ
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ghi chú */}
                {viewing.notes && (
                  <div style={{ marginBottom: "24px" }}>
                    <h3
                      style={{
                        fontSize: "18px",
                        fontWeight: "700",
                        color: "#374151",
                        marginBottom: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      📝 Ghi chú
                    </h3>
                    <div
                      style={{
                        background: "#FFFBEB",
                        padding: "16px",
                        borderRadius: "12px",
                        border: "1px solid #FDE68A",
                        color: "#78350F",
                        fontSize: "14px",
                        lineHeight: "1.6",
                      }}
                    >
                      {viewing.notes}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Signature Section */}
            {viewing?.status === "pending" && (
              <div
                style={{
                  background: "#F0F9FF",
                  padding: "24px",
                  borderRadius: "12px",
                  border: "2px solid #BAE6FD",
                  marginBottom: "24px",
                }}
              >
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "700",
                    color: "#0C4A6E",
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  ✍️ Chữ ký xác nhận
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#075985",
                    marginBottom: "16px",
                  }}
                >
                  Vui lòng nhập tên đầy đủ của bạn để ký và chấp nhận hợp đồng
                </p>
                <input
                  type="text"
                  value={tutorSignature}
                  onChange={(e) => setTutorSignature(e.target.value)}
                  placeholder="Nhập họ và tên của bạn"
                  style={{
                    width: "100%",
                    padding: "14px 18px",
                    border: "2px solid #7DD3FC",
                    borderRadius: "10px",
                    fontSize: "16px",
                    fontWeight: "500",
                    outline: "none",
                    transition: "all 0.2s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#0EA5E9")}
                  onBlur={(e) => (e.target.style.borderColor = "#7DD3FC")}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                borderTop: "2px solid #E5E7EB",
                paddingTop: "20px",
              }}
            >
              <button
                onClick={() => {
                  setShowContract(false);
                  setViewing(null);
                  setTutorSignature("");
                }}
                style={{
                  padding: "12px 24px",
                  border: "2px solid #D1D5DB",
                  background: "white",
                  borderRadius: "10px",
                  fontSize: "15px",
                  fontWeight: "600",
                  color: "#374151",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#F3F4F6";
                  e.target.style.borderColor = "#9CA3AF";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "white";
                  e.target.style.borderColor = "#D1D5DB";
                }}
              >
                Đóng
              </button>
              {viewing?.status === "pending" && (
                <button
                  onClick={() => handleSignatureSubmit(viewing._id, "accept")}
                  disabled={!tutorSignature.trim()}
                  style={{
                    padding: "12px 32px",
                    border: "none",
                    background: tutorSignature.trim()
                      ? "linear-gradient(135deg, #667EEA 0%, #764BA2 100%)"
                      : "#E5E7EB",
                    color: "white",
                    borderRadius: "10px",
                    fontSize: "15px",
                    fontWeight: "700",
                    cursor: tutorSignature.trim() ? "pointer" : "not-allowed",
                    transition: "all 0.3s",
                    boxShadow: tutorSignature.trim()
                      ? "0 4px 12px rgba(102, 126, 234, 0.4)"
                      : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (tutorSignature.trim()) {
                      e.target.style.transform = "translateY(-2px)";
                      e.target.style.boxShadow =
                        "0 6px 16px rgba(102, 126, 234, 0.5)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = tutorSignature.trim()
                      ? "0 4px 12px rgba(102, 126, 234, 0.4)"
                      : "none";
                  }}
                >
                  ✍️ Ký và chấp nhận hợp đồng
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
