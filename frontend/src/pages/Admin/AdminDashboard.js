import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import AdminService from "../../services/AdminService";
import AdminDashboardCharts from "./AdminDashboardCharts";
import "./AdminDashboard.modern.css";

const AdminDashboard = ({ currentUser }) => {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  // Reports for charts
  const [revenueReport, setRevenueReport] = useState([]);
  const [userReport, setUserReport] = useState({ byRole: [], byStatus: [] });
  const [tutorReport, setTutorReport] = useState({
    byStatus: [],
    byVerification: [],
  });

  // Fallback to Redux store if prop not passed
  const storeUser = useSelector(
    (state) => state.user?.user || state.user?.account || null
  );

  useEffect(() => {
    fetchDashboardData();
    fetchReports();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await AdminService.getDashboardStats();
      setStats(response.data.stats);
      setRecentActivity(response.data.recentActivity);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const [rev, users, tutors] = await Promise.all([
        AdminService.getRevenueReport({}),
        AdminService.getUserReport(),
        AdminService.getTutorReport(),
      ]);
      setRevenueReport(Array.isArray(rev.data) ? rev.data : []);
      setUserReport(users.data || { byRole: [], byStatus: [] });
      setTutorReport(tutors.data || { byStatus: [], byVerification: [] });
    } catch (e) {
      console.error("Error fetching reports:", e);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
      </div>
    );
  }

  // Fallbacks in case stats API fails but reports are available
  const computedTotalUsers = (() => {
    const arr = userReport?.byRole || [];
    if (!Array.isArray(arr) || arr.length === 0) return null;
    return arr.reduce((sum, item) => sum + (item.count || 0), 0);
  })();
  const totalUsersValue = stats?.totalUsers || computedTotalUsers || 0;

  const computedTotalTutors = (() => {
    const arr = userReport?.byRole || [];
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const tutorItem = arr.find((x) => (x._id || x.role) === "tutor");
    return tutorItem ? tutorItem.count || 0 : 0;
  })();
  const totalTutorsValue =
    typeof stats?.totalTutors === "number" && stats.totalTutors > 0
      ? stats.totalTutors
      : computedTotalTutors || 0;

  const computedApprovedTutors = (() => {
    const arr = tutorReport?.byStatus || [];
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const item = arr.find((x) => (x._id || x.status) === "approved");
    return item ? item.count || 0 : 0;
  })();
  const approvedTutorsValue =
    typeof stats?.approvedTutors === "number" && stats.approvedTutors > 0
      ? stats.approvedTutors
      : computedApprovedTutors || 0;

  const computedPendingTutors = (() => {
    const arr = tutorReport?.byStatus || [];
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const item = arr.find((x) => (x._id || x.status) === "pending");
    return item ? item.count || 0 : 0;
  })();
  const pendingTutorsValue =
    typeof stats?.pendingTutors === "number" && stats.pendingTutors >= 0
      ? stats.pendingTutors
      : computedPendingTutors || 0;

  const statCards = [
    {
      title: "Tổng người dùng",
      value: totalUsersValue,
      icon: "👤",
      color: "blue",
      change: "+12%",
      description: "Tổng số người dùng đã đăng ký",
    },
    {
      title: "Tổng gia sư",
      value: totalTutorsValue,
      icon: "🎓",
      color: "purple",
      change: "+8%",
      description: "Số người dùng có role gia sư",
    },
    {
      title: "Doanh thu",
      value: `${stats?.totalRevenue || 0} VNĐ`,
      icon: "💲",
      color: "orange",
      change: "+23%",
      description: "Tổng doanh thu từ hợp đồng đã thanh toán",
    },
    {
      title: "Chờ duyệt",
      value: pendingTutorsValue,
      icon: "⏰",
      color: "red",
      change: "-5%",
      description: "Gia sư chờ duyệt",
    },
    {
      title: "Đơn đã duyệt",
      value: approvedTutorsValue,
      icon: "✅",
      color: "green",
      change: "+9%",
      description: "Số đơn đăng ký gia sư đã được duyệt",
    },
  ];

  const effectiveUser = currentUser || storeUser;
  if (!effectiveUser || effectiveUser.role !== "admin") {
    return (
      <div className="admin-no-access">
        Bạn không có quyền truy cập trang này.
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Welcome Section */}
      <div className="admin-welcome">
        <div className="admin-welcome-content">
          <h1 className="admin-welcome-title">Chào mừng đến với Admin Panel</h1>
          <p className="admin-welcome-subtitle">
            Quản lý và theo dõi hệ thống EduMatch
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="admin-stats-grid">
        {statCards.map((stat, idx) => (
          <div className={`admin-stat-card ${stat.color}`} key={idx}>
            <div className="admin-stat-header">
              <div className="admin-stat-icon">{stat.icon}</div>
              <div className="admin-stat-change">
                <span>📈</span>
                {stat.change}
              </div>
            </div>
            <div className="admin-stat-content">
              <div className="admin-stat-value">{stat.value}</div>
              <div className="admin-stat-title">{stat.title}</div>
              <div className="admin-stat-description">{stat.description}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <AdminDashboardCharts
        revenueData={revenueReport}
        usersByRole={userReport?.byRole || []}
        tutorsByStatus={tutorReport?.byStatus || []}
      />

      {/* Activity Section */}
      <div className="admin-activity">
        <div className="admin-activity-grid">
          {/* Recent Users */}
          <div className="admin-activity-card">
            <div className="admin-activity-header">
              <h3 className="admin-activity-title">Người dùng mới</h3>
              <a href="/admin/users" className="admin-activity-link">
                Xem tất cả
              </a>
            </div>
            <div className="admin-activity-list">
              {recentActivity?.users?.length > 0 ? (
                recentActivity.users.map((user, index) => (
                  <div key={index} className="admin-activity-item">
                    <div className="admin-activity-avatar">
                      {user.full_name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="admin-activity-content">
                      <div className="admin-activity-text">
                        {user.full_name}
                      </div>
                      <div className="admin-activity-time">
                        {new Date(user.created_at).toLocaleDateString("vi-VN")}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="admin-empty">
                  <div className="admin-empty-icon">👥</div>
                  <div className="admin-empty-title">
                    Chưa có người dùng mới
                  </div>
                  <div className="admin-empty-message">
                    Sẽ hiển thị khi có người dùng đăng ký
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="admin-activity-card">
            <div className="admin-activity-header">
              <h3 className="admin-activity-title">Đặt lịch gần đây</h3>
              <a href="/admin/bookings" className="admin-activity-link">
                Xem tất cả
              </a>
            </div>
            <div className="admin-activity-list">
              {recentActivity?.bookings?.length > 0 ? (
                recentActivity.bookings.map((booking, index) => (
                  <div key={index} className="admin-activity-item">
                    <div className="admin-activity-avatar">📅</div>
                    <div className="admin-activity-content">
                      <div className="admin-activity-text">
                        {booking.student?.full_name} -{" "}
                        {booking.tutorProfile?.user?.full_name}
                      </div>
                      <div className="admin-activity-time">
                        {new Date(booking.start).toLocaleDateString("vi-VN")}
                      </div>
                    </div>
                    <div className={`admin-activity-status ${booking.status}`}>
                      {booking.status === "completed"
                        ? "Hoàn thành"
                        : booking.status === "pending"
                        ? "Chờ xử lý"
                        : "Đã hủy"}
                    </div>
                  </div>
                ))
              ) : (
                <div className="admin-empty">
                  <div className="admin-empty-icon">📅</div>
                  <div className="admin-empty-title">Chưa có đặt lịch</div>
                  <div className="admin-empty-message">
                    Sẽ hiển thị khi có buổi học được đặt
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
