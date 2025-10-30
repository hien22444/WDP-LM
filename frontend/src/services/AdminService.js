import ApiService from './ApiService';

class AdminService {
  // Dashboard
  getDashboardStats() {
    return ApiService.get('/admin/dashboard/stats');
  }

  // User Management
  getUsers(params = {}) {
    return ApiService.get('/admin/users', { params });
  }

  getUserById(id) {
    return ApiService.get(`/admin/users/${id}`);
  }

  updateUserStatus(id, status) {
    return ApiService.put(`/admin/users/${id}/status`, { status });
  }

  deleteUser(id) {
    return ApiService.delete(`/admin/users/${id}`);
  }

<<<<<<< HEAD
=======
  updateUserRole(id, role) {
    return ApiService.patch(`/admin/users/${id}/role`, { role });
  }

  blockUser(id, reason) {
    return ApiService.put(`/admin/users/${id}/block`, { reason });
  }

  banUser(id, reason) {
    return ApiService.put(`/admin/users/${id}/ban`, { reason });
  }

>>>>>>> Quan3
  // Tutor Management
  getTutors(params = {}) {
    return ApiService.get('/admin/tutors', { params });
  }

  getTutorById(id) {
    return ApiService.get(`/admin/tutors/${id}`);
  }

  updateTutorVerification(id, data) {
    return ApiService.put(`/admin/tutors/${id}/verification`, data);
  }

<<<<<<< HEAD
  updateTutorStatus(id, status) {
    return ApiService.put(`/admin/tutors/${id}/status`, { status });
=======
  updateTutorStatus(id, status, rejectionReason = null) {
    const data = { status };
    if (rejectionReason) {
      data.rejectionReason = rejectionReason;
    }
    return ApiService.put(`/admin/tutors/${id}/status`, data);
>>>>>>> Quan3
  }

  // Booking Management
  getBookings(params = {}) {
    return ApiService.get('/admin/bookings', { params });
  }

  getBookingById(id) {
    return ApiService.get(`/admin/bookings/${id}`);
  }

  updateBookingStatus(id, status) {
    return ApiService.put(`/admin/bookings/${id}/status`, { status });
  }

  // Reports
  getRevenueReport(params = {}) {
    return ApiService.get('/admin/reports/revenue', { params });
  }

  getUserReport() {
    return ApiService.get('/admin/reports/users');
  }

  getTutorReport() {
    return ApiService.get('/admin/reports/tutors');
  }
}

const adminService = new AdminService();
export default adminService;
