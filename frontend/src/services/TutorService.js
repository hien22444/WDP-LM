import axios from "axios";
import Cookies from "js-cookie";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api/v1";

const client = axios.create({ baseURL: API_BASE_URL, withCredentials: true });
client.interceptors.request.use((config) => {
  const accessToken = Cookies.get("accessToken");
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

export const getMyTutorProfile = async () => {
  const res = await client.get(`/tutors/me`);
  return res.data.profile;
};

export const updateTutorBasic = async (payload) => {
  const res = await client.patch(`/tutors/me/basic`, payload);
  return res.data.profile;
};

export const updateTutorExpertise = async (payload) => {
  const res = await client.patch(`/tutors/me/expertise`, payload);
  return res.data.profile;
};

export const updateTutorPreferences = async (payload) => {
  const res = await client.patch(`/tutors/me/preferences`, payload);
  return res.data.profile;
};

export const saveAvailability = async (availability) => {
  const res = await client.put(`/tutors/me/availability`, { availability });
  return res.data.profile;
};

export const submitTutorProfile = async () => {
  const res = await client.post(`/tutors/me/submit`, {});
  return res.data;
};

export const uploadIdDocuments = async (files) => {
  const form = new FormData();
  for (const f of files) form.append("files", f);
  const res = await client.post(`/tutors/me/upload-id`, form);
  return res.data;
};

export const uploadDegreeDocuments = async (files) => {
  const form = new FormData();
  for (const f of files) form.append("files", f);
  const res = await client.post(`/tutors/me/upload-degree`, form);
  return res.data;
};

export const searchTutors = async (query) => {
<<<<<<< HEAD
  // Xử lý query để tách các từ khóa quan trọng
  const keywords = query.toLowerCase().split(" ");

  const params = {
    q: query,
    // Tìm theo môn học
    subjects: keywords.filter((word) =>
      ["toán", "lý", "hóa", "sinh", "văn", "anh", "sử", "địa"].includes(word)
    ),
    // Tìm theo cấp độ
    levels: keywords.filter((word) =>
      [
        "cấp 1",
        "cấp 2",
        "cấp 3",
        "đại học",
        "tiểu học",
        "thcs",
        "thpt",
      ].includes(word)
    ),
    // Tìm theo hình thức
    mode: keywords.includes("online")
      ? "online"
      : keywords.includes("offline")
      ? "offline"
      : undefined,
    // Các tham số khác
    page: 1,
    limit: 5,
  };

=======
  let params = {};
  
  if (typeof query === 'string') {
    // Xử lý query string cũ
    const queryString = query;
    const keywords = queryString.toLowerCase().split(" ");

    params = {
      q: queryString,
      // Tìm theo môn học
      subjects: keywords.filter((word) =>
        ["toán", "lý", "hóa", "sinh", "văn", "anh", "sử", "địa"].includes(word)
      ),
      // Tìm theo cấp độ
      levels: keywords.filter((word) =>
        [
          "cấp 1",
          "cấp 2",
          "cấp 3",
          "đại học",
          "tiểu học",
          "thcs",
          "thpt",
        ].includes(word)
      ),
      // Tìm theo hình thức
      mode: keywords.includes("online")
        ? "online"
        : keywords.includes("offline")
        ? "offline"
        : undefined,
      // Các tham số khác
      page: 1,
      limit: 50,
    };
  } else if (typeof query === 'object' && query !== null) {
    // Xử lý object parameters mới
    params = {
      search: query.search || '',
      subject: query.subject || '',
      location: query.location || '',
      mode: query.mode || '',
      minPrice: query.minPrice || '',
      maxPrice: query.maxPrice || '',
      sortBy: query.sortBy || 'rating',
      page: query.page || 1,
      limit: query.limit || 50,
    };
  }

  // Add includePending to show all tutors (approved + pending)
  params.includePending = true;
  
  console.log('🔍 TutorService searchTutors params:', params);
>>>>>>> Quan3
  const res = await client.get(`/tutors/search`, { params });
  return res.data;
};

export const getTutorCourses = async (tutorId) => {
  const res = await client.get(`/tutors/${tutorId}/courses`);
  return res.data;
};

<<<<<<< HEAD
=======
export const updateTutorProfile = async (payload) => {
  console.log('🔍 TutorService: updateTutorProfile called with payload:', payload);
  console.log('🔍 TutorService: API_BASE_URL:', API_BASE_URL);
  
  // Check all possible token locations
  const accessToken = Cookies.get("accessToken");
  const refreshToken = Cookies.get("refreshToken");
  const localStorageUser = localStorage.getItem("user");
  
  console.log('🔍 TutorService: Access token:', accessToken);
  console.log('🔍 TutorService: Refresh token:', refreshToken);
  console.log('🔍 TutorService: localStorage user:', localStorageUser);
  
  // If no access token, try to get from localStorage
  if (!accessToken && localStorageUser) {
    try {
      const user = JSON.parse(localStorageUser);
      const token = user.token || user.accessToken;
      if (token) {
        console.log('🔍 TutorService: Found token in localStorage user:', token);
        // Set the token in cookies for this request
        Cookies.set("accessToken", token);
      }
    } catch (e) {
      console.error('❌ TutorService: Error parsing localStorage user:', e);
    }
  }
  
  try {
    const res = await client.patch(`/tutors/me`, payload);
    console.log('✅ TutorService: Update successful:', res.data);
    return res.data.profile;
  } catch (error) {
    console.error('❌ TutorService: Update failed:', error);
    console.error('❌ TutorService: Error response:', error.response?.data);
    console.error('❌ TutorService: Error status:', error.response?.status);
    throw error;
  }
};

>>>>>>> Quan3
const tutorService = {
  getMyTutorProfile,
  updateTutorBasic,
  updateTutorExpertise,
  updateTutorPreferences,
  saveAvailability,
  submitTutorProfile,
  uploadIdDocuments,
  uploadDegreeDocuments,
  searchTutors,
  getTutorCourses,
<<<<<<< HEAD
=======
  updateTutorProfile,
>>>>>>> Quan3
};

export default tutorService;
