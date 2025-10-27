import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './PaymentSuccess.scss';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState(null);

  useEffect(() => {
    // Get orderCode from URL params
    const orderCode = searchParams.get('orderCode');
    
    if (orderCode) {
      // Simulate checking payment status
      setTimeout(() => {
        setPaymentInfo({
          orderCode,
          status: 'PAID',
          amount: '500,000',
          courseName: 'Toán 12 - Hình học không gian',
          roomCode: 'ABC123XYZ'
        });
        setLoading(false);
        toast.success('🎉 Thanh toán thành công! Mã phòng học đã được gửi qua email.');
      }, 2000);
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  const handleJoinRoom = () => {
    if (paymentInfo?.roomCode) {
      navigate(`/room/${paymentInfo.roomCode}`);
    }
  };

  const handleViewBookings = () => {
    navigate('/bookings/me');
  };

  if (loading) {
    return (
      <div className="payment-success-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang xử lý thanh toán...</p>
        </div>
      </div>
    );
  }

  if (!paymentInfo) {
    return (
      <div className="payment-success-container">
        <div className="error-message">
          <div className="error-icon">❌</div>
          <h2>Không tìm thấy thông tin thanh toán</h2>
          <p>Vui lòng kiểm tra lại link hoặc liên hệ hỗ trợ.</p>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/')}
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-success-container">
      <div className="success-content">
        <div className="success-icon">🎉</div>
        <h1>Thanh toán thành công!</h1>
        <p className="success-message">
          Cảm ơn bạn đã thanh toán. Mã phòng học đã được gửi đến email của bạn.
        </p>

        <div className="payment-details">
          <div className="detail-item">
            <span className="label">Mã đơn hàng:</span>
            <span className="value">{paymentInfo.orderCode}</span>
          </div>
          <div className="detail-item">
            <span className="label">Số tiền:</span>
            <span className="value">{paymentInfo.amount} VNĐ</span>
          </div>
          <div className="detail-item">
            <span className="label">Khóa học:</span>
            <span className="value">{paymentInfo.courseName}</span>
          </div>
          <div className="detail-item">
            <span className="label">Mã phòng học:</span>
            <span className="value room-code">{paymentInfo.roomCode}</span>
          </div>
        </div>

        <div className="action-buttons">
          <button 
            className="btn btn-primary join-room-btn"
            onClick={handleJoinRoom}
          >
            🎥 Tham gia phòng học ngay
          </button>
          <button 
            className="btn btn-outline-primary"
            onClick={handleViewBookings}
          >
            📋 Xem lịch học của tôi
          </button>
        </div>

        <div className="instructions">
          <h3>📋 Hướng dẫn tham gia phòng học:</h3>
          <ul>
            <li>Nhấn "Tham gia phòng học ngay" để vào phòng học trực tiếp</li>
            <li>Hoặc sử dụng nút "Phòng Học" trên header và nhập mã: <strong>{paymentInfo.roomCode}</strong></li>
            <li>Tham gia phòng học 5 phút trước giờ bắt đầu</li>
            <li>Chuẩn bị camera và microphone</li>
            <li>Kiểm tra email để xem thông tin chi tiết</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
