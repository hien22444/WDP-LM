// import React from "react";
// import { useNavigate } from "react-router-dom";
// import "./PaymentSuccess.scss"; // Reuse styles from PaymentSuccess

// const PaymentCancel = () => {
//   const navigate = useNavigate();

//   return (
//     <div className="payment-success-container">
//       <div className="success-content error-content">
//         <div className="error-icon">❌</div>
//         <h1>Thanh toán đã hủy</h1>
//         <p className="success-message">
//           Giao dịch của bạn đã được hủy. Không có khoản thanh toán nào được thực
//           hiện.
//         </p>

//         <div className="payment-details">
//           <p>Bạn có thể:</p>
//           <ul>
//             <li>Kiểm tra lại thông tin và thử thanh toán lại</li>
//             <li>Liên hệ với bộ phận hỗ trợ nếu bạn cần giúp đỡ</li>
//             <li>Tìm gia sư khác</li>
//           </ul>
//         </div>

//         <div className="action-buttons">
//           <button className="btn btn-primary" onClick={() => navigate(-1)}>
//             Thử lại
//           </button>
//           <button
//             className="btn btn-outline-primary"
//             onClick={() => navigate("/tutors")}
//           >
//             Tìm gia sư khác
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PaymentCancel;

// import React, { useEffect, useState } from "react";
// import { useNavigate, useSearchParams } from "react-router-dom";
// import { toast } from "react-toastify";
// // import "./PaymentSuccess.scss"; // Lỗi xảy ra ở đây, tạm thời bỏ đi
// // Bạn có thể tạo file PaymentCancel.scss hoặc sửa lại đường dẫn nếu muốn

// const PaymentCancel = () => {
//   const navigate = useNavigate();
//   const [searchParams] = useSearchParams();
//   const [orderCode, setOrderCode] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     // 1. Lấy orderCode từ URL
//     const code = searchParams.get("orderCode");
//     setOrderCode(code);

//     if (code) {
//       // 2. Tự động gọi API để hủy đơn hàng
//       const cancelApiCall = async () => {
//         try {
//           const response = await fetch(
//             `${
//               process.env.REACT_APP_API_URL || "http://localhost:5000/api/v1"
//             }/payment/cancel-redirect?orderCode=${code}` // 👈 Gọi API mới
//           );

//           const data = await response.json();

//           if (data.success && data.status === "CANCELLED") {
//             toast.warn("Đơn hàng đã được hủy.");
//           } else {
//             // Trường hợp này có thể là đơn hàng đã được thanh toán (PAID)
//             // hoặc đã bị hủy (CANCELLED) từ trước
//             toast.info(`Trạng thái đơn hàng: ${data.status}`);
//           }
//         } catch (error) {
//           console.error("Error cancelling payment:", error);
//           toast.error("Lỗi kết nối khi hủy thanh toán.");
//         } finally {
//           setLoading(false);
//         }
//       };

//       cancelApiCall();
//     } else {
//       // Không có orderCode, chỉ hiển thị trang
//       setLoading(false);
//     }
//   }, [searchParams]); // Thêm searchParams vào dependency array

//   if (loading) {
//     return (
//       <div className="payment-success-container">
//         <div className="success-content error-content">
//           <p>Đang xử lý hủy...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="payment-success-container">
//       <div className="success-content error-content">
//         <div className="error-icon">❌</div>
//         <h1>Thanh toán đã hủy</h1>
//         <p className="success-message">
//           Giao dịch của bạn (Mã: {orderCode || "N/A"}) đã được hủy.
//         </p>
//         <p className="success-message">
//           Không có khoản thanh toán nào được thực hiện.
//         </p>

//         <div className="payment-details">
//           <p>Bạn có thể:</p>
//           <ul>
//             <li>Kiểm tra lại thông tin và thử thanh toán lại</li>
//             <li>Liên hệ với bộ phận hỗ trợ nếu bạn cần giúp đỡ</li>
//             <li>Tìm gia sư khác</li>
//           </ul>
//         </div>

//         <div className="action-buttons">
//           <button className="btn btn-primary" onClick={() => navigate(-1)}>
//             Thử lại
//           </button>
//           <button
//             className="btn btn-outline-primary"
//             onClick={() => navigate("/tutors")}
//           >
//             Tìm gia sư khác
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PaymentCancel;

import React from "react";
import { useNavigate } from "react-router-dom";
import "./PaymentSuccess.scss"; // Reuse styles from PaymentSuccess

const PaymentCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="payment-success-container">
      <div className="success-content error-content">
        <div className="error-icon">❌</div>
        <h1>Thanh toán đã hủy</h1>
        <p className="success-message">
          Giao dịch của bạn đã được hủy. Không có khoản thanh toán nào được thực
          hiện.
        </p>

        <div className="payment-details">
          <p>Bạn có thể:</p>
          <ul>
            <li>Kiểm tra lại thông tin và thử thanh toán lại</li>
            <li>Liên hệ với bộ phận hỗ trợ nếu bạn cần giúp đỡ</li>
            <li>Tìm gia sư khác</li>
          </ul>
        </div>

        <div className="action-buttons">
          <button className="btn btn-primary" onClick={() => navigate(-1)}>
            Thử lại
          </button>
          <button
            className="btn btn-outline-primary"
            onClick={() => navigate("/tutors")}
          >
            Tìm gia sư khác
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;
