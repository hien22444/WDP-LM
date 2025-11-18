import axios from "axios";
import Cookies from "js-cookie";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api/v1";

const CourseService = {
  // Get tutor's subjects from their profile
  getTutorSubjects: async () => {
    try {
      const token = Cookies.get("accessToken");
      console.log("=".repeat(50));
      console.log("🔑 Token exists:", !!token);
      console.log("🔑 Token value (first 20 chars):", token?.substring(0, 20));
      console.log("📡 API URL:", API_URL);
      console.log("📡 Full URL:", `${API_URL}/tutors/profile`);
      console.log("📡 Request headers:", { Authorization: `Bearer ${token?.substring(0, 20)}...` });
      
      const response = await axios.get(`${API_URL}/tutors/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log("✅ Response status:", response.status);
      console.log("✅ Response data:", JSON.stringify(response.data, null, 2));
      console.log("✅ Subjects array:", response.data.subjects);
      console.log("✅ Subjects length:", response.data.subjects?.length);
      console.log("=".repeat(50));
      return response.data.subjects || [];
    } catch (error) {
      console.log("=".repeat(50));
      console.error("❌ Error fetching tutor subjects:", error.message);
      console.error("❌ Error response data:", error.response?.data);
      console.error("❌ Error status:", error.response?.status);
      console.error("❌ Error full:", error);
      console.log("=".repeat(50));
      throw error;
    }
  },

  // Create a new course
  createCourse: async (courseData) => {
    try {
      const token = Cookies.get("accessToken");
      console.log("=".repeat(50));
      console.log("📝 Creating course...");
      console.log("📝 Course data:", JSON.stringify(courseData, null, 2));
      console.log("📝 API URL:", `${API_URL}/courses`);
      console.log("📝 Token exists:", !!token);
      
      const response = await axios.post(`${API_URL}/courses`, courseData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log("✅ Course created successfully:", response.data);
      console.log("=".repeat(50));
      return response.data;
    } catch (error) {
      console.log("=".repeat(50));
      console.error("❌ Error creating course:", error.message);
      console.error("❌ Error response:", error.response?.data);
      console.error("❌ Error status:", error.response?.status);
      console.log("=".repeat(50));
      throw error;
    }
  },

  // Get tutor's own courses
  getMyCourses: async () => {
    try {
      const token = Cookies.get("accessToken");
      const response = await axios.get(`${API_URL}/courses/tutor/my-courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching my courses:", error);
      throw error;
    }
  },

  // Get public courses (for students)
  getPublicCourses: async (params = {}) => {
    try {
      const token = Cookies.get("accessToken");
      const response = await axios.get(`${API_URL}/courses`, {
        params,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching public courses:", error);
      throw error;
    }
  },

  // Get course by ID
  getCourseById: async (courseId) => {
    try {
      const token = Cookies.get("accessToken");
      const response = await axios.get(`${API_URL}/courses/${courseId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching course:", error);
      throw error;
    }
  },

  // Update course
  updateCourse: async (courseId, courseData) => {
    try {
      const token = Cookies.get("accessToken");
      const response = await axios.put(
        `${API_URL}/courses/${courseId}`,
        courseData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error updating course:", error);
      throw error;
    }
  },

  // Delete course
  deleteCourse: async (courseId) => {
    try {
      const token = Cookies.get("accessToken");
      const response = await axios.delete(`${API_URL}/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      console.error("Error deleting course:", error);
      throw error;
    }
  },

  // Publish course
  publishCourse: async (courseId) => {
    try {
      const token = Cookies.get("accessToken");
      const response = await axios.post(
        `${API_URL}/courses/${courseId}/publish`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error publishing course:", error);
      throw error;
    }
  },

  // Enroll in course
  enrollCourse: async (courseId) => {
    try {
      const token = Cookies.get("accessToken");
      const response = await axios.post(
        `${API_URL}/courses/${courseId}/enroll`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error enrolling in course:", error);
      throw error;
    }
  },

  // Get student's enrollments
  getMyEnrollments: async () => {
    try {
      const token = Cookies.get("accessToken");
      const response = await axios.get(
        `${API_URL}/courses/student/my-enrollments`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      throw error;
    }
  },

  // Get enrollments for a specific course (tutor only)
  getCourseEnrollments: async (courseId) => {
    try {
      const token = Cookies.get("accessToken");
      const response = await axios.get(
        `${API_URL}/courses/${courseId}/enrollments`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching course enrollments:", error);
      throw error;
    }
  },

  // Helper: Format schedule for display
  formatSchedule: (schedule) => {
    const dayLabels = {
      monday: "T2",
      tuesday: "T3",
      wednesday: "T4",
      thursday: "T5",
      friday: "T6",
      saturday: "T7",
      sunday: "CN",
    };

    return schedule
      .map((s) => `${dayLabels[s.dayOfWeek]} ${s.time}`)
      .join(", ");
  },

  // Helper: Calculate total sessions
  calculateTotalSessions: (course) => {
    const sessionsPerWeek = course.schedule?.length || 0;
    const weeks = course.duration?.weeks || 0;
    return sessionsPerWeek * weeks;
  },

  // Helper: Calculate total price
  calculateTotalPrice: (course) => {
    const totalSessions = CourseService.calculateTotalSessions(course);
    return totalSessions * (course.price || 0);
  },

  // Helper: Format price
  formatPrice: (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  },

  // Helper: Get status label
  getStatusLabel: (status) => {
    const labels = {
      draft: "Nháp",
      published: "Đã xuất bản",
      ongoing: "Đang diễn ra",
      completed: "Hoàn thành",
    };
    return labels[status] || status;
  },
};

export default CourseService;
