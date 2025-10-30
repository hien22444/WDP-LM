import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import './About.scss';

const About = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  const cardVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    },
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.3
      }
    }
  };

  const stats = [
    { number: "10,000+", label: "Học viên đã tin tưởng", icon: "👥" },
    { number: "2,500+", label: "Gia sư chất lượng", icon: "🎓" },
    { number: "50+", label: "Môn học đa dạng", icon: "📚" },
    { number: "98%", label: "Tỷ lệ hài lòng", icon: "⭐" }
  ];

  const teamMembers = [
    {
      name: "Nguyễn Văn A",
      role: "CEO & Founder",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face",
      description: "15 năm kinh nghiệm trong lĩnh vực giáo dục"
    },
    {
      name: "Trần Thị B",
      role: "CTO",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=300&fit=crop&crop=face",
      description: "Chuyên gia công nghệ với 10 năm kinh nghiệm"
    },
    {
      name: "Lê Văn C",
      role: "Head of Education",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face",
      description: "Tiến sĩ Giáo dục, 12 năm giảng dạy"
    },
    {
      name: "Phạm Thị D",
      role: "Head of Operations",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face",
      description: "Chuyên gia vận hành và quản lý chất lượng"
    }
  ];

  const values = [
    {
      icon: "🎯",
      title: "Chất lượng",
      description: "Cam kết mang đến dịch vụ giáo dục chất lượng cao nhất"
    },
    {
      icon: "🤝",
      title: "Tin cậy",
      description: "Xây dựng mối quan hệ tin cậy lâu dài với học viên"
    },
    {
      icon: "💡",
      title: "Sáng tạo",
      description: "Áp dụng phương pháp giảng dạy hiện đại và sáng tạo"
    },
    {
      icon: "🌟",
      title: "Xuất sắc",
      description: "Luôn hướng tới sự xuất sắc trong mọi hoạt động"
    }
  ];

  return (
    <div className="about-page">
      {/* Hero Section */}
      <motion.section 
        className="hero-section"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <div className="hero-background">
          <div className="floating-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
            <div className="shape shape-4"></div>
          </div>
        </div>
        <div className="container">
          <motion.div 
            className="hero-content"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <h1 className="hero-title">
              Về <span className="highlight">EduMatch</span>
            </h1>
            <p className="hero-subtitle">
              Nền tảng kết nối học viên và gia sư hàng đầu Việt Nam
            </p>
            <motion.div 
              className="hero-stats"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {stats.map((stat, index) => (
                <motion.div 
                  key={index}
                  className="stat-item"
                  variants={itemVariants}
                  whileHover={{ scale: 1.1 }}
                >
                  <div className="stat-icon">{stat.icon}</div>
                  <div className="stat-number">{stat.number}</div>
                  <div className="stat-label">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Story Section */}
      <motion.section 
        className="story-section"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container">
          <motion.div 
            className="story-content"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div className="story-text" variants={itemVariants}>
              <h2>Câu chuyện của chúng tôi</h2>
              <p>
                EduMatch được thành lập với sứ mệnh mang đến giải pháp giáo dục toàn diện, 
                kết nối học viên với những gia sư chất lượng nhất. Chúng tôi tin rằng mỗi 
                học viên đều xứng đáng có được sự giáo dục tốt nhất.
              </p>
              <p>
                Từ những ngày đầu khởi nghiệp với chỉ vài gia sư, đến nay chúng tôi đã 
                phát triển thành nền tảng giáo dục hàng đầu với hàng nghìn gia sư và 
                học viên trên khắp cả nước.
              </p>
            </motion.div>
            <motion.div className="story-image" variants={itemVariants}>
              <div className="image-placeholder">
                <div className="floating-elements">
                  <div className="element element-1">📚</div>
                  <div className="element element-2">🎓</div>
                  <div className="element element-3">💡</div>
                  <div className="element element-4">🌟</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Values Section */}
      <motion.section 
        className="values-section"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container">
          <motion.div 
            className="section-header"
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2>Giá trị cốt lõi</h2>
            <p>Những nguyên tắc định hướng mọi hoạt động của chúng tôi</p>
          </motion.div>
          
          <motion.div 
            className="values-grid"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {values.map((value, index) => (
              <motion.div 
                key={index}
                className="value-card"
                variants={cardVariants}
                whileHover="hover"
              >
                <div className="value-icon">{value.icon}</div>
                <h3>{value.title}</h3>
                <p>{value.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Team Section */}
      <motion.section 
        className="team-section"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container">
          <motion.div 
            className="section-header"
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2>Đội ngũ của chúng tôi</h2>
            <p>Những con người tài năng đằng sau thành công của EduMatch</p>
          </motion.div>
          
          <motion.div 
            className="team-grid"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {teamMembers.map((member, index) => (
              <motion.div 
                key={index}
                className="team-card"
                variants={cardVariants}
                whileHover="hover"
              >
                <div className="member-image">
                  <img src={member.image} alt={member.name} />
                  <div className="image-overlay">
                    <div className="social-links">
                      <a href="#" className="social-link">📧</a>
                      <a href="#" className="social-link">💼</a>
                      <a href="#" className="social-link">🐦</a>
                    </div>
                  </div>
                </div>
                <div className="member-info">
                  <h3>{member.name}</h3>
                  <p className="member-role">{member.role}</p>
                  <p className="member-description">{member.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Mission Section */}
      <motion.section 
        className="mission-section"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container">
          <motion.div 
            className="mission-content"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div className="mission-text" variants={itemVariants}>
              <h2>Sứ mệnh của chúng tôi</h2>
              <p>
                Chúng tôi cam kết mang đến nền tảng giáo dục tốt nhất, giúp mọi học viên 
                tìm được gia sư phù hợp và đạt được mục tiêu học tập của mình.
              </p>
              <div className="mission-points">
                <div className="mission-point">
                  <span className="point-icon">🎯</span>
                  <span>Kết nối học viên với gia sư chất lượng</span>
                </div>
                <div className="mission-point">
                  <span className="point-icon">📈</span>
                  <span>Nâng cao hiệu quả học tập</span>
                </div>
                <div className="mission-point">
                  <span className="point-icon">🤝</span>
                  <span>Xây dựng cộng đồng giáo dục bền vững</span>
                </div>
              </div>
            </motion.div>
            <motion.div className="mission-visual" variants={itemVariants}>
              <div className="visual-container">
                <div className="progress-ring">
                  <div className="ring ring-1"></div>
                  <div className="ring ring-2"></div>
                  <div className="ring ring-3"></div>
                  <div className="center-text">
                    <span className="percentage">98%</span>
                    <span className="label">Hài lòng</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section 
        className="cta-section"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container">
          <motion.div 
            className="cta-content"
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2>Sẵn sàng bắt đầu hành trình học tập?</h2>
            <p>Tham gia cùng hàng nghìn học viên đã tin tưởng EduMatch</p>
            <div className="cta-buttons">
              <motion.button 
                className="btn btn-primary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Tìm gia sư ngay
              </motion.button>
              <motion.button 
                className="btn btn-secondary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Trở thành gia sư
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
};

export default About;
