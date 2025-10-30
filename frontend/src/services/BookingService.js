import axios from "axios";
import Cookies from "js-cookie";
<<<<<<< HEAD
=======
import { toast } from "react-toastify";
>>>>>>> Quan3

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api/v1";
const client = axios.create({ baseURL: API_BASE_URL, withCredentials: true });
client.interceptors.request.use((config) => {
  const accessToken = Cookies.get("accessToken");
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

export const createBooking = async (payload) => {
<<<<<<< HEAD
  const res = await client.post(`/bookings`, payload);
  return res.data.booking;
=======
  try {
    const res = await client.post(`/bookings`, payload);
    toast.success("🎉 Đặt lịch thành công! Gia sư sẽ phản hồi trong vòng 24 giờ.");
    return res.data.booking;
  } catch (error) {
    const message = error.response?.data?.message || "Không thể đặt lịch. Vui lòng thử lại.";
    toast.error(`❌ ${message}`);
    throw error;
  }
>>>>>>> Quan3
};

export const listMyBookings = async (role = 'student') => {
  const res = await client.get(`/bookings/me`, { params: { role } });
  return res.data.items;
};

export const tutorDecision = async (id, decision) => {
<<<<<<< HEAD
  const res = await client.post(`/bookings/${id}/decision`, { decision });
  return res.data.booking;
=======
  try {
    const res = await client.post(`/bookings/${id}/decision`, { decision });
    const message = decision === 'accept' 
      ? "✅ Đã chấp nhận yêu cầu đặt lịch. Học viên đã được thông báo qua email."
      : "❌ Đã từ chối yêu cầu đặt lịch. Học viên đã được thông báo qua email.";
    toast.success(message);
    return res.data.booking;
  } catch (error) {
    const message = error.response?.data?.message || "Không thể xử lý yêu cầu. Vui lòng thử lại.";
    toast.error(`❌ ${message}`);
    throw error;
  }
>>>>>>> Quan3
};

// Get bookings for a specific date range
export const getBookingsByDateRange = async (startDate, endDate, role = 'tutor') => {
  const res = await client.get(`/bookings/date-range`, {
    params: { 
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      role 
    }
  });
  return res.data.items;
};

// Get tutor availability
export const getTutorAvailability = async () => {
  const res = await client.get(`/tutors/me/availability`);
  return res.data.availability;
};

// Update tutor availability
export const updateTutorAvailability = async (availability) => {
  const res = await client.put(`/tutors/me/availability`, { availability });
  return res.data;
};

// Get booking statistics
export const getBookingStats = async () => {
  const res = await client.get(`/bookings/stats`);
  return res.data;
};

// Teaching slots APIs
export const createTeachingSlot = async (payload) => {
  const res = await client.post(`/bookings/slots`, payload);
  return res.data.slot;
};

export const listMyTeachingSlots = async () => {
  const res = await client.get(`/bookings/slots/me`);
  return res.data.items;
};

export const deleteTeachingSlot = async (id) => {
  const res = await client.delete(`/bookings/slots/${id}`);
  return res.data;
};

export const listPublicTeachingSlots = async (params = {}) => {
<<<<<<< HEAD
  const res = await client.get(`/bookings/slots/public`, { params });
  return res.data.items;
=======
  try {
    console.log("🌐 API Call: GET /bookings/slots/public", params);
    const res = await client.get(`/bookings/slots/public`, { params });
    console.log("📡 API Response status:", res.status);
    console.log("📦 API Response data:", res.data);
    return res.data.items || [];
  } catch (error) {
    console.error("❌ API Error:", error);
    console.error("❌ Error response:", error.response?.data);
    console.error("❌ Error status:", error.response?.status);
    throw error;
  }
>>>>>>> Quan3
};

export const getPublicTeachingSlot = async (id) => {
  const res = await client.get(`/bookings/slots/${id}`);
  return res.data.slot;
};
<<<<<<< HEAD
=======

// Get room token for joining WebRTC session
export const getRoomToken = async (bookingId) => {
  const res = await client.post(`/bookings/${bookingId}/join-token`);
  return res.data;
};

// Process payment success and get room code
export const processPaymentSuccess = async (bookingId) => {
  try {
    const res = await client.post(`/bookings/${bookingId}/payment-success`);
    toast.success("🎉 Thanh toán thành công! Mã phòng học đã được gửi qua email.");
    return res.data;
  } catch (error) {
    const message = error.response?.data?.message || "Không thể xử lý thanh toán. Vui lòng thử lại.";
    toast.error(`❌ ${message}`);
    throw error;
  }
};

// Book from teaching slot
export const bookFromSlot = async (slotId, notes = "") => {
  try {
    const res = await client.post(`/bookings/slots/${slotId}/book`, { notes });
    toast.success("🎉 Đặt lịch từ slot thành công! Gia sư sẽ phản hồi trong vòng 24 giờ.");
    return res.data.booking;
  } catch (error) {
    const message = error.response?.data?.message || "Không thể đặt lịch từ slot. Vui lòng thử lại.";
    toast.error(`❌ ${message}`);
    throw error;
  }
};
>>>>>>> Quan3
// Tutor search API
export const searchTutors = async (params) => {
  const res = await client.get('/tutors/search', { params });
  return res.data;
};

export const getTutorProfile = async (tutorId) => {
  const res = await client.get(`/tutors/${tutorId}`);
  return res.data;
};

<<<<<<< HEAD
=======
// Complete session and release payment
export const completeSession = async (bookingId) => {
  try {
    const res = await client.post(`/bookings/${bookingId}/complete`);
    toast.success("✅ Buổi học đã hoàn thành và thanh toán đã được chuyển!");
    return res.data.booking;
  } catch (error) {
    const message = error.response?.data?.message || "Không thể hoàn thành buổi học. Vui lòng thử lại.";
    toast.error(`❌ ${message}`);
    throw error;
  }
};

// Cancel booking and process refund
export const cancelBooking = async (bookingId, reason) => {
  try {
    const res = await client.post(`/bookings/${bookingId}/cancel`, { reason });
    toast.success("✅ Đã hủy buổi học và xử lý hoàn tiền!");
    return res.data;
  } catch (error) {
    const message = error.response?.data?.message || "Không thể hủy buổi học. Vui lòng thử lại.";
    toast.error(`❌ ${message}`);
    throw error;
  }
};

// Open dispute
export const openDispute = async (bookingId, reason) => {
  try {
    const res = await client.post(`/bookings/${bookingId}/dispute`, { reason });
    toast.success("⚠️ Đã mở tranh chấp. Hệ thống sẽ xử lý trong vòng 48 giờ.");
    return res.data.booking;
  } catch (error) {
    const message = error.response?.data?.message || "Không thể mở tranh chấp. Vui lòng thử lại.";
    toast.error(`❌ ${message}`);
    throw error;
  }
};

// Get escrow stats
export const getEscrowStats = async () => {
  const res = await client.get(`/bookings/escrow/stats`);
  return res.data.stats;
};

>>>>>>> Quan3
const bookingService = { 
  createBooking, 
  listMyBookings, 
  tutorDecision, 
  getBookingsByDateRange,
  getTutorAvailability,
  updateTutorAvailability,
  getBookingStats,
  createTeachingSlot,
  listMyTeachingSlots,
  listPublicTeachingSlots,
  getPublicTeachingSlot,
<<<<<<< HEAD
  searchTutors,
  getTutorProfile
=======
  getRoomToken,
  processPaymentSuccess,
  bookFromSlot,
  searchTutors,
  getTutorProfile,
  completeSession,
  cancelBooking,
  openDispute,
  getEscrowStats
>>>>>>> Quan3
};

export default bookingService;


