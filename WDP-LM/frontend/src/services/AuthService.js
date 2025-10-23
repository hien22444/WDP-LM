import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api/v1";
const client = axios.create({ baseURL: API_BASE_URL, withCredentials: true });

// Login
export const login = async (email, password) => {
  try {
    const res = await client.post("/auth/login", { email, password });
    
    // Store tokens
    Cookies.set("accessToken", res.data.accessToken, { expires: 1 });
    Cookies.set("refreshToken", res.data.refreshToken, { expires: 7 });
    
    // Store user data
    localStorage.setItem("user", JSON.stringify(res.data.user));
    
    // Store profile completion data and notify if incomplete
    if (res.data.profileCompletion) {
      localStorage.setItem("profileCompletion", JSON.stringify(res.data.profileCompletion));
      if (!res.data.profileCompletion.completed) {
        toast.info("📝 Vui lòng hoàn thiện hồ sơ để trải nghiệm đầy đủ.");
      }
    }
    
    toast.success("🎉 Đăng nhập thành công!");
    return res.data;
  } catch (error) {
    const message = error.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại.";
    toast.error(`❌ ${message}`);
    throw error;
  }
};

// Register
export const register = async (userData) => {
  try {
    const res = await client.post("/auth/register", userData);
    toast.success("🎉 Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.");
    return res.data;
  } catch (error) {
    const message = error.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.";
    toast.error(`❌ ${message}`);
    throw error;
  }
};

// Logout
export const logout = async () => {
  try {
    // Clear tokens
    Cookies.remove("accessToken");
    Cookies.remove("refreshToken");
    
    // Clear user data
    localStorage.removeItem("user");
    localStorage.removeItem("profileCompletion");
    
    toast.success("👋 Đã đăng xuất thành công!");
  } catch (error) {
    console.error("Logout error:", error);
    // Still clear local data even if API call fails
    Cookies.remove("accessToken");
    Cookies.remove("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("profileCompletion");
  }
};

// Get current user
export const getCurrentUser = () => {
  try {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

// Get profile completion status
export const getProfileCompletionStatus = () => {
  try {
    const profileCompletion = localStorage.getItem("profileCompletion");
    return profileCompletion ? JSON.parse(profileCompletion) : null;
  } catch (error) {
    console.error("Error getting profile completion status:", error);
    return null;
  }
};

// Check if user needs to complete profile
export const needsProfileCompletion = () => {
  const profileCompletion = getProfileCompletionStatus();
  // Show modal whenever profile is incomplete, regardless of firstLogin flag
  return profileCompletion && !profileCompletion.completed;
};

// Refresh token
export const refreshToken = async () => {
  try {
    const refreshToken = Cookies.get("refreshToken");
    if (!refreshToken) {
      throw new Error("No refresh token");
    }

    const res = await client.post("/auth/refresh", { refreshToken });
    
    // Update tokens
    Cookies.set("accessToken", res.data.accessToken, { expires: 1 });
    Cookies.set("refreshToken", res.data.refreshToken, { expires: 7 });
    
    return res.data;
  } catch (error) {
    console.error("Token refresh failed:", error);
    // Clear tokens on refresh failure
    Cookies.remove("accessToken");
    Cookies.remove("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("profileCompletion");
    throw error;
  }
};

// Setup axios interceptor for token refresh
client.interceptors.request.use((config) => {
  const accessToken = Cookies.get("accessToken");
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        await refreshToken();
        const newToken = Cookies.get("accessToken");
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return client(originalRequest);
      } catch (refreshError) {
        // Redirect to login or handle refresh failure
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

const authService = {
  login,
  register,
  logout,
  getCurrentUser,
  getProfileCompletionStatus,
  needsProfileCompletion,
  refreshToken
};

export default authService;
