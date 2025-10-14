import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import AOS from "aos";
import "aos/dist/aos.css";
import "./Dashboard.scss";
import DashboardService from "../../services/DashboardService";

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  const role = useSelector((state) => state.user.account?.role);

  // Fetch dashboard data based on user role
  const fetchDashboardData = useCallback(async () => {
    if (!isAuthenticated || !role) return;
    
    setLoading(true);
    try {
      const data = await DashboardService.getDashboardData(role);
      setDashboardData(data.data);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      // Fallback to mock data
      switch (role) {
        case "learner":
          setDashboardData(DashboardService.getLearnerMockData());
          break;
        case "tutor":
          setDashboardData(DashboardService.getTutorMockData());
          break;
        case "admin":
          setDashboardData(DashboardService.getAdminMockData());
          break;
        default:
          break;
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, role]);

  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [isAuthenticated, role, fetchDashboardData]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/signin");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="dashboard-container">
      <section className="user-dashboard" data-aos="fade-up">
        {loading ? (
          <div className="dashboard-loading">
            <p>Đang tải dữ liệu dashboard...</p>
          </div>
        ) : (
          <>
            {role === "learner" && dashboardData && (
              <div className="dashboard-content" data-role="learner">
                <h2>Dashboard Học viên</h2>
                <div className="dashboard-cards">
                  <div className="dashboard-card">
                    <h3>📚 Khóa học đang học</h3>
                    <p className="dashboard-number">
                      {dashboardData.activeCourses || 0}
                    </p>
                    <button onClick={() => navigate("/learner/courses")}>
                      Xem chi tiết
                    </button>
                  </div>
                  <div className="dashboard-card">
                    <h3>📅 Lịch học tuần này</h3>
                    <p className="dashboard-number">
                      {dashboardData.weeklyLessons || 0}
                    </p>
                    <button onClick={() => navigate("/learner/schedule")}>
                      Xem lịch học
                    </button>
                  </div>
                  <div className="dashboard-card">
                    <h3>⭐ Gia sư yêu thích</h3>
                    <p className="dashboard-number">
                      {dashboardData.favoriteTutors || 0}
                    </p>
                    <button
                      onClick={() => navigate("/learner/favorite-tutors")}
                    >
                      Xem danh sách
                    </button>
                  </div>
                  <div className="dashboard-card">
                    <h3>🎯 Mục tiêu học tập</h3>
                    <p className="dashboard-number">
                      {dashboardData.learningProgress || 0}%
                    </p>
                    <button onClick={() => navigate("/learner/progress")}>
                      Xem tiến độ
                    </button>
                  </div>
                </div>
              </div>
            )}

            {role === "tutor" && dashboardData && (
              <div className="dashboard-content" data-role="tutor">
                <h2>Dashboard Gia sư</h2>
                <div className="dashboard-cards">
                  <div className="dashboard-card">
                    <h3>👥 Học viên hiện tại</h3>
                    <p className="dashboard-number">
                      {dashboardData.currentStudents || 0}
                    </p>
                    <button onClick={() => navigate("/tutor/students")}>
                      Quản lý học viên
                    </button>
                  </div>
                  <div className="dashboard-card">
                    <h3>💰 Thu nhập tháng này</h3>
                    <p className="dashboard-number">
                      ₫
                      {dashboardData.monthlyEarnings?.toLocaleString() || 0}
                    </p>
                    <button onClick={() => navigate("/tutor/earnings")}>
                      Xem báo cáo
                    </button>
                  </div>
                  <div className="dashboard-card">
                    <h3>⭐ Đánh giá trung bình</h3>
                    <p className="dashboard-number">
                      {dashboardData.averageRating || 0}/5
                    </p>
                    <button onClick={() => navigate("/tutor/reviews")}>
                      Xem đánh giá
                    </button>
                  </div>
                  <div className="dashboard-card">
                    <h3>📅 Lịch dạy tuần này</h3>
                    <p className="dashboard-number">
                      {dashboardData.weeklyHours || 0} giờ
                    </p>
                    <button onClick={() => navigate("/tutor/schedule")}>
                      Xem lịch dạy
                    </button>
                  </div>
                </div>
              </div>
            )}

            {role === "admin" && dashboardData && (
              <div className="dashboard-content" data-role="admin">
                <h2>Dashboard Quản trị</h2>
                <div className="dashboard-cards">
                  <div className="dashboard-card">
                    <h3>👤 Tổng người dùng</h3>
                    <p className="dashboard-number">
                      {dashboardData.totalUsers?.toLocaleString() || 0}
                    </p>
                    <button onClick={() => navigate("/admin/users")}>
                      Quản lý người dùng
                    </button>
                  </div>
                  <div className="dashboard-card">
                    <h3>👨‍🏫 Gia sư hoạt động</h3>
                    <p className="dashboard-number">
                      {dashboardData.activeTutors || 0}
                    </p>
                    <button onClick={() => navigate("/admin/tutors")}>
                      Quản lý gia sư
                    </button>
                  </div>
                  <div className="dashboard-card">
                    <h3>💰 Doanh thu tháng</h3>
                    <p className="dashboard-number">
                      ₫{dashboardData.monthlyRevenue?.toLocaleString() || 0}
                    </p>
                    <button onClick={() => navigate("/admin/revenue")}>
                      Xem báo cáo
                    </button>
                  </div>
                  <div className="dashboard-card">
                    <h3>🎯 Khóa học đang hoạt động</h3>
                    <p className="dashboard-number">
                      {dashboardData.activeCourses || 0}
                    </p>
                    <button onClick={() => navigate("/admin/courses")}>
                      Quản lý khóa học
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default Dashboard;