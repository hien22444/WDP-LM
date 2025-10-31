import axios from "axios";
import Cookies from "js-cookie";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api/v1";

const client = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

client.interceptors.request.use((config) => {
  const accessToken = Cookies.get("accessToken");
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

export const getAllTutors = async () => {
  console.log("🔍 Starting getAllTutors with base URL:", API_BASE_URL);

  let lastError = null;

  // Try all available endpoints in sequence
  const endpoints = [
    {
      url: "/admin/users",
      params: { role: "tutor", status: "active", limit: 100 },
      transform: (data) => {
        const tutors =
          data.users?.filter((user) => user.role === "tutor") || [];
        return { tutors, total: tutors.length, totalPages: 1 };
      },
    },
    {
      url: "/tutors",
      params: { limit: 100, status: "active" },
      transform: (data) => ({
        tutors: data.tutors || [],
        total: data.total || data.tutors?.length || 0,
        totalPages: data.totalPages || 1,
      }),
    },
    {
      url: "/tutors/all",
      params: { limit: 100 },
      transform: (data) => ({
        tutors: Array.isArray(data) ? data : data.tutors || [],
        total: Array.isArray(data)
          ? data.length
          : data.total || data.tutors?.length || 0,
        totalPages: data.totalPages || 1,
      }),
    },
    {
      url: "/tutors/search",
      params: { limit: 100 },
      transform: (data) => data,
    },
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`🔄 Trying endpoint: ${endpoint.url}`);
      const response = await client.get(endpoint.url, {
        params: endpoint.params,
      });
      console.log(`✅ Success from ${endpoint.url}:`, response.data);

      const result = endpoint.transform(response.data);

      if (result.tutors && result.tutors.length > 0) {
        console.log(
          `📊 Found ${result.tutors.length} tutors from ${endpoint.url}`
        );
        return result;
      } else {
        console.log(
          `⚠️ No tutors found in response from ${endpoint.url}, trying next endpoint...`
        );
      }
    } catch (error) {
      console.log(`⚠️ Error from ${endpoint.url}:`, error.message);
      lastError = error;
      // Continue to next endpoint
    }
  }

  // If we get here, no endpoints succeeded
  console.error("❌ All endpoints failed. Last error:", lastError);
  throw new Error("Không thể tải danh sách gia sư. Vui lòng thử lại sau.");
};
