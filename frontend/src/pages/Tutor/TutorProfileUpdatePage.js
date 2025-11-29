import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  getMyTutorProfile,
  updateTutorProfile,
  updateTutorBasic,
  saveAvailability,
} from "../../services/TutorService";
import { createTeachingSlot } from "../../services/BookingService";
import UniversalHeader from "../../components/Layout/UniversalHeader";
import SimpleAvailabilitySelector from "./SimpleAvailabilitySelector";
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
    teachModes: [], // Thêm field teachModes: ["online", "offline"]
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
    const loadProfile = async () => {
      try {
        const profile = await getMyTutorProfile();
        if (!profile) return;

        // Map backend profile to local formData shape
        setFormData((prev) => ({
          ...prev,
          introduction: profile.bio || prev.introduction,
          experience: profile.experienceYears || prev.experience,
          location: profile.city || prev.location,
          university: profile.university || prev.university || "",
          education: profile.education || prev.education || "",
          teachingMethod: profile.teachingMethod || prev.teachingMethod || "",
          achievements: profile.achievements || prev.achievements || "",
          teachModes: Array.isArray(profile.teachModes) ? profile.teachModes : prev.teachModes || [],
          hourlyRate:
            profile.sessionRate !== undefined && profile.sessionRate !== null
              ? profile.sessionRate
              : prev.hourlyRate,
          subjects: Array.isArray(profile.subjects)
            ? profile.subjects.map((s) => ({
                name: s.name,
                price: s.price || 0,
                level: s.level || "Tất cả",
                description: s.description || "",
              }))
            : prev.subjects,
availability: Array.isArray(profile.availability)
            ? profile.availability.map((a) => ({
                dayOfWeek:
                  typeof a.dayOfWeek === "number" ? a.dayOfWeek : a.day || 0,
                start: a.start || a.startTime || "00:00",
                end: a.end || a.endTime || "00:00",
              }))
            : prev.availability,
        }));

        // Optionally, initialize dayRanges based on availability if present
        if (Array.isArray(profile.availability) && profile.availability.length) {
          // Build a simple dayRanges where any availability within common ranges toggles the range enabled
          const nextRanges = [...defaultRanges];
          profile.availability.forEach((a) => {
            const day = typeof a.dayOfWeek === "number" ? a.dayOfWeek : a.day || 0;
            const start = (a.start || a.startTime || "00:00").slice(0, 5);
            const end = (a.end || a.endTime || "00:00").slice(0, 5);

            const markRange = (period) => {
              if (!nextRanges[day]) nextRanges[day] = JSON.parse(JSON.stringify(defaultRanges[0]));
              nextRanges[day][period] = { enabled: true, start, end };
            };

            // naive mapping: morning 08-11, afternoon 13-17, evening 18-22
            if (start >= "07:00" && end <= "12:00") markRange("morning");
            else if (start >= "12:00" && end <= "17:30") markRange("afternoon");
            else markRange("evening");
          });

          setDayRanges(nextRanges);
          // rebuild availability from these ranges to keep consistency
          rebuildAvailability(nextRanges);
        }
      } catch (err) {
        console.error("Failed to load tutor profile:", err);
      }
    };

    loadProfile();
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

            {/* Hình thức dạy học */}
            <div className="form-section">
              <h3>Hình thức dạy học</h3>
              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '12px' }}>
                Chọn các hình thức bạn hỗ trợ (có thể chọn nhiều)
              </p>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  padding: '12px 20px',
                  border: '2px solid',
                  borderColor: formData.teachModes?.includes('online') ? '#3b82f6' : '#e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: formData.teachModes?.includes('online') ? '#eff6ff' : 'white',
                  transition: 'all 0.2s'
                }}>
                  <input
                    type="checkbox"
                    checked={formData.teachModes?.includes('online') || false}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setFormData(prev => ({
                        ...prev,
                        teachModes: isChecked 
                          ? [...(prev.teachModes || []), 'online']
                          : (prev.teachModes || []).filter(m => m !== 'online')
                      }));
                    }}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '15px', fontWeight: 500 }}>💻 Online (dạy trực tuyến)</span>
                </label>

                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  padding: '12px 20px',
                  border: '2px solid',
                  borderColor: formData.teachModes?.includes('offline') ? '#3b82f6' : '#e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: formData.teachModes?.includes('offline') ? '#eff6ff' : 'white',
                  transition: 'all 0.2s'
                }}>
                  <input
                    type="checkbox"
                    checked={formData.teachModes?.includes('offline') || false}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setFormData(prev => ({
                        ...prev,
                        teachModes: isChecked 
                          ? [...(prev.teachModes || []), 'offline']
                          : (prev.teachModes || []).filter(m => m !== 'offline')
                      }));
                    }}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '15px', fontWeight: 500 }}>🏫 Offline (dạy tại nhà)</span>
                </label>
              </div>
              {(!formData.teachModes || formData.teachModes.length === 0) && (
                <p style={{ fontSize: '13px', color: '#ef4444', marginTop: '8px' }}>
                  ⚠️ Vui lòng chọn ít nhất một hình thức dạy học
                </p>
              )}
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
              <h3>🗓️ Lịch rảnh của bạn</h3>
              <p className="form-hint">
                Chọn các buổi sáng/chiều mà bạn có thể dạy. Học viên sẽ chọn giờ cụ thể (tối thiểu 2h) 
                trong khung giờ buổi sáng (7:00-11:30) hoặc buổi chiều (13:00-16:30).
              </p>

              <SimpleAvailabilitySelector
                defaultAvailability={formData.availability}
                onChange={(newAvailability) => {
                  setFormData(prev => ({
                    ...prev,
                    availability: newAvailability
                  }));
                }}
              />

              {/* Actions: lưu availability */}
              <div className="availability-actions" style={{ marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSaveAvailability}
                  disabled={loading}
                  style={{
                    padding: '12px 24px',
                    fontSize: '16px',
                    fontWeight: '600',
                    width: '100%',
                    maxWidth: '400px',
                    margin: '0 auto',
                    display: 'block'
                  }}
                >
                  {loading ? "Đang lưu..." : "💾 Lưu lịch rảnh"}
                </button>
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