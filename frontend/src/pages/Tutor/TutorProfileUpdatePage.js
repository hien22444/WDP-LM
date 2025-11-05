import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  updateTutorProfile,
  updateTutorBasic,
  saveAvailability,
} from "../../services/TutorService";
import { createTeachingSlot } from "../../services/BookingService";
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

  // Config tạo slot nhanh từ lịch rảnh
  const [slotConfig, setSlotConfig] = useState({
    weeks: 4, // số tuần tạo slot kể từ hôm nay
    startFrom: new Date().toISOString().slice(0, 10), // yyyy-mm-dd
    mode: "online",
    price: 0,
    capacity: 1,
    courseName: "Buổi học 1-1",
  });

  // Tùy chọn công khai thời khóa biểu (tự tạo slot tự động)
  const [timetableConfig, setTimetableConfig] = useState({
    publish: true,
    horizonWeeks: 4,
    startFrom: new Date().toISOString().slice(0, 10),
  });

  // Ranges đơn giản: sáng/chiều/tối cho từng ngày
  const defaultRanges = Array.from({ length: 7 }).map(() => ({
    morning: { enabled: false, start: "08:00", end: "11:00" },
    afternoon: { enabled: false, start: "13:00", end: "17:00" },
    evening: { enabled: false, start: "18:00", end: "22:00" },
  }));
  const [dayRanges, setDayRanges] = useState(defaultRanges);

  // Rebuild availability from dayRanges
  const rebuildAvailability = (ranges) => {
    const av = [];
    ranges.forEach((r, day) => {
      ["morning", "afternoon", "evening"].forEach((p) => {
        const seg = r[p];
        if (seg.enabled && seg.start && seg.end) {
          // push as an interval; keep as [start,end]
          av.push({ dayOfWeek: day, start: seg.start, end: seg.end });
        }
      });
    });
    setFormData((prev) => ({ ...prev, availability: av }));
  };

  // -------- Validation helpers --------
  const timeRe = /^\d{2}:\d{2}$/;

  const isOverlap = (a, b) => {
    // times are strings HH:MM
    return a.start < b.end && b.start < a.end;
  };

  const validateAvailability = (list) => {
    if (!Array.isArray(list) || list.length === 0) {
      return { ok: false, message: "Bạn chưa chọn khung giờ nào" };
    }
    for (const it of list) {
      if (
        typeof it.dayOfWeek !== "number" ||
        it.dayOfWeek < 0 ||
        it.dayOfWeek > 6
      )
        return { ok: false, message: "dayOfWeek không hợp lệ" };
      if (!timeRe.test(it.start) || !timeRe.test(it.end))
        return { ok: false, message: "Giờ phải ở dạng HH:mm" };
      if (it.end <= it.start)
        return { ok: false, message: "Giờ kết thúc phải sau giờ bắt đầu" };
    }

    // Kiểm tra chồng chéo trong cùng 1 ngày
    const byDay = list.reduce((acc, it) => {
      acc[it.dayOfWeek] ||= [];
      acc[it.dayOfWeek].push(it);
      return acc;
    }, {});
    for (const day in byDay) {
      const arr = byDay[day].sort((x, y) => (x.start < y.start ? -1 : 1));
      for (let i = 1; i < arr.length; i++) {
        if (isOverlap(arr[i - 1], arr[i]))
          return {
            ok: false,
            message: `Khung giờ trong ngày ${parseInt(day, 10)} bị chồng chéo`,
          };
      }
    }
    return { ok: true };
  };

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

  // Lưu lịch rảnh (availability)
  const handleSaveAvailability = async () => {
    try {
      // Validate before send
      const payload = formData.availability || [];
      const v = validateAvailability(payload);
      if (!v.ok) {
        toast.error(v.message);
        return;
      }
      setLoading(true);
      await saveAvailability(payload);
      toast.success("Đã lưu lịch rảnh theo tuần");

      // Tùy chọn: công khai ngay và tự tạo slot  cho N tuần tới
      if (timetableConfig.publish) {
        const count = await handleGenerateSlotsWithConfig({
          startFrom: timetableConfig.startFrom,
          weeks: timetableConfig.horizonWeeks,
        });
        if (count > 0) toast.success(`Đã tạo ${count} slot từ thời khóa biểu`);
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "Lưu lịch rảnh thất bại. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  // Sinh slot từ lịch rảnh theo số tuần
  const handleGenerateSlots = async () => {
    if (!Array.isArray(formData.availability) || formData.availability.length === 0) {
      toast.error("Bạn chưa chọn lịch rảnh nào");
      return;
    }
    const v = validateAvailability(formData.availability);
    if (!v.ok) {
      toast.error(v.message);
      return;
    }

    try {
      setLoading(true);

      const created = [];
      const startDate = new Date(`${slotConfig.startFrom}T00:00:00`);
      const totalDays = Math.max(1, parseInt(slotConfig.weeks || 0)) * 7;

      for (let i = 0; i < totalDays; i++) {
        const current = new Date(startDate);
        current.setDate(startDate.getDate() + i);
        const dayOfWeek = current.getDay(); // 0-6

        const dayAvailabilities = (formData.availability || []).filter(
          (a) => a.dayOfWeek === dayOfWeek
        );

        for (const a of dayAvailabilities) {
          // Tạo start/end theo giờ phút từ availability
          const [sh, sm] = (a.start || "00:00").split(":").map((n) => parseInt(n, 10));
          const [eh, em] = (a.end || "00:00").split(":").map((n) => parseInt(n, 10));

          const start = new Date(current);
          start.setHours(sh || 0, sm || 0, 0, 0);
          const end = new Date(current);
          end.setHours(eh || 0, em || 0, 0, 0);

          if (end <= start) continue; // bỏ khung giờ không hợp lệ

          const payload = {
            courseName: slotConfig.courseName || "Buổi học 1-1",
            start: start.toISOString(),
            end: end.toISOString(),
            mode: slotConfig.mode || "online",
            price: Math.max(0, parseInt(slotConfig.price || 0)),
            capacity: Math.max(1, parseInt(slotConfig.capacity || 1)),
          };

          try {
            const slot = await createTeachingSlot(payload);
            created.push(slot);
          } catch (e) {
            console.error("Create slot error", e);
          }
        }
      }

      if (created.length > 0) {
        toast.success(`Đã tạo ${created.length} slot mở từ lịch rảnh`);
      } else {
        toast.info("Không có slot nào được tạo (kiểm tra lại lịch rảnh/ cấu hình)");
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "Tạo slot từ lịch rảnh thất bại"
      );
    } finally {
      setLoading(false);
    }
  };

  // Helper để sinh slot với cấu hình truyền vào (dùng khi auto publish)
  const handleGenerateSlotsWithConfig = async ({ startFrom, weeks }) => {
    if (!Array.isArray(formData.availability) || formData.availability.length === 0) return;

    const localCfg = {
      ...slotConfig,
      startFrom: startFrom || slotConfig.startFrom,
      weeks: weeks || slotConfig.weeks,
    };

    const created = [];
    const startDate = new Date(`${localCfg.startFrom}T00:00:00`);
    const totalDays = Math.max(1, parseInt(localCfg.weeks || 0)) * 7;

    for (let i = 0; i < totalDays; i++) {
      const current = new Date(startDate);
      current.setDate(startDate.getDate() + i);
      const dayOfWeek = current.getDay();

      const dayAvailabilities = (formData.availability || []).filter(
        (a) => a.dayOfWeek === dayOfWeek
      );

      for (const a of dayAvailabilities) {
        const [sh, sm] = (a.start || "00:00").split(":").map((n) => parseInt(n, 10));
        const [eh, em] = (a.end || "00:00").split(":").map((n) => parseInt(n, 10));
        const start = new Date(current);
        start.setHours(sh || 0, sm || 0, 0, 0);
        const end = new Date(current);
        end.setHours(eh || 0, em || 0, 0, 0);
        if (end <= start) continue;

        const payload = {
          courseName: localCfg.courseName || "Buổi học 1-1",
          start: start.toISOString(),
          end: end.toISOString(),
          mode: localCfg.mode || "online",
          price: Math.max(0, parseInt(localCfg.price || 0)),
          capacity: Math.max(1, parseInt(localCfg.capacity || 1)),
        };
        try {
          const slot = await createTeachingSlot(payload);
          created.push(slot);
        } catch (e) {
          console.error("Create slot error", e);
        }
      }
    }
    return created.length;
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
              <h3>Thời khóa biểu dạy cố định (hiển thị cho học viên)</h3>
              <p className="form-hint">
                Tick các mốc giờ bạn dạy cố định mỗi tuần. Hệ thống có thể tự công khai
                thời khóa biểu này thành các slot cho {timetableConfig.horizonWeeks} tuần tới.
              </p>

              <div className="availability-grid simple">
                {[
                  "Chủ nhật",
                  "Thứ 2",
                  "Thứ 3",
                  "Thứ 4",
                  "Thứ 5",
                  "Thứ 6",
                  "Thứ 7",
                ].map((dayLabel, dayIndex) => (
                  <div key={dayIndex} className="day-row">
                    <h4>{dayLabel}</h4>
                    {["morning", "afternoon", "evening"].map((period) => {
                      const title =
                        period === "morning"
                          ? "Sáng"
                          : period === "afternoon"
                          ? "Chiều"
                          : "Tối";
                      const seg = dayRanges[dayIndex][period];
                      return (
                        <div key={period} className="period">
                          <label className="toggle">
                            <input
                              type="checkbox"
                              checked={seg.enabled}
                              onChange={(e) => {
                                const enabled = e.target.checked;
                                const next = [...dayRanges];
                                next[dayIndex] = {
                                  ...next[dayIndex],
                                  [period]: { ...seg, enabled },
                                };
                                setDayRanges(next);
                                rebuildAvailability(next);
                              }}
                            />
                            <span>{title}</span>
                          </label>
                          <div className="time-range">
                            <input
                              type="time"
                              value={seg.start}
                              onChange={(e) => {
                                const next = [...dayRanges];
                                next[dayIndex] = {
                                  ...next[dayIndex],
                                  [period]: { ...seg, start: e.target.value },
                                };
                                setDayRanges(next);
                                rebuildAvailability(next);
                              }}
                            />
                            <span>đến</span>
                            <input
                              type="time"
                              value={seg.end}
                              onChange={(e) => {
                                const next = [...dayRanges];
                                next[dayIndex] = {
                                  ...next[dayIndex],
                                  [period]: { ...seg, end: e.target.value },
                                };
                                setDayRanges(next);
                                rebuildAvailability(next);
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {formData.availability.length > 0 && (
                <div className="selected-slots">
                  <p>Đã chọn {formData.availability.length} khung giờ rảnh</p>
                </div>
              )}

              {/* Actions: lưu availability và tạo slot */}
              <div className="availability-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleSaveAvailability}
                  disabled={loading}
                >
                  Lưu thời khóa biểu theo tuần
                </button>

                <div className="generate-slots">
                  <div className="row" style={{ marginBottom: 8 }}>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={timetableConfig.publish}
                        onChange={(e) =>
                          setTimetableConfig((s) => ({ ...s, publish: e.target.checked }))
                        }
                      />
                      <span>Công khai thời khóa biểu thành slot tự động</span>
                    </label>
                  </div>
                  <div className="row">
                    <label>
                      Bắt đầu từ ngày
                      <input
                        type="date"
                        value={slotConfig.startFrom}
                        onChange={(e) =>
                          setSlotConfig((s) => ({ ...s, startFrom: e.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Số tuần
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={slotConfig.weeks}
                        onChange={(e) =>
                          setSlotConfig((s) => ({ ...s, weeks: parseInt(e.target.value || 1) }))
                        }
                      />
                    </label>
                    <label>
                      Hình thức
                      <select
                        value={slotConfig.mode}
                        onChange={(e) => setSlotConfig((s) => ({ ...s, mode: e.target.value }))}
                      >
                        <option value="online">Online</option>
                        <option value="offline">Tại nhà</option>
                      </select>
                    </label>
                    <label>
                      Học phí/buổi (VNĐ)
                      <input
                        type="number"
                        min="0"
                        value={slotConfig.price}
                        onChange={(e) =>
                          setSlotConfig((s) => ({ ...s, price: parseInt(e.target.value || 0) }))
                        }
                      />
                    </label>
                    <label>
                      Số HV
                      <input
                        type="number"
                        min="1"
                        value={slotConfig.capacity}
                        onChange={(e) =>
                          setSlotConfig((s) => ({ ...s, capacity: parseInt(e.target.value || 1) }))
                        }
                      />
                    </label>
                  </div>
                  <div className="row">
                    <label style={{ flex: 1 }}>
                      Tên buổi học (courseName)
                      <input
                        type="text"
                        value={slotConfig.courseName}
                        onChange={(e) =>
                          setSlotConfig((s) => ({ ...s, courseName: e.target.value }))
                        }
                      />
                    </label>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleGenerateSlots}
                      disabled={loading}
                    >
                      Tạo slot từ lịch rảnh
                    </button>
                  </div>
                </div>
              </div>
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
