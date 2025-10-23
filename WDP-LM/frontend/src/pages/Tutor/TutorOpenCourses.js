import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import BackHomeButton from "../../components/Common/BackHomeButton";
import TutorHero from "../../components/Tutor/TutorHero";
import TutorFooter from "../../components/Tutor/TutorFooter";
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
    const result = (items || []).filter(s => {
      if (mode && s.mode !== mode) return false;
      if (q && !(s.courseName || '').toLowerCase().includes(q)) return false;
      if (minPrice && (s.price || 0) < Number(minPrice)) return false;
      if (maxPrice && (s.price || 0) > Number(maxPrice)) return false;
      return true;
    });
    // Reset to first page if current page exceeds new total
    const totalPages = Math.max(1, Math.ceil(result.length / pageSize));
    if (page > totalPages) setPage(1);
    return result;
  }, [items, query, mode, minPrice, maxPrice]);

  const paged = useMemo(() => {
    const startIdx = (page - 1) * pageSize;
    return filtered.slice(startIdx, startIdx + pageSize);
  }, [filtered, page]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filtered.length / pageSize)), [filtered]);

  // Danh sách môn/khóa để gợi ý tìm kiếm
  const courseOptions = useMemo(() => {
    const set = new Set();
    (items || []).forEach(s => { if (s.courseName) set.add(s.courseName); });
    return Array.from(set).sort((a,b)=>a.localeCompare(b));
  }, [items]);

  return (
    <div className="tutor-search-page">
      <div className="search-header">
        <div className="header-content">
          <h1 className="page-title">Tìm kiếm gia sư</h1>
          <p className="page-subtitle">Khám phá hàng nghìn gia sư chất lượng cao</p>
        </div>
        <BackHomeButton />
      </div>
      {/* Conditional Hero Section based on user role */}
      {isTutor && <TutorHero />}

      {/* User status notification */}
      {!isAuthenticated && (
        <div className="welcome-banner">
          <div className="banner-content">
            <div className="banner-icon">
              <i className="fas fa-graduation-cap"></i>
            </div>
            <div className="banner-text">
              <h3>Chào mừng đến với EduMatch!</h3>
              <p>Đăng nhập để đặt khóa học và trải nghiệm đầy đủ các tính năng</p>
            </div>
            <div className="banner-actions">
              <Link to="/signin" className="btn btn-primary">Đăng nhập</Link>
              <Link to="/signup" className="btn btn-outline">Đăng ký</Link>
            </div>
          </div>
        </div>
      )}

      {/* Modern Filters */}
      <div className="filters-section">
        <div className="filters-container">
          <div className="filters-header">
            <h3>Bộ lọc tìm kiếm</h3>
            <button 
              className="clear-filters-btn"
              onClick={() => {
                setQuery("");
                setMode("");
                setMinPrice("");
                setMaxPrice("");
              }}
            >
              <i className="fas fa-times"></i>
              Xóa bộ lọc
            </button>
          </div>
          
          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label">Tìm kiếm khóa học</label>
              <div className="search-input-wrapper">
                <i className="fas fa-search search-icon"></i>
                <input 
                  className="search-input" 
                  list="course-options" 
                  value={query} 
                  onChange={(e)=>setQuery(e.target.value)} 
                  placeholder="Nhập tên khóa học..." 
                />
                <datalist id="course-options">
                  {courseOptions.map(name => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>
            </div>
            
            <div className="filter-group">
              <label className="filter-label">Hình thức học</label>
              <select className="filter-select" value={mode} onChange={(e)=>setMode(e.target.value)}>
                <option value="">Tất cả hình thức</option>
                <option value="online">Trực tuyến</option>
                <option value="offline">Tại nhà</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label className="filter-label">Giá từ</label>
              <input 
                className="filter-input" 
                type="number" 
                value={minPrice} 
                onChange={(e)=>setMinPrice(e.target.value)} 
                placeholder="0 VNĐ" 
              />
            </div>
            
            <div className="filter-group">
              <label className="filter-label">Giá đến</label>
              <input 
                className="filter-input" 
                type="number" 
                value={maxPrice} 
                onChange={(e)=>setMaxPrice(e.target.value)} 
                placeholder="500,000 VNĐ" 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results summary */}
      {!loading && !error && (
        <div className="results-summary">
          <div className="results-info">
            <span className="results-count">
              Tìm thấy {filtered.length} khóa học
              {filtered.length !== items.length && ` (đã lọc từ ${items.length} khóa học)`}
            </span>
          </div>
          <div className="pagination-info">
            Trang {page} / {totalPages}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
          <p className="loading-text">Đang tải danh sách khóa học...</p>
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
            <p>• Items loaded: {items.length}</p>
            <p>• Filtered items: {filtered.length}</p>
            <p>• Tutor ID: {tutorId || "none"}</p>
          </div>
          <button className="retry-button" onClick={() => window.location.reload()}>
            Thử lại
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && paged.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <i className="fas fa-search"></i>
          </div>
          <h3>Không tìm thấy khóa học nào</h3>
          <p>
            {filtered.length === 0 && items.length > 0 
              ? "Thử điều chỉnh bộ lọc để tìm thấy khóa học phù hợp"
              : "Hiện tại chưa có khóa học nào được mở"
            }
          </p>
          {(query || mode || minPrice || maxPrice) && (
            <button 
              className="btn btn-outline"
              onClick={() => {
                setQuery("");
                setMode("");
                setMinPrice("");
                setMaxPrice("");
              }}
            >
              <i className="fas fa-times"></i>
              Xóa bộ lọc
            </button>
          )}
        </div>
      )}

      {/* Course Cards */}
      {!loading && !error && paged.length > 0 && (
        <div className="courses-grid">
          {paged.map(slot => (
            <div key={slot._id} className="course-card">
              <div className="course-cover">
                <div
                  className="cover-image"
                  style={(() => {
                    const hasImage = Boolean(slot.image);
                    return hasImage
                      ? { backgroundImage: `url(${slot.image})` }
                      : { background: 'linear-gradient(135deg, var(--primary-100), var(--secondary-100))' };
                  })()}
                />
                <div className="cover-overlay">
                  <span className={`mode-badge ${slot.mode === 'online' ? 'online' : 'offline'}`}>
                    {slot.mode === 'online' ? 'Trực tuyến' : 'Tại nhà'}
                  </span>
                </div>
              </div>

              <div className="course-content">
                <div className="course-header">
                  <div className="tutor-info">
                    {slot.tutorProfile?.user && (
                      <img
                        className="tutor-avatar"
                        src={slot.tutorProfile.avatarUrl || slot.tutorProfile.user.image || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop&crop=face'}
                        alt={slot.tutorProfile.user.full_name || 'Tutor'}
                      />
                    )}
                    <div className="tutor-details">
                      <h3 className="course-title">{slot.courseName}</h3>
                      {slot.tutorProfile?.user && (
                        <Link to={`/tutor/${slot.tutorProfile._id}`} className="tutor-name">
                          {slot.tutorProfile.user.full_name || 'Gia sư'}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                <div className="course-meta">
                  <div className="meta-item">
                    <i className="fas fa-calendar"></i>
                    <span>{new Date(slot.start).toLocaleDateString()}</span>
                  </div>
                  <div className="meta-item">
                    <i className="fas fa-clock"></i>
                    <span>
                      {new Date(slot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – 
                      {new Date(slot.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {slot.location && (
                    <div className="meta-item">
                      <i className="fas fa-map-marker-alt"></i>
                      <span>{slot.location}</span>
                    </div>
                  )}
                </div>

                {slot.notes && (
                  <div className="course-notes">
                    <p>{slot.notes}</p>
                  </div>
                )}

                <div className="course-footer">
                  <div className="price-section">
                    <span className="price-label">Học phí</span>
                    <span className="price-value">
                      {slot.price ? `${slot.price.toLocaleString()}đ` : 'Liên hệ'}
                    </span>
                  </div>
                  <div className="action-buttons">
                    <Link className="btn btn-outline" to={`/courses/${slot._id}`}>
                      Chi tiết
                    </Link>
                    {isAuthenticated ? (
                      <button 
                        className="btn btn-primary" 
                        onClick={() => window.location.assign(`/tutor/${slot.tutorProfile?._id || ''}`)}
                      >
                        Đặt ngay
                      </button>
                    ) : (
                      <Link className="btn btn-primary" to="/signin">
                        Đăng nhập để đặt
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-section">
              <nav className="pagination-nav">
                <button 
                  className="pagination-btn prev"
                  onClick={()=>setPage(p=>Math.max(1,p-1))}
                  disabled={page === 1}
                >
                  <i className="fas fa-chevron-left"></i>
                  Trước
                </button>
                
                <div className="pagination-numbers">
                  {(() => {
                    const pages = [];
                    const maxVisible = 5;
                    
                    if (totalPages <= maxVisible) {
                      for (let i = 1; i <= totalPages; i++) {
                        pages.push(
                          <button 
                            key={i} 
                            className={`pagination-number ${page === i ? 'active' : ''}`}
                            onClick={()=>setPage(i)}
                          >
                            {i}
                          </button>
                        );
                      }
                    } else {
                      const start = Math.max(1, page - 2);
                      const end = Math.min(totalPages, page + 2);
                      
                      if (start > 1) {
                        pages.push(
                          <button 
                            key={1} 
                            className="pagination-number"
                            onClick={()=>setPage(1)}
                          >
                            1
                          </button>
                        );
                        if (start > 2) {
                          pages.push(
                            <span key="ellipsis1" className="pagination-ellipsis">...</span>
                          );
                        }
                      }
                      
                      for (let i = start; i <= end; i++) {
                        pages.push(
                          <button 
                            key={i} 
                            className={`pagination-number ${page === i ? 'active' : ''}`}
                            onClick={()=>setPage(i)}
                          >
                            {i}
                          </button>
                        );
                      }
                      
                      if (end < totalPages) {
                        if (end < totalPages - 1) {
                          pages.push(
                            <span key="ellipsis2" className="pagination-ellipsis">...</span>
                          );
                        }
                        pages.push(
                          <button 
                            key={totalPages} 
                            className="pagination-number"
                            onClick={()=>setPage(totalPages)}
                          >
                            {totalPages}
                          </button>
                        );
                      }
                    }
                    
                    return pages;
                  })()}
                </div>
                
                <button 
                  className="pagination-btn next"
                  onClick={()=>setPage(p=>Math.min(totalPages,p+1))}
                  disabled={page === totalPages}
                >
                  Sau
                  <i className="fas fa-chevron-right"></i>
                </button>
              </nav>
            </div>
          )}
        </div>
      )}

      <TutorFooter />
    </div>
  );
};

export default TutorOpenCourses;


