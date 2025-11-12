import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminContractService from '../../services/AdminContractService';
import './AdminContractDetail.css';

const AdminContractDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContract();
  }, [id]);

  const loadContract = async () => {
    setLoading(true);
    try {
      const data = await AdminContractService.getContractById(id);
      setContract(data);
    } catch (error) {
      console.error('Error loading contract:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const getDayName = (dayOfWeek) => {
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return days[dayOfWeek];
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { label: 'Chờ xác nhận', class: 'status-pending', icon: 'fa-clock' },
      accepted: { label: 'Đã chấp nhận', class: 'status-accepted', icon: 'fa-check' },
      rejected: { label: 'Đã từ chối', class: 'status-rejected', icon: 'fa-times' },
      cancelled: { label: 'Đã hủy', class: 'status-cancelled', icon: 'fa-ban' },
      completed: { label: 'Hoàn thành', class: 'status-completed', icon: 'fa-check-circle' },
      in_progress: { label: 'Đang học', class: 'status-in-progress', icon: 'fa-play-circle' },
      disputed: { label: 'Tranh chấp', class: 'status-disputed', icon: 'fa-exclamation-triangle' }
    };
    return statusMap[status] || { label: status, class: '', icon: 'fa-question' };
  };

  const getPaymentStatusInfo = (status) => {
    const statusMap = {
      none: { label: 'Chưa thanh toán', class: 'payment-none', icon: 'fa-times-circle' },
      paid: { label: 'Đã thanh toán', class: 'payment-paid', icon: 'fa-check-circle' },
      prepaid: { label: 'Trả trước', class: 'payment-prepaid', icon: 'fa-check-circle' },
      postpaid: { label: 'Trả sau', class: 'payment-postpaid', icon: 'fa-clock' },
      escrow: { label: 'Đang giữ', class: 'payment-escrow', icon: 'fa-lock' },
      held: { label: 'Đã khóa', class: 'payment-held', icon: 'fa-lock' },
      released: { label: 'Đã giải phóng', class: 'payment-released', icon: 'fa-unlock' },
      refunded: { label: 'Đã hoàn tiền', class: 'payment-refunded', icon: 'fa-undo' }
    };
    return statusMap[status] || { label: status || 'Chưa xác định', class: 'payment-none', icon: 'fa-question-circle' };
  };

  if (loading) {
    return (
      <div className="admin-contract-detail">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải thông tin hợp đồng...</p>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="admin-contract-detail">
        <div className="error-container">
          <i className="fas fa-exclamation-circle"></i>
          <h2>Không tìm thấy hợp đồng</h2>
          <button className="btn-back" onClick={() => navigate('/admin/contracts')}>
            <i className="fas fa-arrow-left"></i>
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(contract.status);
  const paymentInfo = getPaymentStatusInfo(contract.paymentStatus);

  return (
    <div className="admin-contract-detail">
      {/* Header */}
      <div className="detail-header">
        <button className="btn-back" onClick={() => navigate('/admin/contracts')}>
          <i className="fas fa-arrow-left"></i>
          <span>Quay lại</span>
        </button>
        <div className="header-info">
          <div className="header-title-section">
            <h1>
              <i className="fas fa-file-contract"></i>
              Chi tiết hợp đồng
            </h1>
            <div className="contract-number">
              <i className="fas fa-hashtag"></i>
              {contract.contractNumber || contract._id.substring(0, 12)}
            </div>
          </div>
        </div>
        <div className="header-status">
          <div className={`status-badge-large ${statusInfo.class}`}>
            <i className={`fas ${statusInfo.icon}`}></i>
            <span>{statusInfo.label}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="detail-content">
        {/* Left Column */}
        <div className="detail-column">
          {/* Contract Info */}
          <div className="info-card contract-info-card">
            <div className="card-header">
              <div className="card-header-content">
                <div className="card-icon-wrapper">
                  <i className="fas fa-file-contract"></i>
                </div>
                <h2>Thông tin hợp đồng</h2>
              </div>
            </div>
            <div className="card-body">
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label-wrapper">
                    <i className="fas fa-hashtag label-icon"></i>
                    <span className="label">Số hợp đồng</span>
                  </div>
                  <span className="value contract-id-value">
                    {contract.contractNumber || contract._id.substring(0, 12)}
                  </span>
                </div>
                <div className="info-item">
                  <div className="info-label-wrapper">
                    <i className="fas fa-info-circle label-icon"></i>
                    <span className="label">Trạng thái</span>
                  </div>
                  <span className={`badge ${statusInfo.class}`}>
                    <i className={`fas ${statusInfo.icon}`}></i>
                    {statusInfo.label}
                  </span>
                </div>
                <div className="info-item">
                  <div className="info-label-wrapper">
                    <i className="fas fa-signature label-icon"></i>
                    <span className="label">Đã ký</span>
                  </div>
                  <span className={`badge ${contract.contractSigned ? 'signed-yes' : 'signed-no'}`}>
                    <i className={`fas ${contract.contractSigned ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                    {contract.contractSigned ? 'Đã ký' : 'Chưa ký'}
                  </span>
                </div>
                <div className="info-item">
                  <div className="info-label-wrapper">
                    <i className="fas fa-calendar-plus label-icon"></i>
                    <span className="label">Ngày tạo</span>
                  </div>
                  <span className="value">{formatDate(contract.created_at)}</span>
                </div>
                {contract.studentSignedAt && (
                  <div className="info-item">
                    <div className="info-label-wrapper">
                      <i className="fas fa-user-check label-icon"></i>
                      <span className="label">Học viên ký</span>
                    </div>
                    <span className="value">{formatDate(contract.studentSignedAt)}</span>
                  </div>
                )}
                {contract.tutorSignedAt && (
                  <div className="info-item">
                    <div className="info-label-wrapper">
                      <i className="fas fa-user-check label-icon"></i>
                      <span className="label">Gia sư ký</span>
                    </div>
                    <span className="value">{formatDate(contract.tutorSignedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Student Info */}
          <div className="info-card student-info-card">
            <div className="card-header">
              <div className="card-header-content">
                <div className="card-icon-wrapper">
                  <i className="fas fa-user-graduate"></i>
                </div>
                <h2>Thông tin học viên</h2>
              </div>
            </div>
            <div className="card-body">
              <div className="info-grid">
                <div className="info-item full-width">
                  <div className="info-label-wrapper">
                    <i className="fas fa-user label-icon"></i>
                    <span className="label">Họ tên</span>
                  </div>
                  <span className="value student-name-value">
                    {contract.contractData?.studentName || 
                     contract.student?.profile?.full_name || 
                     'N/A'}
                  </span>
                </div>
                <div className="info-item">
                  <div className="info-label-wrapper">
                    <i className="fas fa-envelope label-icon"></i>
                    <span className="label">Email</span>
                  </div>
                  <span className="value">
                    {contract.contractData?.studentEmail || 
                     contract.student?.email || 
                     'N/A'}
                  </span>
                </div>
                <div className="info-item">
                  <div className="info-label-wrapper">
                    <i className="fas fa-phone label-icon"></i>
                    <span className="label">Số điện thoại</span>
                  </div>
                  <span className="value">
                    {contract.contractData?.studentPhone || 
                     contract.student?.phone || 
                     'N/A'}
                  </span>
                </div>
                {contract.contractData?.studentAddress && (
                  <div className="info-item full-width">
                    <div className="info-label-wrapper">
                      <i className="fas fa-map-marker-alt label-icon"></i>
                      <span className="label">Địa chỉ</span>
                    </div>
                    <span className="value">{contract.contractData.studentAddress}</span>
                  </div>
                )}
                {contract.studentSignature && (
                  <div className="info-item full-width signature-item">
                    <div className="info-label-wrapper">
                      <i className="fas fa-signature label-icon"></i>
                      <span className="label">Chữ ký</span>
                    </div>
                    <span className="value signature">{contract.studentSignature}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tutor Info */}
          <div className="info-card tutor-info-card">
            <div className="card-header">
              <div className="card-header-content">
                <div className="card-icon-wrapper">
                  <i className="fas fa-chalkboard-teacher"></i>
                </div>
                <h2>Thông tin gia sư</h2>
              </div>
            </div>
            <div className="card-body">
              <div className="info-grid">
                <div className="info-item full-width">
                  <div className="info-label-wrapper">
                    <i className="fas fa-user-tie label-icon"></i>
                    <span className="label">Họ tên</span>
                  </div>
                  <span className="value tutor-name-value">
                    {contract.tutorProfile?.user?.profile?.full_name || 
                     contract.tutorProfile?.user?.email || 
                     'N/A'}
                  </span>
                </div>
                <div className="info-item">
                  <div className="info-label-wrapper">
                    <i className="fas fa-envelope label-icon"></i>
                    <span className="label">Email</span>
                  </div>
                  <span className="value">
                    {contract.tutorProfile?.user?.email || 'N/A'}
                  </span>
                </div>
                <div className="info-item">
                  <div className="info-label-wrapper">
                    <i className="fas fa-phone label-icon"></i>
                    <span className="label">Số điện thoại</span>
                  </div>
                  <span className="value">
                    {contract.tutorProfile?.user?.phone || 'N/A'}
                  </span>
                </div>
                {contract.tutorSignature && (
                  <div className="info-item full-width signature-item">
                    <div className="info-label-wrapper">
                      <i className="fas fa-signature label-icon"></i>
                      <span className="label">Chữ ký</span>
                    </div>
                    <span className="value signature">{contract.tutorSignature}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="detail-column">
          {/* Course Info */}
          <div className="info-card course-info-card">
            <div className="card-header">
              <div className="card-header-content">
                <div className="card-icon-wrapper">
                  <i className="fas fa-book"></i>
                </div>
                <h2>Thông tin khóa học</h2>
              </div>
            </div>
            <div className="card-body">
              <div className="info-grid">
                {contract.contractData?.subject && (
                  <div className="info-item">
                    <div className="info-label-wrapper">
                      <i className="fas fa-book-open label-icon"></i>
                      <span className="label">Môn học</span>
                    </div>
                    <span className="value subject-badge">{contract.contractData.subject}</span>
                  </div>
                )}
                <div className="info-item">
                  <div className="info-label-wrapper">
                    <i className="fas fa-chalkboard label-icon"></i>
                    <span className="label">Hình thức</span>
                  </div>
                  <span className="value mode-badge">
                    {contract.mode === 'online' ? (
                      <><i className="fas fa-video"></i> Trực tuyến</>
                    ) : (
                      <><i className="fas fa-home"></i> Trực tiếp</>
                    )}
                  </span>
                </div>
                <div className="info-item">
                  <div className="info-label-wrapper">
                    <i className="fas fa-calendar-check label-icon"></i>
                    <span className="label">Bắt đầu</span>
                  </div>
                  <span className="value">{formatDate(contract.start)}</span>
                </div>
                <div className="info-item">
                  <div className="info-label-wrapper">
                    <i className="fas fa-calendar-times label-icon"></i>
                    <span className="label">Kết thúc</span>
                  </div>
                  <span className="value">{formatDate(contract.end)}</span>
                </div>
                {contract.contractData?.totalSessions && (
                  <div className="info-item">
                    <div className="info-label-wrapper">
                      <i className="fas fa-calendar-alt label-icon"></i>
                      <span className="label">Số buổi học</span>
                    </div>
                    <span className="value sessions-badge">{contract.contractData.totalSessions} buổi</span>
                  </div>
                )}
                {contract.contractData?.sessionDuration && (
                  <div className="info-item">
                    <div className="info-label-wrapper">
                      <i className="fas fa-clock label-icon"></i>
                      <span className="label">Thời lượng/buổi</span>
                    </div>
                    <span className="value duration-badge">{contract.contractData.sessionDuration} phút</span>
                  </div>
                )}
                {contract.contractData?.weeklySchedule && contract.contractData.weeklySchedule.length > 0 && (
                  <div className="info-item full-width">
                    <div className="info-label-wrapper">
                      <i className="fas fa-calendar-week label-icon"></i>
                      <span className="label">Lịch học</span>
                    </div>
                    <span className="value schedule-badge">
                      {contract.contractData.weeklySchedule.map(day => getDayName(day)).join(', ')}
                    </span>
                  </div>
                )}
                {contract.notes && (
                  <div className="info-item full-width notes-item">
                    <div className="info-label-wrapper">
                      <i className="fas fa-sticky-note label-icon"></i>
                      <span className="label">Ghi chú</span>
                    </div>
                    <span className="value notes-value">{contract.notes}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="info-card payment-info-card">
            <div className="card-header">
              <div className="card-header-content">
                <div className="card-icon-wrapper">
                  <i className="fas fa-dollar-sign"></i>
                </div>
                <h2>Thông tin thanh toán</h2>
              </div>
            </div>
            <div className="card-body">
              <div className="info-grid">
                <div className="info-item payment-status-item">
                  <div className="info-label-wrapper">
                    <i className="fas fa-credit-card label-icon"></i>
                    <span className="label">Trạng thái</span>
                  </div>
                  <span className={`badge payment-status-badge ${paymentInfo.class}`}>
                    <i className={`fas ${paymentInfo.icon}`}></i>
                    <span className="payment-status-text">{paymentInfo.label}</span>
                  </span>
                </div>
                <div className="info-item full-width price-item">
                  <div className="info-label-wrapper">
                    <i className="fas fa-money-bill-wave label-icon"></i>
                    <span className="label">Học phí</span>
                  </div>
                  <span className="value price">{formatCurrency(contract.price)}</span>
                </div>
                {contract.escrowAmount > 0 && (
                  <>
                    <div className="info-item">
                      <span className="label">Số tiền giữ:</span>
                      <span className="value">{formatCurrency(contract.escrowAmount)}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Phí platform (15%):</span>
                      <span className="value">{formatCurrency(contract.platformFee)}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Gia sư nhận (85%):</span>
                      <span className="value price">{formatCurrency(contract.tutorPayout)}</span>
                    </div>
                  </>
                )}
                {contract.refundAmount > 0 && (
                  <div className="info-item">
                    <span className="label">Số tiền hoàn:</span>
                    <span className="value">{formatCurrency(contract.refundAmount)}</span>
                  </div>
                )}
                {contract.paymentId && (
                  <div className="info-item full-width">
                    <span className="label">Mã thanh toán:</span>
                    <span className="value code">{contract.paymentId}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="info-card">
            <div className="card-header">
              <h2>
                <i className="fas fa-info-circle"></i>
                Thông tin bổ sung
              </h2>
            </div>
            <div className="card-body">
              <div className="info-grid">
                {contract.sessionId && (
                  <div className="info-item">
                    <span className="label">Session ID:</span>
                    <span className="value code">{contract.sessionId}</span>
                  </div>
                )}
                {contract.roomId && (
                  <div className="info-item">
                    <span className="label">Room ID:</span>
                    <span className="value code">{contract.roomId}</span>
                  </div>
                )}
                {contract.cancelledAt && (
                  <>
                    <div className="info-item">
                      <span className="label">Ngày hủy:</span>
                      <span className="value">{formatDate(contract.cancelledAt)}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Người hủy:</span>
                      <span className="value">{contract.cancelledBy}</span>
                    </div>
                    {contract.cancellationReason && (
                      <div className="info-item full-width">
                        <span className="label">Lý do hủy:</span>
                        <span className="value">{contract.cancellationReason}</span>
                      </div>
                    )}
                  </>
                )}
                {contract.completedAt && (
                  <div className="info-item">
                    <span className="label">Ngày hoàn thành:</span>
                    <span className="value">{formatDate(contract.completedAt)}</span>
                  </div>
                )}
                {contract.disputeReason && (
                  <>
                    <div className="info-item full-width">
                      <span className="label">Lý do tranh chấp:</span>
                      <span className="value warning">{contract.disputeReason}</span>
                    </div>
                    {contract.disputeOpenedAt && (
                      <div className="info-item">
                        <span className="label">Mở tranh chấp:</span>
                        <span className="value">{formatDate(contract.disputeOpenedAt)}</span>
                      </div>
                    )}
                    {contract.disputeResolvedAt && (
                      <div className="info-item">
                        <span className="label">Giải quyết:</span>
                        <span className="value">{formatDate(contract.disputeResolvedAt)}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminContractDetail;

