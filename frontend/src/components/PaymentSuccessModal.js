import React, { useState } from 'react';
import { processPaymentSuccess } from '../services/BookingService';
import './PaymentSuccessModal.scss';

const PaymentSuccessModal = ({ isOpen, onClose, bookingId, bookingData }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [roomCode, setRoomCode] = useState(null);
  const [roomUrl, setRoomUrl] = useState(null);

  const handlePaymentSuccess = async () => {
    if (!bookingId) return;
    
    setIsProcessing(true);
    try {
      const result = await processPaymentSuccess(bookingId);
      setRoomCode(result.roomCode);
      setRoomUrl(result.roomUrl);
    } catch (error) {
      console.error('Payment processing failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleJoinRoom = () => {
    if (roomUrl) {
      window.open(roomUrl, '_blank');
    }
  };

  const handleCopyCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      // You can add a toast notification here
    }
  };

  if (!isOpen) return null;

  return (
    <div className="payment-success-modal-overlay" onClick={onClose}>
      <div className="payment-success-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🎉 Thanh toán thành công!</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          {!roomCode ? (
            <div className="payment-section">
              <div className="success-icon">✅</div>
              <p>Bạn đã thanh toán thành công cho khóa học này.</p>
              <p>Nhấn nút bên dưới để nhận mã phòng học và thông báo sẽ được gửi đến email của bạn.</p>
              
              <button 
                className="process-payment-btn"
                onClick={handlePaymentSuccess}
                disabled={isProcessing}
              >
                {isProcessing ? 'Đang xử lý...' : 'Nhận mã phòng học'}
              </button>
            </div>
          ) : (
            <div className="room-code-section">
              <div className="success-icon">🎓</div>
              <h3>Mã phòng học đã sẵn sàng!</h3>
              
              <div className="room-code-display">
                <div className="room-code-label">Mã phòng học:</div>
                <div className="room-code-value">{roomCode}</div>
                <button className="copy-btn" onClick={handleCopyCode}>
                  📋 Sao chép
                </button>
              </div>
              
              <div className="room-info">
                <p><strong>Thời gian:</strong> {bookingData?.start ? new Date(bookingData.start).toLocaleString('vi-VN') : 'N/A'}</p>
                <p><strong>Gia sư:</strong> {bookingData?.tutorName || 'N/A'}</p>
                <p><strong>Hình thức:</strong> {bookingData?.mode === 'online' ? 'Trực tuyến' : 'Tại nhà'}</p>
              </div>
              
              <div className="action-buttons">
                <button className="join-room-btn" onClick={handleJoinRoom}>
                  🎥 Tham gia phòng học ngay
                </button>
                <button className="close-modal-btn" onClick={onClose}>
                  Đóng
                </button>
              </div>
              
              <div className="instructions">
                <h4>📋 Hướng dẫn tham gia:</h4>
                <ol>
                  <li>Nhấn "Tham gia phòng học ngay" để vào phòng học</li>
                  <li>Hoặc sử dụng nút "Phòng Học" trên header và nhập mã: <strong>{roomCode}</strong></li>
                  <li>Tham gia phòng học 5 phút trước giờ bắt đầu</li>
                  <li>Chuẩn bị camera và microphone</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessModal;
