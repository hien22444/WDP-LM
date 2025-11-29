import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { getTutorProfile, createRecurringBooking } from "../../services/BookingService";
import "./BookingPage.scss";

const BookingPage = () => {
  const { tutorId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useSelector((state) => state.user.user);
  const [tutor, setTutor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");

  const [bookingData, setBookingData] = useState({
    subject: null,
    start: "",
    end: "",
    mode: "online",
    notes: "",
    numberOfSessions: 1,
    weeklySchedule: [], // Array of selected day slots with custom time: [{dayOfWeek, session, startTime, endTime}]
    numberOfWeeks: 1,
    flexibleSchedule: false,
    daySchedules: {},
    pricePerSession: 0,
    totalPrice: 0,
  });

  const [selectedSlots, setSelectedSlots] = useState([]); // Slots được chọn: [{dayOfWeek, session: 'morning'|'afternoon'}]
  
  // Time settings for all morning/afternoon slots
  const [morningTime, setMorningTime] = useState({ start: '07:00', end: '09:00' });
  const [afternoonTime, setAfternoonTime] = useState({ start: '13:00', end: '15:00' });

  // Helper function to validate time duration
  const validateTimeDuration = (startTime, endTime) => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    const durationHours = durationMinutes / 60;
    return durationHours;
  };

  // Tự động tính toán khi có thay đổi
  useEffect(() => {
    if (bookingData.start && selectedSlots.length > 0 && bookingData.numberOfWeeks > 0) {
      calculateBookingDetails();
    }
  }, [bookingData.start, selectedSlots, bookingData.numberOfWeeks, tutor]);

  const calculateBookingDetails = () => {
    const startDate = new Date(bookingData.start);
    const numberOfSessions = selectedSlots.length * bookingData.numberOfWeeks;
    const daysToAdd = (bookingData.numberOfWeeks * 7) - 1;
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + daysToAdd);
    
    const pricePerSession = tutor?.price || 0;
    const totalPrice = numberOfSessions * pricePerSession;

    setBookingData(prev => ({
      ...prev,
      numberOfSessions,
      end: endDate.toISOString(), // Use full ISO string
      pricePerSession,
      totalPrice,
      weeklySchedule: selectedSlots.map(s => s.dayOfWeek)
    }));
  };

  const toggleSlot = (dayOfWeek, session) => {
    const exists = selectedSlots.find(s => s.dayOfWeek === dayOfWeek && s.session === session);
    
    if (exists) {
      // Remove slot
      setSelectedSlots(prev => prev.filter(s => !(s.dayOfWeek === dayOfWeek && s.session === session)));
    } else {
      // Add slot (time will be taken from morningTime/afternoonTime)
      setSelectedSlots(prev => [...prev, { dayOfWeek, session }]);
    }
  };

  const removeSlot = (dayOfWeek, session) => {
    setSelectedSlots(prev => prev.filter(s => !(s.dayOfWeek === dayOfWeek && s.session === session)));
  };

  const updateSessionTime = (session, start, end) => {
    // Validate duration (minimum 2 hours)
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    const durationHours = durationMinutes / 60;
    
    if (durationHours < 2) {
      toast.error('Buổi học phải có thời lượng tối thiểu 2 giờ!');
      return false;
    }
    
    if (durationHours > 8) {
      toast.error('Buổi học không được quá 8 giờ!');
      return false;
    }
    
    // Validate time range
    const timeRanges = {
      morning: { min: '07:00', max: '11:30' },
      afternoon: { min: '13:00', max: '16:30' }
    };
    
    const range = timeRanges[session];
    if (start < range.min || end > range.max) {
      const sessionName = session === 'morning' ? 'sáng' : 'chiều';
      toast.error(`Giờ học buổi ${sessionName} phải trong khoảng ${range.min} - ${range.max}!`);
      return false;
    }

    // Update time for the session
    if (session === 'morning') {
      setMorningTime({ start, end });
    } else {
      setAfternoonTime({ start, end });
    }
    
    toast.success(`Đã cập nhật giờ học cho tất cả buổi ${session === 'morning' ? 'sáng' : 'chiều'}!`);
    return true;
  };

  useEffect(() => {
    if (!currentUser) {
      toast.error("Vui lòng đăng nhập để đặt lịch học");
      navigate("/signin", { state: { from: location.pathname } });
      return;
    }

    fetchTutorData();
  }, [tutorId, currentUser]);

  const fetchTutorData = async () => {
    try {
      setLoading(true);
      const response = await getTutorProfile(tutorId);
      
      // Extract tutor from response (API returns { tutor: {...}, message: "..." })
      const data = response.tutor || response;
      
      console.log('📊 Tutor Data:', data);
      console.log('📅 Availability:', data.availability);
      
      // Fallback: Nếu không có availability, tạo mock data mẫu
      if (!data.availability || data.availability.length === 0) {
        data.availability = [
          { dayOfWeek: 1, start: "08:00", end: "11:30" }, // T2 sáng
          { dayOfWeek: 1, start: "14:00", end: "17:00" }, // T2 chiều
          { dayOfWeek: 3, start: "08:00", end: "11:30" }, // T4 sáng
          { dayOfWeek: 3, start: "14:00", end: "17:00" }, // T4 chiều
          { dayOfWeek: 5, start: "08:00", end: "11:30" }, // T6 sáng
          { dayOfWeek: 6, start: "14:00", end: "17:00" }, // T7 chiều
        ];
        console.log('⚠️ Using mock availability data');
      }
      
      setTutor(data);
      
      // Set initial booking data with tutor's price
      setBookingData(prev => ({
        ...prev,
        mode: data?.teachModes?.includes("online") ? "online" : "offline",
        pricePerSession: data.price || 0,
        totalPrice: data.price || 0,
      }));
    } catch (error) {
      console.error("Error fetching tutor:", error);
      toast.error("Không thể tải thông tin gia sư");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingData({ ...bookingData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!bookingData.subject) {
      setBookingError("Vui lòng chọn môn học");
      return;
    }

    if (!bookingData.start) {
      setBookingError("Vui lòng chọn ngày bắt đầu");
      return;
    }

    if (selectedSlots.length === 0) {
      setBookingError("Vui lòng chọn ít nhất 1 buổi học trên lịch");
      return;
    }

    // Validate morning time if any morning slots selected
    if (selectedSlots.some(s => s.session === 'morning')) {
      const morningDuration = validateTimeDuration(morningTime.start, morningTime.end);
      
      if (morningDuration < 2) {
        setBookingError("Giờ học buổi sáng phải có thời lượng tối thiểu 2 giờ");
        toast.error("Giờ học buổi sáng phải có thời lượng tối thiểu 2 giờ");
        return;
      }

      if (morningTime.end > '11:30') {
        setBookingError("Giờ kết thúc buổi sáng không được quá 11:30");
        toast.error("Giờ kết thúc buổi sáng không được quá 11:30");
        return;
      }
    }

    // Validate afternoon time if any afternoon slots selected
    if (selectedSlots.some(s => s.session === 'afternoon')) {
      const afternoonDuration = validateTimeDuration(afternoonTime.start, afternoonTime.end);
      
      if (afternoonDuration < 2) {
        setBookingError("Giờ học buổi chiều phải có thời lượng tối thiểu 2 giờ");
        toast.error("Giờ học buổi chiều phải có thời lượng tối thiểu 2 giờ");
        return;
      }

      if (afternoonTime.end > '16:30') {
        setBookingError("Giờ kết thúc buổi chiều không được quá 16:30");
        toast.error("Giờ kết thúc buổi chiều không được quá 16:30");
        return;
      }
    }

    if (bookingData.numberOfWeeks === 0) {
      setBookingError("Vui lòng nhập số tuần học");
      return;
    }

    if (!bookingData.mode) {
      setBookingError("Vui lòng chọn hình thức học");
      return;
    }

    try {
      setBookingLoading(true);
      setBookingError("");

      console.log("=== DEBUG BOOKING ===");
      console.log("Tutor object:", tutor);
      console.log("Tutor ID:", tutor?.id);
      console.log("Tutor teachModes:", tutor?.teachModes);
      console.log("Booking data:", bookingData);
      console.log("Selected slots:", selectedSlots);

      if (!tutor || !tutor.id) {
        throw new Error("Không tìm thấy thông tin gia sư. Vui lòng tải lại trang.");
      }

      // Map selectedSlots to include time from morningTime/afternoonTime
      const slotsWithTime = selectedSlots.map(slot => {
        if (slot.session === 'morning') {
          return {
            dayOfWeek: slot.dayOfWeek,
            start: morningTime.start,
            end: morningTime.end
          };
        } else {
          return {
            dayOfWeek: slot.dayOfWeek,
            start: afternoonTime.start,
            end: afternoonTime.end
          };
        }
      });

      const bookingPayload = {
        tutorProfileId: tutor.id,
        startDate: bookingData.start.split('T')[0], // Chỉ lấy ngày (YYYY-MM-DD)
        selectedSlots: slotsWithTime, // Array of {dayOfWeek, start, end}
        numberOfWeeks: bookingData.numberOfWeeks,
        mode: bookingData.mode,
        pricePerSession: bookingData.pricePerSession,
        notes: bookingData.notes || "",
      };

      console.log("Booking Payload:", JSON.stringify(bookingPayload, null, 2));
      
      const result = await createRecurringBooking(bookingPayload);
      
      console.log("✅ Booking created, redirecting to payment...", result);
      
      // Don't navigate here - let the service handle payment redirect
      // toast.success("Đặt lịch học thành công!");
      // navigate(`/tutor/${tutor._id}`);
      
    } catch (error) {
      console.error("Error creating booking:", error);
      console.error("Error response:", error.response?.data);
      console.error("Validation errors:", error.response?.data?.errors);
      const errorMessage = error.response?.data?.errors 
        ? error.response.data.errors.join(", ")
        : error.response?.data?.message || error.message || "Có lỗi xảy ra khi đặt lịch học";
      setBookingError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="booking-page-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải thông tin...</p>
      </div>
    );
  }

  if (!tutor) {
    return null;
  }

  const daysVN = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  return (
    <div className="booking-page">
      <div className="booking-container">
        {/* Header */}
        <div className="booking-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <span>←</span> Quay lại
          </button>
          <h1>📅 Đặt lịch học</h1>
        </div>

        <div className="booking-content">
          {/* Tutor Info Card */}
          <div className="tutor-info-card">
            <div className="tutor-avatar">
              <img 
                src={tutor.profilePicture || "/default-avatar.png"} 
                alt={tutor.name}
              />
            </div>
            <div className="tutor-details">
              <h2>{tutor.name}</h2>
              <div className="tutor-meta">
                <span className="tutor-rating">
                  ⭐ {tutor.rating || 0} ({tutor.reviewCount || 0} đánh giá)
                </span>
                <span className="tutor-price">
                  💰 {tutor.price?.toLocaleString()}đ /buổi
                </span>
              </div>
              <div className="tutor-subjects">
                {tutor.subjects?.map((subject, index) => {
                  const subjectName = typeof subject === 'string' ? subject : subject.name;
                  return (
                    <span key={index} className="subject-tag">{subjectName}</span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Availability Calendar */}
          <div className="tutor-availability-section">
            <h3>📅 Lịch</h3>
            
            {!tutor.availability || tutor.availability.length === 0 ? (
              <div style={{ 
                padding: '40px', 
                textAlign: 'center', 
                background: '#fef2f2',
                borderRadius: '12px',
                color: '#991b1b'
              }}>
                <i className="fas fa-calendar-times" style={{ fontSize: '48px', marginBottom: '16px' }}></i>
                <p style={{ fontSize: '16px', fontWeight: 600 }}>Gia sư chưa cập nhật lịch rảnh</p>
              </div>
            ) : (
              <>
                <div className="availability-legend">
                  <div className="legend-item">
                    <span className="color-box available"></span>
                    <span>Rảnh (Click để chọn)</span>
                  </div>
                  <div className="legend-item">
                    <span className="color-box selected" style={{background: '#3b82f6'}}></span>
                    <span>Đã chọn</span>
                  </div>
                  <div className="legend-item">
                    <span className="color-box unavailable"></span>
                    <span>Không rảnh</span>
                  </div>
                </div>
                <div className="availability-grid">
                  <div className="availability-header">
                    <div className="availability-cell header-cell">Thời gian</div>
                    {daysVN.map(day => (
                      <div key={day} className="availability-cell header-cell">{day}</div>
                    ))}
                  </div>
                  
                  {/* Morning Session */}
                  <div className="availability-row">
                    <div className="availability-cell session-label">
                      <div style={{ fontWeight: 700, fontSize: '14px' }}>Buổi sáng</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>07:00 - 11:30</div>
                    </div>
                    {[0,1,2,3,4,5,6].map(dayIndex => {
                      // Check if tutor has any morning slot for this day
                      const hasMorningSlot = tutor.availability?.some(
                        s => s.dayOfWeek === dayIndex && parseInt(s.start.split(':')[0]) < 12
                      );
                      const isAvailable = hasMorningSlot;
                      const isSelected = selectedSlots.some(
                        s => s.dayOfWeek === dayIndex && s.session === 'morning'
                      );
                      const selectedSlot = selectedSlots.find(
                        s => s.dayOfWeek === dayIndex && s.session === 'morning'
                      );
                      
                      return (
                        <div 
                          key={dayIndex} 
                          className={`availability-cell ${
                            isSelected ? 'selected' : isAvailable ? 'available' : 'unavailable'
                          } ${isAvailable ? 'clickable' : ''}`}
                          onClick={() => isAvailable && toggleSlot(dayIndex, 'morning')}
                          style={{ cursor: isAvailable ? 'pointer' : 'not-allowed', position: 'relative' }}
                        >
                          {isSelected ? (
                            <span className="check-icon">✓</span>
                          ) : isAvailable ? (
                            <span className="check-icon">✓</span>
                          ) : (
                            <span className="x-icon">−</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Afternoon Session */}
                  <div className="availability-row">
                    <div className="availability-cell session-label">
                      <div style={{ fontWeight: 700, fontSize: '14px' }}>Buổi chiều</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>13:00 - 16:30</div>
                    </div>
                    {[0,1,2,3,4,5,6].map(dayIndex => {
                      // Check if tutor has any afternoon slot for this day
                      const hasAfternoonSlot = tutor.availability?.some(
                        s => s.dayOfWeek === dayIndex && parseInt(s.start.split(':')[0]) >= 12
                      );
                      const isAvailable = hasAfternoonSlot;
                      const isSelected = selectedSlots.some(
                        s => s.dayOfWeek === dayIndex && s.session === 'afternoon'
                      );
                      
                      return (
                        <div 
                          key={dayIndex} 
                          className={`availability-cell ${
                            isSelected ? 'selected' : isAvailable ? 'available' : 'unavailable'
                          } ${isAvailable ? 'clickable' : ''}`}
                          onClick={() => isAvailable && toggleSlot(dayIndex, 'afternoon')}
                          style={{ cursor: isAvailable ? 'pointer' : 'not-allowed', position: 'relative' }}
                        >
                          {isSelected ? (
                            <span className="check-icon">✓</span>
                          ) : isAvailable ? (
                            <span className="check-icon">✓</span>
                          ) : (
                            <span className="x-icon">−</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Time Selection Forms - One for morning, one for afternoon */}
          {selectedSlots.some(s => s.session === 'morning') && (
            <div className="time-selection-card morning">
              <div className="time-selection-header">
                <h3>🌅 Giờ học cho TẤT CẢ buổi sáng</h3>
                <div className="time-selection-info">
                  <span className="info-badge">
                    📅 {selectedSlots.filter(s => s.session === 'morning').length} buổi sáng đã chọn
                  </span>
                  <span className="info-badge time-range">
                    Khung giờ: 07:00 - 11:30
                  </span>
                </div>
                <div style={{ marginTop: '12px' }}>
                  <small style={{ color: '#92400e', fontSize: '13px', fontWeight: 500 }}>
                    💡 Gợi ý: 07:00-09:00 | 07:30-09:30 | 08:00-10:00 | 08:30-10:30 | 09:00-11:00 | 09:30-11:30
                  </small>
                </div>
              </div>

              <div className="time-selection-body">
                <div className="time-input-row">
                  <div className="time-input-group">
                    <label>Giờ bắt đầu <span className="required">*</span></label>
                    <select
                      value={morningTime.start}
                      onChange={(e) => {
                        const newStart = e.target.value;
                        setMorningTime({ ...morningTime, start: newStart });
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #f59e0b',
                        borderRadius: '10px',
                        fontSize: '16px',
                        fontWeight: 600,
                        background: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="07:00">07:00</option>
                      <option value="07:30">07:30</option>
                      <option value="08:00">08:00</option>
                      <option value="08:30">08:30</option>
                      <option value="09:00">09:00</option>
                      <option value="09:30">09:30</option>
                    </select>
                  </div>

                  <div className="time-arrow">→</div>

                  <div className="time-input-group">
                    <label>Giờ kết thúc <span className="required">*</span></label>
                    <select
                      value={morningTime.end}
                      onChange={(e) => {
                        setMorningTime({ ...morningTime, end: e.target.value });
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #f59e0b',
                        borderRadius: '10px',
                        fontSize: '16px',
                        fontWeight: 600,
                        background: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="09:00">09:00</option>
                      <option value="09:30">09:30</option>
                      <option value="10:00">10:00</option>
                      <option value="10:30">10:30</option>
                      <option value="11:00">11:00</option>
                      <option value="11:30">11:30</option>
                    </select>
                  </div>

                  <div className="duration-indicator">
                    {(() => {
                      const duration = validateTimeDuration(morningTime.start, morningTime.end);
                      const isValid = duration >= 2 && morningTime.end <= '11:30';
                      
                      return (
                        <div className={`duration-badge ${isValid ? 'valid' : 'invalid'}`}>
                          <div style={{ fontSize: '14px', marginBottom: '4px', opacity: 0.8 }}>Thời lượng</div>
                          <strong style={{ fontSize: '20px' }}>{duration}h</strong>
                          {duration < 2 && <span className="warning">⚠️ Tối thiểu 2h</span>}
                          {morningTime.end > '11:30' && <span className="warning">⚠️ Quá 11:30</span>}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedSlots.some(s => s.session === 'afternoon') && (
            <div className="time-selection-card afternoon">
              <div className="time-selection-header">
                <h3>🌆 Giờ học cho TẤT CẢ buổi chiều</h3>
                <div className="time-selection-info">
                  <span className="info-badge">
                    📅 {selectedSlots.filter(s => s.session === 'afternoon').length} buổi chiều đã chọn
                  </span>
                  <span className="info-badge time-range">
                    Khung giờ: 13:00 - 16:30
                  </span>
                </div>
                <div style={{ marginTop: '12px' }}>
                  <small style={{ color: '#9a3412', fontSize: '13px', fontWeight: 500 }}>
                    💡 Gợi ý: 13:00-15:00 | 13:30-15:30 | 14:00-16:00 | 14:30-16:30
                  </small>
                </div>
              </div>

              <div className="time-selection-body">
                <div className="time-input-row">
                  <div className="time-input-group">
                    <label>Giờ bắt đầu <span className="required">*</span></label>
                    <select
                      value={afternoonTime.start}
                      onChange={(e) => {
                        const newStart = e.target.value;
                        setAfternoonTime({ ...afternoonTime, start: newStart });
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #f97316',
                        borderRadius: '10px',
                        fontSize: '16px',
                        fontWeight: 600,
                        background: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="13:00">13:00</option>
                      <option value="13:30">13:30</option>
                      <option value="14:00">14:00</option>
                      <option value="14:30">14:30</option>
                      <option value="15:00">15:00</option>
                      <option value="15:30">15:30</option>
                    </select>
                  </div>

                  <div className="time-arrow">→</div>

                  <div className="time-input-group">
                    <label>Giờ kết thúc <span className="required">*</span></label>
                    <select
                      value={afternoonTime.end}
                      onChange={(e) => {
                        setAfternoonTime({ ...afternoonTime, end: e.target.value });
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #f97316',
                        borderRadius: '10px',
                        fontSize: '16px',
                        fontWeight: 600,
                        background: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="15:00">15:00</option>
                      <option value="15:30">15:30</option>
                      <option value="16:00">16:00</option>
                      <option value="16:30">16:30</option>
                    </select>
                  </div>

                  <div className="duration-indicator">
                    {(() => {
                      const duration = validateTimeDuration(afternoonTime.start, afternoonTime.end);
                      const isValid = duration >= 2 && afternoonTime.end <= '16:30';
                      
                      return (
                        <div className={`duration-badge ${isValid ? 'valid' : 'invalid'}`}>
                          <div style={{ fontSize: '14px', marginBottom: '4px', opacity: 0.8 }}>Thời lượng</div>
                          <strong style={{ fontSize: '20px' }}>{duration}h</strong>
                          {duration < 2 && <span className="warning">⚠️ Tối thiểu 2h</span>}
                          {afternoonTime.end > '16:30' && <span className="warning">⚠️ Quá 16:30</span>}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Booking Form */}
          <form className="booking-form" onSubmit={handleSubmit}>
            <h3>📝 Thông tin đặt lịch</h3>

            {bookingError && (
              <div className="error-message">
                <span>⚠️</span> {bookingError}
              </div>
            )}

            {/* Selected Slots Summary */}
            {selectedSlots.length > 0 && (
              <div style={{
                background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                border: '2px solid #0ea5e9',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#0c4a6e', fontSize: '15px' }}>
                  📅 Buổi học đã chọn ({selectedSlots.length} buổi/tuần)
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedSlots.map((slot, idx) => {
                    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                    const sessionLabel = slot.session === 'morning' ? '🌅 Sáng' : '🌆 Chiều';
                    const timeRange = slot.session === 'morning' 
                      ? `${morningTime.start} - ${morningTime.end}` 
                      : `${afternoonTime.start} - ${afternoonTime.end}`;
                    
                    return (
                      <div key={idx} style={{
                        background: 'white',
                        padding: '8px 14px',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#0c4a6e',
                        border: '2px solid #0ea5e9',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}>
                        <div>{dayNames[slot.dayOfWeek]} - {sessionLabel}</div>
                        <div style={{
                          fontSize: '12px',
                          color: '#0369a1',
                          fontWeight: 500
                        }}>
                          ⏰ {timeRange}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Subject Selection */}
            <div className="form-group">
              <label>Môn học <span className="required">*</span></label>
              <select
                name="subject"
                value={bookingData.subject?.name || bookingData.subject || ""}
                onChange={(e) => {
                  const selectedValue = e.target.value;
                  const selectedSubject = tutor.subjects?.find(s => {
                    const subjectName = typeof s === 'string' ? s : s.name;
                    return subjectName === selectedValue;
                  });
                  
                  // Normalize to object format
                  const normalizedSubject = typeof selectedSubject === 'string'
                    ? { name: selectedSubject, price: tutor.price, level: '', description: '' }
                    : selectedSubject;
                  
                  setBookingData({
                    ...bookingData,
                    subject: normalizedSubject
                  });
                }}
                required
              >
                <option value="">-- Chọn môn học --</option>
                {tutor.subjects?.map((subject, index) => {
                  const subjectName = typeof subject === 'string' ? subject : subject.name;
                  return (
                    <option key={index} value={subjectName}>{subjectName}</option>
                  );
                })}
              </select>
            </div>

            {/* Start Date */}
            <div className="form-group">
              <label>Ngày bắt đầu khóa học <span className="required">*</span></label>
              <input
                type="date"
                name="start"
                value={bookingData.start ? bookingData.start.split('T')[0] : ''}
                onChange={(e) => {
                  const date = e.target.value;
                  // Create a proper Date object and convert to ISO string
                  const dateObj = new Date(date + 'T08:00:00');
                  setBookingData({ ...bookingData, start: dateObj.toISOString() });
                }}
                min={new Date().toISOString().split('T')[0]}
                required
              />
              <small style={{ color: '#64748b', fontSize: '13px', display: 'block', marginTop: '6px' }}>
                📅 Chọn ngày bắt đầu học buổi đầu tiên
              </small>
            </div>

            {/* Number of Weeks */}
            <div className="form-group">
              <label>Số tuần học <span className="required">*</span></label>
              <input
                type="number"
                value={bookingData.numberOfWeeks}
                onChange={(e) => {
                  const weeks = parseInt(e.target.value) || 1;
                  setBookingData({ ...bookingData, numberOfWeeks: weeks });
                }}
                min="1"
                max="20"
                required
                style={{
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '10px',
                  fontSize: '15px'
                }}
              />
              <small style={{ color: '#64748b', fontSize: '13px', display: 'block', marginTop: '6px' }}>
                📆 Số tuần học (từ 1-20 tuần)
              </small>
            </div>

            {/* Auto-calculated Summary */}
            {bookingData.start && selectedSlots.length > 0 && bookingData.numberOfWeeks > 0 && (
              <div style={{
                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                border: '2px solid #22c55e',
                borderRadius: '12px',
                padding: '16px',
                marginTop: '16px'
              }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#166534', fontSize: '15px' }}>
                  📊 Tổng kết khóa học
                </h4>
                <div style={{ display: 'grid', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: '#166534' }}>Tổng số buổi học:</span>
                    <strong style={{ color: '#166534' }}>{bookingData.numberOfSessions} buổi</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: '#166534' }}>Ngày kết thúc dự kiến:</span>
                    <strong style={{ color: '#166534' }}>
                      {bookingData.end ? new Date(bookingData.end).toLocaleDateString('vi-VN') : '---'}
                    </strong>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontSize: '16px',
                    paddingTop: '8px',
                    borderTop: '1px solid #22c55e',
                    marginTop: '8px'
                  }}>
                    <span style={{ color: '#166534', fontWeight: 700 }}>💰 Tổng học phí:</span>
                    <strong style={{ color: '#166534', fontSize: '18px' }}>
                      {bookingData.totalPrice.toLocaleString()}đ
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* Mode */}
            <div className="form-group">
              <label>Hình thức học <span className="required">*</span></label>
              <div className="mode-options"
                style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                {(!tutor.teachModes || tutor.teachModes.length === 0 || tutor.teachModes?.includes("online")) && (
                  <label className={`mode-option ${bookingData.mode === 'online' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="mode"
                      value="online"
                      checked={bookingData.mode === "online"}
                      onChange={handleInputChange}
                    />
                    <span>💻 Online</span>
                  </label>
                )}
                {(!tutor.teachModes || tutor.teachModes.length === 0 || tutor.teachModes?.includes("offline")) && (
                  <label className={`mode-option ${bookingData.mode === 'offline' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="mode"
                      value="offline"
                      checked={bookingData.mode === "offline"}
                      onChange={handleInputChange}
                    />
                    <span>🏫 Offline</span>
                  </label>
                )}
              </div>
              {(!tutor.teachModes || tutor.teachModes.length === 0) && (
                <small style={{ color: '#64748b', fontSize: '13px', display: 'block', marginTop: '6px' }}>
                  ⚠️ Gia sư chưa cập nhật hình thức dạy
                </small>
              )}
            </div>

            {/* Notes */}
            <div className="form-group">
              <label>Ghi chú</label>
              <textarea
                name="notes"
                value={bookingData.notes}
                onChange={handleInputChange}
                placeholder="Nhập ghi chú cho gia sư (nếu có)..."
                rows="4"
              />
            </div>

            {/* Validation Messages */}
            {(!bookingData.start || selectedSlots.length === 0 || bookingData.numberOfWeeks === 0) && (
              <div style={{
                background: '#fef2f2',
                border: '2px solid #f87171',
                borderRadius: '10px',
                padding: '12px 16px',
                color: '#991b1b',
                fontSize: '14px',
                marginBottom: '16px'
              }}>
                <strong>⚠️ Vui lòng hoàn thành:</strong>
                <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                  {!bookingData.start && <li>Chọn ngày bắt đầu</li>}
                  {selectedSlots.length === 0 && <li>Chọn ít nhất 1 buổi học trên lịch</li>}
                  {bookingData.numberOfWeeks === 0 && <li>Nhập số tuần học</li>}
                </ul>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="form-actions">
              <button 
                type="button" 
                className="btn-cancel"
                onClick={() => navigate(-1)}
              >
                Hủy
              </button>
              <button 
                type="submit" 
                className="btn-submit"
                disabled={
                  bookingLoading || 
                  !bookingData.start || 
                  selectedSlots.length === 0 || 
                  bookingData.numberOfWeeks === 0 ||
                  !bookingData.mode
                }
              >
                {bookingLoading ? (
                  <>
                    <span className="spinner"></span> Đang xử lý...
                  </>
                ) : (
                  <>✓ Xác nhận đặt lịch</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
