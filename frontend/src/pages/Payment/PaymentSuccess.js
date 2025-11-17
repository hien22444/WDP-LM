// import React, { useEffect, useState } from 'react';
// import { useSearchParams, useNavigate } from 'react-router-dom';
// import { toast } from 'react-toastify';
// import './PaymentSuccess.scss';

// const PaymentSuccess = () => {
//   const [searchParams] = useSearchParams();
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(true);
//   const [paymentInfo, setPaymentInfo] = useState(null);

//   useEffect(() => {
//     // Get orderCode from URL params
//     const orderCode = searchParams.get('orderCode');

//     if (orderCode) {
//       // Verify payment status từ API
//       const verifyPayment = async () => {
//         try {
//           const response = await fetch(
//             `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1'}/payment/verify/${orderCode}`
//           );
//           const data = await response.json();

//           if (data.success && data.status === 'PAID') {
//             // Lấy thông tin booking từ payment nếu có
//             // Có thể cần gọi API khác để lấy booking details
//             setPaymentInfo({
//               orderCode,
//               status: 'PAID',
//               amount: '500,000', // TODO: Lấy từ payment data
//               courseName: 'Khóa học', // TODO: Lấy từ payment data
//               roomCode: 'ABC123XYZ' // TODO: Lấy từ booking data
//             });
//             toast.success('🎉 Thanh toán thành công! Mã phòng học đã được gửi qua email.');
//           } else {
//             setPaymentInfo(null);
//             toast.warning('Thanh toán chưa hoàn tất hoặc đang xử lý...');
//           }
//         } catch (error) {
//           console.error('Error verifying payment:', error);
//           toast.error('Không thể xác minh thanh toán. Vui lòng kiểm tra lại sau.');
//         } finally {
//           setLoading(false);
//         }
//       };

//       verifyPayment();
//     } else {
//       setLoading(false);
//     }
//   }, [searchParams]);

//   const handleJoinRoom = () => {
//     if (paymentInfo?.roomCode) {
//       navigate(`/room/${paymentInfo.roomCode}`);
//     }
//   };

//   const handleViewBookings = () => {
//     navigate('/bookings/me');
//   };

//   if (loading) {
//     return (
//       <div className="payment-success-container">
//         <div className="loading-spinner">
//           <div className="spinner"></div>
//           <p>Đang xử lý thanh toán...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!paymentInfo) {
//     return (
//       <div className="payment-success-container">
//         <div className="error-message">
//           <div className="error-icon">❌</div>
//           <h2>Không tìm thấy thông tin thanh toán</h2>
//           <p>Vui lòng kiểm tra lại link hoặc liên hệ hỗ trợ.</p>
//           <button
//             className="btn btn-primary"
//             onClick={() => navigate('/')}
//           >
//             Về trang chủ
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="payment-success-container">
//       <div className="success-content">
//         <div className="success-icon">🎉</div>
//         <h1>Thanh toán thành công!</h1>
//         <p className="success-message">
//           Cảm ơn bạn đã thanh toán. Mã phòng học đã được gửi đến email của bạn.
//         </p>

//         <div className="payment-details">
//           <div className="detail-item">
//             <span className="label">Mã đơn hàng:</span>
//             <span className="value">{paymentInfo.orderCode}</span>
//           </div>
//           <div className="detail-item">
//             <span className="label">Số tiền:</span>
//             <span className="value">{paymentInfo.amount} VNĐ</span>
//           </div>
//           <div className="detail-item">
//             <span className="label">Khóa học:</span>
//             <span className="value">{paymentInfo.courseName}</span>
//           </div>
//           <div className="detail-item">
//             <span className="label">Mã phòng học:</span>
//             <span className="value room-code">{paymentInfo.roomCode}</span>
//           </div>
//         </div>

//         <div className="action-buttons">
//           <button
//             className="btn btn-primary join-room-btn"
//             onClick={handleJoinRoom}
//           >
//             🎥 Tham gia phòng học ngay
//           </button>
//           <button
//             className="btn btn-outline-primary"
//             onClick={handleViewBookings}
//           >
//             📋 Xem lịch học của tôi
//           </button>
//         </div>

//         <div className="instructions">
//           <h3>📋 Hướng dẫn tham gia phòng học:</h3>
//           <ul>
//             <li>Nhấn "Tham gia phòng học ngay" để vào phòng học trực tiếp</li>
//             <li>Hoặc sử dụng nút "Phòng Học" trên header và nhập mã: <strong>{paymentInfo.roomCode}</strong></li>
//             <li>Tham gia phòng học 5 phút trước giờ bắt đầu</li>
//             <li>Chuẩn bị camera và microphone</li>
//             <li>Kiểm tra email để xem thông tin chi tiết</li>
//           </ul>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PaymentSuccess;

// import React, { useEffect, useState } from "react";
// import { useSearchParams, useNavigate } from "react-router-dom";
// import { toast } from "react-toastify";
// // import "./PaymentSuccess.scss"; // Đảm bảo bạn import file SCSS

// const PaymentSuccess = () => {
//   const [searchParams] = useSearchParams();
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(true);
//   const [paymentInfo, setPaymentInfo] = useState(null);

//   useEffect(() => {
//     // Get orderCode from URL params
//     const orderCode = searchParams.get("orderCode");

//     if (orderCode) {
//       // Verify payment status từ API
//       const verifyPayment = async () => {
//         try {
//           // ==========================================================
//           // ❗️ SỬA Ở ĐÂY: Xóa bỏ "?test=true"
//           // ==========================================================
//           const response = await fetch(
//             `${
//               process.env.REACT_APP_API_URL || "http://localhost:5000/api/v1"
//             }/payment/verify/${orderCode}` // <-- Đã xóa ?test=true
//           );
//           // ==========================================================

//           const data = await response.json();

//           // Hàm verifyPayment (BYPASS mode) sẽ luôn trả về PAID
//           if (data.success && data.status === "PAID") {
//             // Lấy thông tin payment từ backend trả về
//             const { payment } = data;

//             setPaymentInfo({
//               orderCode: payment.orderCode,
//               status: "PAID",
//               amount: payment.amount.toLocaleString(), // Lấy từ data
//               courseName: payment.productName || "Khóa học", // Lấy từ data
//             });
//             toast.success(
//               "🎉 Thanh toán thành công! Đang gửi yêu cầu cho gia sư..."
//             );
//           } else {
//             // Trường hợp này xảy ra nếu đơn hàng không tìm thấy
//             setPaymentInfo(null);
//             toast.error(
//               `Xác minh thất bại: ${data.message || "Lỗi không xác định"}`
//             );
//           }
//         } catch (error) {
//           console.error("Error verifying payment:", error);
//           toast.error(
//             "Không thể xác minh thanh toán. Vui lòng kiểm tra lại sau."
//           );
//         } finally {
//           setLoading(false);
//         }
//       };

//       verifyPayment();
//     } else {
//       setLoading(false);
//       toast.error("Không tìm thấy mã đơn hàng trong URL.");
//     }
//   }, [searchParams]);

//   const handleViewBookings = () => {
//     navigate("/bookings/me");
//   };

//   if (loading) {
//     return (
//       <div className="payment-success-container">
//         <div className="loading-spinner">
//           <div className="spinner"></div>
//           <p>Đang xử lý thanh toán...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!paymentInfo) {
//     return (
//       <div className="payment-success-container">
//         <div className="error-message">
//           <div className="error-icon">❌</div>
//           <h2>Không tìm thấy thông tin thanh toán</h2>
//           <p>Vui lòng kiểm tra lại link hoặc liên hệ hỗ trợ.</p>
//           <button className="btn btn-primary" onClick={() => navigate("/")}>
//             Về trang chủ
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // Sửa lại giao diện để phản ánh đúng logic (chờ gia sư)
//   return (
//     <div className="payment-success-container">
//       <div className="success-content">
//         <div className="success-icon">🎉</div>
//         <h1>Thanh toán thành công!</h1>
//         <p className="success-message">
//           Yêu cầu đặt lịch đã được gửi đến gia sư.
//         </p>
//         <p className="success-message">
//           Vui lòng kiểm tra email hoặc mục "Lịch học của tôi" để xem trạng thái
//           chấp nhận.
//         </p>

//         <div className="payment-details">
//           <div className="detail-item">
//             <span className="label">Mã đơn hàng:</span>
//             <span className="value">{paymentInfo.orderCode}</span>
//           </div>
//           <div className="detail-item">
//             <span className="label">Số tiền:</span>
//             <span className="value">{paymentInfo.amount} VNĐ</span>
//           </div>
//           <div className="detail-item">
//             <span className="label">Khóa học:</span>
//             <span className="value">{paymentInfo.courseName}</span>
//           </div>
//         </div>

//         <div className="action-buttons">
//           <button
//             className="btn btn-primary join-room-btn"
//             onClick={handleViewBookings} // Nút chính là xem lịch học
//           >
//             📋 Xem lịch học của tôi
//           </button>
//           <button
//             className="btn btn-outline-primary"
//             onClick={() => navigate("/")}
//           >
//             Về trang chủ
//           </button>
//         </div>

//         <div className="instructions">
//           <h3>📋 Hướng dẫn tiếp theo:</h3>
//           <ul>
//             <li>Yêu cầu của bạn đang chờ gia sư chấp nhận.</li>
//             <li>Vui lòng kiểm tra "Lịch học của tôi" để xem trạng thái.</li>
//             <li>Mã phòng học sẽ xuất hiện khi gia sư chấp nhận.</li>
//           </ul>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PaymentSuccess;

import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./PaymentSuccess.scss";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState(null);

  useEffect(() => {
    // Get orderCode from URL params
    const orderCode = searchParams.get("orderCode");

    if (orderCode) {
      // Verify payment status từ API
      const verifyPayment = async () => {
        try {
          const response = await fetch(
            `${
              process.env.REACT_APP_API_URL || "http://localhost:5000/api/v1"
            }/payment/verify/${orderCode}`
          );
          const data = await response.json();

          if (data.success && data.status === "PAID") {
            // Lấy thông tin booking từ payment nếu có
            // Có thể cần gọi API khác để lấy booking details
            setPaymentInfo({
              orderCode,
              status: "PAID",
              amount: "500,000", // TODO: Lấy từ payment data
              courseName: "Khóa học", // TODO: Lấy từ payment data
              roomCode: "ABC123XYZ", // TODO: Lấy từ booking data
            });
            toast.success(
              "🎉 Thanh toán thành công! Mã phòng học đã được gửi qua email."
            );
          } else {
            setPaymentInfo(null);
            toast.warning("Thanh toán chưa hoàn tất hoặc đang xử lý...");
          }
        } catch (error) {
          console.error("Error verifying payment:", error);
          toast.error(
            "Không thể xác minh thanh toán. Vui lòng kiểm tra lại sau."
          );
        } finally {
          setLoading(false);
        }
      };

      verifyPayment();
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
    navigate("/bookings/me");
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
          <button className="btn btn-primary" onClick={() => navigate("/")}>
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
            <li>
              Hoặc sử dụng nút "Phòng Học" trên header và nhập mã:{" "}
              <strong>{paymentInfo.roomCode}</strong>
            </li>
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
