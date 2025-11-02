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
