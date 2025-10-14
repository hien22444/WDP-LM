import ApiService from './ApiService';

class DashboardService {
  // Lấy dashboard data theo role
  static async getDashboardData(role) {
    try {
      const response = await ApiService.get(`/dashboard/${role}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${role} dashboard:`, error);
      throw error;
    }
  }

  // Lấy stats chung
  static async getGeneralStats() {
    try {
      const response = await ApiService.get('/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching general stats:', error);
      throw error;
    }
  }

  // Cập nhật role user (admin only)
  static async updateUserRole(userId, newRole) {
    try {
      const response = await ApiService.patch('/dashboard/admin/user-role', {
        userId,
        newRole
      });
      return response.data;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  // Mock data methods để sử dụng tạm thời nếu API chưa sẵn sàng
  static getLearnerMockData() {
    return {
      activeCourses: 3,
      weeklyLessons: 8,
      favoriteTutors: 5,
      learningProgress: 75
    };
  }

  static getTutorMockData() {
    return {
      currentStudents: 12,
      monthlyEarnings: 8500000,
      averageRating: 4.8,
      weeklyHours: 24
    };
  }

  static getAdminMockData() {
    return {
      totalUsers: 2847,
      activeTutors: 156,
      monthlyRevenue: 247000000,
      activeCourses: 89
    };
  }
}

export default DashboardService;