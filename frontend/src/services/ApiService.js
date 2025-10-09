import axios from "axios";
import Cookies from "js-cookie";

// Ensure frontend hits the correct backend prefix /api/v1
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api/v1";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = Cookies.get("accessToken");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't retried yet, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = Cookies.get("refreshToken");
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken } = response.data;
          Cookies.set("accessToken", accessToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        Cookies.remove("accessToken");
        Cookies.remove("refreshToken");
        window.location.href = "/signin";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API functions
export const loginApi = async (email, password) => {
  try {
    const response = await apiClient.post("/auth/login", { email, password });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Login failed" };
  }
};

export const registerApi = async (userData) => {
  try {
    const response = await apiClient.post("/auth/register", userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Registration failed" };
  }
};

export const verifyAccountApi = async (token) => {
  try {
    const response = await apiClient.get(`/auth/verify?token=${token}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Verification failed" };
  }
};

export const logoutApi = async () => {
  try {
    const response = await apiClient.post("/auth/logout");
    Cookies.remove("accessToken");
    Cookies.remove("refreshToken");
    return response.data;
  } catch (error) {
    // Even if API call fails, clear local tokens
    Cookies.remove("accessToken");
    Cookies.remove("refreshToken");
    throw error.response?.data || { message: "Logout failed" };
  }
};

export const forgotPasswordApi = async (email) => {
  try {
    const response = await apiClient.post("/auth/forgot-password", { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to send reset email" };
  }
};

export const resetPasswordApi = async (token, password) => {
  try {
    const response = await apiClient.post("/auth/reset-password", {
      token,
      password,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Password reset failed" };
  }
};

export const changePasswordApi = async (currentPassword, newPassword) => {
  try {
    const response = await apiClient.post("/auth/change-password", {
      currentPassword,
      newPassword,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Password change failed" };
  }
};

export const getCurrentUserApi = async () => {
  try {
    const response = await apiClient.get("/users/me");
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to get user data" };
  }
};

export const updateUserProfileApi = async (profileData) => {
  try {
    const response = await apiClient.patch("/users/me", profileData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to update profile" };
  }
};

export const verifyOTPApi = async (email, otp) => {
  try {
    const response = await apiClient.post("/auth/verify-otp", { email, otp });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "OTP verification failed" };
  }
};

export const resendOTPApi = async (email) => {
  try {
    const response = await apiClient.post("/auth/resend-otp", { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to resend OTP" };
  }
};

// OAuth API functions
export const googleAuthApi = async (credential) => {
  try {
    const response = await apiClient.post("/auth/google", { credential });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Google authentication failed" };
  }
};

export const facebookAuthApi = async (accessToken) => {
  try {
    const response = await apiClient.post("/auth/facebook", { accessToken });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Facebook authentication failed" };
  }
};

export default apiClient;
