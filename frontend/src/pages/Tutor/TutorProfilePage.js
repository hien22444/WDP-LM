import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BackHomeButton from '../../components/Common/BackHomeButton';
import { useSelector } from 'react-redux';
import { getTutorProfile, createBooking } from '../../services/BookingService';
import { getTutorCourses } from '../../services/TutorService';
import './TutorProfilePage.scss';

const TutorProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useSelector(state => state.user.user);
  const [tutor, setTutor] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('about');
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingData, setBookingData] = useState({
    start: '',
    end: '',
    mode: 'online',
    notes: ''
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');

  useEffect(() => {
    loadTutorProfile();
  }, [id]);

  const loadTutorProfile = async () => {
    try {
    setLoading(true);
      setError('');
      const response = await getTutorProfile(id);
      const t = response?.tutor || response?.profile || {};
      // Normalize subject list to strings for safe rendering
      const normalizedSubjects = Array.isArray(t.subjects)
        ? t.subjects
            .map((s) => {
              if (!s) return null;
              if (typeof s === 'string') return s;
              if (typeof s === 'object') {
                return s.name || s.subject?.name || s.subject || s.level || null;
              }
              return null;
            })
            .filter(Boolean)
        : [];
      setTutor({
        ...t,
        name: t.name || t.user?.fullName || t.user?.full_name || 'Gia sư',
        avatar:
          t.avatar || t.user?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        subjects: normalizedSubjects,
        experience: t.experience || `${t.experienceYears || 0} năm`,
        price: t.price || t.sessionRate || 0,
        location: t.location || t.city || 'Chưa cập nhật',
        teachModes: t.teachModes || (t.teachingOptions?.mode ? [t.teachingOptions.mode] : []),
        rating: t.rating || 0,
        reviewCount: t.reviewCount || 0,
        verified: typeof t.verified === 'boolean' ? t.verified : (t.status === 'approved'),
        isOwnProfile: currentUser && String(t.user) === String(currentUser._id)
      });
    } catch (error) {
      console.error('Error loading tutor profile:', error);
      setError('Không thể tải thông tin gia sư');
    } finally {
      setLoading(false);
    }
  };

  const loadTutorCourses = async () => {
    try {
      setCoursesLoading(true);
      const response = await getTutorCourses(id);
      setCourses(response.courses || []);
    } catch (error) {
      console.error('Error loading tutor courses:', error);
      // Don't show error for courses, just log it
    } finally {
      setCoursesLoading(false);
    }
  };

  const handleBookSession = () => {
    setShowBookingForm(true);
    setBookingError('');
    // Reset form with default values
    setBookingData({
      start: '',
      end: '',
      mode: tutor?.teachModes?.includes('online') ? 'online' : 'offline',
      notes: ''
    });
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingLoading(true);
    setBookingError('');

    try {
      // Validate booking data
      if (!bookingData.start || !bookingData.end) {
        throw new Error('Vui lòng chọn thời gian bắt đầu và kết thúc');
      }

      const startTime = new Date(bookingData.start);
      const endTime = new Date(bookingData.end);
      
      if (startTime >= endTime) {
        throw new Error('Thời gian kết thúc phải sau thời gian bắt đầu');
      }

      if (startTime <= new Date()) {
        throw new Error('Thời gian đặt lịch phải trong tương lai');
      }

      // Create booking
      const bookingPayload = {
        tutorProfileId: id,
        start: bookingData.start,
        end: bookingData.end,
        mode: bookingData.mode,
        price: tutor.price,
        notes: bookingData.notes
      };

      await createBooking(bookingPayload);
      
      // Success - close modal and show success message
      setShowBookingForm(false);
      alert('Đặt lịch học thành công! Gia sư sẽ xác nhận trong thời gian sớm nhất.');
      
      // Reset form
      setBookingData({
        start: '',
        end: '',
        mode: tutor?.teachModes?.includes('online') ? 'online' : 'offline',
        notes: ''
      });

    } catch (error) {
      console.error('Booking error:', error);
      setBookingError(error.message || 'Có lỗi xảy ra khi đặt lịch học');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleBookingInputChange = (field, value) => {
    setBookingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContactTutor = () => {
    if (tutor?.phone) {
      window.open(`tel:${tutor.phone}`);
    } else if (tutor?.email) {
      window.open(`mailto:${tutor.email}`);
    }
  };

  if (loading) {
    return (
      <div className="tutor-profile-loading">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Đang tải thông tin gia sư...</p>
        </div>
      </div>
    );
  }

  if (error || !tutor) {
    return (
      <div className="tutor-profile-error">
        <div className="error-content">
          <i className="fas fa-exclamation-triangle"></i>
          <h3>Không tìm thấy gia sư</h3>
          <p>{error || 'Gia sư này không tồn tại hoặc đã bị xóa'}</p>
          <button onClick={() => navigate('/tutor')} className="back-btn">
            Quay lại danh sách gia sư
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tutor-profile-page">
      {/* Header Section */}
      <div className="tutor-profile-header">
        <div className="container">
          <div className="tutor-header-content">
            <div style={{ position: 'absolute', top: 12, left: 12 }}>
              <BackHomeButton />
            </div>
            <div className="tutor-avatar-section">
              <div className="tutor-avatar">
                <img src={tutor.avatar} alt={tutor.name} />
                {tutor.verified && (
                  <div className="verified-badge">
                    <i className="fas fa-check-circle"></i>
                    <span>Đã xác minh</span>
                  </div>
                )}
              </div>
            </div>

            <div className="tutor-basic-info">
              <h1 className="tutor-name">{tutor.name}</h1>
              <div className="tutor-rating">
                <div className="stars">
                  {[...Array(5)].map((_, i) => (
                    <i
                      key={i}
                      className={`fas fa-star ${i < Math.floor(tutor.rating) ? 'filled' : ''}`}
                    />
                  ))}
                </div>
                <span className="rating-value">{tutor.rating}</span>
                <span className="review-count">({tutor.reviewCount} đánh giá)</span>
              </div>
              
              <div className="tutor-subjects">
                {tutor.subjects.map(subject => (
                  <span key={subject} className="subject-tag">{subject}</span>
                ))}
              </div>

              <div className="tutor-location">
                <i className="fas fa-map-marker-alt"></i>
                <span>{tutor.location}</span>
              </div>

              <div className="tutor-price">
                <span className="price-label">Học phí:</span>
                <span className="price-value">{tutor.price.toLocaleString()}đ</span>
                <span className="price-unit">/buổi</span>
              </div>
            </div>

            <div className="tutor-actions">
              <button onClick={handleBookSession} className="book-session-btn">
                <i className="fas fa-calendar-plus"></i>
                Đặt lịch học
              </button>
              <button onClick={handleContactTutor} className="contact-btn">
                <i className="fas fa-phone"></i>
                Liên hệ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="tutor-profile-content">
        <div className="container">
          <div className="tutor-content-layout">
            <div className="tutor-main-content">
              {/* Navigation Tabs */}
              <div className="tutor-tabs">
                <button
                  className={`tab-btn ${activeTab === 'about' ? 'active' : ''}`}
                  onClick={() => setActiveTab('about')}
                >
                  <span>Giới thiệu</span>
                </button>
                <button
                  className={`tab-btn ${activeTab === 'subjects' ? 'active' : ''}`}
                  onClick={() => setActiveTab('subjects')}
                >
                  <span>Môn dạy</span>
                </button>
                <button
                  className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
                  onClick={() => setActiveTab('reviews')}
                >
                  <span>Đánh giá</span>
                </button>
                <button
                  className={`tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('courses');
                    if (courses.length === 0) loadTutorCourses();
                  }}
                >
                  <span>Khóa học ({courses.length})</span>
                </button>
                <button
                  className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
                  onClick={() => setActiveTab('schedule')}
                >
                  <span>Lịch dạy</span>
                </button>
              </div>

              {/* Tab Content */}
              <div className="tab-content">
                {activeTab === 'about' && (
                  <div className="about-section">
                    <h3>Giới thiệu</h3>
                    <div className="bio-content">
                      <p>{tutor.bio}</p>
                    </div>

                    <div className="tutor-details-grid">
                      <div className="detail-item">
                        <i className="fas fa-graduation-cap"></i>
                        <div>
                          <h4>Kinh nghiệm</h4>
                          <p>{tutor.experience}</p>
                        </div>
                      </div>

                      <div className="detail-item">
                        <i className="fas fa-video"></i>
                        <div>
                          <h4>Hình thức dạy</h4>
                          <p>
                            {tutor.teachModes.includes('online') && 'Trực tuyến'}
                            {tutor.teachModes.includes('online') && tutor.teachModes.includes('offline') && ', '}
                            {tutor.teachModes.includes('offline') && 'Trực tiếp'}
                          </p>
                        </div>
                      </div>

                      <div className="detail-item">
                        <i className="fas fa-language"></i>
                        <div>
                          <h4>Ngôn ngữ</h4>
                          <p>{tutor.languages?.join(', ') || 'Tiếng Việt'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'subjects' && (
                  <div className="subjects-section">
                    <h3>Môn học</h3>
                    <div className="subjects-grid">
                      {tutor.subjects.map(subject => {
                        // Count courses for this subject
                        const subjectCourses = courses.filter(course => 
                          course.courseName.toLowerCase().includes(subject.toLowerCase())
                        );
                        
                        return (
                          <div key={subject} className="subject-card">
                            <h4>{subject}</h4>
                            <p>Chuyên sâu, kinh nghiệm giảng dạy</p>
                            {subjectCourses.length > 0 && (
                              <div className="subject-courses-count">
                                <i className="fas fa-book"></i>
                                <span>{subjectCourses.length} khóa học đang mở</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="reviews-section">
                    <h3>Đánh giá ({tutor.reviewCount})</h3>
                    <div className="reviews-summary">
                      <div className="rating-breakdown">
                        <div className="rating-item">
                          <span>5 sao</span>
                          <div className="rating-bar">
                            <div className="rating-fill" style={{width: '80%'}}></div>
                          </div>
                          <span>80%</span>
                        </div>
                        <div className="rating-item">
                          <span>4 sao</span>
                          <div className="rating-bar">
                            <div className="rating-fill" style={{width: '15%'}}></div>
                          </div>
                          <span>15%</span>
                        </div>
                        <div className="rating-item">
                          <span>3 sao</span>
                          <div className="rating-bar">
                            <div className="rating-fill" style={{width: '3%'}}></div>
                          </div>
                          <span>3%</span>
                        </div>
                        <div className="rating-item">
                          <span>2 sao</span>
                          <div className="rating-bar">
                            <div className="rating-fill" style={{width: '1%'}}></div>
                          </div>
                          <span>1%</span>
                        </div>
                        <div className="rating-item">
                          <span>1 sao</span>
                          <div className="rating-bar">
                            <div className="rating-fill" style={{width: '1%'}}></div>
                          </div>
                          <span>1%</span>
                        </div>
                      </div>
                    </div>

                    <div className="reviews-list">
                      {/* Mock reviews - sẽ thay bằng API thật */}
                      <div className="review-item">
                        <div className="review-header">
                          <div className="reviewer-info">
                            <div className="reviewer-avatar">
                              <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&h=40&fit=crop&crop=face" alt="Reviewer" />
                            </div>
                            <div>
                              <h4>Nguyễn Văn A</h4>
                              <div className="review-rating">
                                {[...Array(5)].map((_, i) => (
                                  <i key={i} className="fas fa-star filled"></i>
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="review-date">2 ngày trước</span>
                        </div>
                        <p className="review-text">
                          Thầy dạy rất hay và dễ hiểu. Em đã cải thiện điểm số Toán rất nhiều sau khi học với thầy.
                        </p>
                      </div>

                      <div className="review-item">
                        <div className="review-header">
                          <div className="reviewer-info">
                            <div className="reviewer-avatar">
                              <img src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face" alt="Reviewer" />
                            </div>
        <div>
                              <h4>Trần Thị B</h4>
                              <div className="review-rating">
                                {[...Array(5)].map((_, i) => (
                                  <i key={i} className="fas fa-star filled"></i>
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="review-date">1 tuần trước</span>
                        </div>
                        <p className="review-text">
                          Gia sư rất tận tâm và kiên nhẫn. Con tôi rất thích học với cô.
                        </p>
                      </div>
        </div>
      </div>
                )}

                {activeTab === 'courses' && (
                  <div className="courses-section">
                    <div className="courses-header">
                      <h3>Khóa học đang mở</h3>
                      {tutor.isOwnProfile && (
                        <div className="course-actions">
                          <button 
                            className="create-course-btn"
                            onClick={() => navigate('/tutor/publish-slot')}
                          >
                            <i className="fas fa-plus"></i>
                            Tạo khóa học mới
                          </button>
                          <button 
                            className="manage-course-btn"
                            onClick={() => navigate('/tutor/schedule')}
                          >
                            <i className="fas fa-cog"></i>
                            Quản lý khóa học
                          </button>
                        </div>
                      )}
                    </div>
                    {coursesLoading ? (
                      <div className="loading-courses">
                        <div className="spinner"></div>
                        <div className="loading-text">Đang tải khóa học...</div>
                      </div>
                    ) : courses.length > 0 ? (
                      <div className="courses-grid">
                        {courses.map((course) => (
                          <div key={course.id} className="course-card">
                            <div className="course-header">
                              <h4 className="course-title">{course.courseName}</h4>
                              <div className="course-price">
                                {course.price ? `${course.price.toLocaleString()}` : 'Liên hệ'}
                              </div>
                            </div>
                            
                            <div className="course-details">
                              <div className="detail-item">
                                <i className="fas fa-calendar icon"></i>
                                <span className="detail-text">{new Date(course.start).toLocaleDateString('vi-VN', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}</span>
                              </div>
                              <div className="detail-item">
                                <i className="fas fa-clock icon"></i>
                                <span className="detail-text">
                                  {new Date(course.start).toLocaleTimeString('vi-VN', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })} - {new Date(course.end).toLocaleTimeString('vi-VN', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                              </div>
                              <div className="detail-item">
                                <i className={`fas ${course.mode === 'online' ? 'fa-video' : 'fa-map-marker-alt'} icon`}></i>
                                <span className="detail-text">{course.mode === 'online' ? 'Trực tuyến' : course.location || 'Tại nhà'}</span>
                              </div>
                              <div className="detail-item">
                                <i className="fas fa-users icon"></i>
                                <span className="detail-text">Tối đa {course.capacity} học viên</span>
        </div>
      </div>

                            {course.notes && (
                              <div className="course-notes">
                                <p>{course.notes}</p>
                              </div>
                            )}

                            <button 
                              className="book-btn"
                              onClick={() => handleBookSession()}
                            >
                              Đặt lịch học
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-courses">
                        <div className="icon">🎓</div>
                        <h4>Chưa có khóa học nào</h4>
                        <p>Gia sư chưa đăng khóa học nào. Vui lòng liên hệ trực tiếp để đặt lịch.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'schedule' && (
                  <div className="schedule-section">
                    <h3>Lịch dạy</h3>
                    <div className="schedule-info">
                      <p>Gia sư này có lịch dạy linh hoạt. Vui lòng liên hệ để thống nhất lịch học phù hợp.</p>
                      
                      {tutor.availability && tutor.availability.length > 0 && (
                        <div className="availability-grid">
                          <h4>Khung giờ rảnh thường xuyên:</h4>
                          <div className="time-slots">
                            {tutor.availability.map((slot, index) => (
                              <div key={index} className="time-slot">
                                <span className="day">{getDayName(slot.dayOfWeek)}</span>
                                <span className="time">{slot.start} - {slot.end}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="tutor-sidebar">
              <div className="sidebar-card">
                <h3>Thông tin liên hệ</h3>
                <div className="contact-info">
                  {tutor.phone && (
                    <div className="contact-item">
                      <i className="fas fa-phone"></i>
                      <span>{tutor.phone}</span>
                    </div>
                  )}
                  {tutor.email && (
                    <div className="contact-item">
                      <i className="fas fa-envelope"></i>
                      <span>{tutor.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="sidebar-card">
                <h3>Thống kê</h3>
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-value">{tutor.reviewCount}</span>
                    <span className="stat-label">Đánh giá</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{tutor.experience}</span>
                    <span className="stat-label">Kinh nghiệm</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{tutor.subjects.length}</span>
                    <span className="stat-label">Môn dạy</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && (
        <div className="booking-modal-overlay" onClick={() => setShowBookingForm(false)}>
          <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Đặt lịch học với {tutor.name}</h3>
              <button onClick={() => setShowBookingForm(false)} className="close-btn">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-content">
              <form onSubmit={handleBookingSubmit} className="booking-form">
                <div className="form-group">
                  <label htmlFor="start-time">Thời gian bắt đầu *</label>
                  <input
                    type="datetime-local"
                    id="start-time"
                    value={bookingData.start}
                    onChange={(e) => handleBookingInputChange('start', e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="end-time">Thời gian kết thúc *</label>
                  <input
                    type="datetime-local"
                    id="end-time"
                    value={bookingData.end}
                    onChange={(e) => handleBookingInputChange('end', e.target.value)}
                    min={bookingData.start || new Date().toISOString().slice(0, 16)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="mode">Hình thức dạy học *</label>
                  <select
                    id="mode"
                    value={bookingData.mode}
                    onChange={(e) => handleBookingInputChange('mode', e.target.value)}
                    required
                  >
                    {tutor.teachModes.includes('online') && (
                      <option value="online">Trực tuyến</option>
                    )}
                    {tutor.teachModes.includes('offline') && (
                      <option value="offline">Trực tiếp</option>
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="notes">Ghi chú (tùy chọn)</label>
                  <textarea
                    id="notes"
                    value={bookingData.notes}
                    onChange={(e) => handleBookingInputChange('notes', e.target.value)}
                    placeholder="Nhập nội dung muốn học, mục tiêu, yêu cầu đặc biệt..."
                    rows="3"
                  />
                </div>

                <div className="booking-summary">
                  <div className="summary-item">
                    <span>Học phí:</span>
                    <span className="price">{tutor.price.toLocaleString()}đ</span>
                  </div>
                  <div className="summary-item">
                    <span>Thời lượng:</span>
                    <span>
                      {bookingData.start && bookingData.end 
                        ? Math.round((new Date(bookingData.end) - new Date(bookingData.start)) / (1000 * 60 * 60))
                        : 0
                      } giờ
                    </span>
                  </div>
                </div>

                {bookingError && (
                  <div className="error-message">
                    <i className="fas fa-exclamation-triangle"></i>
                    {bookingError}
                  </div>
                )}

                <div className="modal-actions">
                  <button 
                    type="submit" 
                    className="submit-btn"
                    disabled={bookingLoading}
                  >
                    {bookingLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-calendar-check"></i>
                        Xác nhận đặt lịch
                      </>
                    )}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowBookingForm(false)} 
                    className="cancel-btn"
                    disabled={bookingLoading}
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get day name
const getDayName = (dayOfWeek) => {
  const days = {
    0: 'Chủ nhật',
    1: 'Thứ hai', 
    2: 'Thứ ba',
    3: 'Thứ tư',
    4: 'Thứ năm',
    5: 'Thứ sáu',
    6: 'Thứ bảy'
  };
  return days[dayOfWeek] || dayOfWeek;
};

export default TutorProfilePage;
