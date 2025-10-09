import React, { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import AOS from "aos";
import "aos/dist/aos.css";
import "./LandingPage.scss";
import { logout } from "../../redux/slices/userSlice";
import { getCurrentUserApi } from "../../services/ApiService";

const LandingPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  
  useEffect(() => {
    AOS.init({ duration: 1000 });
    
    // Add Font Awesome CSS if not already loaded
    if (!document.querySelector('link[href*="font-awesome"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
      document.head.appendChild(link);
    }
  }, []);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const role = useSelector((state) => state.user.account?.role || state.user.profile?.role || state.user.role);

  // Fetch current user data when component mounts
  const fetchCurrentUser = useCallback(async () => {
    try {
      const token = Cookies.get("accessToken");
      if (token && !isTokenExpired(token)) {
        const response = await getCurrentUserApi();
        setCurrentUser(response.user);
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
      setCurrentUser(null);
    }
  }, []);

  const isTokenExpired = (token) => {
    try {
      const decodedToken = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decodedToken.exp < currentTime;
    } catch (error) {
      console.error("Error decoding token:", error);
      return true;
    }
  };

  const handleLogout = useCallback(() => {
    // Clear tất cả cookies và localStorage
    Cookies.remove("accessToken");
    Cookies.remove("refreshToken");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userInfo");
    localStorage.removeItem("persist:root");
    
    // Reset current user state
    setCurrentUser(null);
    
    // Dispatch logout action từ Redux
    dispatch(logout());
    
    // Navigate về PublicLandingPage (route "/")
    navigate("/");
  }, [dispatch, navigate]);

  const decodeTokenData = useCallback(async () => {
    try {
      const token = Cookies.get("accessToken");
      if (!token || isTokenExpired(token)) {
        handleLogout();
      }
    } catch (error) {
      console.error("Error decoding token:", error);
      handleLogout();
    }
  }, [handleLogout]);

  useEffect(() => {
    document.title = "Learnova - Trang chủ";
  }, []);

  useEffect(() => {
    decodeTokenData();
    fetchCurrentUser(); // Fetch user data when component mounts
  }, [decodeTokenData, fetchCurrentUser]);

  // Refetch user when user state changes
  useEffect(() => {
    if (user?.isAuthenticated) {
      fetchCurrentUser();
    } else {
      setCurrentUser(null);
    }
  }, [user?.isAuthenticated, fetchCurrentUser]);

  return (
    <div className="home-container">
      <header className="header">
        <div className="logo">Learnova</div>
        <nav className="nav">
          <a href="/tutor">Tìm gia sư</a>

          {/* Navigation dành cho learner */}
          {role === "learner" && (
            <a href="/tutor-application">Trở thành gia sư</a>
          )}

          {/* Navigation dành cho tutor */}
          {role === "tutor" && (
            <>
              <a href="/dashboard">Dashboard</a>
              <a href="/tutor/schedule">Lịch dạy</a>
              <a href="/tutor/earnings">Thu nhập</a>
            </>
          )}

          {/* Navigation dành cho admin */}
          {role === "admin" && (
            <>
              <a href="/dashboard">Quản trị</a>
              <a href="/admin/users">Quản lý người dùng</a>
              <a href="/admin/reports">Báo cáo</a>
            </>
          )}

          <a href="/about-us" className="about-us-link">
            Về Chúng Tôi
          </a>
        </nav>
        <div className="right-section">
          {/* Search bar */}
          <div className="search-container">
            <input
              type="text"
              placeholder="Tìm kiếm gia sư, môn học..."
              className="search-input"
            />
            <button className="search-btn">
              <i className="fas fa-search"></i>
            </button>
          </div>

          {/* Profile dropdown cho user đã đăng nhập */}
          <div className="profile-dropdown">
            <img
              src={
                currentUser?.profile?.image ||
                currentUser?.account?.image ||
                user?.profile?.image ||
                user?.account?.image ||
                "https://res.cloudinary.com/djeilqn5r/image/upload/v1752488100/default-avatar-white_placeholder.png"
              }
              alt="avatar"
              className="avatar"
              onClick={() =>
                document
                  .querySelector(".dropdown-menu")
                  ?.classList.toggle("show")
              }
            />
            <div className="dropdown-menu">
              {/* Menu chung cho tất cả user */}
              <button onClick={() => navigate("/profile")}>
                Trang cá nhân
              </button>

              {/* Menu dành cho learner */}
              {role === "learner" && (
                <>
                  <button onClick={() => navigate("/learner/courses")}>
                    Khóa học của tôi
                  </button>
                  <button onClick={() => navigate("/learner/bookings")}>
                    Lịch học
                  </button>
                  <button onClick={() => navigate("/learner/payments")}>
                    Thanh toán
                  </button>
                </>
              )}

              {/* Menu dành cho tutor */}
              {role === "tutor" && (
                <>
                  <button onClick={() => navigate("/dashboard")}>
                    Dashboard
                  </button>
                  <button onClick={() => navigate("/tutor/students")}>
                    Học viên của tôi
                  </button>
                  <button onClick={() => navigate("/tutor/schedule")}>
                    Lịch dạy
                  </button>
                  <button onClick={() => navigate("/tutor/earnings")}>
                    Thu nhập
                  </button>
                  <button onClick={() => navigate("/tutor/reviews")}>
                    Đánh giá
                  </button>
                </>
              )}

              {/* Menu dành cho admin */}
              {role === "admin" && (
                <>
                  <button onClick={() => navigate("/dashboard")}>
                    Bảng điều khiển
                  </button>
                  <button onClick={() => navigate("/admin/users")}>
                    Quản lý người dùng
                  </button>
                  <button onClick={() => navigate("/admin/system")}>
                    Cài đặt hệ thống
                  </button>
                </>
              )}

              {/* Menu fallback khi không có role hoặc role chưa được load */}
              {(!role ||
                (role !== "learner" &&
                  role !== "tutor" &&
                  role !== "admin")) && (
                <>
                  <button onClick={() => navigate("/courses")}>Khóa học</button>
                  <button onClick={() => navigate("/tutors")}>
                    Tìm gia sư
                  </button>
                  <button onClick={() => navigate("/settings")}>Cài đặt</button>
                </>
              )}

              <div className="dropdown-divider"></div>
              <button onClick={handleLogout} className="logout-menu-btn">
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="new-hero" data-aos="fade-up">
          <div className="hero-content">
            <div className="hero-left">
              <h1>Gia sư hoàn hảo cho con bạn</h1>
              <p>
                Learnova luôn nỗ lực hết mình để tìm ra gia sư hoàn hảo cho nhu
                cầu cụ thể của con bạn. Chúng tôi kết nối trẻ em với các gia sư
                chuyên môn về đọc, toán, viết, khoa học và tiếng Anh. Chúng tôi
                mang đến trải nghiệm học tập được thiết kế riêng, giúp nâng cao
                điểm số và sự tự tin của các em.
              </p>
              <p className="schedule-text">
                Các lớp học của chúng tôi diễn ra trực tuyến theo lịch trình của
                bạn.
              </p>
              <button className="try-class-btn">Tìm gia sư →</button>
              <div className="rating">
                <div className="stars">⭐⭐⭐⭐⭐</div>
                <span className="review-text">
                  "Finally someone who gets my child."
                </span>
              </div>
            </div>
            <div className="hero-right">
              <div className="tutor-images">
                <div className="tutor-card">
                  <img
                    src="https://res.cloudinary.com/dnyvwjbbm/image/upload/v1760021803/giasu1_ehpjll.jpg"
                    alt="Female tutor"
                    className="tutor-img"
                  />
                </div>
                <div className="student-card">
                  <img
                    src="https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=500&fit=crop&crop=face"
                    alt="Student"
                    className="student-img"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="features-section" data-aos="fade-up">
          <div className="features-container">
            <div className="feature-item" data-aos="fade-right">
              <div className="feature-icon personalized">
                <i className="fas fa-star"></i>
              </div>
              <h3>Cá nhân hóa</h3>
              <p>
                Tất cả các buổi học kèm của chúng tôi đều theo hình thức 1-1,
                giúp trẻ em nhận được sự quan tâm riêng biệt, cá nhân hóa.
              </p>
            </div>

            <div className="feature-item" data-aos="fade-up">
              <div className="feature-icon fully-online">
                <i className="fas fa-laptop"></i>
              </div>
              <h3>Online và Offline</h3>
              <p>
                Các lớp học diễn ra trực tiếp hoặc online, với sự hỗ trợ tận
                tình để giúp bạn bắt đầu và vận hành.
              </p>
            </div>

            <div className="feature-item" data-aos="fade-left">
              <div className="feature-icon experienced">
                <i className="fas fa-graduation-cap"></i>
              </div>
              <h3>Gia sư giàu kinh nghiệm</h3>
              <p>
                Mỗi gia sư Learnova đều là những giáo viên giàu kinh nghiệm,
                được tuyển chọn kỹ lưỡng vì khả năng truyền cảm hứng yêu thích
                học tập.
              </p>
            </div>
          </div>
        </section>

        <section className="how-it-works" data-aos="fade-up">
          <h2>Cách hoạt động:</h2>
          <div className="steps">
            <div className="step">
              <div className="step-header">
                <span className="step-number">1</span>
                <h3>Tìm gia sư.</h3>
              </div>
              <p>
                Chúng tôi sẽ kết nối bạn với một gia sư có thể thúc đẩy, thử
                thách và truyền cảm hứng cho bạn.
              </p>
              <div className="step-img">
                <img
                  src="https://res.cloudinary.com/dnyvwjbbm/image/upload/v1760022509/giasu4_jq2kmi.jpg"
                  alt="Find your tutor"
                />
              </div>
            </div>
            <div className="step">
              <div className="step-header">
                <span className="step-number">2</span>
                <h3>Bắt đầu học.</h3>
              </div>
              <p>
                Gia sư sẽ hướng dẫn bạn trong suốt bài học đầu tiên và giúp bạn
                lập kế hoạch cho các bước tiếp theo.
              </p>
              <div className="step-img">
                <img
                  src="https://res.cloudinary.com/dnyvwjbbm/image/upload/v1760022897/giasu2_mzabfd.jpg"
                  alt="Start learning"
                />
              </div>
            </div>
            <div className="step">
              <div className="step-header">
                <span className="step-number">3</span>
                <h3>Nghe. Đọc. Viết. Lặp Lại.</h3>
              </div>
              <p>
                Chọn số lượng bài học bạn muốn học mỗi tuần và sẵn sàng để đạt
                được mục tiêu của mình!
              </p>
              <div className="step-img">
                <img
                  src="https://res.cloudinary.com/dnyvwjbbm/image/upload/v1760022509/giasu3_oyghtw.png"
                  alt="Repeat learning"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="div-become-tutor" data-aos="fade-up">
          <section className="become-tutor">
            <div className="become-left">
              <img
                src="https://res.cloudinary.com/dnyvwjbbm/image/upload/v1760022719/giasu7_txil1b.jpg"
                alt="Trở thành gia sư"
              />
            </div>
            <div className="become-right">
              <h2>Trở thành gia sư</h2>
              <p>
                Kiếm tiền bằng cách chia sẻ kiến thức chuyên môn với học viên.
                Đăng ký ngay để bắt đầu dạy học trực tuyến cùng FindTutor.
              </p>
              <ul>
                <li> Tìm học viên mới</li>
                <li> Phát triển sự nghiệp</li>
                <li> Nhận thanh toán an toàn</li>
              </ul>
              <button className="btn-primary">Trở thành gia sư →</button>
              <a href="#">Tìm hiểu cách hoạt động</a>
            </div>
          </section>
        </div>
      </main>

      <footer className="site-footer" data-aos="fade-up">
        <div className="footer-content">
          <div className="footer-logo">
            <h3>Learnova</h3>
            <p>Kết nối học viên với gia sư hàng đầu trên việt nam.</p>
          </div>
          <div className="footer-links">
            <h4>Về chúng tôi</h4>
            <ul>
              <li>
                <a href="#">Giới thiệu</a>
              </li>
              <li>
                <a href="#">Cơ hội nghề nghiệp</a>
              </li>
              <li>
                <a href="#">Blog</a>
              </li>
            </ul>
          </div>
          <div className="footer-links">
            <h4>Hỗ trợ</h4>
            <ul>
              <li>
                <a href="#">Trung tâm trợ giúp</a>
              </li>
              <li>
                <a href="#">Liên hệ</a>
              </li>
              <li>
                <a href="#">Câu hỏi thường gặp</a>
              </li>
            </ul>
          </div>
          <div className="footer-social">
            <h4>Kết nối</h4>
            <div className="social-icons">
              <a href="#">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#">
                <i className="fab fa-youtube"></i>
              </a>
            </div>
            <div className="app-links">
              <a
                href="https://play.google.com"
                target="_blank"
                rel="noreferrer"
              >
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                  alt="Google Play"
                />
              </a>
              <a
                href="https://www.apple.com/app-store/"
                target="_blank"
                rel="noreferrer"
              >
                <img
                  src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
                  alt="App Store"
                />
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 Learnova. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
