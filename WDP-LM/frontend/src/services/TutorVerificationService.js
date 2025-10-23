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

// Get verification status
export const getVerificationStatus = async () => {
  try {
    const res = await client.get("/tutor-verification/status");
    return res.data;
  } catch (error) {
    const message = error.response?.data?.message || "Không thể tải trạng thái xác minh. Vui lòng thử lại.";
    toast.error(`❌ ${message}`);
    throw error;
  }
};

// Upload identity documents
export const uploadIdentityDocuments = async (formData) => {
  try {
    const res = await client.post("/tutor-verification/identity", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
    toast.success("📄 Giấy tờ tùy thân đã được tải lên thành công!");
    return res.data;
  } catch (error) {
    const message = error.response?.data?.message || "Không thể tải lên giấy tờ tùy thân. Vui lòng thử lại.";
    toast.error(`❌ ${message}`);
    throw error;
  }
};

// Upload education documents
export const uploadEducationDocument = async (formData) => {
  try {
    const res = await client.post("/tutor-verification/education", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
    toast.success("🎓 Tài liệu học vấn đã được tải lên thành công!");
    return res.data;
  } catch (error) {
    const message = error.response?.data?.message || "Không thể tải lên tài liệu học vấn. Vui lòng thử lại.";
    toast.error(`❌ ${message}`);
    throw error;
  }
};

// Upload certificates
export const uploadCertificate = async (formData) => {
  try {
    const res = await client.post("/tutor-verification/certificates", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
    toast.success("🏆 Chứng chỉ đã được tải lên thành công!");
    return res.data;
  } catch (error) {
    const message = error.response?.data?.message || "Không thể tải lên chứng chỉ. Vui lòng thử lại.";
    toast.error(`❌ ${message}`);
    throw error;
  }
};


// Sign commitment
export const signCommitment = async () => {
  try {
    const res = await client.post("/tutor-verification/commitment");
    toast.success("✍️ Cam kết đã được ký thành công!");
    return res.data;
  } catch (error) {
    const message = error.response?.data?.message || "Không thể ký cam kết. Vui lòng thử lại.";
    toast.error(`❌ ${message}`);
    throw error;
  }
};

// Submit for review
export const submitForReview = async () => {
  try {
    const res = await client.post("/tutor-verification/submit");
    toast.success("📤 Hồ sơ đã được gửi để xem xét!");
    return res.data;
  } catch (error) {
    const message = error.response?.data?.message || "Không thể gửi hồ sơ để xem xét. Vui lòng thử lại.";
    toast.error(`❌ ${message}`);
    throw error;
  }
};

// Delete document
export const deleteDocument = async (type, documentId) => {
  try {
    const res = await client.delete(`/tutor-verification/documents/${type}/${documentId}`);
    toast.success("🗑️ Tài liệu đã được xóa thành công!");
    return res.data;
  } catch (error) {
    const message = error.response?.data?.message || "Không thể xóa tài liệu. Vui lòng thử lại.";
    toast.error(`❌ ${message}`);
    throw error;
  }
};

const tutorVerificationService = {
  getVerificationStatus,
  uploadIdentityDocuments,
  uploadEducationDocument,
  uploadCertificate,
  signCommitment,
  submitForReview,
  deleteDocument
};

export default tutorVerificationService;
