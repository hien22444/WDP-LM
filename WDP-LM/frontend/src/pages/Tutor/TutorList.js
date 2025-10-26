import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as TutorService from "../../services/TutorService";
import BackHomeButton from "../../components/Common/BackHomeButton";
import "./TutorList.scss";

const TutorList = () => {
  const navigate = useNavigate();
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTutors, setTotalTutors] = useState(0);

  // Search and filter states
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [location, setLocation] = useState("");
  const [filters, setFilters] = useState({
    gender: "",
    search: ""
  });

  const loadTutors = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await TutorService.searchTutors({
        page: currentPage,
        limit: 12,
        query: query,
        subject: subject,
        grade: grade,
        location: location,
        sortBy: "rating",
        includePending: false
      });

      console.log("📊 Tutors loaded:", data);
      
      // Map API response to component expected format
      const tutors = (data?.tutors || []).map(tutor => {
        // Parse experience to extract years
        let experienceYears = 0;
        if (tutor.experience) {
          const match = tutor.experience.match(/(\d+)/);
          experienceYears = match ? parseInt(match[1]) : 0;
        }
        
        // Format subjects properly
        const formattedSubjects = (tutor.subjects || []).map(subject => {
          if (typeof subject === 'string') return subject;
          if (subject.name) return subject.name;
          if (subject.subject) return subject.subject;
          return 'Môn học';
        });

        // Get a proper name
        let displayName = tutor.name || "Gia sư";
        if (displayName === "Gia sư" && tutor.userId) {
          displayName = `Gia sư ${tutor.userId.slice(-4)}`;
        }

        return {
          _id: tutor.id,
          user: {
            full_name: displayName
          },
          avatarUrl: tutor.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
          subjects: formattedSubjects.length > 0 ? formattedSubjects : ["Chưa cập nhật môn học"],
          location: tutor.location || "Chưa cập nhật",
          rating: tutor.rating || 0,
          reviewCount: tutor.reviewCount || 0,
          experience: experienceYears,
          sessionRate: tutor.price || 0,
          bio: tutor.bio || "Chưa có giới thiệu",
          verified: tutor.verified || false,
          teachModes: tutor.teachModes || []
        };
      });

      setTutors(tutors);
      setTotalPages(data?.totalPages || 1);
      setTotalTutors(data?.total || 0);
    } catch (e) {
      console.error("❌ Error loading tutors:", e);
      setError(`Không tải được danh sách gia sư: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTutors();
  }, [currentPage, query, subject, grade, location]);

  const handleSearch = () => {
    setCurrentPage(1);
    loadTutors();
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleTutorClick = (tutorId) => {
    navigate(`/tutor/${tutorId}`);
  };

  return (
    <div className="tutor-list-container">
      <div className="search-banner">
        <div className="banner-content">
          <h1>Tìm Gia Sư</h1>
        </div>
      </div>

      {/* Search Interface */}
      <div className="search-interface">
        <div className="main-search">
          <input
            type="text"
            placeholder="Nhập tên hoặc mô tả gia sư..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filters-grid">
          <div className="filter-group">
            <label>Môn học</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="filter-select"
            >
              <option value="">Tất cả môn học</option>
              <option value="toán">Toán</option>
              <option value="lý">Vật lý</option>
              <option value="hóa">Hóa học</option>
              <option value="sinh">Sinh học</option>
              <option value="văn">Ngữ văn</option>
              <option value="anh">Tiếng Anh</option>
              <option value="sử">Lịch sử</option>
              <option value="địa">Địa lý</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Chương trình</label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="filter-select"
            >
              <option value="">Tất cả chương trình</option>
              <option value="1">Lớp 1</option>
              <option value="2">Lớp 2</option>
              <option value="3">Lớp 3</option>
              <option value="4">Lớp 4</option>
              <option value="5">Lớp 5</option>
              <option value="6">Lớp 6</option>
              <option value="7">Lớp 7</option>
              <option value="8">Lớp 8</option>
              <option value="9">Lớp 9</option>
              <option value="10">Lớp 10</option>
              <option value="11">Lớp 11</option>
              <option value="12">Lớp 12</option>
              <option value="đại học">Ôn thi đại học</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Khu vực</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="filter-select"
            >
              <option value="">Tất cả khu vực</option>
              <option value="hà nội">Hà Nội</option>
              <option value="tp hcm">TP. Hồ Chí Minh</option>
              <option value="đà nẵng">Đà Nẵng</option>
              <option value="hải phòng">Hải Phòng</option>
              <option value="cần thơ">Cần Thơ</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Giới tính</label>
            <select
              value={filters.gender}
              onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
              className="filter-select"
            >
              <option value="">Tất cả</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
            </select>
          </div>

          <div className="search-button-container">
            <button className="search-button" onClick={handleSearch}>
              <i className="fas fa-search"></i>
              TÌM KIẾM
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      {!loading && (
        <div className="results-summary">
          <p>
            Có <strong>{totalTutors}</strong> gia sư bạn có thể lựa chọn
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
          </div>
          <p>Đang tải danh sách gia sư...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-state">
          <div className="error-icon">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <p>{error}</p>
          <button onClick={loadTutors} className="retry-button">
            Thử lại
          </button>
        </div>
      )}

      {/* Tutors Grid */}
      {!loading && !error && tutors.length > 0 && (
        <div className="tutors-grid">
          {tutors.map((tutor) => (
            <div
              key={tutor._id}
              className="tutor-card"
              onClick={() => handleTutorClick(tutor._id)}
            >
              <div className="tutor-avatar">
                <img
                  src={tutor.avatarUrl}
                  alt={tutor.user?.full_name || "Gia sư"}
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face";
                  }}
                />
                <div className="online-status">
                  <span className="status-dot"></span>
                </div>
              </div>

              <div className="tutor-info">
                <div className="tutor-name-container">
                  <h3 className="tutor-name">
                    {tutor.user?.full_name || "Gia sư"}
                  </h3>
                </div>
                <p className="tutor-subjects">
                  {tutor.subjects?.length > 0 
                    ? tutor.subjects.slice(0, 2).join(", ") + (tutor.subjects.length > 2 ? "..." : "")
                    : "Chưa cập nhật môn học"
                  }
                </p>
                <div className="tutor-rating">
                  <div className="stars">
                    {[...Array(5)].map((_, i) => (
                      <i
                        key={i}
                        className={`fas fa-star ${
                          i < Math.floor(tutor.rating) ? "active" : ""
                        }`}
                      ></i>
                    ))}
                  </div>
                  <span className="rating-text">
                    {tutor.rating.toFixed(1)} ({tutor.reviewCount} đánh giá)
                  </span>
                </div>
                <div className="tutor-meta">
                  <div className="meta-item">
                    <i className="fas fa-briefcase"></i>
                    <span>{tutor.experience} năm kinh nghiệm</span>
                  </div>
                  <div className="meta-item">
                    <i className="fas fa-map-marker-alt"></i>
                    <span>{tutor.location}</span>
                  </div>
                  {tutor.teachModes && tutor.teachModes.length > 0 && (
                    <div className="meta-item">
                      <i className="fas fa-video"></i>
                      <span>{tutor.teachModes.join(", ")}</span>
                    </div>
                  )}
                </div>
                <div className="tutor-price">
                  <span className="price-label">Số lớp đã mở:</span>
                  <span className="price-value">
                    {Math.floor(Math.random() * 3)}
                  </span>
                </div>
              </div>

              <div className="tutor-actions">
                <button className="btn btn-outline">
                  📞 Gọi ngay
                </button>
                <button className="btn btn-primary">
                  Xem hồ sơ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {!loading && !error && tutors.length === 0 && (
        <div className="no-results">
          <div className="no-results-icon">
            <i className="fas fa-search"></i>
          </div>
          <h3>Không tìm thấy gia sư</h3>
          <p>Hãy thử thay đổi bộ lọc để tìm kiếm kết quả khác</p>
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <i className="fas fa-chevron-left"></i>
            Trước
          </button>
          <div className="pagination-info">
            Trang {currentPage} - {totalTutors} gia sư
          </div>
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Sau
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default TutorList;