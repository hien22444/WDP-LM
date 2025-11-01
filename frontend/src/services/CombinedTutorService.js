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
  // Ưu tiên /tutors/search vì nó trả về TutorProfile với đầy đủ thông tin
  const endpoints = [
    {
      url: "/tutors/search",
      params: { limit: 1000, includePending: true },
      transform: (data) => {
        console.log("🔍 /tutors/search response:", data);
        return {
          tutors: data.tutors || [],
          total: data.pagination?.count || data.tutors?.length || 0,
          totalPages: data.pagination?.total || 1,
        };
      },
    },
    {
      url: "/admin/users",
      params: { role: "tutor", limit: 1000 },
      transform: (data) => {
        console.log("🔍 /admin/users response:", data);
        const tutors =
          data.users?.filter((user) => user.role === "tutor") || [];
        // Transform users thành format giống tutors
        const formattedTutors = tutors.map(user => ({
          id: user._id || user.id,
          userId: user._id || user.id,
          name: user.full_name || user.name || "Gia sư",
          email: user.email,
          avatar: user.image || user.avatar,
          subjects: [],
          location: "Chưa cập nhật",
          rating: 0,
          reviewCount: 0,
          experience: "0 năm",
          price: 0,
          teachModes: [],
          bio: "Chưa có giới thiệu",
          verified: user.status === "active"
        }));
        return { tutors: formattedTutors, total: formattedTutors.length, totalPages: 1 };
      },
    },
    {
      url: "/tutors",
      params: { limit: 1000 },
      transform: (data) => ({
        tutors: data.tutors || [],
        total: data.total || data.tutors?.length || 0,
        totalPages: data.totalPages || 1,
      }),
    },
    {
      url: "/tutors/all",
      params: { limit: 1000 },
      transform: (data) => ({
        tutors: Array.isArray(data) ? data : data.tutors || [],
        total: Array.isArray(data)
          ? data.length
          : data.total || data.tutors?.length || 0,
        totalPages: data.totalPages || 1,
      }),
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
