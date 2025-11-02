import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  updateTutorProfile,
  updateTutorBasic,
} from "../../services/TutorService";
import UniversalHeader from "../../components/Layout/UniversalHeader";
import "./TutorProfileUpdatePage.scss";

const TutorProfileUpdatePage = () => {
  const navigate = useNavigate();
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  const currentUser = useSelector((state) => state.user.user);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    introduction: "",
    subjects: [], // Mỗi subject giờ là một object {name, price, level, description}
    experience: "",
    location: "",
    education: "",
    university: "",
    teachingMethod: "",
    achievements: "",
    availability: [],
  });

  const subjects = [
    "Toán",
    "Lý",
    "Hóa",
    "Sinh",
    "Văn",
    "Anh",
    "Sử",
    "Địa",
    "Tin học",
    "Lập trình",
    "Vật lý",
    "Hóa học",
    "Sinh học",
    "Ngữ văn",
    "Tiếng Anh",
    "Lịch sử",
    "Địa lý",
  ];

  useEffect(() => {
    // Check authentication
    console.log("🔍 TutorProfileUpdatePage: Authentication check:", {
      isAuthenticated,
      currentUser,
      localStorageUser: localStorage.getItem("user"),
    });

    if (!isAuthenticated) {
      console.log(
        "❌ TutorProfileUpdatePage: User not authenticated, redirecting to login"
      );
      toast.error("Vui lòng đăng nhập để cập nhật hồ sơ");
      navigate("/signin");
      return;
    }

    // Load existing tutor profile data if available
    // This could be fetched from an API
  }, [isAuthenticated, currentUser, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubjectChange = (subject, price, level, description) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.some((s) => s.name === subject.name)
        ? prev.subjects.filter((s) => s.name !== subject.name)
        : [
            ...prev.subjects,
            {
              name: subject.name,
              price: price || 0,
              level: level || "Tất cả",
              description: description || "",
            },
          ],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("🔍 TutorProfileUpdatePage: Submitting form data:", formData);

      // Use updateTutorProfile to update all fields
      const result = await updateTutorProfile(formData);

      console.log("✅ TutorProfileUpdatePage: Update successful:", result);
      toast.success("Cập nhật hồ sơ gia sư thành công!");
      navigate("/profile");
    } catch (error) {
      console.error(
        "❌ TutorProfileUpdatePage: Error updating tutor profile:",
        error
      );
      console.error("❌ Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
      });

      // Show more helpful error message
      if (error.response?.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        navigate("/signin");
      } else {
        toast.error(
          `Có lỗi xảy ra khi cập nhật hồ sơ: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/profile");
  };

  return (
    <div className="tutor-profile-update-page">
      <UniversalHeader />

      <div className="page-container">
        <div className="page-header">
          <h1>Cập nhật hồ sơ gia sư</h1>
          <p>Điền đầy đủ thông tin để học viên có thể tìm hiểu về bạn</p>
        </div>

        <div className="form-container">
          <form onSubmit={handleSubmit} className="update-form">
            {/* Giới thiệu */}
            <div className="form-section">
              <h3>Giới thiệu</h3>
              <textarea
                name="introduction"
                value={formData.introduction}
                onChange={handleInputChange}
                placeholder="Hãy giới thiệu về bản thân bạn, kinh nghiệm giảng dạy, phương pháp dạy học..."
                className="form-control"
                rows="6"
              />
            </div>

            {/* Môn dạy và giá */}
            <div className="form-section">
              <h3>Môn dạy và học phí</h3>
              <div className="subjects-list">
                {subjects.map((subject) => (
                  <div key={subject} className="subject-item">
                    <div className="subject-header">
                      <label className="subject-checkbox">
                        <input
                          type="checkbox"
                          checked={formData.subjects.some(
                            (s) => s.name === subject
                          )}
                          onChange={() => {
                            const isSelected = formData.subjects.some(
                              (s) => s.name === subject
                            );
                            if (isSelected) {
                              // Remove subject
                              setFormData((prev) => ({
                                ...prev,
                                subjects: prev.subjects.filter(
                                  (s) => s.name !== subject
                                ),
                              }));
                            } else {
                              // Add new subject with price
                              setFormData((prev) => ({
                                ...prev,
                                subjects: [
                                  ...prev.subjects,
                                  {
                                    name: subject,
                                    price: 0,
                                    level: "Tất cả",
                                    description: "",
                                  },
                                ],
                              }));
                            }
                          }}
                        />
                        <span className="subject-label">{subject}</span>
                      </label>
                    </div>

                    {formData.subjects.some((s) => s.name === subject) && (
                      <div className="subject-details">
                        <div className="detail-row">
                          <input
                            type="number"
                            placeholder="Học phí/buổi"
                            value={
                              formData.subjects.find((s) => s.name === subject)
                                ?.price || ""
                            }
                            onChange={(e) => {
                              const price = parseInt(e.target.value) || 0;
                              setFormData((prev) => ({
                                ...prev,
                                subjects: prev.subjects.map((s) =>
                                  s.name === subject ? { ...s, price } : s
                                ),
                              }));
                            }}
                            className="price-input"
                            min="0"
                          />
                          <select
                            value={
                              formData.subjects.find((s) => s.name === subject)
                                ?.level || "Tất cả"
                            }
                            onChange={(e) => {
                              const level = e.target.value;
                              setFormData((prev) => ({
                                ...prev,
                                subjects: prev.subjects.map((s) =>
                                  s.name === subject ? { ...s, level } : s
                                ),
                              }));
                            }}
                            className="level-select"
                          >
                            <option value="Tất cả">Tất cả trình độ</option>
                            <option value="Sơ cấp">Sơ cấp</option>
                            <option value="Trung cấp">Trung cấp</option>
                            <option value="Cao cấp">Cao cấp</option>
                          </select>
                        </div>
                        <textarea
                          placeholder="Mô tả thêm về việc dạy môn này..."
                          value={
                            formData.subjects.find((s) => s.name === subject)
                              ?.description || ""
                          }
                          onChange={(e) => {
                            const description = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              subjects: prev.subjects.map((s) =>
                                s.name === subject ? { ...s, description } : s
                              ),
                            }));
                          }}
                          className="description-input"
                          rows="2"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Kinh nghiệm */}
            <div className="form-section">
              <h3>Kinh nghiệm giảng dạy (năm)</h3>
              <input
                type="number"
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                placeholder="Ví dụ: 3"
                className="form-control"
                min="0"
              />
            </div>

            {/* Mức phí */}
            <div className="form-section">
              <h3>Mức phí/giờ (VNĐ)</h3>
              <input
                type="number"
                name="hourlyRate"
                value={formData.hourlyRate}
                onChange={handleInputChange}
                placeholder="Ví dụ: 200000"
                className="form-control"
                min="0"
              />
            </div>

            {/* Địa điểm */}
            <div className="form-section">
              <h3>Địa điểm dạy</h3>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Ví dụ: Hà Nội, TP.HCM..."
                className="form-control"
              />
            </div>

            {/* Học vấn */}
            <div className="form-section">
              <h3>Học vấn</h3>
              <input
                type="text"
                name="education"
                value={formData.education}
                onChange={handleInputChange}
                placeholder="Ví dụ: Cử nhân, Thạc sĩ, Tiến sĩ..."
                className="form-control"
              />
            </div>

            {/* Trường đại học */}
            <div className="form-section">
              <h3>Trường đại học</h3>
              <input
                type="text"
                name="university"
                value={formData.university}
                onChange={handleInputChange}
                placeholder="Ví dụ: Đại học Bách Khoa Hà Nội..."
                className="form-control"
              />
            </div>

            {/* Phương pháp dạy */}
            <div className="form-section">
              <h3>Phương pháp dạy học</h3>
              <textarea
                name="teachingMethod"
                value={formData.teachingMethod}
                onChange={handleInputChange}
                placeholder="Mô tả phương pháp dạy học của bạn..."
                className="form-control"
                rows="4"
              />
            </div>

            {/* Thành tích */}
            <div className="form-section">
              <h3>Thành tích nổi bật</h3>
              <textarea
                name="achievements"
                value={formData.achievements}
                onChange={handleInputChange}
                placeholder="Các giải thưởng, chứng chỉ, thành tích đạt được..."
                className="form-control"
                rows="4"
              />
            </div>

            {/* Lịch rảnh */}
            <div className="form-section">
              <h3>Thời gian rảnh (để học viên có thể đặt lịch)</h3>
              <p className="form-hint">
                Chọn các khung giờ bạn có thể dạy trong tuần
              </p>

              <div className="availability-grid">
                {[
                  "Chủ nhật",
                  "Thứ 2",
                  "Thứ 3",
                  "Thứ 4",
                  "Thứ 5",
                  "Thứ 6",
                  "Thứ 7",
                ].map((day, dayIndex) => (
                  <div key={dayIndex} className="day-slot">
                    <h4>{day}</h4>
                    <div className="time-slots">
                      {["18:00", "19:00", "20:00", "21:00"].map((time) => {
                        const slotKey = `${dayIndex}_${time}`;
                        const isChecked = formData.availability.some(
                          (s) => s.dayOfWeek === dayIndex && s.start === time
                        );

                        return (
                          <label key={slotKey} className="time-slot-checkbox">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  // Remove slot
                                  setFormData((prev) => ({
                                    ...prev,
                                    availability: prev.availability.filter(
                                      (s) =>
                                        !(
                                          s.dayOfWeek === dayIndex &&
                                          s.start === time
                                        )
                                    ),
                                  }));
                                } else {
                                  // Add slot (2 hours duration)
                                  const [hour, min] = time
                                    .split(":")
                                    .map(Number);
                                  const endHour = String(hour + 2).padStart(
                                    2,
                                    "0"
                                  );
                                  const endTime = `${endHour}:${min}`;

                                  setFormData((prev) => ({
                                    ...prev,
                                    availability: [
                                      ...prev.availability,
                                      {
                                        dayOfWeek: dayIndex,
                                        start: time,
                                        end: endTime,
                                      },
                                    ],
                                  }));
                                }
                              }}
                            />
                            <span>{time}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {formData.availability.length > 0 && (
                <div className="selected-slots">
                  <p>Đã chọn {formData.availability.length} khung giờ rảnh</p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="form-actions">
              <button
                type="button"
                onClick={handleCancel}
                className="btn-cancel"
                disabled={loading}
              >
                Hủy
              </button>
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? "Đang cập nhật..." : "Cập nhật hồ sơ"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TutorProfileUpdatePage;
