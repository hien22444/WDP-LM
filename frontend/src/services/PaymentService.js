import axios from "axios";
import Cookies from "js-cookie";

// Cấu hình URL của backend từ biến môi trường hoặc đặt giá trị mặc định
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api/v1";

// Tạo axios client với interceptor để tự động thêm token
const client = axios.create({ 
  baseURL: API_URL, 
  withCredentials: true 
});

// Request interceptor để thêm token vào header
client.interceptors.request.use((config) => {
  const accessToken = Cookies.get("accessToken");
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

const createPaymentLink = async (payload = {}) => {
  try {
    // Gọi đến API endpoint trên backend của bạn với payload (product, amount...)
    const response = await client.post("/payment/create-payment-link", payload);
    return response.data;
  } catch (error) {
    // Ném lỗi ra để component có thể bắt và xử lý
    throw error;
  }
};

const listPayments = async (params = {}) => {
  try {
    const response = await client.get("/payment", { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getPaymentDetail = async (id) => {
  try {
    const response = await client.get(`/payment/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const verifyPayment = async (orderCode) => {
  try {
    const response = await client.get(`/payment/verify/${encodeURIComponent(orderCode)}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const cancelPayment = async (id) => {
  try {
    const response = await client.post(`/payment/${id}/cancel`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const PaymentService = {
  createPaymentLink,
  listPayments,
  getPaymentDetail,
  verifyPayment,
  cancelPayment,
};

export default PaymentService;
