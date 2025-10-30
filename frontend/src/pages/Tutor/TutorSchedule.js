import React, { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import "./TutorSchedule.scss";
<<<<<<< HEAD
import BookingService from "../../services/BookingService";
=======
import BookingService, { listMyTeachingSlots, deleteTeachingSlot } from "../../services/BookingService";
>>>>>>> Quan3
import BackHomeButton from "../../components/Common/BackHomeButton";

const TutorSchedule = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [teachingSlots, setTeachingSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'month'
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending', 'accepted', 'completed', 'cancelled'

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  const role = useSelector((state) => state.user.user?.account?.role);

  // Redirect if not authenticated or not tutor
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/signin");
    } else if (role && role !== 'tutor') {
      navigate("/dashboard");
    }
  }, [isAuthenticated, role, navigate]);

  // Load bookings
  const loadBookings = useCallback(async () => {
    if (!isAuthenticated || role !== 'tutor') return;
    
    setLoading(true);
    try {
      const [bookingsData, slotsData] = await Promise.all([
        BookingService.listMyBookings('tutor'),
<<<<<<< HEAD
        BookingService.listMyTeachingSlots()
=======
        listMyTeachingSlots()
>>>>>>> Quan3
      ]);
      setBookings(bookingsData || []);
      setTeachingSlots(slotsData || []);
    } catch (error) {
      console.error("Failed to load bookings:", error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, role]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  // Handle booking decision
  const handleBookingDecision = async (bookingId, decision) => {
    setLoading(true);
    try {
      await BookingService.tutorDecision(bookingId, decision);
      await loadBookings();
    } catch (error) {
      console.error("Failed to update booking:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter bookings by status
  const filteredBookings = bookings.filter(booking => {
    if (filterStatus === 'all') return true;
    return booking.status === filterStatus;
  });

  // Get bookings for selected date/week/month
  const getBookingsForPeriod = () => {
    const start = new Date(selectedDate);
    const end = new Date(selectedDate);

    if (viewMode === 'week') {
      start.setDate(start.getDate() - start.getDay());
      end.setDate(end.getDate() + (6 - start.getDay()));
    } else {
      start.setDate(1);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
    }

    return filteredBookings.filter(booking => {
      const bookingDate = new Date(booking.start);
      return bookingDate >= start && bookingDate <= end;
    });
  };

  // Get week days for week view
  const getWeekDays = () => {
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - start.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Get time slots for calendar
  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour <= 22; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  // Get booking for specific time slot
  const getBookingForSlot = (date, timeSlot) => {
    const slotStart = new Date(date);
    const [hour] = timeSlot.split(':');
    slotStart.setHours(parseInt(hour), 0, 0, 0);
    
    const slotEnd = new Date(slotStart);
    slotEnd.setHours(parseInt(hour) + 1, 0, 0, 0);

    return filteredBookings.find(booking => {
      const bookingStart = new Date(booking.start);
      const bookingEnd = new Date(booking.end);
      return bookingStart < slotEnd && bookingEnd > slotStart;
    });
  };

  // Get open teaching slot for specific time slot
  const getOpenSlotForTime = (date, timeSlot) => {
    const slotStart = new Date(date);
    const [hour] = timeSlot.split(':');
    slotStart.setHours(parseInt(hour), 0, 0, 0);

    const slotEnd = new Date(slotStart);
    slotEnd.setHours(parseInt(hour) + 1, 0, 0, 0);

    return teachingSlots.find(slot => {
      const s = new Date(slot.start);
      const e = new Date(slot.end);
      return s < slotEnd && e > slotStart && slot.status === 'open';
    });
  };

  // Format booking status
  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Chờ xác nhận',
      'accepted': 'Đã chấp nhận',
      'completed': 'Hoàn thành',
      'cancelled': 'Đã hủy',
      'rejected': 'Đã từ chối'
    };
    return statusMap[status] || status;
  };

  // Get status color
  const getStatusColor = (status) => {
    const colorMap = {
      'pending': '#ffc107',
      'accepted': '#28a745',
      'completed': '#007bff',
      'cancelled': '#dc3545',
      'rejected': '#6c757d'
    };
    return colorMap[status] || '#6c757d';
  };

  // Color for open slots
  const getOpenSlotColor = () => '#17a2b8';

  if (!isAuthenticated || role !== 'tutor') {
    return (
      <div className="tutor-schedule-container">
        <div className="loading-message">
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tutor-schedule-container">
      <div className="schedule-header" data-aos="fade-down">
        <div className="header-content">
          <h1>📅 Lịch dạy của tôi</h1>
          <p>Quản lý lịch dạy và booking của học viên</p>
        </div>
        
        <div className="header-actions">
          <BackHomeButton />
          <div className="view-controls">
            <button 
              className={viewMode === 'week' ? 'active' : ''}
              onClick={() => setViewMode('week')}
            >
              Tuần
            </button>
            <button 
              className={viewMode === 'month' ? 'active' : ''}
              onClick={() => setViewMode('month')}
            >
              Tháng
            </button>
          </div>
          
          <div className="date-navigation">
            <button onClick={() => {
              const newDate = new Date(selectedDate);
              if (viewMode === 'week') {
                newDate.setDate(newDate.getDate() - 7);
              } else {
                newDate.setMonth(newDate.getMonth() - 1);
              }
              setSelectedDate(newDate);
            }}>
              ←
            </button>
            <span className="current-date">
              {selectedDate.toLocaleDateString('vi-VN', { 
                month: 'long', 
                year: 'numeric',
                ...(viewMode === 'week' && { day: 'numeric' })
              })}
            </span>
            <button onClick={() => {
              const newDate = new Date(selectedDate);
              if (viewMode === 'week') {
                newDate.setDate(newDate.getDate() + 7);
              } else {
                newDate.setMonth(newDate.getMonth() + 1);
              }
              setSelectedDate(newDate);
            }}>
              →
            </button>
          </div>
        </div>
      </div>

      <div className="schedule-content">
        <div className="schedule-sidebar" data-aos="fade-right">
          <div className="sidebar-section">
            <h3>🔍 Lọc theo trạng thái</h3>
            <div className="filter-buttons">
              {['all', 'pending', 'accepted', 'completed', 'cancelled'].map(status => (
                <button
                  key={status}
                  className={`filter-btn ${filterStatus === status ? 'active' : ''}`}
                  onClick={() => setFilterStatus(status)}
                >
                  {status === 'all' ? 'Tất cả' : getStatusText(status)}
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <h3>📊 Thống kê</h3>
            <div className="stats">
              <div className="stat-item">
                <span className="stat-label">Tổng booking:</span>
                <span className="stat-value">{bookings.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Chờ xác nhận:</span>
                <span className="stat-value pending">
                  {bookings.filter(b => b.status === 'pending').length}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Đã chấp nhận:</span>
                <span className="stat-value accepted">
                  {bookings.filter(b => b.status === 'accepted').length}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Hoàn thành:</span>
                <span className="stat-value completed">
                  {bookings.filter(b => b.status === 'completed').length}
                </span>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>⚡ Thao tác nhanh</h3>
            <div className="quick-actions">
              <button 
                className="action-btn primary"
                onClick={() => navigate('/tutor/publish')}
              >
                📝 Đăng ký dạy học
              </button>
              <button 
                className="action-btn secondary"
                onClick={() => navigate('/tutor/availability')}
              >
                ⏰ Cập nhật lịch rảnh
              </button>
              <button 
                className="action-btn tertiary"
                onClick={() => navigate('/profile')}
              >
                👤 Cập nhật hồ sơ
              </button>
              <button 
                className="action-btn quaternary"
                onClick={() => navigate('/dashboard')}
              >
                📊 Dashboard
              </button>
            </div>
          </div>
        </div>

        <div className="schedule-main" data-aos="fade-left">
          {viewMode === 'week' ? (
            <div className="week-view">
              <div className="week-header">
                {getWeekDays().map((day, index) => (
                  <div key={index} className="week-day-header">
                    <div className="day-name">
                      {day.toLocaleDateString('vi-VN', { weekday: 'short' })}
                    </div>
                    <div className="day-number">
                      {day.getDate()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="week-calendar">
                <div className="time-column">
                  {getTimeSlots().map(time => (
                    <div key={time} className="time-slot">
                      {time}
                    </div>
                  ))}
                </div>

                {getWeekDays().map((day, dayIndex) => (
                  <div key={dayIndex} className="day-column">
                    {getTimeSlots().map(time => {
                      const booking = getBookingForSlot(day, time);
                      const openSlot = booking ? null : getOpenSlotForTime(day, time);
                      return (
                        <div 
                          key={time} 
                          className={`calendar-cell ${booking ? 'has-booking' : openSlot ? 'has-slot' : ''}`}
                          onClick={() => booking ? setSelectedBooking(booking) : (openSlot && setSelectedSlot(openSlot))}
                        >
                          {booking && (
                            <div 
                              className="booking-item"
                              style={{ backgroundColor: getStatusColor(booking.status) }}
                            >
                              <div className="booking-student">
                                {booking.student || 'N/A'}
                              </div>
                              <div className="booking-subject">
                                {booking.subject || 'N/A'}
                              </div>
                              <div className="booking-status">
                                {getStatusText(booking.status)}
                              </div>
                            </div>
                          )}
                          {!booking && openSlot && (
                            <div 
                              className="slot-item"
                              title={`${openSlot.courseName} — ${openSlot.mode === 'online' ? 'Trực tuyến' : (openSlot.location || '')}`}
                              style={{ backgroundColor: getOpenSlotColor() }}
                            >
                              <div className="booking-student">
                                {openSlot.courseName}
                              </div>
                              <div className="booking-subject">
                                {openSlot.mode === 'online' ? 'Online' : 'Offline'}
                              </div>
                              <div className="booking-status">
                                Slot mở
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="month-view">
              <div className="month-grid">
                {/* Month view implementation */}
                <div className="month-placeholder">
                  <p>Chế độ xem tháng đang được phát triển</p>
                  <p>Sử dụng chế độ xem tuần để xem chi tiết lịch dạy</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="modal-overlay" onClick={() => setSelectedBooking(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chi tiết buổi dạy</h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedBooking(null)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="booking-details">
                <div className="detail-row">
                  <span className="label">Học viên:</span>
                  <span className="value">{selectedBooking.student || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Thời gian:</span>
                  <span className="value">
                    {new Date(selectedBooking.start).toLocaleString('vi-VN')} - {' '}
                    {new Date(selectedBooking.end).toLocaleString('vi-VN')}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Hình thức:</span>
                  <span className="value">
                    {selectedBooking.mode === 'online' ? 'Trực tuyến' : 'Tại nhà'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Giá:</span>
                  <span className="value">
                    {(selectedBooking.price || 0).toLocaleString()} VNĐ
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Trạng thái:</span>
                  <span 
                    className="value status"
                    style={{ color: getStatusColor(selectedBooking.status) }}
                  >
                    {getStatusText(selectedBooking.status)}
                  </span>
                </div>
                {selectedBooking.notes && (
                  <div className="detail-row">
                    <span className="label">Ghi chú:</span>
                    <span className="value">{selectedBooking.notes}</span>
                  </div>
                )}
              </div>

              {selectedBooking.status === 'pending' && (
                <div className="modal-actions">
                  <button 
                    className="btn-accept"
                    onClick={() => {
                      handleBookingDecision(selectedBooking._id, 'accept');
                      setSelectedBooking(null);
                    }}
                  >
                    Chấp nhận
                  </button>
                  <button 
                    className="btn-reject"
                    onClick={() => {
                      handleBookingDecision(selectedBooking._id, 'reject');
                      setSelectedBooking(null);
                    }}
                  >
                    Từ chối
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Teaching Slot Detail Modal */}
      {selectedSlot && (
        <div className="modal-overlay" onClick={() => setSelectedSlot(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Slot mở: {selectedSlot.courseName}</h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedSlot(null)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="booking-details">
                <div className="detail-row"><span className="label">Thời gian:</span>
                  <span className="value">{new Date(selectedSlot.start).toLocaleString('vi-VN')} - {new Date(selectedSlot.end).toLocaleString('vi-VN')}</span>
                </div>
                <div className="detail-row"><span className="label">Hình thức:</span>
                  <span className="value">{selectedSlot.mode === 'online' ? 'Trực tuyến' : 'Tại nhà'}</span>
                </div>
                {selectedSlot.location && (
                  <div className="detail-row"><span className="label">Địa điểm:</span>
                    <span className="value">{selectedSlot.location}</span>
                  </div>
                )}
                <div className="detail-row"><span className="label">Học phí:</span>
                  <span className="value">{(selectedSlot.price || 0).toLocaleString()} VNĐ</span>
                </div>
                <div className="detail-row"><span className="label">Số học viên:</span>
                  <span className="value">{selectedSlot.capacity}</span>
                </div>
                {selectedSlot.notes && (
                  <div className="detail-row"><span className="label">Ghi chú:</span>
                    <span className="value">{selectedSlot.notes}</span>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button 
                  className="btn-reject"
                  onClick={async () => {
                    try {
<<<<<<< HEAD
                      await BookingService.deleteTeachingSlot(selectedSlot._id);
=======
                      await deleteTeachingSlot(selectedSlot._id);
>>>>>>> Quan3
                      setSelectedSlot(null);
                      await loadBookings();
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                >
                  Xóa slot
                </button>
                <button 
                  className="btn-accept"
                  onClick={() => {
                    setSelectedSlot(null);
                    navigate('/tutor/publish');
                  }}
                >
                  Sửa/đăng lại
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Đang tải...</p>
        </div>
      )}
    </div>
  );
};

export default TutorSchedule;
