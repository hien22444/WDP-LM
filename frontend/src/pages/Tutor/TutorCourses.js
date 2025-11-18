import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CourseService from "../../services/CourseService";
import "./TutorCourses.scss";

const TutorCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false); // Start with false to show UI immediately
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // all, draft, published, ongoing, completed

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(""); // Clear previous errors
      const data = await CourseService.getMyCourses();
      console.log("Courses loaded:", data);
      setCourses(data);
    } catch (err) {
      console.error("Error loading courses:", err);
      const errorMsg = err.response?.data?.message || "Không thể tải khóa học";
      setError(errorMsg);
      setCourses([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa khóa học này?")) {
      return;
    }

    try {
      await CourseService.deleteCourse(courseId);
      setCourses(courses.filter((c) => c._id !== courseId));
    } catch (err) {
      alert(err.response?.data?.message || "Không thể xóa khóa học");
    }
  };

  const handlePublish = async (courseId) => {
    try {
      await CourseService.publishCourse(courseId);
      loadCourses(); // Reload to get updated status
    } catch (err) {
      alert(err.response?.data?.message || "Không thể xuất bản khóa học");
    }
  };

  const handleUnpublish = async (courseId) => {
    try {
      await CourseService.updateCourse(courseId, { status: "draft" });
      loadCourses();
    } catch (err) {
      alert(err.response?.data?.message || "Không thể hủy xuất bản");
    }
  };

  const filteredCourses = courses.filter((course) => {
    if (filter === "all") return true;
    return course.status === filter;
  });

  const getStatusBadge = (status) => {
    const badges = {
      draft: { text: "Nháp", class: "badge-draft" },
      published: { text: "Đã xuất bản", class: "badge-published" },
      ongoing: { text: "Đang diễn ra", class: "badge-ongoing" },
      completed: { text: "Hoàn thành", class: "badge-completed" },
    };
    const badge = badges[status] || badges.draft;
    return <span className={`status-badge ${badge.class}`}>{badge.text}</span>;
  };

  return (
    <div className="tutor-courses-container">
      <div className="courses-header">
        <h1>Quản lý khóa học của tôi</h1>
        <button
          className="btn-create-course"
          onClick={() => navigate("/tutor/courses/create")}
        >
          + Tạo khóa học mới
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="filter-tabs">
        <button
          className={filter === "all" ? "active" : ""}
          onClick={() => setFilter("all")}
        >
          Tất cả ({courses.length})
        </button>
        <button
          className={filter === "draft" ? "active" : ""}
          onClick={() => setFilter("draft")}
        >
          Nháp ({courses.filter((c) => c.status === "draft").length})
        </button>
        <button
          className={filter === "published" ? "active" : ""}
          onClick={() => setFilter("published")}
        >
          Đã xuất bản ({courses.filter((c) => c.status === "published").length})
        </button>
        <button
          className={filter === "ongoing" ? "active" : ""}
          onClick={() => setFilter("ongoing")}
        >
          Đang diễn ra ({courses.filter((c) => c.status === "ongoing").length})
        </button>
        <button
          className={filter === "completed" ? "active" : ""}
          onClick={() => setFilter("completed")}
        >
          Hoàn thành ({courses.filter((c) => c.status === "completed").length})
        </button>
      </div>

      <div className="courses-grid">
        {loading ? (
          <div className="loading">Đang tải danh sách khóa học...</div>
        ) : filteredCourses.length === 0 ? (
          <div className="empty-state">
            <p>Chưa có khóa học nào</p>
            <button onClick={() => navigate("/tutor/courses/create")}>
              Tạo khóa học đầu tiên
            </button>
          </div>
        ) : (
          filteredCourses.map((course) => (
            <div key={course._id} className="course-card">
              <div className="course-header">
                <h3>{course.title}</h3>
                {getStatusBadge(course.status)}
              </div>

              <div className="course-info">
                <p className="subject">{course.subject?.name}</p>
                <p className="description">{course.description}</p>
                <div className="course-details">
                  <span>📅 {course.duration.weeks} tuần</span>
                  <span>👥 {course.currentStudents}/{course.maxStudents} học viên</span>
                  <span>💰 {course.price.toLocaleString()}đ/buổi</span>
                </div>
                <div className="schedule">
                  {CourseService.formatSchedule(course.schedule)}
                </div>
              </div>

              <div className="course-actions">
                {course.status === "draft" && (
                  <>
                    <button
                      className="btn-edit"
                      onClick={() => navigate(`/tutor/courses/${course._id}/edit`)}
                    >
                      Chỉnh sửa
                    </button>
                    <button
                      className="btn-publish"
                      onClick={() => handlePublish(course._id)}
                    >
                      Xuất bản
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(course._id)}
                    >
                      Xóa
                    </button>
                  </>
                )}

                {course.status === "published" && (
                  <>
                    <button
                      className="btn-view"
                      onClick={() => navigate(`/courses/${course._id}`)}
                    >
                      Xem
                    </button>
                    <button
                      className="btn-unpublish"
                      onClick={() => handleUnpublish(course._id)}
                    >
                      Hủy xuất bản
                    </button>
                  </>
                )}

                {(course.status === "ongoing" || course.status === "completed") && (
                  <button
                    className="btn-view"
                    onClick={() => navigate(`/courses/${course._id}`)}
                  >
                    Xem chi tiết
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TutorCourses;
