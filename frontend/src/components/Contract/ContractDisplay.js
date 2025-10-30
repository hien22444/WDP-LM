import React from 'react';
import './ContractDisplay.scss';

const ContractDisplay = ({ contractData, tutor, onSign }) => {
  const getDayName = (dayOfWeek) => {
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return days[dayOfWeek];
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  return (
    <div className="contract-display">
      <div className="contract-header">
        <h1>📋 HỢP ĐỒNG THUÊ GIA SƯ</h1>
        <div className="contract-info">
          <span className="contract-number">Số hợp đồng: HD-{Date.now()}</span>
          <span className="contract-date">Ngày ký: {new Date().toLocaleDateString('vi-VN')}</span>
        </div>
      </div>

      <div className="contract-body">
        {/* Thông tin các bên */}
        <div className="parties-section">
          <h3>👥 Thông tin các bên</h3>
          <div className="parties-grid">
            <div className="party-card student">
              <h4>👨‍🎓 Bên A (Học viên)</h4>
              <div className="party-info">
                <p><strong>Họ tên:</strong> {contractData.studentName}</p>
                <p><strong>Số điện thoại:</strong> {contractData.studentPhone}</p>
                <p><strong>Email:</strong> {contractData.studentEmail}</p>
                <p><strong>Địa chỉ:</strong> {contractData.studentAddress}</p>
              </div>
            </div>
            <div className="party-card tutor">
              <h4>👨‍🏫 Bên B (Gia sư)</h4>
              <div className="party-info">
                <p><strong>Họ tên:</strong> {tutor?.name}</p>
                <p><strong>Số điện thoại:</strong> {tutor?.phone}</p>
                <p><strong>Email:</strong> {tutor?.email}</p>
                <p><strong>Địa chỉ:</strong> {tutor?.address}</p>
                <p><strong>Bằng cấp:</strong> {tutor?.qualification}</p>
                <p><strong>Kinh nghiệm:</strong> {tutor?.experience}</p>
              </div>
            </div>
            <div className="party-card platform">
              <h4>🏢 Bên C (Platform)</h4>
              <div className="party-info">
                <p><strong>Tên:</strong> LearnMate</p>
                <p><strong>Địa chỉ:</strong> Việt Nam</p>
                <p><strong>Email:</strong> support@learnmate.com</p>
              </div>
            </div>
          </div>
        </div>

        {/* Thông tin khóa học */}
        <div className="course-section">
          <h3>📚 Thông tin khóa học</h3>
          <div className="course-info">
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Môn học:</span>
                <span className="value">{contractData.subject}</span>
              </div>
              <div className="info-item">
                <span className="label">Số buổi học:</span>
                <span className="value">{contractData.totalSessions} buổi</span>
              </div>
              <div className="info-item">
                <span className="label">Thời gian mỗi buổi:</span>
                <span className="value">2 giờ 30 phút</span>
              </div>
              <div className="info-item">
                <span className="label">Hình thức học:</span>
                <span className="value">{contractData.mode === 'online' ? 'Trực tuyến' : 'Trực tiếp'}</span>
              </div>
              <div className="info-item">
                <span className="label">Ngày bắt đầu:</span>
                <span className="value">{formatDate(contractData.startDate)}</span>
              </div>
              <div className="info-item">
                <span className="label">Ngày kết thúc dự kiến:</span>
                <span className="value">{formatDate(contractData.endDate)}</span>
              </div>
              {contractData.weeklySchedule && contractData.weeklySchedule.length > 0 && (
                <div className="info-item">
                  <span className="label">Lịch học:</span>
                  <span className="value">
                    {contractData.weeklySchedule.map(day => getDayName(day)).join(', ')}
                  </span>
                </div>
              )}
              {contractData.notes && (
                <div className="info-item full-width">
                  <span className="label">Ghi chú:</span>
                  <span className="value">{contractData.notes}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Thông tin tài chính */}
        <div className="financial-section">
          <h3>💰 Thông tin tài chính</h3>
          <div className="financial-info">
            <div className="financial-grid">
              <div className="financial-item">
                <span className="label">Học phí mỗi buổi:</span>
                <span className="price">{contractData.pricePerSession?.toLocaleString()}đ</span>
              </div>
              <div className="financial-item">
                <span className="label">Số buổi học:</span>
                <span className="value">{contractData.totalSessions} buổi</span>
              </div>
              <div className="financial-item total">
                <span className="label">Tổng học phí:</span>
                <span className="price">{contractData.totalPrice?.toLocaleString()}đ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Điều khoản hợp đồng */}
        <div className="terms-section">
          <h3>📋 Điều khoản hợp đồng</h3>
          
          <div className="terms-content">
            <div className="term-item">
              <h4>Điều 1: Thông tin khóa học</h4>
              <p>Học viên cam kết tham gia đầy đủ {contractData.totalSessions} buổi học, mỗi buổi 2 giờ 30 phút, hình thức {contractData.mode === 'online' ? 'trực tuyến' : 'trực tiếp'}.</p>
            </div>

            <div className="term-item">
              <h4>Điều 2: Quyền và nghĩa vụ</h4>
              <div className="term-subsection">
                <h5>Học viên:</h5>
                <ul>
                  <li>Được học đúng giờ, đúng chất lượng</li>
                  <li>Tham gia đúng giờ, làm bài tập</li>
                  <li>Thông báo trước khi nghỉ học</li>
                </ul>
              </div>
              <div className="term-subsection">
                <h5>Gia sư:</h5>
                <ul>
                  <li>Được thanh toán đúng hạn</li>
                  <li>Dạy đúng giờ, đúng chất lượng</li>
                  <li>Chuẩn bị bài, hỗ trợ học viên</li>
                </ul>
              </div>
            </div>

            <div className="term-item">
              <h4>Điều 3: Nghỉ học và hủy bỏ</h4>
              <ul>
                <li><strong>Nghỉ tạm thời:</strong> Thông báo trước 24h, không tính phí</li>
                <li><strong>Nghỉ dài hạn:</strong> Thông báo trước 48h, phí bảo lưu 15%/tháng</li>
                <li><strong>Hủy trước 24h:</strong> Hoàn 100% tiền</li>
                <li><strong>Hủy trong 24h:</strong> Hoàn 50% tiền</li>
                <li><strong>Hủy sau khi bắt đầu:</strong> Hoàn 0% tiền</li>
              </ul>
            </div>

            <div className="term-item">
              <h4>Điều 4: Tranh chấp</h4>
              <p>Mọi tranh chấp sẽ được giải quyết bằng thương lượng, trung gian hòa giải, hoặc tòa án có thẩm quyền theo luật Việt Nam.</p>
            </div>

            <div className="term-item">
              <h4>Điều 5: Điều khoản cuối</h4>
              <p>Hợp đồng có hiệu lực từ ngày ký đến khi hoàn thành khóa học. Các bên cam kết bảo mật thông tin cá nhân và tuân thủ các điều khoản đã thỏa thuận.</p>
            </div>
          </div>
        </div>

        {/* Chữ ký */}
        <div className="signature-section">
          <div className="signature-grid">
            <div className="signature-item">
              <h4>HỌC VIÊN</h4>
              <div className="signature-line">
                <span>Ký tên:</span>
                <input 
                  type="text" 
                  className="signature-input"
                  placeholder="Nhập tên của bạn"
                  onChange={(e) => {
                    if (onSign) onSign({ studentSignature: e.target.value });
                  }}
                />
              </div>
              <div className="signature-date">
                <span>Ngày: {new Date().toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
            <div className="signature-item">
              <h4>GIA SƯ</h4>
              <div className="signature-line">
                <span>Ký tên:</span>
                <div className="signature-space" style={{ color: '#6b7280', fontStyle: 'italic' }}>
                  {tutor?.name || tutor?.user?.profile?.full_name || tutor?.user?.email || '[Chờ gia sư chấp nhận booking]'}
                </div>
              </div>
              <div className="signature-date">
                <span>Ngày: [Chờ gia sư chấp nhận]</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractDisplay;
