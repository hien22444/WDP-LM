<<<<<<< HEAD
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TutorService from "../../services/TutorService";
// Availability step removed
import "./OnboardingWizard.scss";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";

const OnboardingWizard = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [idPreviews, setIdPreviews] = useState([]);
  const [idFrontPreview, setIdFrontPreview] = useState(null);
  const [idBackPreview, setIdBackPreview] = useState(null);
  const [degreePreviews, setDegreePreviews] = useState([]);
  const [uploadingIdDocs, setUploadingIdDocs] = useState(false);
  const [uploadingDegreeDocs, setUploadingDegreeDocs] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const p = await TutorService.getMyTutorProfile();
        setProfile(p);
        setAvatarUrl(p?.avatarUrl || "");
        setAvatarPreview(p?.avatarUrl || "");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const next = () => setStep((s) => Math.min(4, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  const saveBasic = async (e) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const payload = {
      avatarUrl: avatarUrl || undefined,
      gender: form.get("gender") || undefined,
      dateOfBirth: form.get("dateOfBirth") || undefined,
      city: form.get("city") || undefined,
      district: form.get("district") || undefined,
      bio: form.get("bio") || undefined,
    };
    try {
      const p = await TutorService.updateTutorBasic(payload);
      setProfile(p);
    } catch (err) {
      console.warn("updateTutorBasic failed, continue onboarding:", err?.response?.status);
      // Fallback: lưu tạm trên client để tiếp tục quy trình
      setProfile((prev) => ({ ...(prev || {}), ...payload }));
      toast.warn("Không lưu được lên máy chủ lúc này. Tiếp tục bước kế tiếp.");
    } finally {
      setLoading(false);
      next();
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước file không được vượt quá 5MB");
      return;
    }

    try {
      setAvatarUploading(true);
      // preview tạm thời trước khi upload
      const objectUrl = URL.createObjectURL(file);
      setAvatarPreview(objectUrl);

      const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api/v1";
      const accessToken = Cookies.get("accessToken");

      const formData = new FormData();
      formData.append("avatar", file);

      const resp = await axios.post(`${API_BASE_URL}/users/upload-avatar`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${accessToken}`,
        },
        withCredentials: true,
      });

      if (resp.data?.imageUrl) {
        setAvatarUrl(resp.data.imageUrl);
        setAvatarPreview(resp.data.imageUrl);
        toast.success("Tải ảnh đại diện thành công!");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không thể tải ảnh, thử lại!");
    } finally {
      setAvatarUploading(false);
    }
  };

  const saveExpertise = async (e) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const subjects = (form.get("subjects") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name) => ({ name }));
    const payload = {
      subjects,
      experienceYears: Number(form.get("experienceYears") || 0),
      experiencePlaces: form.get("experiencePlaces") || undefined,
    };
    const p = await TutorService.updateTutorExpertise(payload);
    setProfile(p);
    setLoading(false);
    next();
  };

  // Preferences step removed

  // Availability step removed

  const submitProfile = async () => {
    setLoading(true);
    await TutorService.submitTutorProfile();
    setLoading(false);
    navigate("/dashboard");
  };

  if (loading && !profile) return <div style={{ padding: 24 }}>Đang tải...</div>;

  return (
    <div className="onboarding-wizard">
      <div className="wizard-header" aria-live="polite">
        <h1>Đăng ký trở thành gia sư</h1>
        <div className="progress-bar" aria-label={`Tiến độ: bước ${step} trên 4`}>
          <div
            className="progress-fill"
            style={{ width: `${(step / 4) * 100}%` }}
          ></div>
        </div>
        <div className="step-indicator" role="tablist" aria-label="Các bước đăng ký">
          {[1, 2, 3, 4].map((stepNum) => (
            <div
              key={stepNum}
              className={`step ${
                stepNum < step
                  ? "completed"
                  : stepNum === step
                  ? "active"
                  : "pending"
              }`}
              role="tab"
              aria-selected={stepNum === step}
              aria-current={stepNum === step ? "step" : undefined}
              tabIndex={stepNum <= step ? 0 : -1}
              aria-disabled={stepNum > step}
              onClick={() => {
                if (stepNum <= step) setStep(stepNum);
              }}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && stepNum <= step) {
                  e.preventDefault();
                  setStep(stepNum);
                }
              }}
            >
              {stepNum}
            </div>
          ))}
        </div>
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}

      <div className="wizard-content">
        {step === 1 && (
          <div className="step-content" aria-labelledby="step1-title">
            <h2 id="step1-title">Thông tin cơ bản</h2>
            <p>
              Hãy cung cấp thông tin cá nhân cơ bản để học viên có thể hiểu rõ hơn về bạn.
            </p>

            <form onSubmit={saveBasic}>
              <div className="form-group">
                <label htmlFor="avatarFile">Ảnh đại diện</label>
                <input id="avatarFile" type="file" accept="image/*" onChange={handleAvatarUpload} />
              </div>
              {avatarPreview && (
                <div className="form-group" aria-live="polite">
                  <img src={avatarPreview} alt="Xem trước ảnh đại diện" style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "2px solid #e9ecef" }} />
                  {avatarUploading && <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>Đang tải ảnh...</div>}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="gender">Giới tính</label>
                <select id="gender" name="gender" defaultValue={profile?.gender || ""}>
                  <option value="">--</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="dateOfBirth">Ngày sinh</label>
                <input
                  id="dateOfBirth"
                  type="date"
                  name="dateOfBirth"
                  defaultValue={
                    profile?.dateOfBirth
                      ? profile.dateOfBirth.substring(0, 10)
                      : ""
                  }
                />
              </div>

              <div className="form-group">
                <label htmlFor="city">Thành phố</label>
                <input id="city" name="city" defaultValue={profile?.city || ""} />
              </div>

              <div className="form-group">
                <label htmlFor="district">Quận/Huyện</label>
                <input id="district" name="district" defaultValue={profile?.district || ""} />
              </div>

              <div className="form-group">
                <label htmlFor="bio">Mô tả ngắn về bản thân</label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  defaultValue={profile?.bio || ""}
                  placeholder="Giới thiệu về bản thân, sở thích, phong cách giảng dạy..."
                />
              </div>

              <div className="wizard-actions">
                <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  Lưu & tiếp tục
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 2 && (
          <div className="step-content" aria-labelledby="step2-title">
            <h2 id="step2-title">Chuyên môn giảng dạy</h2>
            <p>Thêm các môn/khóa có thể dạy và kinh nghiệm của bạn.</p>
            <form onSubmit={saveExpertise}>
              <div className="form-group">
                <label htmlFor="subjects">Môn/khóa có thể dạy (ngăn cách bởi dấu phẩy)</label>
                <input
                  id="subjects"
                  name="subjects"
                  placeholder="Toán cấp 2, Python, IELTS Speaking"
                  defaultValue={(profile?.subjects || []).map((s) => s.name).join(", ")}
                />
              </div>

              <div className="form-group">
                <label htmlFor="experienceYears">Kinh nghiệm (năm)</label>
                <input
                  id="experienceYears"
                  type="number"
                  name="experienceYears"
                  min={0}
                  defaultValue={profile?.experienceYears || 0}
                  inputMode="numeric"
=======
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import { submitTutorProfile, uploadIdDocuments, uploadDegreeDocuments } from '../../services/TutorService';
import UniversalHeader from '../../components/Layout/UniversalHeader';
import "./OnboardingWizard.scss";

const OnboardingWizard = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Education info
    education: '',
    major: '',
    university: '',
    graduationYear: '',
    
    // Teaching info
    subjects: [],
    experience: '',
    hourlyRate: '',
    
    // Documents
    identityFront: null,
    identityBack: null,
    educationDocument: null,
    certificateDocument: null,
    
    // Additional fields for verification
    educationType: '',
    certificateName: '',
    certificateType: '',
    
    // Additional info (Step 4)
    introduction: '',
    teachingGoals: '',
    strengths: ''
  });

  const steps = [
    { id: 1, title: 'Xác minh danh tính', description: 'CCCD/CMND/Hộ chiếu (quan trọng nhất)' },
    { id: 2, title: 'Trình độ học vấn', description: 'Bằng cấp chính thức' },
    { id: 3, title: 'Kinh nghiệm giảng dạy', description: 'Môn dạy và phương pháp' },
    { id: 4, title: 'Thông tin bổ sung', description: 'Giới thiệu và mục tiêu' },
    { id: 5, title: 'Chứng chỉ & thành tích', description: 'IELTS, TOEIC, giải thưởng... (tùy chọn)' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (field, file) => {
    setFormData(prev => ({
      ...prev,
      [field]: file
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
    if (!bytes && bytes !== 0) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const removeSelectedFile = (field) => {
    setFormData((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async () => {
    try {
      console.log('Form submitted:', formData);
      
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
      
      // 3. Submit tutor profile to backend
      const result = await submitTutorProfile();
      
      // 4. Show success message
      toast.success("🎉 Đăng ký gia sư thành công! Hồ sơ của bạn đang được xem xét.");
      
      // 5. Redirect to profile page
      navigate('/profile');
      
    } catch (error) {
      console.error('Error submitting tutor profile:', error);
      const errorMessage = error.response?.data?.message || "Có lỗi xảy ra khi đăng ký gia sư";
      toast.error(`❌ ${errorMessage}`);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <h3>Xác minh Danh tính</h3>
            <p>Tải lên ảnh chụp rõ nét hai mặt Căn cước công dân (CCCD), hoặc giấy tờ tùy thân hợp lệ (CMND, hộ chiếu, bằng lái xe).</p>
            
            <div className="verification-info">
              <div className="info-section">
                <h4>🎯 Mục đích:</h4>
                <ul>
                  <li>Xác minh người đăng ký là thật và chịu trách nhiệm pháp lý</li>
                  <li>Ngăn chặn gian lận (đăng ký giả danh, mạo danh sinh viên/trường)</li>
                  <li>Tăng độ tin cậy cho học viên và phụ huynh khi xem hồ sơ</li>
                </ul>
        </div>
              
              <div className="info-section">
                <h4>🔒 Hệ thống xử lý:</h4>
                <ul>
                  <li>Tự động làm mờ số CCCD khi hiển thị công khai</li>
                  <li>Hệ thống sẽ tự động xác thực</li>
                  <li>Nếu ảnh không rõ hoặc sai thông tin → tự động báo lỗi, yêu cầu tải lại</li>
                </ul>
        </div>
      </div>

            <div className="form-group">
              <label>Ảnh mặt trước CCCD/CMND/Hộ chiếu *</label>
              <div className="file-upload-area">
                <input type="file" accept="image/*" onChange={(e) => handleFileChange('identityFront', e.target.files[0])} />
                <div className="upload-placeholder">
                  <div className="upload-icon">📄</div>
                  <p>Kéo thả ảnh vào đây hoặc nhấn để chọn</p>
                </div>
              </div>
              {formData.identityFront && (
                <div className="file-preview">
                  <div className="preview-image">
                    <img src={URL.createObjectURL(formData.identityFront)} alt="Ảnh mặt trước" />
                  </div>
                  <div className="file-info">
                    <div className="file-name">{formData.identityFront.name}</div>
                    <div className="file-size">{formatBytes(formData.identityFront.size)}</div>
                    <button type="button" className="remove-btn" onClick={() => removeSelectedFile('identityFront')}>Xóa</button>
                  </div>
        </div>
      )}
            </div>

              <div className="form-group">
              <label>Ảnh mặt sau CCCD/CMND *</label>
              <div className="file-upload-area">
                <input type="file" accept="image/*" onChange={(e) => handleFileChange('identityBack', e.target.files[0])} />
                <div className="upload-placeholder">
                  <div className="upload-icon">📄</div>
                  <p>Kéo thả ảnh vào đây hoặc nhấn để chọn</p>
                </div>
              </div>
              {formData.identityBack && (
                <div className="file-preview">
                  <div className="preview-image">
                    <img src={URL.createObjectURL(formData.identityBack)} alt="Ảnh mặt sau" />
                  </div>
                  <div className="file-info">
                    <div className="file-name">{formData.identityBack.name}</div>
                    <div className="file-size">{formatBytes(formData.identityBack.size)}</div>
                    <button type="button" className="remove-btn" onClick={() => removeSelectedFile('identityBack')}>Xóa</button>
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
              <select value={formData.education} onChange={(e) => handleInputChange('education', e.target.value)}>
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
                  onChange={(e) => handleInputChange('major', e.target.value)}
                  placeholder="Công nghệ thông tin, Toán học..."
                />
              </div>
              <div className="form-group">
                <label>Trường/Đại học</label>
                <input
                  type="text"
                  value={formData.university}
                  onChange={(e) => handleInputChange('university', e.target.value)}
                  placeholder="Đại học Bách Khoa Hà Nội..."
                />
              </div>
            </div>

              <div className="form-group">
              <label>Năm tốt nghiệp</label>
                <input
                type="number"
                value={formData.graduationYear}
                onChange={(e) => handleInputChange('graduationYear', e.target.value)}
                placeholder="2024"
                min="1990"
                max="2030"
                />
              </div>

            <div className="verification-info">
              <div className="info-section">
                <h4>🎯 Mục đích:</h4>
                <ul>
                  <li>Đảm bảo gia sư có nền tảng kiến thức đúng chuyên ngành</li>
                  <li>Phân loại gia sư (Sinh viên – Giáo viên – Người đi làm)</li>
                  <li>Hỗ trợ phụ huynh chọn gia sư phù hợp trình độ</li>
                </ul>
              </div>
              
              <div className="info-section">
                <h4>🔍 Hệ thống xử lý:</h4>
                <ul>
                  <li>Dò trùng tên trường, ngành học, bằng cấp để ngăn giả mạo</li>
                  <li>Nếu tài liệu mờ, thiếu thông tin → hệ thống gắn cờ "Cần xác minh lại"</li>
                  <li>Hệ thống có thể yêu cầu xác minh video ngắn (tùy hệ thống nâng cao)</li>
                </ul>
              </div>
              </div>

              <div className="form-group">
              <label>Loại tài liệu *</label>
              <select value={formData.educationType} onChange={(e) => handleInputChange('educationType', e.target.value)}>
                <option value="">-- Chọn loại tài liệu --</option>
                <option value="student_card">Thẻ sinh viên + Bảng điểm</option>
                <option value="diploma">Bằng tốt nghiệp Đại học</option>
                <option value="master">Bằng Thạc sĩ</option>
                <option value="phd">Bằng Tiến sĩ</option>
                <option value="teacher_card">Thẻ giáo viên + Bằng sư phạm</option>
              </select>
              </div>

              <div className="form-group">
              <label>Tài liệu chứng minh *</label>
              <div className="file-upload-area">
                <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileChange('educationDocument', e.target.files[0])} />
                <div className="upload-placeholder">
                  <div className="upload-icon">🎓</div>
                  <p>Kéo thả tài liệu vào đây hoặc nhấn để chọn</p>
                </div>
              </div>
              {formData.educationDocument && (
                <div className="file-preview">
                  <div className="preview-image">
                    <img src={URL.createObjectURL(formData.educationDocument)} alt="Tài liệu học vấn" />
                  </div>
                  <div className="file-info">
                    <div className="file-name">{formData.educationDocument.name}</div>
                    <div className="file-size">{formatBytes(formData.educationDocument.size)}</div>
                    <button type="button" className="remove-btn" onClick={() => removeSelectedFile('educationDocument')}>Xóa</button>
                  </div>
                </div>
              )}
            </div>

            <div className="requirements">
              <h4>📋 Yêu cầu theo nhóm đối tượng:</h4>
              <div className="requirement-table">
                <div className="req-row">
                  <strong>Sinh viên:</strong> Thẻ sinh viên còn hạn + Bảng điểm gần nhất
                </div>
                <div className="req-row">
                  <strong>Người đã tốt nghiệp:</strong> Bằng tốt nghiệp Đại học/Thạc sĩ/Tiến sĩ
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
              <label>Môn dạy</label>
              <div className="checkbox-group">
                {['Toán', 'Lý', 'Hóa', 'Sinh', 'Văn', 'Anh', 'Lịch sử', 'Địa lý', 'Tin học'].map(subject => (
                  <label key={subject} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={formData.subjects.includes(subject)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            subjects: [...prev.subjects, subject]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            subjects: prev.subjects.filter(s => s !== subject)
                          }));
                        }
                      }}
                    />
                    <span className="checkmark"></span>
                    {subject}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Kinh nghiệm (năm)</label>
                <input
                  type="number"
                  value={formData.experience}
                  onChange={(e) => handleInputChange('experience', e.target.value)}
                  placeholder="2"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Mức phí (VNĐ/giờ)</label>
                <input
                  type="number"
                  value={formData.hourlyRate}
                  onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                  placeholder="200000"
                  min="50000"
                />
              </div>
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
                onChange={(e) => handleInputChange('introduction', e.target.value)}
                placeholder="Xin chào! Tôi là [Tên], hiện đang là sinh viên năm 3 ngành Công nghệ thông tin tại Đại học Bách Khoa Hà Nội..."
                  rows={4}
>>>>>>> Quan3
                />
              </div>

              <div className="form-group">
<<<<<<< HEAD
                <label htmlFor="experiencePlaces">Nơi từng dạy</label>
                <input id="experiencePlaces" name="experiencePlaces" defaultValue={profile?.experiencePlaces || ""} />
              </div>

              <div className="wizard-actions">
                <button type="button" className="btn-secondary" onClick={back}>Quay lại</button>
                <button type="submit" className="btn-primary">Lưu & tiếp tục</button>
              </div>
            </form>
          </div>
        )}
        
        {step === 3 && (
          <div className="step-content" aria-labelledby="step5-title">
            <h2 id="step5-title">Tài liệu xác minh</h2>
            <p>Tải ảnh CMND/CCCD/Hộ chiếu và bằng cấp/chứng chỉ. Hỗ trợ JPG/PNG/WebP (PDF cho bằng cấp).</p>

            <div className="file-upload">
              <div className="upload-group">
                <label className="upload-label" htmlFor="idFront">Giấy tờ tùy thân - Mặt trước</label>
                <input id="idFront" type="file" accept="image/*" onChange={async (e) => {
                  const file = e.target.files && e.target.files[0];
                  if (!file) return;
                  setUploadingIdDocs(true);
                  setIdFrontPreview(URL.createObjectURL(file));
                  try {
                    await TutorService.uploadIdDocuments([file]);
                    toast.success("Đã tải mặt trước");
                  } catch (err) {
                    toast.error(err?.response?.data?.message || "Không thể tải mặt trước, thử lại!");
                  } finally {
                    setUploadingIdDocs(false);
                  }
                }} />

                <label className="upload-label" htmlFor="idBack" style={{ marginTop: 8 }}>Giấy tờ tùy thân - Mặt sau</label>
                <input id="idBack" type="file" accept="image/*" onChange={async (e) => {
                  const file = e.target.files && e.target.files[0];
                  if (!file) return;
                  setUploadingIdDocs(true);
                  setIdBackPreview(URL.createObjectURL(file));
                  try {
                    await TutorService.uploadIdDocuments([file]);
                    toast.success("Đã tải mặt sau");
                  } catch (err) {
                    toast.error(err?.response?.data?.message || "Không thể tải mặt sau, thử lại!");
                  } finally {
                    setUploadingIdDocs(false);
                  }
                }} />

                {(idFrontPreview || idBackPreview) && (
                  <div className="upload-grid">
                    {idFrontPreview && (
                      <div className="preview-item" title="Mặt trước">
                        <img src={idFrontPreview} alt="Mặt trước" />
                        <button type="button" className="remove" onClick={() => setIdFrontPreview(null)}>×</button>
                      </div>
                    )}
                    {idBackPreview && (
                      <div className="preview-item" title="Mặt sau">
                        <img src={idBackPreview} alt="Mặt sau" />
                        <button type="button" className="remove" onClick={() => setIdBackPreview(null)}>×</button>
                      </div>
                    )}
                  </div>
                )}
                {uploadingIdDocs && <div className="uploading-hint">Đang tải lên...</div>}
              </div>

              <div className="upload-group">
                <label className="upload-label" htmlFor="degreeDocs">Bằng cấp/Chứng chỉ</label>
                <input id="degreeDocs" type="file" multiple accept="image/*,application/pdf" onChange={async (e) => {
                  if (!e.target.files?.length) return;
                  setUploadingDegreeDocs(true);
                  const previews = Array.from(e.target.files).map(f => ({ name: f.name, url: f.type === 'application/pdf' ? null : URL.createObjectURL(f) }));
                  setDegreePreviews(prev => [...prev, ...previews]);
                  try {
                    await TutorService.uploadDegreeDocuments(e.target.files);
                    toast.success("Tải bằng cấp/chứng chỉ thành công");
                  } catch (err) {
                    toast.error(err?.response?.data?.message || "Không thể tải bằng cấp, thử lại!");
                  } finally {
                    setUploadingDegreeDocs(false);
                  }
                }} />

                {degreePreviews.length > 0 && (
                  <div className="upload-grid">
                    {degreePreviews.map((p, idx) => (
                      <div className="preview-item" key={idx} title={p.name}>
                        {p.url ? (
                          <img src={p.url} alt={p.name} />
                        ) : (
                          <div className="pdf-chip">PDF</div>
                        )}
                        <button type="button" className="remove" onClick={() => setDegreePreviews(prev => prev.filter((_, i) => i !== idx))}>×</button>
                      </div>
                    ))}
                  </div>
                )}
                {uploadingDegreeDocs && <div className="uploading-hint">Đang tải lên...</div>}
              </div>
            </div>
            <div className="wizard-actions">
              <button className="btn-secondary" onClick={back}>Quay lại</button>
              <button className="btn-primary" onClick={next}>Tiếp tục</button>
            </div>
          </div>
        )}
        {step === 4 && (
          <div className="step-content" aria-labelledby="step6-title">
            <h2 id="step6-title">Xem lại & gửi duyệt</h2>
            <p>
              Xem lại và gửi hồ sơ để Admin duyệt. Bạn có thể tải tài liệu ở
              phần hồ sơ sau.
            </p>
            <div className="wizard-actions">
              <button className="btn-secondary" onClick={back}>Quay lại</button>
              <button className="btn-success" onClick={submitProfile}>Gửi duyệt</button>
            </div>
          </div>
        )}
=======
              <label>Mục tiêu giảng dạy</label>
              <textarea
                value={formData.teachingGoals}
                onChange={(e) => handleInputChange('teachingGoals', e.target.value)}
                placeholder="Tôi muốn giúp học sinh hiểu rõ các khái niệm toán học, phát triển tư duy logic và đạt được kết quả học tập tốt..."
                rows={4}
                />
              </div>

              <div className="form-group">
              <label>Điểm mạnh của bạn</label>
              <textarea
                value={formData.strengths}
                onChange={(e) => handleInputChange('strengths', e.target.value)}
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
            <p>Tải lên các chứng chỉ bổ trợ hoặc thành tích học thuật (không bắt buộc).</p>
            
            <div className="verification-info">
              <div className="info-section">
                <h4>🎯 Mục đích:</h4>
                <ul>
                  <li>Làm nổi bật hồ sơ gia sư trong hệ thống gợi ý lớp học</li>
                  <li>Cung cấp thông tin chính xác giúp phụ huynh dễ chọn gia sư uy tín</li>
                  <li>Tăng điểm tin cậy (trust score) của tài khoản</li>
                </ul>
              </div>

              <div className="info-section">
                <h4>🏆 Hệ thống xử lý:</h4>
                <ul>
                  <li>Các chứng chỉ được lưu ở trạng thái "đã xác minh" sau khi hệ thống kiểm tra</li>
                  <li>Những gia sư có chứng chỉ được hiển thị huy hiệu "Đã xác minh học vấn / Có chứng chỉ"</li>
                </ul>
              </div>
            </div>

            <div className="form-group">
              <label>Tên chứng chỉ/Thành tích</label>
                <input
                type="text"
                value={formData.certificateName}
                onChange={(e) => handleInputChange('certificateName', e.target.value)}
                placeholder="Ví dụ: IELTS 7.5, TOEIC 850, Giải nhất Olympic Toán..."
                />
              </div>

              <div className="form-group">
              <label>Loại chứng chỉ</label>
              <select value={formData.certificateType} onChange={(e) => handleInputChange('certificateType', e.target.value)}>
                <option value="">-- Chọn loại --</option>
                <option value="language">Ngoại ngữ (IELTS, TOEIC, HSK, JLPT...)</option>
                <option value="academic">Học thuật (Olympic, học sinh giỏi...)</option>
                <option value="professional">Chuyên môn (MOS, IC3...)</option>
                <option value="achievement">Thành tích khác</option>
              </select>
              </div>

            <div className="form-group">
              <label>Tài liệu chứng chỉ</label>
              <div className="file-upload-area">
                <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileChange('certificateDocument', e.target.files[0])} />
                <div className="upload-placeholder">
                  <div className="upload-icon">🏆</div>
                  <p>Kéo thả tài liệu vào đây hoặc nhấn để chọn</p>
                </div>
              </div>
          </div>

            <div className="note">
              <p><strong>💡 Lưu ý:</strong> Bước này là tùy chọn. Bạn có thể bỏ qua nếu không có chứng chỉ nào.</p>
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
            <div className="progress-fill" style={{ width: `${(currentStep / 5) * 100}%` }}></div>
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
                  <div key={step.id} className={`step-item ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}>
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
>>>>>>> Quan3
      </div>
    </div>
  );
};

<<<<<<< HEAD
export default OnboardingWizard;

=======
export default OnboardingWizard;
>>>>>>> Quan3
