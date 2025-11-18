import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CourseService from "../../services/CourseService";
import "./CourseForm.scss";

const DAYS_OF_WEEK = [
  { value: "monday", label: "Thứ 2" },
  { value: "tuesday", label: "Thứ 3" },
  { value: "wednesday", label: "Thứ 4" },
  { value: "thursday", label: "Thứ 5" },
  { value: "friday", label: "Thứ 6" },
  { value: "saturday", label: "Thứ 7" },
  { value: "sunday", label: "Chủ nhật" },
];

const CourseForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tutorSubjects, setTutorSubjects] = useState([]);

  const [formData, setFormData] = useState({
    subject: "",
    title: "",
    description: "",
    duration: { weeks: 4 },
    schedule: [],
    price: 100000,
    maxStudents: 10,
    startDate: "",
  });

  const [selectedDays, setSelectedDays] = useState([]);
  const [scheduleStartTime, setScheduleStartTime] = useState("");
  const [scheduleEndTime, setScheduleEndTime] = useState("");

  useEffect(() => {
    loadTutorSubjects();
    if (isEditMode) {
      loadCourse();
    }
  }, [id]);

  const loadTutorSubjects = async () => {
    try {
      console.log("📚 CourseForm: Starting to load tutor subjects...");
      const subjects = await CourseService.getTutorSubjects();
      console.log("📚 CourseForm: Subjects returned from service:", subjects);
      console.log("📚 CourseForm: Subjects type:", typeof subjects);
      console.log("📚 CourseForm: Is array:", Array.isArray(subjects));
      console.log("📚 CourseForm: Subjects length:", subjects?.length);
      
      setTutorSubjects(subjects);
      console.log("📚 CourseForm: State updated with subjects");
      
      if (subjects.length === 0) {
        console.warn("⚠️ CourseForm: No subjects found in tutor profile");
        setError("Bạn chưa có môn học nào trong hồ sơ gia sư. Vui lòng thêm môn học trước khi tạo khóa học.");
      } else {
        console.log("✅ CourseForm: Successfully loaded", subjects.length, "subjects");
      }
    } catch (err) {
      console.error("❌ CourseForm: Error in loadTutorSubjects:", err);
      console.error("❌ CourseForm: Error message:", err.message);
      console.error("❌ CourseForm: Error stack:", err.stack);
      setError("Không thể tải danh sách môn học. Vui lòng kiểm tra xem bạn đã có hồ sơ gia sư chưa.");
    }
  };

  const loadCourse = async () => {
    try {
      setLoading(true);
      const course = await CourseService.getCourseById(id);
      setFormData({
        subject: course.subject._id,
        title: course.title,
        description: course.description,
        duration: course.duration,
        schedule: course.schedule,
        price: course.price,
        maxStudents: course.maxStudents,
        startDate: course.startDate.split("T")[0],
      });
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải khóa học");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "weeks") {
      setFormData({ ...formData, duration: { weeks: parseInt(value) } });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleApplySchedule = () => {
    if (selectedDays.length === 0) {
      alert("Vui lòng chọn ít nhất 1 ngày");
      return;
    }

    if (!scheduleStartTime || !scheduleEndTime) {
      alert("Vui lòng chọn giờ bắt đầu và giờ kết thúc");
      return;
    }

    const [startHours] = scheduleStartTime.split(":");
    const [endHours] = scheduleEndTime.split(":");
    const startHour = parseInt(startHours);
    const endHour = parseInt(endHours);

    // Validate evening time (17:00-23:00)
    if (startHour < 17 || startHour >= 23) {
      alert("Giờ bắt đầu phải trong khoảng 17:00 - 23:00");
      return;
    }

    if (endHour < 17 || endHour > 23) {
      alert("Giờ kết thúc phải trong khoảng 17:00 - 23:00");
      return;
    }

    if (scheduleStartTime >= scheduleEndTime) {
      alert("Giờ kết thúc phải sau giờ bắt đầu");
      return;
    }

    // Add all selected days with same time
    const newSchedules = selectedDays.map(day => ({
      dayOfWeek: day,
      startTime: scheduleStartTime,
      endTime: scheduleEndTime
    }));

    // Remove duplicates and add new schedules
    const existingSchedules = formData.schedule.filter(
      s => !selectedDays.includes(s.dayOfWeek)
    );

    setFormData({
      ...formData,
      schedule: [...existingSchedules, ...newSchedules],
    });

    // Reset
    setSelectedDays([]);
    setScheduleStartTime("");
    setScheduleEndTime("");
  };

  const handleRemoveSchedule = (index) => {
    setFormData({
      ...formData,
      schedule: formData.schedule.filter((_, i) => i !== index),
    });
  };

  const validateForm = () => {
    if (!formData.subject) return "Vui lòng chọn môn học";
    if (!formData.title.trim()) return "Vui lòng nhập tên khóa học";
    if (!formData.description.trim()) return "Vui lòng nhập mô tả";
    if (formData.duration.weeks < 1 || formData.duration.weeks > 52)
      return "Thời lượng phải từ 1-52 tuần";
    if (formData.schedule.length === 0) return "Vui lòng thêm ít nhất 1 lịch học";
    if (formData.price < 2000) return "Giá tối thiểu 2,000đ/buổi";
    if (formData.maxStudents < 1 || formData.maxStudents > 50)
      return "Số học viên phải từ 1-50";
    if (!formData.startDate) return "Vui lòng chọn ngày bắt đầu";

    const startDate = new Date(formData.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) return "Ngày bắt đầu phải trong tương lai";

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError("");

      console.log("📤 Submitting course data:", formData);

      if (isEditMode) {
        const response = await CourseService.updateCourse(id, formData);
        console.log("✅ Update response:", response);
      } else {
        const response = await CourseService.createCourse(formData);
        console.log("✅ Create response:", response);
      }

      navigate("/tutor/courses");
    } catch (err) {
      console.error("❌ Submit error:", err);
      console.error("Error response:", err.response?.data);
      setError(err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return <div className="course-form-container"><div className="loading">Đang tải...</div></div>;
  }

  return (
    <div className="course-form-container">
      <div className="form-header">
        <h1>{isEditMode ? "Chỉnh sửa khóa học" : "Tạo khóa học mới"}</h1>
        <button className="btn-back" onClick={() => navigate("/tutor/courses")}>
          ← Quay lại
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="course-form">
        <div className="form-group">
          <label>Môn học *</label>
          <select
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
            disabled={isEditMode}
          >
            <option value="">-- Chọn môn học --</option>
            {tutorSubjects.map((subject) => (
              <option key={subject._id} value={subject._id}>
                {subject.name}
              </option>
            ))}
          </select>
          <small>Chỉ có thể chọn môn học từ hồ sơ gia sư của bạn</small>
        </div>

        <div className="form-group">
          <label>Tên khóa học *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="VD: Toán nâng cao lớp 10"
            required
          />
        </div>

        <div className="form-group">
          <label>Mô tả *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Mô tả chi tiết về khóa học..."
            rows="4"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Thời lượng (tuần) *</label>
            <input
              type="number"
              name="weeks"
              value={formData.duration.weeks}
              onChange={handleChange}
              min="1"
              max="52"
              required
            />
          </div>

          <div className="form-group">
            <label>Giá/buổi (VNĐ) *</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              min="2000"
              step="10000"
              required
            />
          </div>

          <div className="form-group">
            <label>Số học viên tối đa *</label>
            <input
              type="number"
              name="maxStudents"
              value={formData.maxStudents}
              onChange={handleChange}
              min="1"
              max="50"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Ngày bắt đầu *</label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            min={new Date().toISOString().split("T")[0]}
            required
          />
          <small>Ngày kết thúc sẽ tự động tính từ ngày bắt đầu + {formData.duration.weeks} tuần</small>
        </div>

        <div className="form-group">
          <label>Lịch học * (17:00 - 23:00)</label>
          
          <div className="day-selector">
            <p>Chọn các ngày trong tuần:</p>
            <div className="days-grid">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  className={`day-button ${selectedDays.includes(day.value) ? 'selected' : ''}`}
                  onClick={() => toggleDay(day.value)}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          <div className="time-selector">
            <div className="time-inputs">
              <div>
                <label>Giờ bắt đầu</label>
                <input
                  type="time"
                  value={scheduleStartTime}
                  onChange={(e) => setScheduleStartTime(e.target.value)}
                  min="17:00"
                  max="23:00"
                />
              </div>
              <div>
                <label>Giờ kết thúc</label>
                <input
                  type="time"
                  value={scheduleEndTime}
                  onChange={(e) => setScheduleEndTime(e.target.value)}
                  min="17:00"
                  max="23:00"
                />
              </div>
            </div>
            <button type="button" onClick={handleApplySchedule} className="btn-apply">
              Áp dụng cho các ngày đã chọn
            </button>
          </div>

          <div className="schedule-list">
            <p>Lịch đã thêm:</p>
            {formData.schedule.length === 0 ? (
              <p className="empty-schedule">Chưa có lịch học nào</p>
            ) : (
              formData.schedule.map((item, index) => (
                <div key={index} className="schedule-item">
                  <span>
                    {DAYS_OF_WEEK.find((d) => d.value === item.dayOfWeek)?.label}: {item.startTime} - {item.endTime}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSchedule(index)}
                    className="btn-remove"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate("/tutor/courses")}
            className="btn-cancel"
          >
            Hủy
          </button>
          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? "Đang lưu..." : isEditMode ? "Cập nhật" : "Tạo khóa học"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CourseForm;
