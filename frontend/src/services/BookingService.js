import axios from "axios";
import Cookies from "js-cookie";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api/v1";
const client = axios.create({ baseURL: API_BASE_URL, withCredentials: true });
client.interceptors.request.use((config) => {
  const accessToken = Cookies.get("accessToken");
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

export const createBooking = async (payload) => {
  const res = await client.post(`/bookings`, payload);
  return res.data.booking;
};

export const listMyBookings = async (role = 'student') => {
  const res = await client.get(`/bookings/me`, { params: { role } });
  return res.data.items;
};

export const tutorDecision = async (id, decision) => {
  const res = await client.post(`/bookings/${id}/decision`, { decision });
  return res.data.booking;
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
  const res = await client.get(`/bookings/slots/public`, { params });
  return res.data.items;
};

export const getPublicTeachingSlot = async (id) => {
  const res = await client.get(`/bookings/slots/${id}`);
  return res.data.slot;
};
// Tutor search API
export const searchTutors = async (params) => {
  const res = await client.get('/tutors/search', { params });
  return res.data;
};

export const getTutorProfile = async (tutorId) => {
  const res = await client.get(`/tutors/${tutorId}`);
  return res.data;
};

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
  searchTutors,
  getTutorProfile
};

export default bookingService;


