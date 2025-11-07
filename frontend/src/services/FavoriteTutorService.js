import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api/v1";
const client = axios.create({ baseURL: API_BASE_URL, withCredentials: true });

client.interceptors.request.use((config) => {
  const accessToken = Cookies.get("accessToken");
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// Lấy danh sách gia sư yêu thích
export const getFavoriteTutors = async () => {
  try {
    const res = await client.get("/favorites/tutors");
    return res.data.tutors;
  } catch (error) {
    console.error("Error getting favorite tutors:", error);
    toast.error("Không thể lấy danh sách gia sư yêu thích");
    return [];
  }
};

// Thêm gia sư vào danh sách yêu thích
export const addFavoriteTutor = async (tutorId) => {
  try {
    const res = await client.post(`/favorites/tutors/${tutorId}`);
    toast.success("Đã thêm gia sư vào danh sách yêu thích");
    return res.data;
  } catch (error) {
    console.error("Error adding favorite tutor:", error);
    toast.error("Không thể thêm gia sư vào danh sách yêu thích");
    throw error;
  }
};

// Xóa gia sư khỏi danh sách yêu thích
export const removeFavoriteTutor = async (tutorId) => {
  try {
    const res = await client.delete(`/favorites/tutors/${tutorId}`);
    toast.success("Đã xóa gia sư khỏi danh sách yêu thích");
    return res.data;
  } catch (error) {
    console.error("Error removing favorite tutor:", error);
    toast.error("Không thể xóa gia sư khỏi danh sách yêu thích");
    throw error;
  }
};

// Kiểm tra xem gia sư có trong danh sách yêu thích không
export const checkFavoriteTutor = async (tutorId) => {
  try {
    const res = await client.get(`/favorites/tutors/${tutorId}`);
    return res.data.isFavorite;
  } catch (error) {
    console.error("Error checking favorite tutor:", error);
    return false;
  }
};

export default {
  getFavoriteTutors,
  addFavoriteTutor,
  removeFavoriteTutor,
  checkFavoriteTutor,
};
