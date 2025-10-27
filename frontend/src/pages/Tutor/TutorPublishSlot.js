import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BackHomeButton from "../../components/Common/BackHomeButton";
import { useSelector } from "react-redux";
import { createTeachingSlot } from "../../services/BookingService";
import TutorService from "../../services/TutorService";
import AvailabilityGrid from "./AvailabilityGrid";
import DayTimeRanges from "./DayTimeRanges";
import DayTimeBlocks from "./DayTimeBlocks";
import "./TutorPublishSlot.scss";

const TutorPublishSlot = () => {
  const navigate = useNavigate();
  const isAuthenticated = useSelector((s) => s.user.isAuthenticated);
  const role = useSelector((s) => s.user.user?.account?.role);

  const [form, setForm] = useState({
    courseName: "",
    courseCode: "",
    // date/start/end không cần cho chế độ định kỳ
    mode: "online",
    location: "",
    price: "",
    notes: "",
    capacity: 1,
    recurringType: "weekly", // single | weekly | monthly (mặc định weekly để không cần ngày bắt đầu)
    recurringUntil: "",
    recurringDuration: 4 // số tuần/tháng
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [generatedAvailability, setGeneratedAvailability] = useState([]);
  const [pickerMode, setPickerMode] = useState('blocks'); // 'grid' | 'ranges' | 'blocks'
  const [tutorProfile, setTutorProfile] = useState(null);
  const [tutorSubjects, setTutorSubjects] = useState([]);

  // Load tutor profile to get subjects
  useEffect(() => {
    const loadTutorProfile = async () => {
      try {
        const profile = await TutorService.getMyTutorProfile();
        setTutorProfile(profile);
        if (profile?.subjects) {
          const subjects = profile.subjects.map(s => s.name || s);
          setTutorSubjects(subjects);
        }
      } catch (error) {
        console.error('Error loading tutor profile:', error);
      }
    };

    if (isAuthenticated && role === "tutor") {
      loadTutorProfile();
    }
  }, [isAuthenticated, role]);

  if (!isAuthenticated || role !== "tutor") {
    return (
      <div style={{ padding: 24 }}>
        <p>Vui lòng đăng nhập bằng tài khoản gia sư.</p>
      </div>
    );
  }

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setSuccess("");
    setSubmitting(true);
    try {
      const { courseName, courseCode, mode, price, notes, capacity, location, recurringType, recurringDuration } = form;

      // Client-side validations
      const errs = {};
      if (!courseName?.trim()) errs.courseName = "Vui lòng nhập tên khóa học";
      
      // Không cần ngày bắt đầu cho chế độ định kỳ
      if (mode === 'offline' && !location?.trim()) errs.location = "Vui lòng nhập địa điểm dạy (offline)";
      
      // Only validate recurring fields for weekly/monthly
      if (recurringType === 'weekly' || recurringType === 'monthly') {
        if (!recurringDuration) errs.recurringDuration = "Vui lòng nhập số tuần/tháng";
        if (recurringDuration < 1 || recurringDuration > 52) errs.recurringDuration = "Số tuần/tháng phải từ 1 đến 52";
        if (!generatedAvailability || generatedAvailability.length === 0) {
          errs.availability = "Vui lòng chọn ít nhất một khung giờ rảnh";
        }
      }
      if (Object.keys(errs).length) {
        console.log("Validation errors:", errs);
        setFieldErrors(errs);
        setSubmitting(false);
        return;
      }
      
      console.log("Form data:", form);
      console.log("Generated availability:", generatedAvailability);
      
      // Build payload (định kỳ)
      const payload = {
        courseName,
        start: new Date().toISOString(), // placeholder, backend sẽ dùng recurring
        end: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        mode,
        location: mode === 'offline' ? (location || '') : undefined,
        price: price ? Number(price) : undefined,
        notes,
        capacity: Number(capacity),
        recurring: {
          type: recurringType,
          duration: Number(recurringDuration),
          availability: generatedAvailability
        },
        courseCode: courseCode || undefined
      };
      await createTeachingSlot(payload);
      setSuccess("Đã tạo slot mở để học viên đặt");
      setTimeout(() => navigate("/tutor/schedule"), 1000);
    } catch (err) {
      setError(err?.response?.data?.message || "Tạo slot thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="publish-slot-container">
      <div className="publish-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <BackHomeButton />
        </div>
        <h2>Đăng lịch dạy mở</h2>
        <p>Đăng lịch học để học viên có thể đặt. Với chế độ định kỳ, bạn KHÔNG cần chọn ngày bắt đầu; hệ thống sẽ áp dụng cho các buổi theo thời khóa biểu.</p>

        <form onSubmit={onSubmit} className="publish-form">
          <div className="form-row">
            <label>Tên khóa học</label>
            <input type="text" name="courseName" value={form.courseName} onChange={onChange} placeholder="VD: Toán 12 - Hình học không gian" />
            {fieldErrors.courseName && <div className="field-error">{fieldErrors.courseName}</div>}
          </div>
          <div className="form-row">
            <label>Mã khóa (nhóm các buổi)</label>
            <input type="text" name="courseCode" value={form.courseCode} onChange={onChange} placeholder="VD: TOAN12-2025-01" />
            <div className="field-hint">Các buổi có cùng mã sẽ được gom nhóm trong trang chi tiết.</div>
          </div>

          {tutorSubjects.length > 0 && (
            <div className="form-row">
              <label>Gợi ý môn dạy từ hồ sơ</label>
              <div className="subject-suggestions">
                {tutorSubjects.map((subject, index) => (
                  <button
                    key={index}
                    type="button"
                    className="subject-suggestion-btn"
                    onClick={() => setForm(prev => ({ 
                      ...prev, 
                      courseName: `${subject} - ${prev.courseName || ''}`.trim()
                    }))}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* Tần suất đặt ngay sau tên khóa học */}
          <div className="form-row two-cols">
            <div>
              <label>Tần suất</label>
              <select name="recurringType" value={form.recurringType} onChange={onChange}>
                <option value="weekly">Đăng định kỳ hàng tuần</option>
                <option value="monthly">Đăng định kỳ hàng tháng</option>
              </select>
              <div className="field-hint">Chọn định kỳ nếu muốn học viên đặt theo thời khóa biểu, không cần ngày bắt đầu.</div>
            </div>
            {(form.recurringType === 'weekly' || form.recurringType === 'monthly') && (
              <div>
                <label>Dạy trong {form.recurringType === 'weekly' ? 'số tuần' : 'số tháng'}</label>
                <input 
                  type="number" 
                  name="recurringDuration" 
                  value={form.recurringDuration} 
                  onChange={onChange} 
                  min="1" 
                  max="52"
                  placeholder="4"
                />
                {fieldErrors.recurringDuration && <div className="field-error">{fieldErrors.recurringDuration}</div>}
              </div>
            )}
          </div>

          {/* Chỉ dùng thời khóa biểu định kỳ, không yêu cầu ngày bắt đầu */}
            <div className="form-row">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <label>Kiểu chọn thời khóa biểu:</label>
                <select value={pickerMode} onChange={(e) => setPickerMode(e.target.value)}>
                  <option value="grid">Lưới 30'</option>
                  <option value="ranges">Theo khoảng giờ</option>
                  <option value="blocks">Theo buổi (Sáng/Chiều/Tối)</option>
                </select>
              </div>
              <details open>
                <summary style={{ cursor: 'pointer' }}>Thời khóa biểu rảnh (mở rộng/thu gọn)</summary>
                <div style={{ marginTop: 12 }}>
                  {pickerMode === 'grid' ? (
                    <AvailabilityGrid 
                      startHour={7}
                      endHour={23}
                      stepMinutes={30}
                      onChange={(slots) => setGeneratedAvailability(slots)} 
                    />
                  ) : pickerMode === 'ranges' ? (
                    <DayTimeRanges
                      startHour={7}
                      endHour={23}
                      stepMinutes={30}
                      onChange={(slots) => setGeneratedAvailability(slots)}
                    />
                  ) : (
                    <DayTimeBlocks
                      onChange={(slots) => setGeneratedAvailability(slots)}
                    />
                  )}
                </div>
              </details>
              {fieldErrors.availability && <div className="field-error">{fieldErrors.availability}</div>}
              <div className="field-hint">Lịch rảnh sẽ dùng để tạo các buổi học định kỳ. Học viên đặt chỗ sẽ theo đúng các buổi này, không phụ thuộc ngày bắt đầu.</div>
            </div>
          
          <div className="form-row">
            <label>Hình thức</label>
            <select name="mode" value={form.mode} onChange={onChange}>
              <option value="online">Trực tuyến</option>
              <option value="offline">Tại nhà</option>
            </select>
          </div>
          {form.mode === 'offline' && (
            <div className="form-row">
              <label>Địa điểm dạy (offline)</label>
              <input type="text" name="location" value={form.location} onChange={onChange} placeholder="VD: 123 Lê Lợi, Q.1, TP.HCM" />
              {fieldErrors.location && <div className="field-error">{fieldErrors.location}</div>}
            </div>
          )}
          <div className="form-row two-cols">
            <div>
              <label>Giá (VNĐ)</label>
              <input type="number" name="price" value={form.price} onChange={onChange} placeholder="Mặc định theo hồ sơ" />
            </div>
            <div>
              <label>Số học viên</label>
              <input type="number" name="capacity" min="1" max="20" value={form.capacity} onChange={onChange} />
            </div>
          </div>
          
          <div className="form-row">
            <label>Ghi chú</label>
            <textarea name="notes" rows="3" value={form.notes} onChange={onChange} placeholder="Ví dụ: dạy Toán 12, ôn luyện thi..."></textarea>
          </div>

          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">{success}</div>}

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => navigate("/tutor/schedule")}>Hủy</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Đang tạo..." : "Đăng lịch mở"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TutorPublishSlot;


