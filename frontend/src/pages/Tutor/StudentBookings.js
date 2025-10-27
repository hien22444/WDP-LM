import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BookingService from "../../services/BookingService";
import "./StudentBookings.scss";

const StudentBookings = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all, pending, accepted, completed, cancelled
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const bookings = await BookingService.listMyBookings('student');
      setItems(bookings);
    } catch (err) {
      setError(err?.message || "Lỗi tải danh sách đặt lịch");
      console.error("Load bookings error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const getStatusBadge = (status, paymentStatus) => {
    const statusClasses = {
      pending: "badge-warning",
      accepted: "badge-success",
      rejected: "badge-danger",
      cancelled: "badge-secondary",
      completed: "badge-primary",
      in_progress: "badge-info"
    };
    const paymentStatusText = {
      escrow: "⏳ Đang giữ",
      held: "🔒 Đã khóa",
      released: "✅ Đã giải phóng",
      refunded: "💰 Đã hoàn"
    };

    return (
      <>
        <span className={`badge ${statusClasses[status] || "badge-secondary"}`}>
          {status}
        </span>
        {paymentStatus && (
          <span className="badge badge-light ml-2">
            {paymentStatusText[paymentStatus] || paymentStatus}
          </span>
        )}
      </>
    );
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Bạn có chắc muốn hủy đặt lịch này?")) return;
    
    try {
      await BookingService.cancelBooking(bookingId);
      load();
    } catch (err) {
      alert(err?.message || "Lỗi hủy đặt lịch");
    }
  };

  const handleJoinVideoCall = (booking) => {
    if (booking.roomId) {
      navigate(`/room/${booking.roomId}`);
    } else {
      alert("Chưa có phòng học. Vui lòng đợi gia sư chấp nhận.");
    }
  };

  const filteredItems = filter === "all" 
    ? items 
    : items.filter(item => item.status === filter);

  return (
    <div className="student-bookings-container">
      <div className="bookings-header">
        <h2>📅 Lịch học của tôi</h2>
        <div className="filter-tabs">
          <button 
            className={`tab ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            Tất cả ({items.length})
          </button>
          <button 
            className={`tab ${filter === "pending" ? "active" : ""}`}
            onClick={() => setFilter("pending")}
          >
            Chờ xác nhận ({items.filter(i => i.status === "pending").length})
          </button>
          <button 
            className={`tab ${filter === "accepted" ? "active" : ""}`}
            onClick={() => setFilter("accepted")}
          >
            Đã chấp nhận ({items.filter(i => i.status === "accepted").length})
          </button>
          <button 
            className={`tab ${filter === "completed" ? "active" : ""}`}
            onClick={() => setFilter("completed")}
          >
            Hoàn thành ({items.filter(i => i.status === "completed").length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">Đang tải...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : filteredItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>Chưa có lịch học nào</p>
          <button 
            className="btn btn-primary"
            onClick={() => navigate("/tutors")}
          >
            Tìm gia sư
          </button>
        </div>
      ) : (
        <div className="bookings-grid">
          {filteredItems.map(booking => (
            <div key={booking._id} className="booking-card">
              <div className="booking-header">
                <div className="tutor-info">
                  <img 
                    src={booking.tutorProfile?.user?.avatar || "https://res.cloudinary.com/dnyvwjbbm/image/upload/v1760334427/whiteava_m3gka1.jpg"}
                    alt="avatar"
                    className="avatar"
                  />
                  <div>
                    <h4>{booking.tutorProfile?.user?.full_name || "Gia sư"}</h4>
                    <p className="text-muted small">
                      {booking.tutorProfile?.subject || "Môn học"}
                    </p>
                  </div>
                </div>
                <div className="status-badges">
                  {getStatusBadge(booking.status, booking.paymentStatus)}
                </div>
              </div>

              <div className="booking-details">
                <div className="detail-item">
                  <span className="icon">📅</span>
                  <span>{new Date(booking.start).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="detail-item">
                  <span className="icon">🕐</span>
                  <span>
                    {new Date(booking.start).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })} - {new Date(booking.end).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="icon">💻</span>
                  <span>{booking.mode === "online" ? "Trực tuyến" : "Offline"}</span>
                </div>
                <div className="detail-item">
                  <span className="icon">💰</span>
                  <span className="price">{(booking.price || 0).toLocaleString('vi-VN')} đ</span>
                </div>
              </div>

              {booking.notes && (
                <div className="booking-notes">
                  <strong>Ghi chú:</strong> {booking.notes}
                </div>
              )}

              <div className="booking-actions">
                {booking.status === "pending" && (
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => handleCancelBooking(booking._id)}
                  >
                    Hủy đặt lịch
                  </button>
                )}
                
                {booking.status === "accepted" && booking.roomId && (
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => handleJoinVideoCall(booking)}
                  >
                    📹 Vào phòng học
                  </button>
                )}
                
                {(booking.status === "in_progress" || booking.status === "completed") && (
                  <button 
                    className="btn btn-success btn-sm"
                    onClick={() => {
                      // Navigate to review page
                      navigate(`/tutor/${booking.tutorProfile?._id}`);
                    }}
                  >
                    ⭐ Đánh giá
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentBookings;


