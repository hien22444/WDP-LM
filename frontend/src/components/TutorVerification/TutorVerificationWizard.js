import React, { useState, useEffect, useRef } from 'react';
import tutorVerificationService from '../../services/TutorVerificationService';
import './TutorVerificationWizard.scss';

const TutorVerificationWizard = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [verificationData, setVerificationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const frontInputRef = useRef(null);
  const backInputRef = useRef(null);
  const eduInputRef = useRef(null);
  const certInputRef = useRef(null);
  const [formData, setFormData] = useState({
    // Identity documents
    identityType: 'cccd',
    identityFront: null,
    identityBack: null,
    
    // Education documents
    educationType: 'student_card',
    educationDocument: null,
    institutionName: '',
    major: '',
    graduationYear: '',
    gpa: '',
    
    // Certificates
    certificateName: '',
    certificateType: 'language',
    certificateDocument: null,
    issuingOrganization: '',
    issueDate: '',
    expiryDate: '',
    score: '',
    
  });

  const steps = [
    { id: 1, title: 'Xác minh danh tính', description: 'Tải lên CCCD/CMND' },
    { id: 2, title: 'Xác minh học vấn', description: 'Tài liệu chứng minh trình độ' },
    { id: 3, title: 'Chứng chỉ & thành tích', description: 'Chứng chỉ bổ trợ (tùy chọn)' },
    { id: 4, title: 'Cam kết', description: 'Ký cam kết trung thực' }
  ];

  useEffect(() => {
    if (isOpen) {
      loadVerificationStatus();
    }
  }, [isOpen]);

  const loadVerificationStatus = async () => {
    try {
      setLoading(true);
      const response = await tutorVerificationService.getVerificationStatus();
      setVerificationData(response.verification);
    } catch (error) {
      console.error('Error loading verification status:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const removeSelectedFile = (field) => {
    setFormData(prev => ({ ...prev, [field]: null }));
  };

  const formatBytes = (bytes) => {
    if (!bytes && bytes !== 0) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmitStep = async () => {
    setLoading(true);
    try {
      switch (currentStep) {
        case 1:
          await handleIdentitySubmit();
          break;
        case 2:
          await handleEducationSubmit();
          break;
        case 3:
          await handleCertificateSubmit();
          break;
        case 4:
          await handleCommitmentSubmit();
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error submitting step:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIdentitySubmit = async () => {
    const fd = new FormData();
    fd.append('type', formData.identityType);
    fd.append('front_image', formData.identityFront);
    fd.append('back_image', formData.identityBack);
    await tutorVerificationService.uploadIdentityDocuments(fd);
    handleNext();
  };

  const handleEducationSubmit = async () => {
    const fd = new FormData();
    fd.append('type', formData.educationType);
    fd.append('document_image', formData.educationDocument);
    fd.append('institution_name', formData.institutionName);
    fd.append('major', formData.major);
    if (formData.graduationYear) fd.append('graduation_year', formData.graduationYear);
    if (formData.gpa) fd.append('gpa', formData.gpa);
    await tutorVerificationService.uploadEducationDocument(fd);
    handleNext();
  };

  const handleCertificateSubmit = async () => {
    const fd = new FormData();
    fd.append('name', formData.certificateName);
    fd.append('type', formData.certificateType);
    fd.append('document_image', formData.certificateDocument);
    fd.append('issuing_organization', formData.issuingOrganization);
    if (formData.issueDate) fd.append('issue_date', formData.issueDate);
    if (formData.expiryDate) fd.append('expiry_date', formData.expiryDate);
    if (formData.score) fd.append('score', formData.score);
    await tutorVerificationService.uploadCertificate(fd);
    handleNext();
  };


  const handleCommitmentSubmit = async () => {
    await tutorVerificationService.signCommitment();
    await tutorVerificationService.submitForReview();
    onClose();
  };

  const preventDefault = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDropFile = (e, field) => {
    preventDefault(e);
    const droppedFiles = e.dataTransfer?.files;
    if (droppedFiles && droppedFiles[0]) {
      handleFileChange(field, droppedFiles[0]);
    }
  };

  const renderProgressBar = () => (
    <div className="progress-bar inline">
      <div className="progress-fill" style={{ width: `${(currentStep / steps.length) * 100}%` }}></div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderIdentityStep();
      case 2:
        return renderEducationStep();
      case 3:
        return renderCertificateStep();
      case 4:
        return renderCommitmentStep();
      default:
        return null;
    }
  };

  const renderIdentityStep = () => (
    <div className="step-content">
      {renderProgressBar()}
      <h3>Xác minh Danh tính</h3>
      <p>Tải lên ảnh chụp rõ nét hai mặt Căn cước công dân (CCCD) hoặc giấy tờ tùy thân hợp lệ.</p>
      
      <div className="form-group">
        <label>Loại giấy tờ *</label>
        <select 
          value={formData.identityType} 
          onChange={(e) => handleInputChange('identityType', e.target.value)}
        >
          <option value="cccd">Căn cước công dân (CCCD)</option>
          <option value="cmnd">Chứng minh nhân dân (CMND)</option>
          <option value="passport">Hộ chiếu</option>
          <option value="driver_license">Bằng lái xe</option>
        </select>
      </div>

      <div className="form-group">
        <label>Ảnh mặt trước *</label>
        <div
          className="dropzone"
          onDragEnter={preventDefault}
          onDragOver={preventDefault}
          onDrop={(e) => handleDropFile(e, 'identityFront')}
          onClick={() => frontInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') frontInputRef.current?.click(); }}
        >
          <div className="dz-icon" />
          <div className="dz-text">Kéo và thả ảnh vào đây, hoặc nhấn để chọn tệp</div>
        </div>
        <input ref={frontInputRef} type="file" accept="image/*" onChange={(e) => handleFileChange('identityFront', e.target.files[0])} />
        {formData.identityFront && (
          <div className="file-chip">
            <div className="meta">{formData.identityFront.name} · {formatBytes(formData.identityFront.size)}</div>
            <button type="button" className="remove-btn" onClick={() => removeSelectedFile('identityFront')}>Xóa</button>
          </div>
        )}
      </div>

      <div className="form-group">
        <label>Ảnh mặt sau *</label>
        <div
          className="dropzone"
          onDragEnter={preventDefault}
          onDragOver={preventDefault}
          onDrop={(e) => handleDropFile(e, 'identityBack')}
          onClick={() => backInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') backInputRef.current?.click(); }}
        >
          <div className="dz-icon" />
          <div className="dz-text">Kéo và thả ảnh vào đây, hoặc nhấn để chọn tệp</div>
        </div>
        <input ref={backInputRef} type="file" accept="image/*" onChange={(e) => handleFileChange('identityBack', e.target.files[0])} />
        {formData.identityBack && (
          <div className="file-chip">
            <div className="meta">{formData.identityBack.name} · {formatBytes(formData.identityBack.size)}</div>
            <button type="button" className="remove-btn" onClick={() => removeSelectedFile('identityBack')}>Xóa</button>
          </div>
        )}
      </div>

      <div className="requirements">
        <h4>Yêu cầu ảnh:</h4>
        <ul>
          <li>Ảnh phải rõ nét, không mờ</li>
          <li>Không che khuất thông tin quan trọng</li>
          <li>Trùng với thông tin cá nhân đã khai</li>
          <li>Định dạng: JPG, PNG (tối đa 5MB)</li>
        </ul>
      </div>
    </div>
  );

  const renderEducationStep = () => (
    <div className="step-content">
      {renderProgressBar()}
      <h3>Xác minh Trình độ Học vấn</h3>
      <p>Tải lên tài liệu chứng minh trình độ cao nhất và phù hợp với môn dạy.</p>
      
      <div className="form-group">
        <label>Loại tài liệu *</label>
        <select 
          value={formData.educationType} 
          onChange={(e) => handleInputChange('educationType', e.target.value)}
        >
          <option value="student_card">Thẻ sinh viên</option>
          <option value="diploma">Bằng tốt nghiệp</option>
          <option value="degree">Bằng đại học</option>
          <option value="teacher_card">Thẻ giáo viên</option>
        </select>
      </div>

      <div className="form-group">
        <label>Tài liệu *</label>
        <div
          className="dropzone"
          onDragEnter={preventDefault}
          onDragOver={preventDefault}
          onDrop={(e) => handleDropFile(e, 'educationDocument')}
          onClick={() => eduInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') eduInputRef.current?.click(); }}
        >
          <div className="dz-icon" />
          <div className="dz-text">Kéo và thả tệp vào đây, hoặc nhấn để chọn</div>
        </div>
        <input ref={eduInputRef} type="file" accept="image/*,.pdf" onChange={(e) => handleFileChange('educationDocument', e.target.files[0])} />
        {formData.educationDocument && (
          <div className="file-chip">
            <div className="meta">{formData.educationDocument.name} · {formatBytes(formData.educationDocument.size)}</div>
            <button type="button" className="remove-btn" onClick={() => removeSelectedFile('educationDocument')}>Xóa</button>
          </div>
        )}
      </div>

      <div className="form-group">
        <label>Tên trường/tổ chức *</label>
        <input
          type="text"
          value={formData.institutionName}
          onChange={(e) => handleInputChange('institutionName', e.target.value)}
          placeholder="Ví dụ: Đại học Bách Khoa Hà Nội"
        />
      </div>

      <div className="form-group">
        <label>Chuyên ngành *</label>
        <input
          type="text"
          value={formData.major}
          onChange={(e) => handleInputChange('major', e.target.value)}
          placeholder="Ví dụ: Công nghệ thông tin"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Năm tốt nghiệp</label>
          <input
            type="number"
            value={formData.graduationYear}
            onChange={(e) => handleInputChange('graduationYear', e.target.value)}
            placeholder="2024"
          />
        </div>

        <div className="form-group">
          <label>Điểm GPA</label>
          <input
            type="text"
            value={formData.gpa}
            onChange={(e) => handleInputChange('gpa', e.target.value)}
            placeholder="3.5/4.0"
          />
        </div>
      </div>
    </div>
  );

  const renderCertificateStep = () => (
    <div className="step-content">
      {renderProgressBar()}
      <h3>Chứng chỉ & Thành tích</h3>
      <p>Tải lên các chứng chỉ bổ trợ hoặc thành tích học thuật (tùy chọn).</p>
      
      <div className="form-group">
        <label>Tên chứng chỉ *</label>
        <input
          type="text"
          value={formData.certificateName}
          onChange={(e) => handleInputChange('certificateName', e.target.value)}
          placeholder="Ví dụ: IELTS 7.5"
        />
      </div>

      <div className="form-group">
        <label>Loại chứng chỉ *</label>
        <select 
          value={formData.certificateType} 
          onChange={(e) => handleInputChange('certificateType', e.target.value)}
        >
          <option value="language">Ngoại ngữ (IELTS, TOEIC, HSK...)</option>
          <option value="academic">Học thuật (Olympic, học sinh giỏi...)</option>
          <option value="professional">Chuyên môn (MOS, IC3...)</option>
          <option value="achievement">Thành tích khác</option>
        </select>
      </div>

      <div className="form-group">
        <label>Tài liệu chứng chỉ *</label>
        <div
          className="dropzone"
          onDragEnter={preventDefault}
          onDragOver={preventDefault}
          onDrop={(e) => handleDropFile(e, 'certificateDocument')}
          onClick={() => certInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') certInputRef.current?.click(); }}
        >
          <div className="dz-icon" />
          <div className="dz-text">Kéo và thả tệp vào đây, hoặc nhấn để chọn</div>
        </div>
        <input ref={certInputRef} type="file" accept="image/*,.pdf" onChange={(e) => handleFileChange('certificateDocument', e.target.files[0])} />
        {formData.certificateDocument && (
          <div className="file-chip">
            <div className="meta">{formData.certificateDocument.name} · {formatBytes(formData.certificateDocument.size)}</div>
            <button type="button" className="remove-btn" onClick={() => removeSelectedFile('certificateDocument')}>Xóa</button>
          </div>
        )}
      </div>

      <div className="form-group">
        <label>Tổ chức cấp chứng chỉ *</label>
        <input
          type="text"
          value={formData.issuingOrganization}
          onChange={(e) => handleInputChange('issuingOrganization', e.target.value)}
          placeholder="Ví dụ: British Council"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Ngày cấp</label>
          <input
            type="date"
            value={formData.issueDate}
            onChange={(e) => handleInputChange('issueDate', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Ngày hết hạn</label>
          <input
            type="date"
            value={formData.expiryDate}
            onChange={(e) => handleInputChange('expiryDate', e.target.value)}
          />
        </div>
      </div>

      <div className="form-group">
        <label>Điểm số</label>
        <input
          type="text"
          value={formData.score}
          onChange={(e) => handleInputChange('score', e.target.value)}
          placeholder="Ví dụ: 7.5, 850, A2..."
        />
      </div>

      <div className="note">
        <p><strong>Lưu ý:</strong> Bước này là tùy chọn. Bạn có thể bỏ qua nếu không có chứng chỉ nào.</p>
      </div>
    </div>
  );


  const renderCommitmentStep = () => (
    <div className="step-content">
      <h3>Cam kết Trung thực</h3>
      <p>Vui lòng đọc và ký cam kết dưới đây:</p>
      
      <div className="commitment-box">
        <h4>CAM KẾT CỦA GIA SƯ</h4>
        <p>
          Tôi cam kết các thông tin và giấy tờ cung cấp là trung thực, chính xác và đầy đủ. 
          Tôi hiểu rằng việc cung cấp thông tin sai sự thật hoặc giả mạo giấy tờ sẽ dẫn đến 
          việc khóa tài khoản vĩnh viễn và có thể bị xử lý theo pháp luật.
        </p>
        <p>
          Tôi cam kết tuân thủ các quy định của nền tảng và cung cấp dịch vụ giảng dạy 
          chất lượng, chuyên nghiệp cho học viên.
        </p>
        <p>
          Tôi đồng ý để nền tảng xác minh thông tin và giấy tờ đã cung cấp thông qua 
          các phương thức phù hợp.
        </p>
      </div>

      <div className="checkbox-group">
        <label className="checkbox-item">
          <input
            type="checkbox"
            checked={formData.commitmentAccepted}
            onChange={(e) => handleInputChange('commitmentAccepted', e.target.checked)}
          />
          <span className="checkmark"></span>
          Tôi đã đọc và đồng ý với cam kết trên
        </label>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="tutor-verification-fullscreen">
      <div className="tutor-verification-container">

        <div className="page-container">
          <div className="form-wrapper">
            <div className="modal-content">
              <div className="tvw-grid">
            <div className="tvw-left">
              {renderStepContent()}

              <div className="step-actions">
                {currentStep > 1 && (
                  <button 
                    className="btn-previous" 
                    onClick={handlePrevious}
                    disabled={loading}
                  >
                    Quay lại
                  </button>
                )}
                
                <div className="btn-group">
                  {currentStep < steps.length ? (
                    <button 
                      className="btn-next" 
                      onClick={handleSubmitStep}
                      disabled={loading}
                    >
                      {loading ? 'Đang xử lý...' : 'Tiếp theo'}
                    </button>
                  ) : (
                    <button 
                      className="btn-submit" 
                      onClick={handleSubmitStep}
                      disabled={loading || !formData.commitmentAccepted}
                    >
                      {loading ? 'Đang gửi...' : 'Gửi để xem xét'}
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="tvw-right">
              <div className="trust-panel">
                <div className="illustration" aria-hidden>
                  {/* simple inline SVG illustration */}
                  <svg width="100%" height="140" viewBox="0 0 400 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="8" y="24" width="180" height="104" rx="12" fill="#eff2ff"/>
                    <rect x="28" y="44" width="140" height="12" rx="6" fill="#cfd6ff"/>
                    <rect x="28" y="66" width="100" height="12" rx="6" fill="#cfd6ff"/>
                    <circle cx="300" cy="70" r="58" fill="#eefbf7"/>
                    <path d="M270 72l20 20 40-44" stroke="#21d4b4" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="next-steps">
                  <div className="steps-title">Quy trình 3 bước</div>
                  <ol>
                    <li className={currentStep===1? 'active' : ''}>1. Xác minh danh tính</li>
                    <li>2. Xác minh học vấn</li>
                    <li>3. Hoàn tất hồ sơ</li>
                  </ol>
                </div>
                <blockquote className="commit-quote">"EduMatch cam kết bảo mật thông tin của bạn. Việc xác thực giúp xây dựng cộng đồng gia sư uy tín và chất lượng."</blockquote>
                
                <div className="verification-benefits">
                  <h4>Lợi ích xác minh</h4>
                  <ul>
                    <li>Hồ sơ được đánh dấu "Đã xác minh"</li>
                    <li>Ưu tiên hiển thị trong tìm kiếm</li>
                    <li>Tăng độ tin cậy với học viên</li>
                    <li>Hỗ trợ ưu tiên từ EduMatch</li>
                    <li>Bảo mật thông tin cá nhân</li>
                  </ul>
                </div>
              </div>
            </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorVerificationWizard;
