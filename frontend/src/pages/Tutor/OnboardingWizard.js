import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  submitTutorProfile,
  uploadIdDocuments,
  uploadDegreeDocuments,
  updateTutorExpertise,
  updateTutorBasic,
} from "../../services/TutorService";
import UniversalHeader from "../../components/Layout/UniversalHeader";
import "./OnboardingWizard.scss";

const OnboardingWizard = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Education info
    education: "",
    major: "",
    university: "",
    graduationYear: "",

    // Teaching info
    subjects: [],
    experience: "",
    sessionRate: "", // Common price for all subjects

    // Documents
    identityFront: null,
    identityBack: null,
    educationDocument: null,
    certificateDocument: null,

    // Additional fields for verification
    educationType: "",
    certificateName: "",
    certificateType: "",

    // Additional info (Step 4)
    introduction: "",
    teachingGoals: "",
    strengths: "",
  });

  const steps = [
    {
      id: 1,
      title: "Xác minh danh tính",
      description: "CCCD/CMND/Hộ chiếu (quan trọng nhất)",
    },
    { id: 2, title: "Trình độ học vấn", description: "Bằng cấp chính thức" },
    {
      id: 3,
      title: "Kinh nghiệm giảng dạy",
      description: "Môn dạy và phương pháp",
    },
    {
      id: 4,
      title: "Thông tin bổ sung",
      description: "Giới thiệu và mục tiêu",
    },
    {
      id: 5,
      title: "Chứng chỉ & thành tích",
      description: "IELTS, TOEIC, giải thưởng... (tùy chọn)",
    },
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileChange = (field, file) => {
    setFormData((prev) => ({
      ...prev,
      [field]: file,
    }));
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes && bytes !== 0) return "";
    const sizes = ["B", "KB", "MB", "GB"];
    if (bytes === 0) return "0 B";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const removeSelectedFile = (field) => {
    setFormData((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async () => {
    try {
      console.log("Form submitted:", formData);

      // 1. Upload identity documents if available
      if (formData.identityFront || formData.identityBack) {
        const identityFiles = [];
        if (formData.identityFront) identityFiles.push(formData.identityFront);
        if (formData.identityBack) identityFiles.push(formData.identityBack);

        await uploadIdDocuments(identityFiles);
        toast.success("✅ Đã tải lên giấy tờ tùy thân");
      }

      // 2. Upload education documents if available
      if (formData.educationDocument) {
        await uploadDegreeDocuments([formData.educationDocument]);
        toast.success("✅ Đã tải lên tài liệu học vấn");
      }

      // 3. Save subjects and experience info
      if (formData.subjects.length > 0) {
        await updateTutorExpertise({
          subjects: formData.subjects.map((s) => ({
            ...s,
            price: parseInt(formData.sessionRate) || 0,
          })),
          experienceYears: parseInt(formData.experience) || 0,
          experiencePlaces: formData.university || null,
          sessionRate: parseInt(formData.sessionRate) || 0,
        });
        toast.success("✅ Đã lưu thông tin môn học và kinh nghiệm");
      }

      // 4. Update basic info
      await updateTutorBasic({
        bio: formData.introduction,
        city: formData.city || null,
        district: formData.district || null,
      });

      // 5. Submit tutor profile to backend
      const result = await submitTutorProfile();

      // 6. Show success message
      toast.success(
        "🎉 Đăng ký gia sư thành công! Hồ sơ của bạn đang được xem xét."
      );

      // 7. Redirect to profile page
      navigate("/profile");
    } catch (error) {
      console.error("Error submitting tutor profile:", error);
      const errorMessage =
        error.response?.data?.message || "Có lỗi xảy ra khi đăng ký gia sư";
      toast.error(`❌ ${errorMessage}`);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <h3>Xác minh Danh tính</h3>
            <p>
              Tải lên ảnh chụp rõ nét hai mặt Căn cước công dân (CCCD), hoặc
              giấy tờ tùy thân hợp lệ (CMND, hộ chiếu, bằng lái xe).
            </p>

            <div className="verification-info">
              <div className="info-section">
                <h4>🎯 Mục đích:</h4>
                <ul>
                  <li>
                    Xác minh người đăng ký là thật và chịu trách nhiệm pháp lý
                  </li>
                  <li>
                    Ngăn chặn gian lận (đăng ký giả danh, mạo danh sinh
                    viên/trường)
                  </li>
                  <li>
                    Tăng độ tin cậy cho học viên và phụ huynh khi xem hồ sơ
                  </li>
                </ul>
              </div>

              <div className="info-section">
                <h4>🔒 Hệ thống xử lý:</h4>
                <ul>
                  <li>Tự động làm mờ số CCCD khi hiển thị công khai</li>
                  <li>Hệ thống sẽ tự động xác thực</li>
                  <li>
                    Nếu ảnh không rõ hoặc sai thông tin → tự động báo lỗi, yêu
                    cầu tải lại
                  </li>
                </ul>
              </div>
            </div>

            <div className="form-group">
              <label>Ảnh mặt trước CCCD/CMND/Hộ chiếu *</label>
              <div className="file-upload-area">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleFileChange("identityFront", e.target.files[0])
                  }
                />
                <div className="upload-placeholder">
                  <div className="upload-icon">📄</div>
                  <p>Kéo thả ảnh vào đây hoặc nhấn để chọn</p>
                </div>
              </div>
              {formData.identityFront && (
                <div className="file-preview">
                  <div className="preview-image">
                    <img
                      src={URL.createObjectURL(formData.identityFront)}
                      alt="Ảnh mặt trước"
                    />
                  </div>
                  <div className="file-info">
                    <div className="file-name">
                      {formData.identityFront.name}
                    </div>
                    <div className="file-size">
                      {formatBytes(formData.identityFront.size)}
                    </div>
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => removeSelectedFile("identityFront")}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Ảnh mặt sau CCCD/CMND *</label>
              <div className="file-upload-area">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleFileChange("identityBack", e.target.files[0])
                  }
                />
                <div className="upload-placeholder">
                  <div className="upload-icon">📄</div>
                  <p>Kéo thả ảnh vào đây hoặc nhấn để chọn</p>
                </div>
              </div>
              {formData.identityBack && (
                <div className="file-preview">
                  <div className="preview-image">
                    <img
                      src={URL.createObjectURL(formData.identityBack)}
                      alt="Ảnh mặt sau"
                    />
                  </div>
                  <div className="file-info">
                    <div className="file-name">
                      {formData.identityBack.name}
                    </div>
                    <div className="file-size">
                      {formatBytes(formData.identityBack.size)}
                    </div>
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => removeSelectedFile("identityBack")}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="requirements">
              <h4>⚠️ Yêu cầu bắt buộc:</h4>
              <ul>
                <li>Ảnh phải rõ mặt chữ, không mờ, không che khuất</li>
                <li>Trùng với thông tin cá nhân đã khai trong hồ sơ</li>
                <li>Định dạng: JPG, PNG (tối đa 5MB)</li>
                <li>Chấp nhận: CCCD, CMND, Hộ chiếu, Bằng lái xe</li>
              </ul>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <h3>Trình độ học vấn</h3>
            <p>Thông tin về bằng cấp và chuyên môn của bạn.</p>

            <div className="form-group">
              <label>Trình độ học vấn cao nhất</label>
              <select
                value={formData.education}
                onChange={(e) => handleInputChange("education", e.target.value)}
              >
                <option value="">--</option>
                <option value="high_school">THPT</option>
                <option value="college">Cao đẳng</option>
                <option value="university">Đại học</option>
                <option value="master">Thạc sĩ</option>
                <option value="phd">Tiến sĩ</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Chuyên ngành</label>
                <input
                  type="text"
                  value={formData.major}
                  onChange={(e) => handleInputChange("major", e.target.value)}
                  placeholder="Công nghệ thông tin, Toán học..."
                />
              </div>
              <div className="form-group">
                <label>Trường/Đại học</label>
                <input
                  type="text"
                  value={formData.university}
                  onChange={(e) =>
                    handleInputChange("university", e.target.value)
                  }
                  placeholder="Đại học Bách Khoa Hà Nội..."
                />
              </div>
            </div>

            <div className="form-group">
              <label>Năm tốt nghiệp</label>
              <input
                type="number"
                value={formData.graduationYear}
                onChange={(e) =>
                  handleInputChange("graduationYear", e.target.value)
                }
                placeholder="2024"
                min="1990"
                max="2030"
              />
            </div>

            <div className="verification-info">
              <div className="info-section">
                <h4>🎯 Mục đích:</h4>
                <ul>
                  <li>
                    Đảm bảo gia sư có nền tảng kiến thức đúng chuyên ngành
                  </li>
                  <li>
                    Phân loại gia sư (Sinh viên – Giáo viên – Người đi làm)
                  </li>
                  <li>Hỗ trợ phụ huynh chọn gia sư phù hợp trình độ</li>
                </ul>
              </div>

              <div className="info-section">
                <h4>🔍 Hệ thống xử lý:</h4>
                <ul>
                  <li>
                    Dò trùng tên trường, ngành học, bằng cấp để ngăn giả mạo
                  </li>
                  <li>
                    Nếu tài liệu mờ, thiếu thông tin → hệ thống gắn cờ "Cần xác
                    minh lại"
                  </li>
                  <li>
                    Hệ thống có thể yêu cầu xác minh video ngắn (tùy hệ thống
                    nâng cao)
                  </li>
                </ul>
              </div>
            </div>

            <div className="form-group">
              <label>Loại tài liệu *</label>
              <select
                value={formData.educationType}
                onChange={(e) =>
                  handleInputChange("educationType", e.target.value)
                }
              >
                <option value="">-- Chọn loại tài liệu --</option>
                <option value="student_card">Thẻ sinh viên + Bảng điểm</option>
                <option value="diploma">Bằng tốt nghiệp Đại học</option>
                <option value="master">Bằng Thạc sĩ</option>
                <option value="phd">Bằng Tiến sĩ</option>
                <option value="teacher_card">
                  Thẻ giáo viên + Bằng sư phạm
                </option>
              </select>
            </div>

            <div className="form-group">
              <label>Tài liệu chứng minh *</label>
              <div className="file-upload-area">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) =>
                    handleFileChange("educationDocument", e.target.files[0])
                  }
                />
                <div className="upload-placeholder">
                  <div className="upload-icon">🎓</div>
                  <p>Kéo thả tài liệu vào đây hoặc nhấn để chọn</p>
                </div>
              </div>
              {formData.educationDocument && (
                <div className="file-preview">
                  <div className="preview-image">
                    <img
                      src={URL.createObjectURL(formData.educationDocument)}
                      alt="Tài liệu học vấn"
                    />
                  </div>
                  <div className="file-info">
                    <div className="file-name">
                      {formData.educationDocument.name}
                    </div>
                    <div className="file-size">
                      {formatBytes(formData.educationDocument.size)}
                    </div>
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => removeSelectedFile("educationDocument")}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="requirements">
              <h4>📋 Yêu cầu theo nhóm đối tượng:</h4>
              <div className="requirement-table">
                <div className="req-row">
                  <strong>Sinh viên:</strong> Thẻ sinh viên còn hạn + Bảng điểm
                  gần nhất
                </div>
                <div className="req-row">
                  <strong>Người đã tốt nghiệp:</strong> Bằng tốt nghiệp Đại
                  học/Thạc sĩ/Tiến sĩ
                </div>
                <div className="req-row">
                  <strong>Giáo viên:</strong> Thẻ giáo viên + Bằng cấp sư phạm
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <h3>Kinh nghiệm giảng dạy</h3>
            <p>Thông tin về môn dạy và phương pháp giảng dạy của bạn.</p>

            <div className="form-group">
              <label>Môn dạy và học phí</label>
              <div className="subjects-list">
                {[
                  "Toán",
                  "Lý",
                  "Hóa",
                  "Sinh",
                  "Văn",
                  "Anh",
                  "Lịch sử",
                  "Địa lý",
                  "Tin học",
                ].map((subject) => (
                  <div key={subject} className="subject-item">
                    <div className="subject-header">
                      <label className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={formData.subjects.some(
                            (s) => s.name === subject
                          )}
                          onChange={(e) => {
                            if (e.target.checked) {
                              // Chỉ thêm tên môn học
                              setFormData((prev) => ({
                                ...prev,
                                subjects: [
                                  ...prev.subjects,
                                  {
                                    name: subject,
                                  },
                                ],
                              }));
                            } else {
                              // Xóa môn học
                              setFormData((prev) => ({
                                ...prev,
                                subjects: prev.subjects.filter(
                                  (s) => s.name !== subject
                                ),
                              }));
                            }
                          }}
                        />
                        <span className="checkmark"></span>
                        {subject}
                      </label>
                    </div>

                    {/* Removed all description and level fields */}
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Kinh nghiệm (năm)</label>
              <input
                type="number"
                value={formData.experience}
                onChange={(e) =>
                  handleInputChange("experience", e.target.value)
                }
                placeholder="2"
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Học phí chung cho tất cả các môn (VNĐ/buổi)</label>
              <input
                type="number"
                value={formData.sessionRate}
                onChange={(e) =>
                  handleInputChange("sessionRate", e.target.value)
                }
                placeholder="VD: 200000"
                min="0"
                className="price-input"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="step-content">
            <h3>Thông tin bổ sung</h3>
            <p>Giới thiệu bản thân và chia sẻ mục tiêu giảng dạy của bạn.</p>

            <div className="form-group">
              <label>Giới thiệu bản thân</label>
              <textarea
                value={formData.introduction}
                onChange={(e) =>
                  handleInputChange("introduction", e.target.value)
                }
                placeholder="Xin chào! Tôi là [Tên], hiện đang là sinh viên năm 3 ngành Công nghệ thông tin tại Đại học Bách Khoa Hà Nội..."
                rows={4}
              />
            </div>

            <div className="form-group">
              <label>Mục tiêu giảng dạy</label>
              <textarea
                value={formData.teachingGoals}
                onChange={(e) =>
                  handleInputChange("teachingGoals", e.target.value)
                }
                placeholder="Tôi muốn giúp học sinh hiểu rõ các khái niệm toán học, phát triển tư duy logic và đạt được kết quả học tập tốt..."
                rows={4}
              />
            </div>

            <div className="form-group">
              <label>Điểm mạnh của bạn</label>
              <textarea
                value={formData.strengths}
                onChange={(e) => handleInputChange("strengths", e.target.value)}
                placeholder="Kiên nhẫn, có kinh nghiệm giải bài tập khó, biết cách truyền đạt dễ hiểu..."
                rows={3}
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="step-content">
            <h3>Chứng chỉ & Thành tích Liên quan</h3>
            <p>
              Tải lên các chứng chỉ bổ trợ hoặc thành tích học thuật (không bắt
              buộc).
            </p>

            <div className="verification-info">
              <div className="info-section">
                <h4>🎯 Mục đích:</h4>
                <ul>
                  <li>Làm nổi bật hồ sơ gia sư trong hệ thống gợi ý lớp học</li>
                  <li>
                    Cung cấp thông tin chính xác giúp phụ huynh dễ chọn gia sư
                    uy tín
                  </li>
                  <li>Tăng điểm tin cậy (trust score) của tài khoản</li>
                </ul>
              </div>

              <div className="info-section">
                <h4>🏆 Hệ thống xử lý:</h4>
                <ul>
                  <li>
                    Các chứng chỉ được lưu ở trạng thái "đã xác minh" sau khi hệ
                    thống kiểm tra
                  </li>
                  <li>
                    Những gia sư có chứng chỉ được hiển thị huy hiệu "Đã xác
                    minh học vấn / Có chứng chỉ"
                  </li>
                </ul>
              </div>
            </div>

            <div className="form-group">
              <label>Tên chứng chỉ/Thành tích</label>
              <input
                type="text"
                value={formData.certificateName}
                onChange={(e) =>
                  handleInputChange("certificateName", e.target.value)
                }
                placeholder="Ví dụ: IELTS 7.5, TOEIC 850, Giải nhất Olympic Toán..."
              />
            </div>

            <div className="form-group">
              <label>Loại chứng chỉ</label>
              <select
                value={formData.certificateType}
                onChange={(e) =>
                  handleInputChange("certificateType", e.target.value)
                }
              >
                <option value="">-- Chọn loại --</option>
                <option value="language">
                  Ngoại ngữ (IELTS, TOEIC, HSK, JLPT...)
                </option>
                <option value="academic">
                  Học thuật (Olympic, học sinh giỏi...)
                </option>
                <option value="professional">Chuyên môn (MOS, IC3...)</option>
                <option value="achievement">Thành tích khác</option>
              </select>
            </div>

            <div className="form-group">
              <label>Tài liệu chứng chỉ</label>
              <div className="file-upload-area">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) =>
                    handleFileChange("certificateDocument", e.target.files[0])
                  }
                />
                <div className="upload-placeholder">
                  <div className="upload-icon">🏆</div>
                  <p>Kéo thả tài liệu vào đây hoặc nhấn để chọn</p>
                </div>
              </div>
            </div>

            <div className="note">
              <p>
                <strong>💡 Lưu ý:</strong> Bước này là tùy chọn. Bạn có thể bỏ
                qua nếu không có chứng chỉ nào.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="onboarding-wizard">
      <UniversalHeader />
      <div className="wizard-container">
        <div className="wizard-header">
          <h1>Đăng ký trở thành gia sư</h1>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="wizard-content">
          <div className="wizard-main">
            {renderStepContent()}

            <div className="wizard-actions">
              {currentStep > 1 && (
                <button className="btn-previous" onClick={handlePrevious}>
                  Quay lại
                </button>
              )}

              <div className="btn-group">
                {currentStep < 5 ? (
                  <button className="btn-next" onClick={handleNext}>
                    Tiếp theo
                  </button>
                ) : (
                  <button className="btn-submit" onClick={handleSubmit}>
                    Hoàn thành đăng ký
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="wizard-sidebar">
            <div className="steps-panel">
              <h3>Quy trình đăng ký</h3>
              <div className="steps-list">
                {steps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`step-item ${
                      currentStep === step.id ? "active" : ""
                    } ${currentStep > step.id ? "completed" : ""}`}
                  >
                    <div className="step-number">{step.id}</div>
                    <div className="step-info">
                      <div className="step-title">{step.title}</div>
                      <div className="step-description">{step.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="benefits-panel">
              <h4>Lợi ích khi trở thành gia sư</h4>
              <ul>
                <li>✅ Thu nhập linh hoạt</li>
                <li>✅ Làm việc từ xa</li>
                <li>✅ Phát triển kỹ năng giảng dạy</li>
                <li>✅ Hỗ trợ học sinh</li>
                <li>✅ Cộng đồng gia sư chuyên nghiệp</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
