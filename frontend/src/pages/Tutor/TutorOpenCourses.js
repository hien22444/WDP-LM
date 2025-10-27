import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import BookingService from "../../services/BookingService";
import "./TutorOpenCourses.scss";

const TutorOpenCourses = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [params] = useSearchParams();
  const tutorId = params.get('tutorId') || undefined;
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Get user info for permission checking
  const userState = useSelector((state) => state.user);
  const isAuthenticated = userState?.isAuthenticated;
  const userRole = userState?.user?.role || userState?.account?.role;
  const isTutor = userRole === 'tutor';

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      
      try {
        const data = await BookingService.listPublicTeachingSlots({ tutorId });
        setItems(data || []);
        
      } catch (e) {
        console.error("❌ Error loading teaching slots:", e);
        setError(`Không tải được danh sách khóa học: ${e.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    load();
  }, [tutorId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const min = parseFloat(minPrice) || 0;
    const max = parseFloat(maxPrice) || Infinity;
    
    return items.filter(item => {
      const matchesQuery = !q || 
        item.subject?.toLowerCase().includes(q) ||
        item.tutor?.name?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q);
      
      const matchesMode = !mode || item.mode === mode;
      const matchesPrice = item.price >= min && item.price <= max;
      
      return matchesQuery && matchesMode && matchesPrice;
    });
  }, [items, query, mode, minPrice, maxPrice]);

  const courseOptions = useMemo(() => {
    return [...new Set(items.map(item => item.subject).filter(Boolean))];
  }, [items]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa xác định';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Ngày không hợp lệ';
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '--:--';
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  return (
    <div className="tutor-open-courses">
      {/* Search Banner */}
      <div className="search-banner">
        <div className="banner-content">
          <h1>Khóa học mở</h1>
        </div>
      </div>

      {/* Search Interface */}
      <div className="search-interface">
        <div className="main-search">
          <input
            type="text"
            placeholder="Nhập tên khóa học hoặc môn học..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filters-grid">
          <div className="filter-group">
            <label>Hình thức học</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="filter-select"
            >
              <option value="">Tất cả hình thức</option>
              <option value="online">Trực tuyến</option>
              <option value="offline">Tại nhà</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Giá từ (VNĐ)</label>
            <input
              type="number"
              placeholder="0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>Giá đến (VNĐ)</label>
            <input
              type="number"
              placeholder="500000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="search-button-container">
            <button 
              className="search-button" 
              onClick={() => {
                setQuery("");
                setMode("");
                setMinPrice("");
                setMaxPrice("");
              }}
            >
              <i className="fas fa-refresh"></i>
              XÓA BỘ LỌC
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      {!loading && (
        <div className="results-summary">
          <p>
            Có <strong>{filtered.length}</strong> khóa học bạn có thể lựa chọn
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
          </div>
          <p>Đang tải danh sách khóa học...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-state">
          <div className="error-icon">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="retry-button">
            Thử lại
          </button>
        </div>
      )}

      {/* Courses Grid */}
      {!loading && !error && paginatedItems.length > 0 && (
        <div className="courses-grid">
          {paginatedItems.map((course) => (
            <div key={course._id} className="course-card">
              <div className="course-header">
                <div className="course-tutor">
                  <div className="tutor-avatar">
                    <img
                      src={course.tutor?.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"}
                      alt={course.tutor?.name || "Gia sư"}
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face";
                      }}
                    />
                  </div>
                  <div className="tutor-info">
                    <h4 className="tutor-name">{course.tutor?.name || "Gia sư"}</h4>
                    <span className="tutor-rating">
                      <i className="fas fa-star"></i>
                      {course.tutor?.rating || 0} ({course.tutor?.totalReviews || 0} đánh giá)
                    </span>
                  </div>
                </div>
                <div className="course-price">
                  {formatPrice(course.price)}
                </div>
              </div>

              <div className="course-content">
                <h3 className="course-title">{course.subject}</h3>
                <p className="course-description">
                  {course.description || "Chưa có mô tả khóa học"}
                </p>
                
                <div className="course-details">
                  <div className="detail-item">
                    <i className="fas fa-calendar"></i>
                    <span>{course.date ? formatDate(course.date) : 'Chưa xác định'}</span>
                  </div>
                  <div className="detail-item">
                    <i className="fas fa-clock"></i>
                    <span>{formatTime(course.startTime)} - {formatTime(course.endTime)}</span>
                  </div>
                  <div className="detail-item">
                    <i className={`fas fa-${course.mode === 'online' ? 'video' : 'home'}`}></i>
                    <span>{course.mode === 'online' ? 'Trực tuyến' : course.mode === 'offline' ? 'Tại nhà' : 'Chưa xác định'}</span>
                  </div>
                </div>
              </div>

              <div className="course-actions">
                <button className="btn btn-outline">
                  📞 Liên hệ
                </button>
                <button className="btn btn-primary">
                  Đăng ký ngay
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {!loading && !error && paginatedItems.length === 0 && (
        <div className="no-results">
          <div className="no-results-icon">
            <i className="fas fa-search"></i>
          </div>
          <h3>Không tìm thấy khóa học</h3>
          <p>Hãy thử thay đổi bộ lọc để tìm kiếm kết quả khác</p>
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
          >
            <i className="fas fa-chevron-left"></i>
            Trước
          </button>
          <div className="pagination-info">
            Trang {page} - {filtered.length} khóa học
          </div>
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
          >
            Sau
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default TutorOpenCourses;