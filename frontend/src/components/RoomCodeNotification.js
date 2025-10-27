import React, { useState } from 'react';
import { processPaymentSuccess } from '../services/BookingService';
import './RoomCodeNotification.scss';

const RoomCodeNotification = ({ booking, onRoomCodeReceived }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRoomCode, setShowRoomCode] = useState(false);
  const [roomCode, setRoomCode] = useState(booking?.roomId || null);

  const handleGetRoomCode = async () => {
    if (!booking?._id) return;
    
    setIsProcessing(true);
    try {
      const result = await processPaymentSuccess(booking._id);
      setRoomCode(result.roomCode);
      setShowRoomCode(true);
      if (onRoomCodeReceived) {
        onRoomCodeReceived(result.roomCode, result.roomUrl);
      }
    } catch (error) {
      console.error('Failed to get room code:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleJoinRoom = () => {
    if (roomCode) {
      window.open(`/room/${roomCode}`, '_blank');
    }
  };

  const handleCopyCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      // You can add a toast notification here
    }
  };

  // Don't show if booking is not accepted or already has room code
  if (booking?.status !== 'accepted') return null;

  return (
    <div className="room-code-notification">
      {!showRoomCode && !roomCode ? (
        <div className="payment-pending">
          <div className="notification-icon">💰</div>
          <div className="notification-content">
            <h4>Thanh toán chưa hoàn tất</h4>
            <p>Vui lòng thanh toán để nhận mã phòng học và tham gia buổi học.</p>
            <button 
              className="payment-btn"
              onClick={handleGetRoomCode}
              disabled={isProcessing}
            >
              {isProcessing ? 'Đang xử lý...' : 'Thanh toán & Nhận mã phòng học'}
            </button>
          </div>
        </div>
      ) : (
        <div className="room-code-available">
          <div className="notification-icon">🎓</div>
          <div className="notification-content">
            <h4>Mã phòng học đã sẵn sàng!</h4>
            <div className="room-code-display">
              <span className="room-code-label">Mã phòng:</span>
              <span className="room-code-value">{roomCode}</span>
              <button className="copy-btn" onClick={handleCopyCode} title="Sao chép mã">
                📋
              </button>
            </div>
            <div className="action-buttons">
              <button className="join-btn" onClick={handleJoinRoom}>
                🎥 Tham gia phòng học
              </button>
              <button 
                className="toggle-btn" 
                onClick={() => setShowRoomCode(!showRoomCode)}
              >
                {showRoomCode ? 'Ẩn' : 'Hiện'} chi tiết
              </button>
            </div>
          </div>
        </div>
      )}

      {showRoomCode && (
        <div className="room-details">
          <div className="detail-item">
            <strong>Thời gian:</strong> {booking?.start ? new Date(booking.start).toLocaleString('vi-VN') : 'N/A'}
          </div>
          <div className="detail-item">
            <strong>Hình thức:</strong> {booking?.mode === 'online' ? 'Trực tuyến' : 'Tại nhà'}
          </div>
          <div className="detail-item">
            <strong>Học phí:</strong> {booking?.price ? booking.price.toLocaleString() + ' VNĐ' : 'Liên hệ'}
          </div>
          <div className="instructions">
            <h5>📋 Hướng dẫn tham gia:</h5>
            <ul>
              <li>Nhấn "Tham gia phòng học" để vào phòng học trực tiếp</li>
              <li>Hoặc sử dụng nút "Phòng Học" trên header và nhập mã: <strong>{roomCode}</strong></li>
              <li>Tham gia phòng học 5 phút trước giờ bắt đầu</li>
              <li>Chuẩn bị camera và microphone</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomCodeNotification;
