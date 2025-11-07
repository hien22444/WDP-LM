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
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css";
      document.head.appendChild(link);
    }
  }, []);

  return (
    <div className="home-container">
      <header className="header">
        <div className="header-wrapper">
          <div className="logo">
            <img src="/edumatch-logo.png" alt="EduMatch" className="brand-logo" />
          </div>
          <nav className="nav">
            <a href="/tutors">Tìm gia sư</a>
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
        </div>
      </header>

      <style>{`
        .quick-links{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin:24px 0}
        .q-card{border-radius:16px;padding:16px;border:1px solid #eef2f7;background:#fff;display:flex;align-items:center;gap:12px;transition:.2s box-shadow}
        .q-card:hover{box-shadow:0 10px 24px rgba(2,8,23,.08)}
        .q-icon{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff}
        .q1{background:#6366f1}.q2{background:#06b6d4}.q3{background:#10b981}
        .testimonials{padding:60px 0}
        .t-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
        .t-card{background:#fff;border:1px solid #eef2f7;border-radius:16px;padding:18px;box-shadow:0 8px 20px rgba(2,8,23,.06)}
        .t-head{display:flex;align-items:center;gap:12px;margin-bottom:10px}
        .t-ava{width:44px;height:44px;border-radius:50%;object-fit:cover}
        .logos-strip{display:flex;gap:28px;justify-content:center;align-items:center;opacity:.7;flex-wrap:wrap}
        .faq{margin-top:30px}
        .faq-item{border:1px solid #eef2f7;border-radius:12px;margin-bottom:10px;background:#fff}
        .faq-q{padding:14px 16px;font-weight:600;cursor:pointer}
        .faq-a{padding:0 16px 14px;color:#475569}
      `}</style>

      <main>
        <section className="new-hero" data-aos="fade-up">
          <div className="hero-content">
            <div className="hero-left">
              <h1>Gia sư hoàn hảo cho con bạn</h1>
              <p>
                EduMatch luôn nỗ lực hết mình để tìm ra gia sư hoàn hảo cho nhu
                cầu cụ thể của con bạn. Chúng tôi kết nối trẻ em với các gia sư
                chuyên môn về đọc, toán, viết, khoa học và tiếng Anh. Chúng tôi
                mang đến trải nghiệm học tập được thiết kế riêng, giúp nâng cao
                điểm số và sự tự tin của các em.
              </p>
              <p className="schedule-text">
                Các lớp học của chúng tôi diễn ra trực tuyến theo lịch trình của
                bạn.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button
                  className="try-class-btn"
                  onClick={() => navigate("/tutors")}
                >
                  Tìm gia sư →
                </button>
                <button
                  className="try-class-btn"
                  onClick={() => navigate("/courses")}
                >
                  Khóa học →
                </button>
              </div>
              {/* Quick links */}
              <div className="quick-links">
                <button
                  className="q-card"
                  onClick={() => navigate("/tutor/onboarding")}
                >
                  <span className="q-icon q1">
                    <i className="fas fa-chalkboard-teacher"></i>
                  </span>
                  <div>
                    <div className="fw-bold">Trở thành gia sư</div>
                    <div className="text-secondary" style={{ fontSize: 12 }}>
                      Đăng ký nhanh trong 2 phút
                    </div>
                  </div>
                </button>
                <button className="q-card" onClick={() => navigate("/tutors")}>
                  <span className="q-icon q2">
                    <i className="fas fa-search"></i>
                  </span>
                  <div>
                    <div className="fw-bold">Tìm gia sư phù hợp</div>
                    <div className="text-secondary" style={{ fontSize: 12 }}>
                      Lọc theo môn, hình thức, giá
                    </div>
                  </div>
                </button>
                <button className="q-card" onClick={() => navigate("/courses")}>
                  <span className="q-icon q3">
                    <i className="fas fa-book-open"></i>
                  </span>
                  <div>
                    <div className="fw-bold">Xem khóa học mở</div>
                    <div className="text-secondary" style={{ fontSize: 12 }}>
                      Đặt chỗ ngay trong 1 chạm
                    </div>
                  </div>
                </button>
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

        {/* Testimonials */}
        <section className="features-section testimonials" data-aos="fade-up">
          <h2 style={{ textAlign: "center", marginBottom: 24 }}>
            Học viên nói gì về EduMatch
          </h2>
          <div className="t-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="t-card">
                <div className="t-head">
                  <img
                    className="t-ava"
                    src={`https://i.pravatar.cc/100?img=${10 + i}`}
                    alt="avatar"
                  />
                  <div>
                    <div className="fw-bold">Học viên {i}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      Khóa Toán nâng cao
                    </div>
                  </div>
                </div>
                <div>
                  "Giáo trình rõ ràng, gia sư rất tận tâm. Mình tiến bộ nhanh
                  chỉ sau vài tuần."
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Partners / Logos */}
        <section
          className="features-section"
          data-aos="fade-up"
          style={{ textAlign: "center" }}
        >
          <h2 style={{ marginBottom: 18 }}>Đối tác đồng hành</h2>
          <div className="logos-strip">
            {[1, 2, 3, 4, 5].map((i) => (
              <img
                key={i}
                src={`https://dummyimage.com/120x40/ddd/555&text=Logo+${i}`}
                alt={`logo ${i}`}
                style={{ filter: "grayscale(1)" }}
              />
            ))}
          </div>

          {/* FAQ */}
          <div className="faq">
            {[
              [
                "EduMatch hoạt động thế nào?",
                "Bạn tìm gia sư/khóa học, đặt lịch, học trực tuyến hoặc tại nhà.",
              ],
              [
                "Chi phí ra sao?",
                "Có nhiều mức giá linh hoạt theo gia sư/khóa học, hiển thị rõ ràng trước khi đặt.",
              ],
              [
                "Bảo đảm chất lượng?",
                "Gia sư được xét duyệt hồ sơ và đánh giá từ học viên thực, luôn minh bạch.",
              ],
            ].map(([q, a], idx) => (
              <div key={idx} className="faq-item">
                <div className="faq-q">{q}</div>
                <div className="faq-a">{a}</div>
              </div>
            ))}
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
                Mỗi gia sư EduMatch đều là những giáo viên giàu kinh nghiệm,
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
              <button
                className="btn-primary"
                onClick={() => navigate("/tutor/onboarding")}
              >
                Trở thành gia sư →
              </button>
              <button
                type="button"
                className="learn-more-link"
                onClick={() => navigate("/signin")}
              >
                Tìm hiểu cách hoạt động
              </button>
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
                <button type="button" onClick={() => navigate("/about")}>
                  Giới thiệu
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate("/tutor/onboarding")}
                >
                  Cơ hội nghề nghiệp
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate("/signin")}>
                  Blog
                </button>
              </li>
            </ul>
          </div>
          <div className="footer-links">
            <h4>Hỗ trợ</h4>
            <ul>
              <li>
                <button type="button" onClick={() => navigate("/signin")}>
                  Trung tâm trợ giúp
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate("/signin")}>
                  Liên hệ
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate("/signin")}>
                  Câu hỏi thường gặp
                </button>
              </li>
            </ul>
          </div>
          <div className="footer-social">
            <h4>Kết nối</h4>
            <div className="social-icons">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fab fa-facebook-f"></i>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fab fa-instagram"></i>
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
              >
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
          <p>© 2025 EduMatch. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default PublicLandingPage;
