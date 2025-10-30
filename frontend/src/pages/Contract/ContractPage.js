import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getTutorProfile } from '../../services/BookingService';
import ContractDisplay from '../../components/Contract/ContractDisplay';
import './ContractPage.scss';

const ContractPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useSelector(state => state.user.currentUser);
  const [tutor, setTutor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contractData, setContractData] = useState({
    studentName: '',
    studentPhone: '',
    studentEmail: '',
    studentAddress: '',
    subject: '',
    totalSessions: 1,
    sessionDuration: 150, // 2h30 = 150 phút
    weeklySchedule: [],
    mode: 'online',
    pricePerSession: 0,
    totalPrice: 0,
    startDate: '',
    endDate: '',
    notes: ''
  });
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    // Nếu có dữ liệu từ state (từ trang booking), sử dụng dữ liệu đó
    if (location.state?.bookingData && location.state?.tutor) {
      const { bookingData, tutor: tutorData } = location.state;
      console.log('📦 Using location.state data');
      setTutor(tutorData);
      setContractData(prev => ({
        ...prev,
        ...bookingData,
        studentName: currentUser?.profile?.full_name || '',
        studentPhone: currentUser?.phone || '',
        studentEmail: currentUser?.email || '',
        studentAddress: currentUser?.profile?.address || '',
        pricePerSession: tutorData.price,
        totalPrice: tutorData.price * (bookingData.numberOfSessions || 1)
      }));
      setLoading(false);
    } 
    // Nếu không có location.state, thử đọc từ sessionStorage
    else {
      const sessionData = sessionStorage.getItem('contractData');
      if (sessionData) {
        try {
          const { bookingData, tutor: tutorData } = JSON.parse(sessionData);
          console.log('📦 Using sessionStorage data');
          setTutor(tutorData);
          setContractData(prev => ({
            ...prev,
            ...bookingData,
            studentName: currentUser?.profile?.full_name || '',
            studentPhone: currentUser?.phone || '',
            studentEmail: currentUser?.email || '',
            studentAddress: currentUser?.profile?.address || '',
            pricePerSession: tutorData.price,
            totalPrice: tutorData.price * (bookingData.numberOfSessions || 1)
          }));
          setLoading(false);
          // Xóa sessionStorage sau khi đọc
          sessionStorage.removeItem('contractData');
        } catch (error) {
          console.error('❌ Error parsing sessionStorage data:', error);
          loadTutorProfile();
        }
      } else {
        // Nếu không có dữ liệu từ state, load từ API
        loadTutorProfile();
      }
    }
  }, [id, location.state, currentUser]);

  const loadTutorProfile = async () => {
    try {
      const tutorData = await getTutorProfile(id);
      setTutor(tutorData);
      setContractData(prev => ({
        ...prev,
        pricePerSession: tutorData.price,
        totalPrice: tutorData.price * prev.totalSessions
      }));
    } catch (error) {
      console.error('Error loading tutor:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setContractData(prev => {
      const newData = { ...prev, [field]: value };
      if (field === 'totalSessions') {
        newData.totalPrice = newData.pricePerSession * parseInt(value);
      }
      return newData;
    });
  };

  const handleSignContract = async () => {
    if (!agreed) {
      alert('Vui lòng đồng ý với các điều khoản hợp đồng');
      return;
    }

    console.log('📝 Signing contract...');
    console.log('📦 Contract data:', contractData);
    console.log('📦 Location state:', location.state);
    
    setSigning(true);
    try {
      // Lấy dữ liệu từ location.state (từ TutorProfilePage)
      const bookingData = location.state?.bookingData;
      
      if (!bookingData) {
        throw new Error('Không tìm thấy dữ liệu booking');
      }

      console.log('📦 Original booking data:', bookingData);

      // Tạo booking với thông tin hợp đồng
      const bookingPayload = {
        tutorProfileId: id,
        start: bookingData.start,
        end: bookingData.end,
        mode: bookingData.mode,
        price: contractData.totalPrice,
        notes: bookingData.notes,
        numberOfSessions: bookingData.totalSessions,
        weeklySchedule: bookingData.weeklySchedule,
        numberOfWeeks: bookingData.numberOfWeeks,
        flexibleSchedule: bookingData.flexibleSchedule,
        daySchedules: bookingData.daySchedules,
        sessionDetails: bookingData.sessionDetails,
        studentSignature: contractData.studentName, // Tên học viên đã ký
        contractSigned: true
      };

      console.log('📦 Booking payload:', bookingPayload);

      // Gọi API tạo booking bằng BookingService
      const BookingService = (await import('../../services/BookingService')).default;
      const createdBooking = await BookingService.createBooking(bookingPayload);

      console.log('✅ Booking created:', createdBooking);

      alert('Hợp đồng đã được ký thành công! Gia sư sẽ xác nhận trong thời gian sớm nhất.');
      navigate('/bookings/me');
    } catch (error) {
      console.error('❌ Error signing contract:', error);
      alert(`Có lỗi xảy ra khi ký hợp đồng: ${error.message}. Vui lòng thử lại.`);
    } finally {
      setSigning(false);
    }
  };

  const getDayName = (dayOfWeek) => {
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return days[dayOfWeek];
  };

  if (loading) {
    return (
      <div className="contract-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải thông tin gia sư...</p>
        </div>
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="contract-page">
        <div className="error-container">
          <h2>Không tìm thấy thông tin gia sư</h2>
          <button onClick={() => navigate('/')} className="btn-primary">
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="contract-page">
      <div className="contract-container">
        {/* Header */}
        <div className="contract-header">
          <h1>📋 HỢP ĐỒNG THUÊ GIA SƯ</h1>
          <div className="contract-info">
            <span className="contract-number">Số hợp đồng: HD-{Date.now()}</span>
            <span className="contract-date">Ngày ký: {new Date().toLocaleDateString('vi-VN')}</span>
          </div>
        </div>

        {/* Contract Form */}
        <div className="contract-form">
          {/* Student Information */}
          <div className="form-section">
            <h3>👨‍🎓 Thông tin học viên</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Họ tên *</label>
                <input
                  type="text"
                  value={contractData.studentName}
                  onChange={(e) => handleInputChange('studentName', e.target.value)}
                  placeholder="Nhập họ tên đầy đủ"
                  required
                />
              </div>
              <div className="form-group">
                <label>Số điện thoại *</label>
                <input
                  type="tel"
                  value={contractData.studentPhone}
                  onChange={(e) => handleInputChange('studentPhone', e.target.value)}
                  placeholder="Nhập số điện thoại"
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={contractData.studentEmail}
                  onChange={(e) => handleInputChange('studentEmail', e.target.value)}
                  placeholder="Nhập email"
                  required
                />
              </div>
              <div className="form-group">
                <label>Địa chỉ</label>
                <input
                  type="text"
                  value={contractData.studentAddress}
                  onChange={(e) => handleInputChange('studentAddress', e.target.value)}
                  placeholder="Nhập địa chỉ"
                />
              </div>
            </div>
          </div>

          {/* Course Information */}
          <div className="form-section">
            <h3>📚 Thông tin khóa học</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Môn học *</label>
                <select
                  value={contractData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  required
                >
                  <option value="">Chọn môn học</option>
                  {tutor.subjects?.map((subject, index) => (
                    <option key={index} value={subject.name || subject}>
                      {subject.name || subject}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Số buổi học *</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={contractData.totalSessions}
                  onChange={(e) => handleInputChange('totalSessions', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Thời gian mỗi buổi</label>
                <input
                  type="text"
                  value="2 giờ 30 phút"
                  readOnly
                  className="readonly-input"
                />
              </div>
              <div className="form-group">
                <label>Hình thức học *</label>
                <select
                  value={contractData.mode}
                  onChange={(e) => handleInputChange('mode', e.target.value)}
                  required
                >
                  {tutor.teachModes?.includes('online') && (
                    <option value="online">Trực tuyến</option>
                  )}
                  {tutor.teachModes?.includes('offline') && (
                    <option value="offline">Trực tiếp</option>
                  )}
                </select>
              </div>
              <div className="form-group">
                <label>Ngày bắt đầu *</label>
                <input
                  type="date"
                  value={contractData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div className="form-group">
                <label>Ghi chú</label>
                <textarea
                  value={contractData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Nhập nội dung muốn học, mục tiêu, yêu cầu đặc biệt..."
                  rows="3"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="form-section pricing-section">
            <h3>💰 Thông tin tài chính</h3>
            <div className="pricing-grid">
              <div className="pricing-item">
                <span>Học phí mỗi buổi:</span>
                <span className="price">{contractData.pricePerSession.toLocaleString()}đ</span>
              </div>
              <div className="pricing-item">
                <span>Số buổi học:</span>
                <span>{contractData.totalSessions} buổi</span>
              </div>
              <div className="pricing-item total">
                <span>Tổng học phí:</span>
                <span className="price">{contractData.totalPrice.toLocaleString()}đ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contract Display */}
        <div className="contract-display-section">
          <ContractDisplay 
            contractData={contractData} 
            tutor={tutor} 
            onSign={(signatureData) => {
              console.log('✍️ Signature updated:', signatureData);
              // Lưu chữ ký vào state nếu cần
            }}
          />
        </div>

        {/* Agreement */}
        <div className="agreement-section">
          <label className="agreement-checkbox">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span className="checkmark"></span>
            <span className="agreement-text">
              Tôi đã đọc và đồng ý với tất cả các điều khoản trong hợp đồng thuê gia sư này
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="contract-actions">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            <i className="fas fa-arrow-left"></i>
            Quay lại
          </button>
          <button
            type="button"
            onClick={handleSignContract}
            disabled={!agreed || signing}
            className="btn-primary"
          >
            {signing ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Đang ký hợp đồng...
              </>
            ) : (
              <>
                <i className="fas fa-signature"></i>
                Ký hợp đồng
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContractPage;
