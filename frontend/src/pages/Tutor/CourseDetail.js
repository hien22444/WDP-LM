import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import CourseService from "../../services/CourseService";
import "./CourseDetail.scss";

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userState = useSelector((state) => state.user);
  const isAuthenticated = userState?.isAuthenticated;
  const isTutor = userState?.user?.role === "tutor" || userState?.account?.role === "tutor";

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        console.log("📖 Loading course:", id);
        const response = await CourseService.getCourseById(id);
        console.log("✅ Course loaded:", response);
        setCourse(response);
      } catch (e) {
        console.error("❌ Error loading course:", e);
        setError(e.response?.data?.message || "Không tải được chi tiết khóa học");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const DAYS_MAP = {
    monday: "Thứ 2",
    tuesday: "Thứ 3",
    wednesday: "Thứ 4",
    thursday: "Thứ 5",
    friday: "Thứ 6",
    saturday: "Thứ 7",
    sunday: "Chủ nhật"
  };

  if (loading) {
    return (
      <div className="course-detail-container">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="course-detail-container">
        <div className="error-message">{error || "Không tìm thấy khóa học"}</div>
        <button onClick={() => navigate(-1)} className="btn-back">
          ← Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="course-detail-container">
      <div className="detail-header">
        <button onClick={() => navigate(-1)} className="btn-back">
          ← Quay lại
        </button>
        <h1>{course.title}</h1>
        <p className="subject-name">{course.subject?.name}</p>
      </div>

      <div className="detail-content">
        <div className="main-info">
          <div className="info-card">
            <h3>Thông tin khóa học</h3>
            <div className="info-row">
              <label>Mô tả:</label>
              <span>{course.description}</span>
            </div>
            <div className="info-row">
              <label>Thời lượng:</label>
              <span>{course.duration.weeks} tuần</span>
            </div>
            <div className="info-row">
              <label>Ngày bắt đầu:</label>
              <span>{new Date(course.startDate).toLocaleDateString('vi-VN')}</span>
            </div>
            <div className="info-row">
              <label>Giá/buổi:</label>
              <span className="price">{course.price?.toLocaleString()} đ</span>
            </div>
            <div className="info-row">
              <label>Số học viên tối đa:</label>
              <span>{course.maxStudents} người</span>
            </div>
            <div className="info-row">
              <label>Học viên hiện tại:</label>
              <span>{course.currentStudents || 0} người</span>
            </div>
            <div className="info-row">
              <label>Trạng thái:</label>
              <span className={`status status-${course.status}`}>
                {course.status === 'draft' && 'Nháp'}
                {course.status === 'published' && 'Đã xuất bản'}
                {course.status === 'ongoing' && 'Đang diễn ra'}
                {course.status === 'completed' && 'Hoàn thành'}
              </span>
            </div>
          </div>

          <div className="info-card">
            <h3>Lịch học</h3>
            {course.schedule && course.schedule.length > 0 ? (
              <div className="schedule-list">
                {course.schedule.map((item, index) => (
                  <div key={index} className="schedule-item">
                    <i className="fas fa-calendar-day"></i>
                    <span className="day">{DAYS_MAP[item.dayOfWeek]}:</span>
                    <span className="time">{item.startTime} - {item.endTime}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p>Chưa có lịch học</p>
            )}
          </div>
        </div>

        <div className="sidebar">
          <div className="tutor-card">
            <h3>Gia sư</h3>
            {course.tutor && (
              <>
                <div className="tutor-info">
                  <p><strong>Tên:</strong> {course.tutor.user?.fullName || 'Chưa cập nhật'}</p>
                  <p><strong>Email:</strong> {course.tutor.user?.email || 'Chưa cập nhật'}</p>
                  {course.tutor.user?.phone && (
                    <p><strong>SĐT:</strong> {course.tutor.user.phone}</p>
                  )}
                </div>
                {isTutor && (
                  <div className="actions">
                    {course.status === 'draft' && (
                      <>
                        <button 
                          onClick={() => navigate(`/tutor/courses/edit/${course._id}`)}
                          className="btn-edit"
                        >
                          Chỉnh sửa
                        </button>
                        <button 
                          onClick={async () => {
                            if (window.confirm('Bạn muốn xuất bản khóa học này?')) {
                              try {
                                await CourseService.publishCourse(course._id);
                                alert('Đã xuất bản khóa học!');
                                navigate('/tutor/courses');
                              } catch (e) {
                                alert(e.response?.data?.message || 'Lỗi xuất bản');
                              }
                            }
                          }}
                          className="btn-publish"
                        >
                          Xuất bản
                        </button>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
