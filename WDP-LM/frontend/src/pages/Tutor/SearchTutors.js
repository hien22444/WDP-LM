import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchTutors } from '../../services/TutorService';
import './SearchTutors.scss';

const SearchTutors = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedMode, setSelectedMode] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('rating');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const navigate = useNavigate();

  // Mock data - sẽ thay bằng API call
  const mockTutors = [
    {
      id: '1',
      name: 'Nguyễn Văn A',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      subjects: ['Toán học', 'Vật lý'],
      location: 'Hà Nội',
      rating: 4.8,
      reviewCount: 156,
      experience: '5 năm',
      price: 200000,
      teachModes: ['online', 'offline'],
      bio: 'Tôi là giáo viên Toán học với 5 năm kinh nghiệm giảng dạy. Tôi có thể giúp học sinh cải thiện điểm số và hiểu sâu hơn về môn học.',
      verified: true
    },
    {
      id: '2',
      name: 'Trần Thị B',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      subjects: ['Tiếng Anh', 'Văn học'],
      location: 'TP.HCM',
      rating: 4.9,
      reviewCount: 203,
      experience: '7 năm',
      price: 250000,
      teachModes: ['online'],
      bio: 'Chuyên gia tiếng Anh với chứng chỉ IELTS 8.5. Tôi có thể giúp bạn cải thiện kỹ năng giao tiếp và chuẩn bị cho các kỳ thi quốc tế.',
      verified: true
    },
    {
      id: '3',
      name: 'Lê Văn C',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      subjects: ['Hóa học', 'Sinh học'],
      location: 'Đà Nẵng',
      rating: 4.7,
      reviewCount: 89,
      experience: '4 năm',
      price: 180000,
      teachModes: ['offline'],
      bio: 'Thạc sĩ Hóa học, có kinh nghiệm giảng dạy tại các trường THPT. Tôi chuyên về các môn khoa học tự nhiên.',
      verified: true
    }
  ];

  const subjects = [
    'Toán học', 'Vật lý', 'Hóa học', 'Sinh học', 'Tiếng Anh', 
    'Văn học', 'Lịch sử', 'Địa lý', 'Tin học', 'Tiếng Nhật'
  ];

  const locations = [
    'Hà Nội', 'TP.HCM', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Khác'
  ];

  const teachModes = [
    { value: 'online', label: 'Trực tuyến' },
    { value: 'offline', label: 'Trực tiếp' }
  ];

  useEffect(() => {
    // Load once on mount; subsequent loads via the Search button
    loadTutors();
  }, []);

  const loadTutors = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading tutors with params:', {
        search: searchTerm,
        subject: selectedSubject,
        location: selectedLocation,
        mode: selectedMode,
        minPrice: priceRange.min,
        maxPrice: priceRange.max,
        sortBy,
        page,
        limit
      });

      const searchParams = {
        search: searchTerm,
        subject: selectedSubject,
        location: selectedLocation,
        mode: selectedMode,
        minPrice: priceRange.min,
        maxPrice: priceRange.max,
        sortBy,
        page,
        limit,
        includePending: true // Bao gồm cả gia sư chưa duyệt để hiển thị tất cả
      };

      const response = await searchTutors(searchParams);
      console.log('✅ Tutors API response:', response);
      console.log('📊 Response structure:', {
        tutors: response?.tutors?.length,
        items: response?.items?.length,
        data: response?.data?.length,
        total: response?.total,
        pagination: response?.pagination
      });
      
      const rows = response?.tutors || response?.items || response?.data || [];
      console.log('📊 Raw tutors data:', rows);
      
      const pg = response?.pagination;
      if (pg) {
        setTotalPages(pg.totalPages || 1);
        setTotalCount(pg.total || rows.length);
      } else if (typeof response?.total === 'number' && typeof response?.page === 'number') {
        // support older shape { items, total, page, pageSize }
        setTotalCount(response.total);
        setTotalPages(Math.max(1, Math.ceil(response.total / (response.pageSize || limit))));
      } else {
        // Fallback if no pagination info
        setTotalCount(rows.length);
        setTotalPages(1);
      }
      
      const normalized = rows.map((t) => ({
        id: t.id || t._id,
        name: t.name || t.user?.fullName || t.user?.full_name || 'Gia sư',
        avatar: t.avatarUrl || t.avatar || t.user?.image || t.user?.avatar || t.profileImage || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        subjects: Array.isArray(t.subjects)
          ? t.subjects.map((s) => (typeof s === 'string' ? s : (s.name || s.subject || ''))).filter(Boolean)
          : [],
        location: t.location || t.city || 'Chưa cập nhật',
        rating: t.rating || 0,
        reviewCount: t.reviewCount || 0,
        experience: t.experience || `${t.experienceYears || 0} năm`,
        price: t.price || t.sessionRate || 0,
        teachModes: t.teachModes || (t.teachingOptions?.mode ? [t.teachingOptions.mode] : []),
        bio: t.bio || t.description || 'Chưa có giới thiệu',
        verified: typeof t.verified === 'boolean' ? t.verified : (t.status === 'approved')
      }));
      
      console.log('📋 Normalized tutors:', normalized);
      setTutors(normalized);
    } catch (error) {
      console.error('Error loading tutors:', error);
      // Show empty state instead of mock data
      setTutors([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadTutors();
  };

  const handleTutorClick = (tutorId) => {
    navigate(`/tutor/${tutorId}`);
  };

  const handleMessageTutor = (tutorId) => {
    // TODO: Implement messaging system
    console.log('Message tutor:', tutorId);
    alert('Tính năng nhắn tin sẽ được triển khai sớm!');
  };

  const handleBookTrial = (tutorId) => {
    // TODO: Implement trial booking
    console.log('Book trial with tutor:', tutorId);
    alert('Tính năng đặt lịch học thử sẽ được triển khai sớm!');
  };

  // Since API already handles filtering and sorting, we just use the tutors as-is
  // const filteredTutors = tutors;

  return (
    <div className="search-tutors">
      <div className="search-tutors-header">
      <div className="container">
          <h1>Tìm gia sư phù hợp</h1>
          <p>Kết nối với hàng nghìn gia sư chất lượng cao</p>
        </div>
      </div>

      <div className="container search-tutors-content">
        <div className="search-tutors-sidebar">
          <div className="search-filters">
            <h3>Bộ lọc</h3>
            
            <div className="filter-group">
              <label>Tìm kiếm</label>
              <input
                type="text"
                placeholder="Tên gia sư, môn học..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
        </div>

            <div className="filter-group">
              <label>Môn học</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="filter-select"
              >
                <option value="">Tất cả môn học</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Địa điểm</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="filter-select"
              >
                <option value="">Tất cả địa điểm</option>
                {locations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Hình thức dạy</label>
              <select
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value)}
                className="filter-select"
              >
                <option value="">Tất cả hình thức</option>
                {teachModes.map(mode => (
                  <option key={mode.value} value={mode.value}>{mode.label}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Giá (VNĐ/buổi)</label>
              <div className="price-range">
                <input
                  type="number"
                  placeholder="Từ"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                  className="price-input"
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Đến"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                  className="price-input"
                />
              </div>
            </div>

            <button onClick={handleSearch} className="search-btn">
              Tìm kiếm
            </button>
            
            <button 
              onClick={() => {
                setLimit(1000); // Load tất cả gia sư
                setPage(1);
                loadTutors();
              }} 
              className="search-btn"
              style={{ marginTop: '10px', backgroundColor: '#10B981' }}
            >
              Hiển thị tất cả gia sư
            </button>
          </div>
        </div>

        <div className="search-tutors-main">
          <div className="search-results-header">
            <div className="results-count">
              Tìm thấy {tutors.length} gia sư {totalCount > tutors.length && `(tổng ${totalCount} gia sư)`}
            </div>
            <div className="sort-options">
              <label>Sắp xếp theo:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="rating">Đánh giá cao</option>
                <option value="price-low">Giá thấp đến cao</option>
                <option value="price-high">Giá cao đến thấp</option>
                <option value="experience">Kinh nghiệm</option>
              </select>
                  </div>
                </div>

          <div className="tutors-grid">
            {loading ? (
              <div className="loading">Đang tải...</div>
            ) : tutors.length > 0 ? (
              tutors.map(tutor => (
                <div
                  key={tutor.id}
                  className="tutor-card"
                  onClick={() => handleTutorClick(tutor.id)}
                >
                  <div className="tutor-avatar">
                    <img src={tutor.avatar} alt={tutor.name} />
                    {tutor.verified && (
                      <div className="verified-badge">
                        <i className="fas fa-check-circle"></i>
                      </div>
                    )}
                    {!tutor.verified && (
                      <div className="verified-badge" style={{ background: '#F59E0B' }} title="Hồ sơ chưa duyệt">
                        <i className="fas fa-hourglass-half"></i>
                      </div>
                    )}
                  </div>
                  
                  <div className="tutor-info">
                    <h3 className="tutor-name">{tutor.name}</h3>
                    
                    {/* Verification Status */}
                    <div className="verification-status">
                      {tutor.verified ? (
                        <span className="verified-text">
                          <i className="fas fa-check-circle"></i>
                          Đã xác minh danh tính
                        </span>
                      ) : (
                        <span className="pending-text">
                          <i className="fas fa-hourglass-half"></i>
                          Chờ xác minh
                        </span>
                      )}
                    </div>
                    
                    <div className="tutor-rating">
                      <div className="stars">
                        {[...Array(5)].map((_, i) => (
                          <i
                            key={i}
                            className={`fas fa-star ${i < Math.floor(tutor.rating) ? 'filled' : ''}`}
                          />
                        ))}
                </div>
                      <span className="rating-text">
                        {tutor.rating} ({tutor.reviewCount} đánh giá)
                      </span>
              </div>
                    
                    <div className="tutor-subjects">
                      {tutor.subjects.map(subject => (
                        <span key={subject} className="subject-tag">{subject}</span>
            ))}
          </div>
                    
                    <div className="tutor-details">
                      <div className="detail-item">
                        <i className="fas fa-map-marker-alt"></i>
                        <span>{tutor.location}</span>
                      </div>
                      <div className="detail-item">
                        <i className="fas fa-clock"></i>
                        <span>{tutor.experience} kinh nghiệm</span>
                      </div>
                      <div className="detail-item">
                        <i className="fas fa-video"></i>
                        <span>
                          {tutor.teachModes.includes('online') && 'Trực tuyến'}
                          {tutor.teachModes.includes('online') && tutor.teachModes.includes('offline') && ', '}
                          {tutor.teachModes.includes('offline') && 'Trực tiếp'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="tutor-price">
                      <span className="price-label">Từ</span>
                      <span className="price-value">{tutor.price.toLocaleString()}đ</span>
                      <span className="price-unit">/buổi</span>
                    </div>
                    
                    <p className="tutor-bio">{tutor.bio}</p>
                    
                    {/* Action Buttons */}
                    <div className="tutor-actions">
                      <button 
                        className="btn-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/tutor/${tutor.id}`);
                        }}
                      >
                        <i className="fas fa-user"></i>
                        Xem hồ sơ chi tiết
                      </button>
                      
                      <button 
                        className="btn-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMessageTutor(tutor.id);
                        }}
                      >
                        <i className="fas fa-comment"></i>
                        Nhắn tin
                      </button>
                      
                      <button 
                        className="btn-success"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookTrial(tutor.id);
                        }}
                      >
                        <i className="fas fa-calendar-plus"></i>
                        Đặt lịch học thử
                      </button>
                    </div>
          </div>
                </div>
              ))
            ) : (
              <div className="no-results">
                <i className="fas fa-search"></i>
                <h3>Không tìm thấy gia sư nào</h3>
                <p>Thử thay đổi bộ lọc để tìm kiếm tốt hơn</p>
        </div>
      )}
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
            <div style={{ color: '#666' }}>Tổng: {totalCount}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button disabled={page <= 1} onClick={() => { setPage(p => Math.max(1, p - 1)); setTimeout(loadTutors, 0); }} className="search-btn" style={{ padding: '8px 12px' }}>Trang trước</button>
              <span style={{ color: '#666' }}>{page}/{totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => { setPage(p => Math.min(totalPages, p + 1)); setTimeout(loadTutors, 0); }} className="search-btn" style={{ padding: '8px 12px' }}>Trang sau</button>
            </div>
          </div>
        </div>
    </div>
    </div>
  );
};

export default SearchTutors;
