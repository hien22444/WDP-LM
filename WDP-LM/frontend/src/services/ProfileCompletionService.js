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

// Get profile completion status
export const getProfileCompletionStatus = async () => {
  try {
    const res = await client.get("/profile-completion/status");
    return res.data;
  } catch (error) {
    console.error("Error getting profile completion status:", error);
    throw error;
  }
};

// Update profile completion step
export const updateProfileStep = async (step, data) => {
  try {
    const res = await client.post("/profile-completion/update-step", {
      step,
      data
    });
    
    if (res.data.profileCompleted) {
      toast.success("🎉 Hồ sơ đã được hoàn thành!");
    } else {
      toast.success("✅ Bước tiếp theo đã được cập nhật!");
    }
    
    return res.data;
  } catch (error) {
    const message = error.response?.data?.message || "Không thể cập nhật hồ sơ. Vui lòng thử lại.";
    toast.error(`❌ ${message}`);
    throw error;
  }
};

// Complete profile
export const completeProfile = async (profileData) => {
  try {
    const res = await client.post("/profile-completion/complete", {
      profileData
    });
    
    toast.success("🎉 Hồ sơ đã được hoàn thành thành công!");
    return res.data;
  } catch (error) {
    const message = error.response?.data?.message || "Không thể hoàn thành hồ sơ. Vui lòng thử lại.";
    toast.error(`❌ ${message}`);
    throw error;
  }
};

// Skip profile completion
export const skipProfileCompletion = async () => {
  try {
    const res = await client.post("/profile-completion/skip");
    toast.info("⏭️ Đã bỏ qua hoàn thành hồ sơ");
    return res.data;
  } catch (error) {
    const message = error.response?.data?.message || "Không thể bỏ qua hoàn thành hồ sơ. Vui lòng thử lại.";
    toast.error(`❌ ${message}`);
    throw error;
  }
};

const profileCompletionService = {
  getProfileCompletionStatus,
  updateProfileStep,
  completeProfile,
  skipProfileCompletion
};

export default profileCompletionService;
