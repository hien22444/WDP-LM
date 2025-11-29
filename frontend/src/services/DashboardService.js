import ApiService from "./ApiService";

class DashboardService {
  // Fetch dashboard data for a given role
  static async getDashboardData(role) {
    try {
      const response = await ApiService.get(`/dashboard/${role}`);
      console.log(`✅ Dashboard data for ${role}:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching ${role} dashboard:`, error);
      console.error("Error details:", error.response?.data || error.message);
      throw error;
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
}

export default DashboardService;
