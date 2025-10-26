import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { updateTutorProfile } from '../../services/TutorService';
import UniversalHeader from '../../components/Layout/UniversalHeader';
import './TutorProfileUpdatePage.scss';

const TutorProfileUpdatePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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

  const subjects = [
    'Toán', 'Lý', 'Hóa', 'Sinh', 'Văn', 'Anh', 'Sử', 'Địa',
    'Tin học', 'Lập trình', 'Vật lý', 'Hóa học', 'Sinh học',
    'Ngữ văn', 'Tiếng Anh', 'Lịch sử', 'Địa lý'
  ];

  useEffect(() => {
    // Load existing tutor profile data if available
    // This could be fetched from an API
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubjectChange = (subject) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateTutorProfile(formData);
      toast.success('Cập nhật hồ sơ gia sư thành công!');
      navigate('/profile');
    } catch (error) {
      console.error('Error updating tutor profile:', error);
      toast.error('Có lỗi xảy ra khi cập nhật hồ sơ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/profile');
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

            {/* Môn dạy */}
            <div className="form-section">
              <h3>Môn dạy</h3>
              <div className="subjects-grid">
                {subjects.map(subject => (
                  <label key={subject} className="subject-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.subjects.includes(subject)}
                      onChange={() => handleSubjectChange(subject)}
                    />
                    <span className="subject-label">{subject}</span>
                  </label>
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
              <button
                type="submit"
                className="btn-submit"
                disabled={loading}
              >
                {loading ? 'Đang cập nhật...' : 'Cập nhật hồ sơ'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TutorProfileUpdatePage;
