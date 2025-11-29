import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './TutorSchedule.scss';
import BookingService from '../../services/BookingService';
import { getMyTutorProfile } from '../../services/TutorService';
import BackHomeButton from '../../components/Common/BackHomeButton';

const WEEKDAYS = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'];
const SESSIONS = [
  { id: 'morning', label: 'Buổi sáng', time: '7:00-11:30' },
  { id: 'afternoon', label: 'Buổi chiều', time: '13:00-16:30' },
];

export default function TutorSchedule() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));

  const navigate = useNavigate();
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  const role = useSelector((state) => state.user.user?.account?.role);

  function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  const getWeekDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const prevWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const nextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(getMonday(new Date()));
  };

  const getWeekRange = () => {
    const weekDates = getWeekDates();
    const start = weekDates[0];
    const end = weekDates[6];
    return `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}`;
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin');
    } else if (role && role !== 'tutor') {
      navigate('/dashboard');
    }
  }, [isAuthenticated, role, navigate]);

  const loadData = useCallback(async () => {
    if (!isAuthenticated || role !== 'tutor') return;

    setLoading(true);
    try {
      const [bookingsData, profileData] = await Promise.all([
        BookingService.listMyBookings('tutor'),
        getMyTutorProfile(),
      ]);

      console.log('=== BOOKINGS DATA ===' );
      console.log('Total bookings:', bookingsData?.length);
      bookingsData?.forEach((booking, idx) => {
        console.log(`Booking ${idx + 1}:`, {
          id: booking._id,
          contractData: booking.contractData,
          subject: booking.contractData?.subject,
          student: booking.student?.full_name
        });
      });

      setBookings(bookingsData || []);
      setAvailability(profileData?.availability || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isSessionAvailable = (dayIndex, sessionId) => {
    if (!Array.isArray(availability)) return false;

    return availability.some((slot) => {
      if (slot.dayOfWeek !== dayIndex) return false;

      const [startHour] = slot.start.split(':').map(Number);
      const [endHour] = slot.end.split(':').map(Number);

      if (sessionId === 'morning') {
        return startHour < 12 && endHour <= 12;
      } else if (sessionId === 'afternoon') {
        return startHour >= 12 && endHour > 12;
      }
      return false;
    });
  };

  // Hàm lấy tất cả các time slots duy nhất từ bookings đã thanh toán VÀ ĐÃ ACCEPT
  const getUniqueTimeSlots = () => {
    const weekDates = getWeekDates();
    const slotsSet = new Set();
    
    console.log('🔍 [getUniqueTimeSlots] Processing bookings:', bookings.length);
    
    bookings.forEach(booking => {
      console.log('🔍 Checking booking:', {
        id: booking._id,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        isPaid: booking.paymentStatus === 'paid',
        isAccepted: booking.status === 'accepted'
      });
      
      // ✅ Chỉ lấy booking đã thanh toán VÀ đã accept
      if (booking.paymentStatus !== 'paid') {
        console.log('❌ Skipped: Not paid');
        return;
      }
      if (booking.status !== 'accepted') {
        console.log('❌ Skipped: Not accepted (status:', booking.status, ')');
        return;
      }
      console.log('✅ Processing this booking...');
      
      // For recurring bookings
      if (booking.type === 'recurring' && booking.recurrencePattern?.selectedSlots) {
        booking.recurrencePattern.selectedSlots.forEach(slot => {
          // Check if any day in current week matches this recurring slot
          weekDates.forEach((date, dayIdx) => {
            const dayOfWeek = (dayIdx + 1) % 7;
            if (slot.dayOfWeek === dayOfWeek) {
              const start = new Date(booking.recurrencePattern.startDate);
              const end = new Date(booking.recurrencePattern.endDate);
              if (date >= start && date <= end) {
                slotsSet.add(`${slot.start}-${slot.end}`);
              }
            }
          });
        });
      }
      
      // For single bookings
      if (booking.start && booking.end) {
        const bookingDate = new Date(booking.start);
        weekDates.forEach(date => {
          if (bookingDate.toDateString() === date.toDateString()) {
            const start = bookingDate.toTimeString().slice(0, 5);
            const end = new Date(booking.end).toTimeString().slice(0, 5);
            slotsSet.add(`${start}-${end}`);
          }
        });
      }
    });
    
    // Convert to array and sort by start time
    const slots = Array.from(slotsSet).map((timeRange, idx) => {
      const [start, end] = timeRange.split('-');
      return {
        id: timeRange,
        time: timeRange,
        label: getTimeSlotLabel(start, end),
        sortKey: start
      };
    });
    
    return slots.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  };

  // Hàm tạo label cho time slot
  const getTimeSlotLabel = (start, end) => {
    const [startHour] = start.split(':').map(Number);
    
    if (startHour >= 6 && startHour < 12) {
      return `Buổi sáng (${start}-${end})`;
    } else if (startHour >= 12 && startHour < 17) {
      return `Buổi chiều (${start}-${end})`;
    } else {
      return `Buổi tối (${start}-${end})`;
    }
  };

  // Hàm kiểm tra có booking nào trong slot này không
  const getBookingForSlot = (dayIndex, slotTime) => {
    const weekDates = getWeekDates();
    const targetDate = weekDates[dayIndex];
    
    return bookings.find(booking => {
      // Check if booking is paid
      if (booking.paymentStatus !== 'paid') return false;
      
      // For recurring bookings
      if (booking.type === 'recurring' && booking.recurrencePattern?.selectedSlots) {
        const matchingSlot = booking.recurrencePattern.selectedSlots.find(slot => {
          if (slot.dayOfWeek !== (dayIndex + 1) % 7) return false;
          return slotTime === `${slot.start}-${slot.end}`;
        });
        
        if (!matchingSlot) return false;
        
        // Check if target date is within recurrence period
        const start = new Date(booking.recurrencePattern.startDate);
        const end = new Date(booking.recurrencePattern.endDate);
        return targetDate >= start && targetDate <= end;
      }
      
      // For single bookings
      if (booking.start) {
        const bookingDate = new Date(booking.start);
        if (bookingDate.toDateString() !== targetDate.toDateString()) return false;
        
        const bookingStart = bookingDate.toTimeString().slice(0, 5);
        const bookingEnd = new Date(booking.end).toTimeString().slice(0, 5);
        
        return slotTime === `${bookingStart}-${bookingEnd}`;
      }
      
      return false;
    });
  };

  const getStats = () => {
    const total = bookings.length;
    const pending = bookings.filter((b) => b.status === 'pending').length;
    const accepted = bookings.filter((b) => b.status === 'accepted').length;
    const completed = bookings.filter((b) => b.status === 'completed').length;
    const paid = bookings.filter((b) => b.paymentStatus === 'paid').length;

    return { total, pending, accepted, completed, paid };
  };

  const handleBookingAction = async (bookingId, action) => {
    setLoading(true);
    try {
      await BookingService.tutorDecision(bookingId, action);
      toast.success(`Đã ${action === 'accept' ? 'chấp nhận' : 'từ chối'} booking`);
      await loadData();
    } catch (error) {
      console.error('Failed to update booking:', error);
      toast.error('Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  // Hàm kiểm tra có thể hoàn thành booking không (phải đến ngày kết thúc)
  const canCompleteBooking = (booking) => {
    if (booking.status !== 'accepted') return false;
    if (booking.status === 'completed') return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let endDate;
    
    if (booking.type === 'recurring' && booking.recurrencePattern?.endDate) {
      endDate = new Date(booking.recurrencePattern.endDate);
    } else if (booking.end) {
      endDate = new Date(booking.end);
    } else {
      return false;
    }
    
    endDate.setHours(0, 0, 0, 0);
    
    // Chỉ cho phép hoàn thành từ ngày kết thúc trở đi
    return today >= endDate;
  };

  // Hàm xử lý hoàn thành booking
  const handleCompleteBooking = async (bookingId) => {
    if (!window.confirm('🎓 Xác nhận hoàn thành khóa học này?\n\nHọc sinh sẽ có thể đánh giá bạn sau khi hoàn thành.')) {
      return;
    }
    
    setLoading(true);
    try {
      await BookingService.completeBooking(bookingId);
      toast.success('✅ Đã hoàn thành khóa học! Học sinh có thể đánh giá bạn.');
      await loadData();
    } catch (error) {
      console.error('Failed to complete booking:', error);
      const message = error.response?.data?.message || 'Không thể hoàn thành booking';
      toast.error(`❌ ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    // Chỉ hiển thị bookings đã thanh toán
    if (b.paymentStatus !== 'paid') return false;
    
    if (filterStatus === 'all') return true;
    return b.status === filterStatus;
  });

  const stats = getStats();

  if (!isAuthenticated || role !== 'tutor') {
    return null;
  }

  return (
    <div className="tutor-schedule-page">
      <div className="schedule-header">
        <div className="header-left">
          <h1>📅 Lịch dạy của tôi</h1>
          <p>Quản lý lịch rảnh và booking của học viên</p>
        </div>
        <BackHomeButton />
      </div>

      <div className="schedule-content">
        <div className="schedule-sidebar">
          <div className="sidebar-section">
            <h3>🔍 Lọc theo trạng thái</h3>
            <div className="filter-buttons">
              <button
                className={filterStatus === 'all' ? 'active' : ''}
                onClick={() => setFilterStatus('all')}
              >
                Tất cả đã thanh toán
              </button>
              <button
                className={filterStatus === 'pending' ? 'active' : ''}
                onClick={() => setFilterStatus('pending')}
              >
                Chờ xác nhận
              </button>
              <button
                className={filterStatus === 'accepted' ? 'active' : ''}
                onClick={() => setFilterStatus('accepted')}
              >
                Đã chấp nhận
              </button>
              <button
                className={filterStatus === 'completed' ? 'active' : ''}
                onClick={() => setFilterStatus('completed')}
              >
                Hoàn thành
              </button>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>📊 Thống kê</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{stats.paid}</div>
                <div className="stat-label">Đã thanh toán</div>
              </div>
              <div className="stat-card pending">
                <div className="stat-value">{stats.pending}</div>
                <div className="stat-label">Chờ xác nhận</div>
              </div>
              <div className="stat-card accepted">
                <div className="stat-value">{stats.accepted}</div>
                <div className="stat-label">Đã chấp nhận</div>
              </div>
              <div className="stat-card completed">
                <div className="stat-value">{stats.completed}</div>
                <div className="stat-label">Hoàn thành</div>
              </div>
            </div>
          </div>
        </div>

        <div className="schedule-main">
          <div className="calendar-section">
            <div className="section-header">
              <h2>🗓️ Lịch rảnh của bạn</h2>
              <button
                className="btn-edit"
                onClick={() => navigate('/tutor/profile-update')}
              >
                ✏️ Cập nhật lịch rảnh
              </button>
            </div>

            <div className="availability-calendar">
              <div className="calendar-header">
                <div className="header-cell time-cell">Thời gian</div>
                {getWeekDates().map((date, idx) => {
                  const dayName = WEEKDAYS[(idx + 1) % 7];
                  const isToday = date.toDateString() === new Date().toDateString();
                  return (
                    <div
                      key={idx}
                      className={`header-cell ${isToday ? 'today' : ''}`}
                    >
                      <div className="day-name">{dayName}</div>
                      <div className="day-date">
                        {date.getDate()}/{date.getMonth() + 1}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="calendar-body">
                {SESSIONS.map((session) => (
                  <div key={session.id} className="calendar-row">
                    <div className="time-cell">
                      <div className="session-label">{session.label}</div>
                      <div className="session-time">{session.time}</div>
                    </div>
                    {getWeekDates().map((date, idx) => {
                      const dayOfWeek = (idx + 1) % 7;
                      const available = isSessionAvailable(dayOfWeek, session.id);
                      return (
                        <div
                          key={idx}
                          className={`calendar-cell ${available ? 'available' : ''}`}
                        >
                          {available && <span className="checkmark">✓</span>}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {availability.length === 0 && (
              <div className="empty-state">
                <p>📭 Bạn chưa đăng ký lịch rảnh</p>
                <button
                  className="btn-primary"
                  onClick={() => navigate('/tutor/profile-update')}
                >
                  Đăng ký ngay
                </button>
              </div>
            )}
          </div>

          {/* LỊCH DẠY MỚI - CALENDAR VIEW CHI TIẾT */}
          <div className="calendar-section" style={{ marginTop: "32px" }}>
            <div className="section-header">
              <h2>📚 Lịch dạy trong tuần</h2>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <div style={{ fontSize: "13px", color: "#6B7280" }}>
                  <span style={{ display: "inline-block", width: "12px", height: "12px", background: "#10B981", borderRadius: "2px", marginRight: "6px" }}></span>
                  Đã có lịch dạy
                </div>
                <div style={{ fontSize: "13px", color: "#6B7280" }}>
                  <span style={{ display: "inline-block", width: "12px", height: "12px", background: "#E5E7EB", borderRadius: "2px", marginRight: "6px" }}></span>
                  Trống
                </div>
              </div>
            </div>

            <div className="week-navigation">
              <button className="btn-nav" onClick={prevWeek}>
                ◀ Tuần trước
              </button>
              <div className="week-info">
                <div className="week-range">{getWeekRange()}</div>
                <button className="btn-today" onClick={goToCurrentWeek}>
                  Tuần này
                </button>
              </div>
              <button className="btn-nav" onClick={nextWeek}>
                Tuần sau ▶
              </button>
            </div>

            <div className="teaching-calendar">
              <div className="calendar-header">
                <div className="header-cell time-cell">Buổi học</div>
                {getWeekDates().map((date, idx) => {
                  const dayName = WEEKDAYS[(idx + 1) % 7];
                  const isToday = date.toDateString() === new Date().toDateString();
                  return (
                    <div
                      key={idx}
                      className={`header-cell ${isToday ? 'today' : ''}`}
                    >
                      <div className="day-name">{dayName}</div>
                      <div className="day-date">
                        {date.getDate()}/{date.getMonth() + 1}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="calendar-body">
                {(() => {
                  const timeSlots = getUniqueTimeSlots();
                  
                  if (timeSlots.length === 0) {
                    return (
                      <div style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        color: '#9CA3AF'
                      }}>
                        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📭</div>
                        <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>Chưa có lịch dạy trong tuần này</p>
                        <p style={{ fontSize: '0.95rem', marginTop: '8px' }}>Các buổi học đã thanh toán sẽ hiển thị tại đây</p>
                      </div>
                    );
                  }
                  
                  return timeSlots.map((slot) => (
                    <div key={slot.id} className="calendar-row">
                      <div className="time-cell">
                        <div className="session-label">{slot.label}</div>
                        <div className="session-time">{slot.time}</div>
                      </div>
                      {getWeekDates().map((date, idx) => {
                        const dayOfWeek = (idx + 1) % 7;
                        const booking = getBookingForSlot(idx, slot.id);
                        
                        if (booking) {
                          const subjectName = booking.subject || 
                                            booking.contractData?.subject || 
                                            booking.tutorProfile?.subjects?.[0]?.name || 
                                            'Môn học';
                          console.log('Booking found in slot:', {
                            slotId: slot.id,
                            dayIdx: idx,
                            bookingSubject: booking.subject,
                            contractSubject: booking.contractData?.subject,
                            tutorSubjects: booking.tutorProfile?.subjects,
                            finalSubject: subjectName
                          });
                        }
                        
                        return (
                          <div
                            key={idx}
                            className={`calendar-cell ${booking ? 'has-booking' : ''}`}
                            title={booking ? `${booking.student?.full_name || 'Học viên'} - ${booking.subject || booking.contractData?.subject || booking.tutorProfile?.subjects?.[0]?.name || 'Môn học'}` : ''}
                          >
                            {booking && (
                              <div className="booking-info">
                                <div style={{ fontWeight: "700", fontSize: "13px", marginBottom: "4px", color: "#047857" }}>
                                  {booking.subject || booking.contractData?.subject || booking.tutorProfile?.subjects?.[0]?.name || 'Môn học'}
                                </div>
                                <div style={{ fontWeight: "500", fontSize: "11px", marginBottom: "2px", color: "#065F46" }}>
                                  {booking.student?.full_name || 'Học viên'}
                                </div>
                                {booking.mode === 'online' && (
                                  <div style={{ marginTop: "2px", fontSize: "10px", color: "#059669" }}>
                                    💻 Online
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ));
                })()}
              </div>
            </div>

            {bookings.filter(b => b.paymentStatus === 'paid').length === 0 && (
              <div className="empty-state" style={{ marginTop: "24px" }}>
                <p>📭 Chưa có lịch dạy nào trong tuần này</p>
              </div>
            )}
          </div>

          <div className="bookings-section">
            <div className="section-header">
              <h2>📚 Lịch dạy (Đã thanh toán)</h2>
              <span className="badge">
                {filteredBookings.length}
              </span>
            </div>

            <div className="bookings-list">
              {filteredBookings.length === 0 ? (
                <div className="empty-state">
                  <p>Không có lịch dạy nào</p>
                </div>
              ) : (
                filteredBookings.map((booking) => (
                  <div
                    key={booking._id}
                    className={`booking-card status-${booking.status}`}
                  >
                    <div className="booking-header">
                      <div className="student-info">
                        <h4>{booking.student?.full_name || booking.studentName || 'Học viên'}</h4>
                        <span className="subject">
                          {booking.subject || 'Môn học'}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <span className={`status-badge ${booking.status}`}>
                          {booking.status === 'pending' && 'Chờ xác nhận'}
                          {booking.status === 'accepted' && 'Đã chấp nhận'}
                          {booking.status === 'completed' && 'Hoàn thành'}
                          {booking.status === 'cancelled' && 'Đã hủy'}
                        </span>
                        <span className="status-badge" style={{ background: "#D1FAE5", color: "#065F46" }}>
                          💰 Đã thanh toán
                        </span>
                      </div>
                    </div>

                    {/* Recurring Schedule */}
                    {booking.type === 'recurring' && booking.recurrencePattern?.selectedSlots && (
                      <div style={{
                        background: "#F0F9FF",
                        padding: "12px",
                        borderRadius: "8px",
                        margin: "12px 0",
                        border: "1px solid #BAE6FD"
                      }}>
                        <div style={{ fontSize: "13px", fontWeight: "600", color: "#0C4A6E", marginBottom: "8px" }}>
                          🔄 Lịch định kỳ
                        </div>
                        <div style={{ fontSize: "13px", color: "#075985", marginBottom: "6px" }}>
                          <strong>Thời gian:</strong> {(() => {
                            const startDate = booking.recurrencePattern.startDate;
                            const endDate = booking.recurrencePattern.endDate;
                            if (!startDate || !endDate) return "Chưa có thời gian";
                            const start = new Date(startDate);
                            const end = new Date(endDate);
                            if (isNaN(start.getTime()) || isNaN(end.getTime())) return "Chưa có thời gian";
                            return `${start.toLocaleDateString('vi-VN')} - ${end.toLocaleDateString('vi-VN')}`;
                          })()}
                        </div>
                        <div style={{ fontSize: "13px", color: "#075985", marginBottom: "6px" }}>
                          <strong>Lịch trong tuần:</strong>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                          {booking.recurrencePattern.selectedSlots.map((slot, idx) => (
                            <span key={idx} style={{
                              background: "#0EA5E9",
                              color: "white",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "600"
                            }}>
                              {["CN", "T2", "T3", "T4", "T5", "T6", "T7"][slot.dayOfWeek]} ({slot.start}-{slot.end})
                            </span>
                          ))}
                        </div>
                        <div style={{ fontSize: "13px", color: "#075985", marginTop: "8px" }}>
                          <strong>Tiến độ:</strong> {booking.completedSessions || 0}/{booking.totalSessionsPlanned || 0} buổi
                        </div>
                      </div>
                    )}

                    <div className="booking-details">
                      {booking.type !== 'recurring' && (
                        <>
                          <div className="detail-item">
                            <span className="icon">📆</span>
                            <span>
                              {(() => {
                                if (!booking.start) return "Chưa có ngày";
                                const date = new Date(booking.start);
                                if (isNaN(date.getTime())) return "Chưa có ngày";
                                return date.toLocaleDateString('vi-VN');
                              })()}
                            </span>
                          </div>
                          <div className="detail-item">
                            <span className="icon">⏰</span>
                            <span>
                              {(() => {
                                if (!booking.start || !booking.end) return "Chưa có giờ";
                                const start = new Date(booking.start);
                                const end = new Date(booking.end);
                                if (isNaN(start.getTime()) || isNaN(end.getTime())) return "Chưa có giờ";
                                return `${start.toLocaleTimeString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })} - ${end.toLocaleTimeString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}`;
                              })()}
                            </span>
                          </div>
                        </>
                      )}
                      <div className="detail-item">
                        <span className="icon">💰</span>
                        <span>{(booking.totalPrice || booking.price || 0).toLocaleString()} đ</span>
                      </div>
                    </div>

                    {booking.notes && (
                      <div className="booking-notes">
                        <strong>Ghi chú:</strong> {booking.notes}
                      </div>
                    )}

                    {booking.status === 'pending' && (
                      <div className="booking-actions">
                        <button
                          className="btn-accept"
                          onClick={() =>
                            handleBookingAction(booking._id, 'accept')
                          }
                        >
                          ✓ Chấp nhận
                        </button>
                        <button
                          className="btn-reject"
                          onClick={() =>
                            handleBookingAction(booking._id, 'reject')
                          }
                        >
                          ✕ Từ chối
                        </button>
                      </div>
                    )}

                    {booking.status === 'accepted' && canCompleteBooking(booking) && (
                      <div className="booking-actions">
                        <button
                          className="btn-complete"
                          onClick={() => handleCompleteBooking(booking._id)}
                          style={{
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.3s',
                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                          }}
                          onMouseOver={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
                          }}
                          onMouseOut={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
                          }}
                        >
                          🎓 Hoàn thành khóa học
                        </button>
                      </div>
                    )}

                    {booking.status === 'completed' && (
                      <div style={{
                        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        marginTop: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        border: '1px solid #86efac'
                      }}>
                        <span style={{ fontSize: '20px' }}>✅</span>
                        <span style={{ color: '#166534', fontWeight: '600' }}>Đã hoàn thành</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  );
}
