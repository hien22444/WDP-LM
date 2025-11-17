import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import AOS from "aos";
import "aos/dist/aos.css";
import "./Dashboard.scss";
import DashboardService from "../../services/DashboardService";
import { loadCurrentUser } from "../../redux/actions/authActions";

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  const role = useSelector((state) => state.user.user?.account?.role);
  const userState = useSelector((state) => state.user);
  const tutorProfile = useSelector((state) => state.user.user?.profile);

  // Debug logs
  console.log("Dashboard - isAuthenticated:", isAuthenticated);
  console.log("Dashboard - role:", role);
  console.log("Dashboard - userState:", userState);
  console.log("Dashboard - user.account:", userState.user?.account);

  // Fetch dashboard data based on user role
  const fetchDashboardData = useCallback(async () => {
    if (!isAuthenticated || !role) return;

    setLoading(true);
    try {
      console.log(`Fetching dashboard data for role: ${role}`);
      const response = await DashboardService.getDashboardData(role);
      console.log("Dashboard response:", response);

      if (response.success && response.data) {
        setDashboardData(response.data);
      } else {
        console.warn("No dashboard data available");
        setDashboardData({});
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      // Set empty data instead of mock
      setDashboardData({});
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, role]);

  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  // Load current user info when component mounts
  useEffect(() => {
    if (isAuthenticated && !role) {
      dispatch(loadCurrentUser());
    }
  }, [isAuthenticated, role, dispatch]);

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
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">
          <p>Đang chuyển hướng đến trang đăng nhập...</p>
        </div>
      </div>
    );
  }

  // Show loading or no role state
  if (!role) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">
          <p>Đang tải thông tin người dùng...</p>
          <p>
            Debug: isAuthenticated={String(isAuthenticated)}, role=
            {String(role)}
          </p>
          <p>User account: {JSON.stringify(userState.user?.account)}</p>
          <button onClick={() => dispatch(loadCurrentUser())}>
            Thử tải lại thông tin user
          </button>
          <button
            onClick={() => {
              // Force refresh the page
              window.location.reload();
            }}
          >
            Refresh trang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Tutor completeness banner */}
      {role === "tutor" &&
        (() => {
          const missing = [];
          const subjects = tutorProfile?.subjects;
          const teachModes = tutorProfile?.teachModes;
          const rate = tutorProfile?.sessionRate;
          const city = tutorProfile?.city;
          if (!subjects || (Array.isArray(subjects) && subjects.length === 0))
            missing.push("môn dạy");
          if (
            !teachModes ||
            (Array.isArray(teachModes) && teachModes.length === 0)
          )
            missing.push("hình thức dạy");
          if (!rate || Number(rate) <= 0) missing.push("học phí/buổi");
          if (!city) missing.push("thành phố");
          if (missing.length === 0) return null;
          return (
            <div
              className="dashboard-alert"
              style={{
                margin: "16px auto",
                maxWidth: 1200,
                background: "#FFF4E5",
                border: "1px solid #FFD8A8",
                color: "#8B5E00",
                padding: "12px 16px",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <strong>
                  Hoàn thiện hồ sơ để học viên có thể tìm thấy bạn.
                </strong>
                <span> Thiếu: {missing.join(", ")}.</span>
              </div>
              <button
                onClick={() => navigate("/tutor/onboarding")}
                style={{
                  background: "#F59E0B",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
              >
                Bổ sung ngay
              </button>
            </div>
          );
        })()}
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
                    <button onClick={() => navigate("/bookings/me")}>
                      Xem chi tiết
                    </button>
                  </div>
                  <div className="dashboard-card">
                    <h3>📅 Lịch học tuần này</h3>
                    <p className="dashboard-number">
                      {dashboardData.weeklyLessons || 0}
                    </p>
                    <button onClick={() => navigate("/bookings/me")}>
                      Xem lịch học
                    </button>
                  </div>
                  <div className="dashboard-card">
                    <h3>⭐ Gia sư yêu thích</h3>
                    <p className="dashboard-number">
                      {dashboardData.favoriteTutors || 0}
                    </p>
                    <button onClick={() => navigate("/favorite-tutors")}>
                      Xem danh sách
                    </button>
                  </div>
                  <div className="dashboard-card">
                    <h3>🎯 Mục tiêu học tập</h3>
                    <p className="dashboard-number">
                      {dashboardData.learningProgress || 0}%
                    </p>
                    <button onClick={() => navigate("/dashboard")}>
                      Xem tiến độ
                    </button>
                  </div>
                </div>
              </div>
            )}

            {role === "tutor" && dashboardData && (
              <div className="dashboard-content" data-role="tutor">
                <h2>Dashboard Gia sư</h2>

                {/* Quick Stats Cards */}
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
                      ₫{dashboardData.monthlyEarnings?.toLocaleString() || 0}
                    </p>
                    <p style={{ fontSize: "0.9em", color: "#666", marginTop: "8px" }}>
                      Từ các buổi học hoàn thành
                    </p>
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

                {/* Detailed Widgets */}
                <div className="dashboard-widgets">
                  {/* Upcoming Lessons */}
                  <div className="widget upcoming-lessons">
                    <div className="widget-header">
                      <h3>📅 Buổi dạy sắp tới</h3>
                      <button
                        onClick={() => navigate("/tutor/schedule")}
                        className="view-all-btn"
                      >
                        Xem tất cả
                      </button>
                    </div>
                    <div className="widget-content">
                      {dashboardData.upcomingLessons &&
                      dashboardData.upcomingLessons.length > 0 ? (
                        <div className="lessons-list">
                          {dashboardData.upcomingLessons
                            .slice(0, 3)
                            .map((lesson) => (
                              <div key={lesson.id} className="lesson-item">
                                <div className="lesson-info">
                                  <div className="lesson-student">
                                    {lesson.studentName}
                                  </div>
                                  <div className="lesson-subject">
                                    {lesson.subject}
                                  </div>
                                  <div className="lesson-time">
                                    {lesson.date} - {lesson.time} (
                                    {lesson.duration} phút)
                                  </div>
                                </div>
                                <div
                                  className={`lesson-status ${lesson.status}`}
                                >
                                  {lesson.status === "confirmed"
                                    ? "Đã xác nhận"
                                    : "Chờ xác nhận"}
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="no-data">
                          Không có buổi dạy nào sắp tới
                        </div>
                      )}
                    </div>
                  </div>

                  {/* New Requests */}
                  <div className="widget new-requests">
                    <div className="widget-header">
                      <h3>🔔 Yêu cầu mới</h3>
                      <span className="badge">
                        {dashboardData.newRequests?.length || 0}
                      </span>
                    </div>
                    <div className="widget-content">
                      {dashboardData.newRequests &&
                      dashboardData.newRequests.length > 0 ? (
                        <div className="requests-list">
                          {dashboardData.newRequests
                            .slice(0, 2)
                            .map((request) => (
                              <div key={request.id} className="request-item">
                                <div className="request-info">
                                  <div className="request-student">
                                    {request.studentName}
                                  </div>
                                  <div className="request-subject">
                                    {request.subject}
                                  </div>
                                  <div className="request-message">
                                    {request.message}
                                  </div>
                                  <div className="request-rate">
                                    ₫{request.hourlyRate?.toLocaleString()}/giờ
                                  </div>
                                </div>
                                <div className="request-actions">
                                  <button className="btn-accept">
                                    Chấp nhận
                                  </button>
                                  <button className="btn-decline">
                                    Từ chối
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="no-data">Không có yêu cầu mới</div>
                      )}
                    </div>
                  </div>

                  {/* Weekly Earnings Chart */}
                  <div className="widget earnings-chart">
                    <div className="widget-header">
                      <h3>📊 Thu nhập tuần này</h3>
                    </div>
                    <div className="widget-content">
                      <div className="chart-container">
                        {dashboardData.weeklyEarnings &&
                        dashboardData.weeklyEarnings.length > 0 ? (
                          <div className="simple-chart">
                            {dashboardData.weeklyEarnings.map((day, index) => {
                              const maxAmount = Math.max(
                                ...dashboardData.weeklyEarnings.map(
                                  (d) => d.amount
                                )
                              );
                              const height = (day.amount / maxAmount) * 100;
                              return (
                                <div key={index} className="chart-bar">
                                  <div className="bar-value">
                                    ₫{(day.amount / 1000).toFixed(0)}k
                                  </div>
                                  <div
                                    className="bar"
                                    style={{ height: `${height}%` }}
                                    title={`${
                                      day.day
                                    }: ₫${day.amount.toLocaleString()}`}
                                  ></div>
                                  <div className="bar-label">{day.day}</div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="no-data">Không có dữ liệu</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="widget quick-actions">
                    <div className="widget-header">
                      <h3>⚡ Thao tác nhanh</h3>
                    </div>
                    <div className="widget-content">
                      <div className="action-buttons">
                        <button
                          className="action-btn primary"
                          onClick={() => navigate("/tutor/publish")}
                        >
                          📝 Đăng ký dạy học
                        </button>
                        <button
                          className="action-btn primary"
                          onClick={() => navigate("/tutor/schedule")}
                        >
                          📅 Lịch dạy
                        </button>
                        <button
                          className="action-btn secondary"
                          onClick={() => navigate("/tutor/students")}
                        >
                          👥 Học viên
                        </button>
                        <button
                          className="action-btn quaternary"
                          onClick={() => navigate("/tutor/profile")}
                        >
                          ⚙️ Hồ sơ
                        </button>
                      </div>
                    </div>
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
