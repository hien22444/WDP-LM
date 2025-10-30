import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import TutorService from '../../services/TutorService';
import './TutorProfileUpdateModal.scss';

const TutorProfileUpdateModal = ({ isOpen, onClose, tutorProfile, onUpdate }) => {
  const [formData, setFormData] = useState({
    introduction: '',
    subjects: [],
    experience: '',
    hourlyRate: '',
    location: '',
    education: '',
    university: '',
    teachingMethod: '',
    achievements: ''
  });

  const [availableSubjects] = useState([
    'Toán', 'Lý', 'Hóa', 'Sinh', 'Văn', 'Anh', 'Sử', 'Địa',
    'Tin học', 'Lập trình', 'Vật lý', 'Hóa học', 'Sinh học',
    'Ngữ văn', 'Tiếng Anh', 'Lịch sử', 'Địa lý'
  ]);

  const [experienceOptions] = useState([
    'Chưa có kinh nghiệm',
    'Dưới 1 năm',
    '1-3 năm',
    '3-5 năm',
    '5-10 năm',
    'Trên 10 năm'
  ]);

  useEffect(() => {
    if (tutorProfile && isOpen) {
      setFormData({
        introduction: tutorProfile.introduction || '',
        subjects: tutorProfile.subjects || [],
        experience: tutorProfile.experience || '',
        hourlyRate: tutorProfile.hourlyRate || '',
        location: tutorProfile.location || '',
        education: tutorProfile.education || '',
        university: tutorProfile.university || '',
        teachingMethod: tutorProfile.teachingMethod || '',
        achievements: tutorProfile.achievements || ''
      });
    }
  }, [tutorProfile, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubjectToggle = (subject) => {
    setFormData(prev => {
      const subjects = prev.subjects || [];
      if (subjects.includes(subject)) {
        return { ...prev, subjects: subjects.filter(s => s !== subject) };
      } else {
        return { ...prev, subjects: [...subjects, subject] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Update tutor profile
      const updatedProfile = await TutorService.updateTutorProfile(formData);
      
      toast.success('✅ Cập nhật hồ sơ thành công!');
      
      if (onUpdate) {
        onUpdate(updatedProfile);
      }
      
      onClose();
    } catch (error) {
      toast.error('❌ Không thể cập nhật hồ sơ. Vui lòng thử lại.');
      console.error('Error updating tutor profile:', error);
    }
  };

  // Don't render modal container when closed
  if (!isOpen) return null;

  return (
    <div className="tutor-profile-update-modal">
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Cập nhật hồ sơ gia sư</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        
        <form className="update-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Giới thiệu</h3>
            <textarea
              className="form-control"
              value={formData.introduction}
              onChange={(e) => handleInputChange('introduction', e.target.value)}
              placeholder="Hãy giới thiệu về bản thân bạn..."
              rows={4}
            />
          </div>

          <div className="form-section">
            <h3>Môn dạy</h3>
            <div className="subjects-grid">
              {availableSubjects.map(subject => (
                <label key={subject} className="subject-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.subjects.includes(subject)}
                    onChange={() => handleSubjectToggle(subject)}
                  />
                  <span>{subject}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-section">
            <h3>Kinh nghiệm giảng dạy</h3>
            <select
              className="form-control"
              value={formData.experience}
              onChange={(e) => handleInputChange('experience', e.target.value)}
            >
              <option value="">-- Chọn kinh nghiệm --</option>
              {experienceOptions.map(exp => (
                <option key={exp} value={exp}>{exp}</option>
              ))}
            </select>
          </div>

          <div className="form-section">
            <h3>Học phí</h3>
            <input
              type="number"
              className="form-control"
              value={formData.hourlyRate}
              onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
              placeholder="Ví dụ: 150000"
              min="0"
            />
          </div>

          <div className="form-section">
            <h3>Địa điểm giảng dạy</h3>
            <input
              type="text"
              className="form-control"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="Ví dụ: Đà Nẵng, Hà Nội..."
            />
          </div>

          <div className="form-section">
            <h3>Trình độ học vấn</h3>
            <select
              className="form-control"
              value={formData.education}
              onChange={(e) => handleInputChange('education', e.target.value)}
            >
              <option value="">-- Chọn trình độ --</option>
              <option value="Đại học">Đại học</option>
              <option value="Thạc sĩ">Thạc sĩ</option>
              <option value="Tiến sĩ">Tiến sĩ</option>
              <option value="Sinh viên">Sinh viên</option>
              <option value="Giáo viên">Giáo viên</option>
            </select>
          </div>

          <div className="form-section">
            <h3>Trường/Đại học</h3>
            <input
              type="text"
              className="form-control"
              value={formData.university}
              onChange={(e) => handleInputChange('university', e.target.value)}
              placeholder="Ví dụ: Đại học Bách Khoa..."
            />
          </div>

          <div className="form-section">
            <h3>Phương pháp giảng dạy</h3>
            <textarea
              className="form-control"
              value={formData.teachingMethod}
              onChange={(e) => handleInputChange('teachingMethod', e.target.value)}
              placeholder="Mô tả phương pháp giảng dạy của bạn..."
              rows={3}
            />
          </div>

          <div className="form-section">
            <h3>Thành tích & Chứng chỉ</h3>
            <textarea
              className="form-control"
              value={formData.achievements}
              onChange={(e) => handleInputChange('achievements', e.target.value)}
              placeholder="Thành tích, chứng chỉ, giải thưởng..."
              rows={3}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn-submit">
              Cập nhật hồ sơ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TutorProfileUpdateModal;
