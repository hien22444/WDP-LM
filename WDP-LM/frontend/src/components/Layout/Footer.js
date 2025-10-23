import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.scss';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Main Footer Content */}
        <div className="footer-main">
          <div className="footer-section">
            <div className="footer-logo">
              <div className="logo-icon">
                <i className="fas fa-graduation-cap"></i>
              </div>
              <span className="logo-text">EduMatch</span>
            </div>
            <p className="footer-description">
              Nền tảng kết nối gia sư và học viên hàng đầu Việt Nam. 
              Tìm kiếm gia sư phù hợp và đặt lịch học dễ dàng.
            </p>
            <div className="social-links">
              <a href="https://facebook.com" className="social-link" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="https://twitter.com" className="social-link" aria-label="Twitter" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="https://instagram.com" className="social-link" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="https://linkedin.com" className="social-link" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-linkedin-in"></i>
              </a>
              <a href="https://youtube.com" className="social-link" aria-label="YouTube" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-youtube"></i>
              </a>
            </div>
          </div>

          <div className="footer-section">
            <h3 className="footer-title">Dịch vụ</h3>
            <ul className="footer-links">
              <li>
                <Link to="/tutor" className="footer-link">
                  Tìm gia sư
                </Link>
              </li>
              <li>
                <Link to="/tutor/register" className="footer-link">
                  Đăng ký làm gia sư
                </Link>
              </li>
              <li>
                <Link to="/courses" className="footer-link">
                  Khóa học
                </Link>
              </li>
              <li>
                <Link to="/online-class" className="footer-link">
                  Lớp học trực tuyến
                </Link>
              </li>
              <li>
                <Link to="/tutoring" className="footer-link">
                  Gia sư tại nhà
                </Link>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h3 className="footer-title">Hỗ trợ</h3>
            <ul className="footer-links">
              <li>
                <Link to="/help" className="footer-link">
                  Trung tâm trợ giúp
                </Link>
              </li>
              <li>
                <Link to="/faq" className="footer-link">
                  Câu hỏi thường gặp
                </Link>
              </li>
              <li>
                <Link to="/contact" className="footer-link">
                  Liên hệ hỗ trợ
                </Link>
              </li>
              <li>
                <Link to="/guide" className="footer-link">
                  Hướng dẫn sử dụng
                </Link>
              </li>
              <li>
                <Link to="/troubleshoot" className="footer-link">
                  Khắc phục sự cố
                </Link>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h3 className="footer-title">Công ty</h3>
            <ul className="footer-links">
              <li>
                <Link to="/about" className="footer-link">
                  Giới thiệu
                </Link>
              </li>
              <li>
                <Link to="/careers" className="footer-link">
                  Tuyển dụng
                </Link>
              </li>
              <li>
                <Link to="/press" className="footer-link">
                  Báo chí
                </Link>
              </li>
              <li>
                <Link to="/partners" className="footer-link">
                  Đối tác
                </Link>
              </li>
              <li>
                <Link to="/blog" className="footer-link">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h3 className="footer-title">Liên hệ</h3>
            <div className="contact-info">
              <div className="contact-item">
                <i className="fas fa-map-marker-alt"></i>
                <div>
                  <p>Địa chỉ:</p>
                  <span>123 Đường ABC, Quận 1, TP.HCM</span>
                </div>
              </div>
              <div className="contact-item">
                <i className="fas fa-phone"></i>
                <div>
                  <p>Điện thoại:</p>
                  <span>+84 123 456 789</span>
                </div>
              </div>
              <div className="contact-item">
                <i className="fas fa-envelope"></i>
                <div>
                  <p>Email:</p>
                  <span>support@edumatch.vn</span>
                </div>
              </div>
              <div className="contact-item">
                <i className="fas fa-clock"></i>
                <div>
                  <p>Giờ làm việc:</p>
                  <span>8:00 - 22:00 (T2 - CN)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter Subscription */}
        <div className="footer-newsletter">
          <div className="newsletter-content">
            <h3>Đăng ký nhận tin tức</h3>
            <p>Nhận thông tin về khóa học mới và ưu đãi đặc biệt</p>
            <form className="newsletter-form">
              <div className="form-group">
                <input 
                  type="email" 
                  placeholder="Nhập email của bạn"
                  className="newsletter-input"
                />
                <button type="submit" className="newsletter-btn">
                  <i className="fas fa-paper-plane"></i>
                  Đăng ký
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <div className="copyright">
              <p>&copy; {currentYear} EduMatch. Tất cả quyền được bảo lưu.</p>
            </div>
            <div className="footer-legal">
              <Link to="/privacy" className="legal-link">
                Chính sách bảo mật
              </Link>
              <Link to="/terms" className="legal-link">
                Điều khoản sử dụng
              </Link>
              <Link to="/cookies" className="legal-link">
                Chính sách Cookie
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      <button 
        className="back-to-top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Lên đầu trang"
      >
        <i className="fas fa-chevron-up"></i>
      </button>
    </footer>
  );
};

export default Footer;
