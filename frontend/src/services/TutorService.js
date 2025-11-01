import axios from "axios";
import Cookies from "js-cookie";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api/v1";

// Log the API URL for debugging
console.log("Using API URL for tutor service:", API_BASE_URL);

// Debug API URL
console.log("Using API URL:", API_BASE_URL);

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

export const searchTutors = async (query = {}) => {
  // Use the provided query params or default to empty object
  const params = {
    ...query, // Spread the query params to include any filters
    limit: 1000, // Set a high limit to get all tutors
    sortBy: "rating", // Sort by rating by default
    includePending: true // Include both approved and pending tutors
  };

  console.log("🔍 Starting to fetch tutors with params:", params);

  try {
    // First try the admin endpoint
    try {
      console.log("🔍 Attempting to fetch from admin endpoint...");
      const adminRes = await client.get(`/admin/users`, { 
        params: { ...params, role: "tutor" } 
      });
      console.log("✅ Admin API success:", adminRes.data);

      const tutors = adminRes.data.users || [];
      return {
        tutors: tutors,
        total: tutors.length,
        totalPages: 1,
      };
    } catch (adminError) {
      console.log(
        "⚠️ Admin API failed, falling back to regular search...",
        adminError
      );
      // Remove role from params for regular search
      const { role, ...searchParams } = params;
      const res = await client.get(`/tutors/search`, { params: searchParams });
      console.log("✅ Regular search API Response:", res.data);

      if (!res.data || !Array.isArray(res.data.tutors)) {
        console.error("❌ Invalid response format:", res.data);
        return { tutors: [], total: 0, totalPages: 1 };
      }

      // Xử lý dữ liệu trả về, đảm bảo format đúng
      const tutors = Array.isArray(res.data.tutors)
        ? res.data.tutors
        : Array.isArray(res.data)
        ? res.data
        : [];

      console.log("✅ Found tutors:", tutors.length);

      return {
        tutors: tutors,
        total: tutors.length,
        totalPages: Math.ceil(tutors.length / params.limit),
      };
    }
  } catch (error) {
    if (error.response?.status === 404) {
      console.log("⚠️ /tutors/all not found, trying /tutors/search");
      // Fallback to /tutors/search if /tutors/all is not available
      const searchRes = await client.get("/tutors/search", { params });
      return searchRes.data;
    }
    console.error("❌ API Error:", error.response?.data || error.message);
    throw error;
  }
};

export const getTutorCourses = async (tutorId) => {
  const res = await client.get(`/tutors/${tutorId}/courses`);
  return res.data;
};

export const updateTutorProfile = async (payload) => {
  console.log(
    "🔍 TutorService: updateTutorProfile called with payload:",
    payload
  );
  console.log("🔍 TutorService: API_BASE_URL:", API_BASE_URL);

  // Check all possible token locations
  const accessToken = Cookies.get("accessToken");
  const refreshToken = Cookies.get("refreshToken");
  const localStorageUser = localStorage.getItem("user");

  console.log("🔍 TutorService: Access token:", accessToken);
  console.log("🔍 TutorService: Refresh token:", refreshToken);
  console.log("🔍 TutorService: localStorage user:", localStorageUser);

  // If no access token, try to get from localStorage
  if (!accessToken && localStorageUser) {
    try {
      const user = JSON.parse(localStorageUser);
      const token = user.token || user.accessToken;
      if (token) {
        console.log(
          "🔍 TutorService: Found token in localStorage user:",
          token
        );
        // Set the token in cookies for this request
        Cookies.set("accessToken", token);
      }
    } catch (e) {
      console.error("❌ TutorService: Error parsing localStorage user:", e);
    }
  }

  try {
    const res = await client.patch(`/tutors/me`, payload);
    console.log("✅ TutorService: Update successful:", res.data);
    return res.data.profile;
  } catch (error) {
    console.error("❌ TutorService: Update failed:", error);
    console.error("❌ TutorService: Error response:", error.response?.data);
    console.error("❌ TutorService: Error status:", error.response?.status);
    throw error;
  }
};

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
  updateTutorProfile,
};

export default tutorService;
