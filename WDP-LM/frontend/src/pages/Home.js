import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './Home.scss';

const Home = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.user);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      name: "Nguyễn Minh Anh",
      role: "Học sinh lớp 12",
      content: "EduMatch giúp tôi tìm được gia sư Toán tuyệt vời. Điểm số của tôi đã cải thiện rõ rệt từ 6.5 lên 8.5 chỉ sau 2 tháng!",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Trần Văn Nam",
      role: "Phụ huynh",
      content: "Con tôi rất thích học với gia sư trên EduMatch. Giao diện dễ sử dụng, thanh toán an toàn và chất lượng giảng dạy rất tốt.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Lê Thị Hương",
      role: "Gia sư",
      content: "Làm gia sư trên EduMatch rất thuận tiện. Tôi có thể quản lý lịch dạy, nhận thanh toán và tương tác với học sinh một cách dễ dàng.",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
    }
  ];

  const features = [
    {
      icon: "fas fa-search",
      title: "Tìm kiếm thông minh",
      description: "Tìm gia sư phù hợp với nhu cầu học tập của bạn trong vài giây"
    },
    {
      icon: "fas fa-video",
      title: "Học trực tuyến",
      description: "Tham gia lớp học trực tuyến với công nghệ WebRTC hiện đại"
    },
    {
      icon: "fas fa-shield-alt",
      title: "Thanh toán an toàn",
      description: "Hệ thống thanh toán bảo mật với escrow đảm bảo quyền lợi"
    },
    {
      icon: "fas fa-star",
      title: "Đánh giá chất lượng",
      description: "Hệ thống đánh giá và phản hồi giúp duy trì chất lượng giảng dạy"
    }
  ];

  const stats = [
    { number: "10,000+", label: "Gia sư đã đăng ký" },
    { number: "50,000+", label: "Học sinh tin tưởng" },
    { number: "100,000+", label: "Giờ học đã hoàn thành" },
    { number: "4.9/5", label: "Đánh giá trung bình" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="hero-pattern"></div>
        </div>
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Kết nối với
                <span className="gradient-text"> gia sư tốt nhất</span>
                <br />
                cho việc học của bạn
              </h1>
              <p className="hero-description">
                Tìm kiếm gia sư phù hợp, đặt lịch học linh hoạt và học tập hiệu quả 
                với nền tảng gia sư trực tuyến hàng đầu Việt Nam.
              </p>
              <div className="hero-actions">
                <button 
                  className="btn-primary"
                  onClick={() => navigate('/courses')}
                >
                  <i className="fas fa-search"></i>
                  Tìm gia sư ngay
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => navigate('/tutor/onboarding')}
                >
                  <i className="fas fa-chalkboard-teacher"></i>
                  Trở thành gia sư
                </button>
              </div>
            </div>
            <div className="hero-image">
              <div className="hero-illustration">
                <div className="floating-card card-1">
                  <i className="fas fa-graduation-cap"></i>
                  <span>Học tập hiệu quả</span>
                </div>
                <div className="floating-card card-2">
                  <i className="fas fa-users"></i>
                  <span>Gia sư chuyên nghiệp</span>
                </div>
                <div className="floating-card card-3">
                  <i className="fas fa-clock"></i>
                  <span>Lịch học linh hoạt</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          {stats.map((stat, index) => (
            <div key={index} className="stat-item">
              <div className="stat-number">{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <div className="section-header">
            <h2 className="section-title">Tại sao chọn EduMatch?</h2>
            <p className="section-description">
              Chúng tôi cung cấp giải pháp học tập toàn diện với công nghệ hiện đại
            </p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">
                  <i className={feature.icon}></i>
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="testimonials-container">
          <div className="section-header">
            <h2 className="section-title">Khách hàng nói gì về chúng tôi</h2>
            <p className="section-description">
              Hàng nghìn học sinh và phụ huynh đã tin tưởng EduMatch
            </p>
          </div>
          <div className="testimonial-slider">
            <div className="testimonial-card">
              <div className="testimonial-content">
                <div className="testimonial-avatar">
                  <img src={testimonials[currentTestimonial].avatar} alt={testimonials[currentTestimonial].name} />
                </div>
                <div className="testimonial-text">
                  <p>"{testimonials[currentTestimonial].content}"</p>
                </div>
                <div className="testimonial-author">
                  <h4>{testimonials[currentTestimonial].name}</h4>
                  <span>{testimonials[currentTestimonial].role}</span>
                </div>
              </div>
            </div>
            <div className="testimonial-dots">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`dot ${index === currentTestimonial ? 'active' : ''}`}
                  onClick={() => setCurrentTestimonial(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-content">
            <h2>Sẵn sàng bắt đầu hành trình học tập?</h2>
            <p>Tham gia cùng hàng nghìn học sinh đã cải thiện kết quả học tập với EduMatch</p>
            <div className="cta-actions">
              <button 
                className="btn-primary"
                onClick={() => navigate('/courses')}
              >
                Tìm gia sư ngay
              </button>
              <button 
                className="btn-outline"
                onClick={() => navigate('/about')}
              >
                Tìm hiểu thêm
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
