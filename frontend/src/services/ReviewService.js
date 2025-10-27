import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api/v1";
const client = axios.create({ baseURL: API_BASE_URL, withCredentials: true });
client.interceptors.request.use((config) => {
  const accessToken = Cookies.get("accessToken");
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// Create review for completed booking
export const createReview = async (reviewData) => {
  try {
    const res = await client.post("/reviews", reviewData);
    toast.success("⭐ Đánh giá đã được gửi thành công!");
    return res.data.review;
  } catch (error) {
    const message = error.response?.data?.message || "Không thể gửi đánh giá. Vui lòng thử lại.";
    toast.error(`❌ ${message}`);
    throw error;
  }
};

// Get reviews for a tutor
export const getTutorReviews = async (tutorId, params = {}) => {
  try {
    const res = await client.get(`/reviews/tutor/${tutorId}`, { params });
    return res.data;
  } catch (error) {
    const message = error.response?.data?.message || "Không thể tải đánh giá. Vui lòng thử lại.";
    toast.error(`❌ ${message}`);
    throw error;
  }
};

// Get user's reviews
export const getMyReviews = async (params = {}) => {
  try {
    const res = await client.get("/reviews/my-reviews", { params });
    return res.data;
  } catch (error) {
    const message = error.response?.data?.message || "Không thể tải đánh giá của bạn. Vui lòng thử lại.";
    toast.error(`❌ ${message}`);
    throw error;
  }
};

// Update review
export const updateReview = async (reviewId, updateData) => {
  try {
    const res = await client.put(`/reviews/${reviewId}`, updateData);
    toast.success("✅ Đánh giá đã được cập nhật!");
    return res.data.review;
  } catch (error) {
    const message = error.response?.data?.message || "Không thể cập nhật đánh giá. Vui lòng thử lại.";
    toast.error(`❌ ${message}`);
    throw error;
  }
};

// Delete review
export const deleteReview = async (reviewId) => {
  try {
    const res = await client.delete(`/reviews/${reviewId}`);
    toast.success("🗑️ Đánh giá đã được xóa!");
    return res.data;
  } catch (error) {
    const message = error.response?.data?.message || "Không thể xóa đánh giá. Vui lòng thử lại.";
    toast.error(`❌ ${message}`);
    throw error;
  }
};

// Add tutor response to review
export const addReviewResponse = async (reviewId, comment) => {
  try {
    const res = await client.post(`/reviews/${reviewId}/response`, { comment });
    toast.success("💬 Phản hồi đã được gửi!");
    return res.data.review;
  } catch (error) {
    const message = error.response?.data?.message || "Không thể gửi phản hồi. Vui lòng thử lại.";
    toast.error(`❌ ${message}`);
    throw error;
  }
};

// Report review
export const reportReview = async (reviewId, reason) => {
  try {
    const res = await client.post(`/reviews/${reviewId}/report`, { reason });
    toast.success("🚨 Đánh giá đã được báo cáo!");
    return res.data;
  } catch (error) {
    const message = error.response?.data?.message || "Không thể báo cáo đánh giá. Vui lòng thử lại.";
    toast.error(`❌ ${message}`);
    throw error;
  }
};

// Mark review as helpful
export const markReviewHelpful = async (reviewId) => {
  try {
    const res = await client.post(`/reviews/${reviewId}/helpful`);
    toast.success("👍 Đã đánh dấu hữu ích!");
    return res.data;
  } catch (error) {
    const message = error.response?.data?.message || "Không thể đánh dấu hữu ích. Vui lòng thử lại.";
    toast.error(`❌ ${message}`);
    throw error;
  }
};

const reviewService = {
  createReview,
  getTutorReviews,
  getMyReviews,
  updateReview,
  deleteReview,
  addReviewResponse,
  reportReview,
  markReviewHelpful
};

export default reviewService;
