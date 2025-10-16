import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import "./LandingPage.scss";

const PublicLandingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    AOS.init({ duration: 1000 });
    document.title = "EduMatch - Tìm gia sư hoàn hảo";
    
    // Add Font Awesome CSS if not already loaded
    if (!document.querySelector('link[href*="font-awesome"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
      document.head.appendChild(link);
    }
  }, []);

  return (
    <div className="home-container">
      <header className="header">
        <div className="logo">
          <img src="/edumatch-logo.png" alt="EduMatch" className="brand-logo" />
          <span className="brand-text">EduMatch</span>
        </div>
        <nav className="nav">
          <a href="/tutor">Tìm gia sư</a>
          <a href="/courses">Khóa học mở</a>
          <a href="/tutor-application">Trở thành gia sư</a>
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

          <div className="auth-buttons">
            <button className="signin-btn" onClick={() => navigate("/signin")}>
              Sign In
            </button>
            <button className="signout-btn" onClick={() => navigate("/signup")}>
              Sign Up
            </button>
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
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button className="try-class-btn" onClick={() => navigate('/courses')}>Xem khóa học mở →</button>
                <button className="try-class-btn" onClick={() => navigate('/tutor')}>Tìm gia sư →</button>
              </div>
              <div className="rating">
                <div className="stars">⭐⭐⭐⭐⭐</div>
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

        <section className="stats" data-aos="fade-up">
          <div className="stat-item">
            <strong>+1200</strong>
            <div>Gia sư đã xác thực</div>
          </div>
          <div className="stat-item">
            <strong>+8000</strong>
            <div>Buổi học hoàn thành</div>
          </div>
          <div className="stat-item">
            <strong>4.9/5</strong>
            <div>Mức hài lòng trung bình</div>
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
              <button className="btn-primary" onClick={() => navigate('/signup')}>Trở thành gia sư →</button>
              <button type="button" className="learn-more-link" onClick={() => navigate('/signin')}>Tìm hiểu cách hoạt động</button>
            </div>
          </section>
        </div>
      </main>

      <footer className="site-footer" data-aos="fade-up">
        <div className="footer-content">
          <div className="footer-logo">
            <h3>EduMatch</h3>
            <p>Kết nối học viên với gia sư hàng đầu trên việt nam.</p>
          </div>
          <div className="footer-links">
            <h4>Về chúng tôi</h4>
            <ul>
              <li>
                <button onClick={() => navigate("/signin")}>Giới thiệu</button>
              </li>
              <li>
                <button onClick={() => navigate("/signin")}>Cơ hội nghề nghiệp</button>
              </li>
              <li>
                <button onClick={() => navigate("/signin")}>Blog</button>
              </li>
            </ul>
          </div>
          <div className="footer-links">
            <h4>Hỗ trợ</h4>
            <ul>
              <li>
                <button onClick={() => navigate("/signin")}>Trung tâm trợ giúp</button>
              </li>
              <li>
                <button onClick={() => navigate("/signin")}>Liên hệ</button>
              </li>
              <li>
                <button onClick={() => navigate("/signin")}>Câu hỏi thường gặp</button>
              </li>
            </ul>
          </div>
          <div className="footer-social">
            <h4>Kết nối</h4>
            <div className="social-icons">
              <button onClick={() => navigate("/signin")}>
                <i className="fab fa-facebook-f"></i>
              </button>
              <button onClick={() => navigate("/signin")}>
                <i className="fab fa-instagram"></i>
              </button>
              <button onClick={() => navigate("/signin")}>
                <i className="fab fa-youtube"></i>
              </button>
            </div>
            <div className="app-links">
              <button onClick={() => navigate("/signin")}>
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                  alt="Google Play - Đăng nhập để tải"
                />
              </button>
              <button onClick={() => navigate("/signin")}>
                <img
                  src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
                  alt="App Store - Đăng nhập để tải"
                />
              </button>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 EduMatch. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default PublicLandingPage;