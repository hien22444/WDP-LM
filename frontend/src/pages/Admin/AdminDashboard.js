import React, { useState, useEffect } from "react";
import AdminService from "../../services/AdminService";
import AdminSidebar from "./AdminSidebar";
import "./AdminDashboard.modern.css";

const AdminDashboard = ({ currentUser }) => {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
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

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Tổng người dùng",
      value: stats?.totalUsers || 0,
      icon: "👤",
      color: "blue",
      change: "+12%",
      description: "Tổng số người dùng đã đăng ký",
    },
    {
      title: "Tổng gia sư",
      value: stats?.totalTutors || 0,
      icon: "🎓",
      color: "purple",
      change: "+8%",
      description: "Số gia sư đã được duyệt",
    },
    {
      title: "Tổng đặt lịch",
      value: stats?.totalBookings || 0,
      icon: "📅",
      color: "green",
      change: "+15%",
      description: "Tổng số buổi học đã đặt",
    },
    {
      title: "Doanh thu",
      value: `${stats?.totalRevenue || 0} VNĐ`,
      icon: "💲",
      color: "orange",
      change: "+23%",
      description: "Tổng doanh thu hệ thống",
    },
    {
      title: "Chờ duyệt",
      value: stats?.pendingTutors || 0,
      icon: "⏰",
      color: "red",
      change: "-5%",
      description: "Gia sư chờ duyệt",
    },
    {
      title: "Người dùng hoạt động",
      value: stats?.activeUsers || 0,
      icon: "✅",
      color: "green",
      change: "+9%",
      description: "Người dùng đang hoạt động",
    },
  ];

  if (!currentUser || currentUser.role !== "admin") {
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
