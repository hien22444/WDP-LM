import axios from "axios";

// Cấu hình URL của backend từ biến môi trường hoặc đặt giá trị mặc định
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api/v1";

const createPaymentLink = async () => {
  try {
    // Gọi đến API endpoint trên backend của bạn
    const response = await axios.post(`${API_URL}/payment/create-payment-link`);
    return response.data;
  } catch (error) {
    // Ném lỗi ra để component có thể bắt và xử lý
    throw error;
  }
};

const PaymentService = {
  createPaymentLink,
};

export default PaymentService;
