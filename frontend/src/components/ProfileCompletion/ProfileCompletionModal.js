import React, { useState, useEffect } from 'react';
import { updateProfileStep, completeProfile, skipProfileCompletion } from '../../services/ProfileCompletionService';
import './ProfileCompletionModal.scss';

const ProfileCompletionModal = ({ isOpen, onClose, profileCompletion, onComplete }) => {
  const [currentStep, setCurrentStep] = useState('basic_info');
  const [formData, setFormData] = useState({
    full_name: '',
    date_of_birth: '',
    gender: '',
    phone_number: '',
    address: '',
    city: '',
    preferences: {}
  });
  const [loading, setLoading] = useState(false);
  const [stepData, setStepData] = useState({});

  useEffect(() => {
    if (profileCompletion) {
      setCurrentStep(profileCompletion.nextStep || 'basic_info');
    }
  }, [profileCompletion]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStepSubmit = async (step) => {
    setLoading(true);
    try {
      const data = { ...formData, ...stepData };
      await updateProfileStep(step, data);
      
      if (step === 'preferences') {
        // Move to completion
        await handleComplete();
      } else {
        // Move to next step
        const nextStep = getNextStep(step);
        setCurrentStep(nextStep);
        setStepData({});
      }
    } catch (error) {
      console.error('Error updating step:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const result = await completeProfile({
        ...formData,
        ...stepData
      });
      
      onComplete?.(result);
      onClose();
    } catch (error) {
      console.error('Error completing profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      await skipProfileCompletion();
      onClose();
    } catch (error) {
      console.error('Error skipping profile completion:', error);
    }
  };

  const getNextStep = (current) => {
    const steps = ['basic_info', 'contact_info', 'preferences'];
    const currentIndex = steps.indexOf(current);
    return steps[currentIndex + 1] || 'completed';
  };

  const getStepTitle = (step) => {
    switch (step) {
      case 'basic_info': return 'Thông tin cơ bản';
      case 'contact_info': return 'Thông tin liên lạc';
      case 'preferences': return 'Sở thích học tập';
      default: return 'Hoàn thành hồ sơ';
    }
  };

  const getStepDescription = (step) => {
    switch (step) {
      case 'basic_info': return 'Hãy cung cấp thông tin cơ bản về bản thân';
      case 'contact_info': return 'Thông tin liên lạc giúp chúng tôi hỗ trợ bạn tốt hơn';
      case 'preferences': return 'Chia sẻ sở thích học tập để chúng tôi gợi ý phù hợp';
      default: return 'Hoàn thành hồ sơ của bạn';
    }
  };

  const renderBasicInfoStep = () => (
    <div className="step-content">
      <div className="form-group">
        <label htmlFor="full_name">Họ và tên *</label>
        <input
          type="text"
          id="full_name"
          value={formData.full_name}
          onChange={(e) => handleInputChange('full_name', e.target.value)}
          placeholder="Nhập họ và tên đầy đủ"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="date_of_birth">Ngày sinh *</label>
        <input
          type="date"
          id="date_of_birth"
          value={formData.date_of_birth}
          onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="gender">Giới tính *</label>
        <select
          id="gender"
          value={formData.gender}
          onChange={(e) => handleInputChange('gender', e.target.value)}
          required
        >
          <option value="">Chọn giới tính</option>
          <option value="male">Nam</option>
          <option value="female">Nữ</option>
          <option value="other">Khác</option>
        </select>
      </div>
    </div>
  );

  const renderContactInfoStep = () => (
    <div className="step-content">
      <div className="form-group">
        <label htmlFor="phone_number">Số điện thoại *</label>
        <input
          type="tel"
          id="phone_number"
          value={formData.phone_number}
          onChange={(e) => handleInputChange('phone_number', e.target.value)}
          placeholder="Nhập số điện thoại"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="address">Địa chỉ *</label>
        <textarea
          id="address"
          value={formData.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
          placeholder="Nhập địa chỉ chi tiết"
          rows={3}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="city">Thành phố *</label>
        <input
          type="text"
          id="city"
          value={formData.city}
          onChange={(e) => handleInputChange('city', e.target.value)}
          placeholder="Nhập thành phố"
          required
        />
      </div>
    </div>
  );

  const renderPreferencesStep = () => (
    <div className="step-content">
      <div className="form-group">
        <label>Môn học quan tâm</label>
        <div className="checkbox-group">
          {['Toán', 'Lý', 'Hóa', 'Sinh', 'Văn', 'Anh', 'Sử', 'Địa'].map(subject => (
            <label key={subject} className="checkbox-item">
              <input
                type="checkbox"
                checked={formData.preferences.subjects?.includes(subject) || false}
                onChange={(e) => {
                  const subjects = formData.preferences.subjects || [];
                  const newSubjects = e.target.checked
                    ? [...subjects, subject]
                    : subjects.filter(s => s !== subject);
                  handleInputChange('preferences', {
                    ...formData.preferences,
                    subjects: newSubjects
                  });
                }}
              />
              <span className="checkmark"></span>
              {subject}
            </label>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Hình thức học ưa thích</label>
        <div className="radio-group">
          <label className="radio-item">
            <input
              type="radio"
              name="learning_mode"
              value="online"
              checked={formData.preferences.learning_mode === 'online'}
              onChange={(e) => handleInputChange('preferences', {
                ...formData.preferences,
                learning_mode: e.target.value
              })}
            />
            <span className="radio-mark"></span>
            Trực tuyến
          </label>
          <label className="radio-item">
            <input
              type="radio"
              name="learning_mode"
              value="offline"
              checked={formData.preferences.learning_mode === 'offline'}
              onChange={(e) => handleInputChange('preferences', {
                ...formData.preferences,
                learning_mode: e.target.value
              })}
            />
            <span className="radio-mark"></span>
            Tại nhà
          </label>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="learning_goals">Mục tiêu học tập</label>
        <textarea
          id="learning_goals"
          value={formData.preferences.learning_goals || ''}
          onChange={(e) => handleInputChange('preferences', {
            ...formData.preferences,
            learning_goals: e.target.value
          })}
          placeholder="Mô tả mục tiêu học tập của bạn..."
          rows={3}
        />
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic_info': return renderBasicInfoStep();
      case 'contact_info': return renderContactInfoStep();
      case 'preferences': return renderPreferencesStep();
      default: return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'basic_info':
        return formData.full_name && formData.date_of_birth && formData.gender;
      case 'contact_info':
        return formData.phone_number && formData.address && formData.city;
      case 'preferences':
        return true; // Preferences are optional
      default:
        return false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="profile-completion-overlay">
      <div className="profile-completion-modal">
        <div className="modal-header">
          <h2>Hoàn thành hồ sơ</h2>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${profileCompletion?.percentage || 0}%` }}
            ></div>
          </div>
          <p className="progress-text">
            {profileCompletion?.percentage || 0}% hoàn thành
          </p>
        </div>

        <div className="modal-content">
          <div className="step-header">
            <h3>{getStepTitle(currentStep)}</h3>
            <p>{getStepDescription(currentStep)}</p>
          </div>

          {renderStepContent()}

          <div className="step-actions">
            <button 
              className="btn-skip" 
              onClick={handleSkip}
              disabled={loading}
            >
              Bỏ qua
            </button>
            
            <div className="btn-group">
              <button 
                className="btn-next" 
                onClick={() => handleStepSubmit(currentStep)}
                disabled={!canProceed() || loading}
              >
                {loading ? 'Đang xử lý...' : 
                 currentStep === 'preferences' ? 'Hoàn thành' : 'Tiếp theo'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletionModal;
