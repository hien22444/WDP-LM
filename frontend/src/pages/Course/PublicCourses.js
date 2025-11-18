import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CourseService from "../../services/CourseService";
import "./PublicCourses.scss";

const PublicCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    subject: "",
    minPrice: "",
    maxPrice: "",
  });

  useEffect(() => {
    loadCourses();
  }, [filters]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.subject) params.subject = filters.subject;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;

      const data = await CourseService.getPublicCourses(params);
      setCourses(data);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải khóa học");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleEnroll = async (courseId) => {
    try {
      await CourseService.enrollCourse(courseId);
      alert("Đăng ký thành công! Vui lòng thanh toán để hoàn tất.");
      navigate("/my-courses");
    } catch (err) {
      alert(err.response?.data?.message || "Không thể đăng ký khóa học");
    }
  };

  if (loading) {
    return (
      <div className="public-courses-container">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="public-courses-container">
      <div className="courses-header">
        <h1>Khóa học trực tuyến</h1>
        <p>Khám phá các khóa học chất lượng từ gia sư uy tín</p>
      </div>

      <div className="filters">
        <input
          type="text"
          name="subject"
          placeholder="Tìm kiếm môn học..."
          value={filters.subject}
          onChange={handleFilterChange}
        />
        <input
          type="number"
          name="minPrice"
          placeholder="Giá tối thiểu"
          value={filters.minPrice}
          onChange={handleFilterChange}
          min="0"
          step="10000"
        />
        <input
          type="number"
          name="maxPrice"
          placeholder="Giá tối đa"
          value={filters.maxPrice}
          onChange={handleFilterChange}
          min="0"
          step="10000"
        />
        <button onClick={loadCourses} className="btn-filter">
          Lọc
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="courses-grid">
        {courses.length === 0 ? (
          <div className="empty-state">
            <p>Không tìm thấy khóa học phù hợp</p>
          </div>
        ) : (
          courses.map((course) => (
            <div key={course._id} className="course-card">
              <div className="course-header">
                <h3>{course.title}</h3>
                <span className="price">{course.price.toLocaleString()}đ/buổi</span>
              </div>

              <div className="course-info">
                <p className="subject">{course.subject?.name}</p>
                <p className="description">{course.description}</p>

                <div className="course-details">
                  <span>📅 {course.duration.weeks} tuần</span>
                  <span>👥 {course.currentStudents}/{course.maxStudents} học viên</span>
                  <span>
                    📚 {CourseService.calculateTotalSessions(course)} buổi học
                  </span>
                </div>

                <div className="schedule">
                  <strong>Lịch học:</strong> {CourseService.formatSchedule(course.schedule)}
                </div>

                <div className="tutor-info">
                  <strong>Gia sư:</strong>{" "}
                  <span
                    className="tutor-name"
                    onClick={() => navigate(`/tutor/${course.tutor?._id}`)}
                  >
                    {course.tutor?.user?.fullName || "Ẩn danh"}
                  </span>
                </div>
              </div>

              <div className="course-actions">
                <button
                  className="btn-view"
                  onClick={() => navigate(`/courses/${course._id}`)}
                >
                  Xem chi tiết
                </button>
                <button
                  className="btn-enroll"
                  onClick={() => handleEnroll(course._id)}
                  disabled={course.currentStudents >= course.maxStudents}
                >
                  {course.currentStudents >= course.maxStudents ? "Đã đủ học viên" : "Đăng ký"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PublicCourses;
