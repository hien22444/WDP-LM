import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import BackHomeButton from "../../components/Common/BackHomeButton";
import TutorService from "../../services/TutorService";
import "./TutorList.scss";

const TutorList = () => {
  const navigate = useNavigate();
  const userState = useSelector((state) => state.user);
  const isAuthenticated = userState?.isAuthenticated;
  const userRole = userState?.user?.role || userState?.account?.role;

  // States
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [location, setLocation] = useState("");
  const [mode, setMode] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState("");
  const [experience, setExperience] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("rating");

  const pageSize = 12;

  // Load tutors data
  useEffect(() => {
    const loadTutors = async () => {
      setLoading(true);
      setError("");
      try {
        console.log("🔍 Loading tutors with filters:", {
          search: query,
          subject,
          grade,
          location,
          mode,
          minPrice,
          maxPrice,
          minRating,
          experience,
          page,
          sortBy
        });

        const data = await TutorService.searchTutors({
          search: query,
          subject,
          grade,
          location,
          mode,
          minPrice: minPrice ? Number(minPrice) : undefined,
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
          minRating: minRating ? Number(minRating) : undefined,
          experience,
          page,
          limit: pageSize,
          sortBy,
          includePending: false // Chỉ hiển thị gia sư đã duyệt
        });

        console.log("📊 Tutors loaded:", data);
        // Map API response to component expected format
        const tutors = (data?.tutors || []).map(tutor => ({
          _id: tutor.id,
          user: {
            full_name: tutor.name || tutor.userId || "Gia sư"
          },
          avatarUrl: tutor.avatar,
          subjects: tutor.subjects || [],
          location: tutor.location || "Chưa cập nhật",
          rating: tutor.rating || 0,
          reviewCount: tutor.reviewCount || 0,
          experience: tutor.experience || "0 năm",
          sessionRate: tutor.price || 0,
          bio: tutor.bio || "Chưa có giới thiệu",
          verified: tutor.verified || false
        }));
        setTutors(tutors);
      } catch (e) {
        console.error("❌ Error loading tutors:", e);
        setError(`Không tải được danh sách gia sư: ${e.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadTutors();
  }, [query, subject, grade, location, mode, minPrice, maxPrice, minRating, experience, page, sortBy]);

  // Filter handlers
  const handleClearFilters = () => {
    setQuery("");
    setSubject("");
    setGrade("");
    setLocation("");
    setMode("");
    setMinPrice("");
    setMaxPrice("");
    setMinRating("");
    setExperience("");
    setPage(1);
  };

  const handleTutorClick = (tutorId) => {
    navigate(`/tutor/${tutorId}`);
  };

  return (
    <div className="tutor-list-container">
      <div className="tutor-list-header">
        <BackHomeButton />
        <div className="header-content">
          <h1>Danh sách gia sư</h1>
          <p>Tìm kiếm và lựa chọn gia sư phù hợp với nhu cầu học tập của bạn</p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filters-grid">
          {/* Search */}
          <div className="filter-group">
            <label>Tìm kiếm</label>
            <input
              type="text"
              placeholder="Tên gia sư, môn học..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="filter-input"
            />
          </div>

          {/* Subject */}
          <div className="filter-group">
            <label>Môn học</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="filter-select"
            >
              <option value="">Tất cả môn</option>
              <option value="toán">Toán</option>
              <option value="lý">Lý</option>
              <option value="hóa">Hóa</option>
              <option value="sinh">Sinh</option>
              <option value="văn">Văn</option>
              <option value="anh">Tiếng Anh</option>
              <option value="sử">Lịch sử</option>
              <option value="địa">Địa lý</option>
            </select>
          </div>

          {/* Grade */}
          <div className="filter-group">
            <label>Lớp</label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="filter-select"
            >
              <option value="">Tất cả lớp</option>
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
            </select>
          </div>

          {/* Mode */}
          <div className="filter-group">
            <label>Hình thức</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="filter-select"
            >
              <option value="">Tất cả</option>
              <option value="online">Trực tuyến</option>
              <option value="offline">Tại nhà</option>
            </select>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="advanced-filters">
          <div className="filter-row">
            <div className="filter-group">
              <label>Địa điểm</label>
              <input
                type="text"
                placeholder="Hà Nội, TP.HCM..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label>Giá tối thiểu (VNĐ)</label>
              <input
                type="number"
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label>Giá tối đa (VNĐ)</label>
              <input
                type="number"
                placeholder="1000000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label>Đánh giá tối thiểu</label>
              <select
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
                className="filter-select"
              >
                <option value="">Tất cả</option>
                <option value="4">4+ sao</option>
                <option value="3">3+ sao</option>
                <option value="2">2+ sao</option>
                <option value="1">1+ sao</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Sắp xếp</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="rating">Đánh giá cao</option>
                <option value="price">Giá thấp</option>
                <option value="experience">Kinh nghiệm</option>
                <option value="created">Mới nhất</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filter Actions */}
        <div className="filter-actions">
          <button
            onClick={handleClearFilters}
            className="clear-filters-btn"
          >
            <i className="fas fa-times"></i>
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="results-summary">
        <p>
          Tìm thấy <strong>{tutors.length}</strong> gia sư phù hợp
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="loading-spinner">
            <div className="spinner"></div>
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
          <h3>Không thể tải dữ liệu</h3>
          <p>{error}</p>
          <div className="debug-info">
            <p>🔍 Debug Info:</p>
            <p>• API Base URL: {process.env.REACT_APP_API_URL || "http://localhost:5000/api/v1"}</p>
            <p>• Tutors loaded: {tutors.length}</p>
            <p>• Current filters: {JSON.stringify({ query, subject, grade, location, mode })}</p>
          </div>
          <button
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && tutors.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <i className="fas fa-user-graduate"></i>
          </div>
          <h3>Không tìm thấy gia sư</h3>
          <p>Thử điều chỉnh bộ lọc để tìm kiếm kết quả khác</p>
          <button onClick={handleClearFilters} className="clear-filters-btn">
            Xóa bộ lọc
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
                  src={tutor.avatarUrl || "/default-avatar.png"}
                  alt={tutor.user?.full_name || "Gia sư"}
                  onError={(e) => {
                    e.target.src = "/default-avatar.png";
                  }}
                />
                <div className="online-status">
                  <span className="status-dot"></span>
                </div>
              </div>

              <div className="tutor-info">
                <h3 className="tutor-name">
                  {tutor.user?.full_name || "Gia sư"}
                </h3>
                <p className="tutor-subjects">
                  {tutor.subjects?.slice(0, 3).map(s => s.name || s.subject || s).join(", ")}
                  {tutor.subjects?.length > 3 && "..."}
                </p>
                <div className="tutor-rating">
                  <div className="stars">
                    {[...Array(5)].map((_, i) => (
                      <i
                        key={i}
                        className={`fas fa-star ${
                          i < (tutor.rating || 0) ? "active" : ""
                        }`}
                      ></i>
                    ))}
                  </div>
                  <span className="rating-text">
                    {tutor.rating?.toFixed(1) || "0.0"} ({tutor.reviewCount || 0} đánh giá)
                  </span>
                </div>
                <div className="tutor-meta">
                  <div className="meta-item">
                    <i className="fas fa-graduation-cap"></i>
                    <span>{tutor.experience || 0} năm kinh nghiệm</span>
                  </div>
                  <div className="meta-item">
                    <i className="fas fa-map-marker-alt"></i>
                    <span>{tutor.location || "Không xác định"}</span>
                  </div>
                </div>
                <div className="tutor-price">
                  <span className="price-label">Từ</span>
                  <span className="price-value">
                    {tutor.sessionRate ? `${tutor.sessionRate.toLocaleString()}đ/buổi` : "Liên hệ"}
                  </span>
                </div>
              </div>

              <div className="tutor-actions">
                <button className="btn btn-primary">
                  Xem hồ sơ
                </button>
                {isAuthenticated ? (
                  <button className="btn btn-outline">
                    Liên hệ
                  </button>
                ) : (
                  <Link to="/signin" className="btn btn-outline">
                    Đăng nhập
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && tutors.length > 0 && (
        <div className="pagination">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="pagination-btn"
          >
            <i className="fas fa-chevron-left"></i>
            Trước
          </button>
          
          <div className="pagination-info">
            Trang {page} - {tutors.length} gia sư
          </div>
          
          <button
            onClick={() => setPage(page + 1)}
            disabled={tutors.length < pageSize}
            className="pagination-btn"
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
