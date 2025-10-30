import ApiService from "./ApiService";

class DashboardService {
  // Fetch dashboard data for a given role. On API failure, return mock data
  static async getDashboardData(role) {
    try {
      const response = await ApiService.get(`/dashboard/${role}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${role} dashboard:`, error);
      // Fallback to mock data if API fails
      switch (role) {
        case "learner":
          return { success: true, data: this.getLearnerMockData() };
        case "tutor":
          return { success: true, data: this.getTutorMockData() };
        case "admin":
<<<<<<< HEAD
          return { success: true, data: this.getAdminMockData() };
=======
          return { success: true, data: this.getTutorMockData() };
>>>>>>> Quan3
        default:
          throw error;
      }
    }
  }

  static async getGeneralStats() {
    try {
      const response = await ApiService.get("/dashboard/stats");
      return response.data;
    } catch (error) {
      console.error("Error fetching general stats:", error);
      throw error;
    }
  }

  static async updateUserRole(userId, newRole) {
    try {
      const response = await ApiService.patch("/dashboard/admin/user-role", {
        userId,
        newRole,
      });
      return response.data;
    } catch (error) {
      console.error("Error updating user role:", error);
      throw error;
    }
  }

  static getLearnerMockData() {
    return {
      activeCourses: 3,
      weeklyLessons: 8,
      favoriteTutors: 5,
      learningProgress: 75,
    };
  }

  static getTutorMockData() {
    return {
      currentStudents: 12,
      monthlyEarnings: 8500000,
      averageRating: 4.8,
      weeklyHours: 24,

      upcomingLessons: [
        {
          id: 1,
          studentName: "Nguyễn Minh An",
          subject: "Toán học",
          date: "2024-01-15",
          time: "14:00",
          duration: 120,
          status: "confirmed",
        },
        {
          id: 2,
          studentName: "Trần Thị Lan",
          subject: "Tiếng Anh",
          date: "2024-01-15",
          time: "16:30",
          duration: 90,
          status: "pending",
        },
        {
          id: 3,
          studentName: "Lê Văn Hùng",
          subject: "Vật lý",
          date: "2024-01-16",
          time: "09:00",
          duration: 120,
          status: "confirmed",
        },
      ],

      newRequests: [
        {
          id: 1,
          studentName: "Phạm Thị Mai",
          subject: "Hóa học",
          message: "Em muốn học thêm về phần hữu cơ, thầy có thể dạy không ạ?",
          requestDate: "2024-01-14",
          hourlyRate: 150000,
        },
        {
          id: 2,
          studentName: "Võ Minh Tuấn",
          subject: "Toán học",
          message: "Con em đang học lớp 11, cần gia sư để ôn thi đại học",
          requestDate: "2024-01-14",
          hourlyRate: 200000,
        },
      ],

      weeklyEarnings: [
        { day: "Thứ 2", amount: 450000 },
        { day: "Thứ 3", amount: 600000 },
        { day: "Thứ 4", amount: 350000 },
        { day: "Thứ 5", amount: 750000 },
        { day: "Thứ 6", amount: 800000 },
        { day: "Thứ 7", amount: 650000 },
        { day: "CN", amount: 400000 },
      ],

      totalLessonsThisMonth: 48,
      totalEarningsThisMonth: 8500000,
      completedLessons: 45,
      cancelledLessons: 3,
      responseRate: 95,

      recentReviews: [
        {
          id: 1,
          studentName: "Nguyễn Văn A",
          rating: 5,
          comment: "Thầy dạy rất hay, em hiểu bài ngay",
          date: "2024-01-10",
        },
        {
          id: 2,
          studentName: "Trần Thị B",
          rating: 4,
          comment: "Phương pháp dạy tốt, nhưng hơi nhanh",
          date: "2024-01-08",
        },
      ],
    };
  }

  static getAdminMockData() {
<<<<<<< HEAD
    return {
      totalUsers: 2847,
      activeTutors: 156,
      monthlyRevenue: 247000000,
      activeCourses: 89,
    };
=======
    return this.getTutorMockData();
>>>>>>> Quan3
  }
}

export default DashboardService;
