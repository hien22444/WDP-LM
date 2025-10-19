import axios from "axios";

// Cấu hình URL của backend từ biến môi trường hoặc đặt giá trị mặc định
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api/v1";

const createPaymentLink = async (payload = {}) => {
  try {
    // Gọi đến API endpoint trên backend của bạn với payload (product, amount...)
    const response = await axios.post(
      `${API_URL}/payment/create-payment-link`,
      payload
    );
    return response.data;
  } catch (error) {
    // Ném lỗi ra để component có thể bắt và xử lý
    throw error;
  }
};

const listPayments = async (params = {}) => {
  try {
    const response = await axios.get(`${API_URL}/payment`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getPaymentDetail = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/payment/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const cancelPayment = async (id) => {
  try {
    const response = await axios.post(`${API_URL}/payment/${id}/cancel`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const PaymentService = {
  createPaymentLink,
  listPayments,
  getPaymentDetail,
  cancelPayment,
};

export default PaymentService;
