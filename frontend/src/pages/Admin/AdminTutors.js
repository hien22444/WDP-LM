import React, { useEffect, useState } from 'react';
import AdminService from '../../services/AdminService';
import './AdminTutors.modern.css';

const AdminTutors = () => {
  const [tutors, setTutors] = useState([]);
  const [error, setError] = useState(null);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [approveModal, setApproveModal] = useState({ open: false, tutor: null });
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });

  useEffect(() => {
    fetchTutors();
  }, []);

  const fetchTutors = async () => {
    console.log('🔄 fetchTutors called');
    setError(null);
    try {
      console.log('📡 Calling AdminService.getTutors()...');
      const res = await AdminService.getTutors();
      console.log('📊 API response:', res);
      console.log('📋 Tutors data:', res.data.tutors);
      setTutors(res.data.tutors || []);
    } catch (err) {
      console.error('❌ Error fetching tutors:', err);
      setError('Lỗi tải danh sách tutor.');
    }
  };

  const handleApprove = (tutor) => {
    setApproveModal({ open: true, tutor });
  };

  const confirmApprove = async () => {
    console.log('🔍 confirmApprove called');
    console.log('Tutor ID:', approveModal.tutor._id);
    console.log('Tutor data:', approveModal.tutor);
    
    setActionLoading(true);
    try {
      // Cập nhật status tutor thành approved
      console.log('📡 Calling updateTutorStatus API...');
      const result = await AdminService.updateTutorStatus(approveModal.tutor._id, 'approved');
      console.log('✅ API response:', result);
      console.log('✅ Updated tutor status:', result.data?.status);
      
      setSuccessMsg('Duyệt tutor thành công!');
      setApproveModal({ open: false, tutor: null });
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMsg(''), 3000);
      
      console.log('🔄 Refreshing tutors list...');
      await fetchTutors();
      
      // Log current tutors after refresh
      console.log('📊 Tutors after refresh:', tutors);
    } catch (err) {
      console.error('❌ Error approving tutor:', err);
      console.error('❌ Error details:', err.response?.data);
      setError(`Lỗi duyệt tutor: ${err.message || 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Khi click chi tiết, fetch đầy đủ tutor
  const handleShowDetail = async (tutor) => {
    setSelectedTutor(tutor); // show modal ngay để UX tốt
    try {
      const res = await AdminService.getTutorById(tutor._id);
      setSelectedTutor(res.data || tutor);
    } catch (e) {
      setSelectedTutor(tutor);
    }
  };

  // Chỉ hiển thị đơn của user chưa có role tutor
  function isNotTutorRole(tutor) {
    return !(tutor.user && tutor.user.role === 'tutor');
  }
  // Đơn đã duyệt: status="approved" hoặc verified=true
  const approvedTutors = tutors.filter(tutor => tutor.status === 'approved' || tutor.verified);
  // Đơn bị từ chối: status="rejected" hoặc rejected=true
  const rejectedTutors = tutors.filter(tutor => tutor.status === 'rejected' || tutor.rejected);
  // Đơn chờ duyệt: status="pending" hoặc chưa verified, chưa rejected
  const pendingTutors = tutors.filter(tutor => 
    (tutor.status === 'pending' || (!tutor.verified && !tutor.rejected)) && 
    isNotTutorRole(tutor)
  );

  // Debug logs
  console.log('🔍 Debug filter logic:');
  console.log('Total tutors:', tutors.length);
  console.log('Pending tutors:', pendingTutors.length);
  console.log('Approved tutors:', approvedTutors.length);
  console.log('Rejected tutors:', rejectedTutors.length);
  console.log('Tutors data:', tutors.map(t => ({
    id: t._id,
    name: t.user?.full_name,
    status: t.status,
    verified: t.verified,
    rejected: t.rejected,
    userRole: t.user?.role,
    shouldShowApprove: (t.status === 'pending' || !t.status || (!t.verified && !t.rejected))
  })));

  // Test function để kiểm tra trạng thái
  const testTutorStatus = (tutor) => {
    console.log('🧪 Testing tutor status:', {
      id: tutor._id,
      name: tutor.user?.full_name,
      status: tutor.status,
      verified: tutor.verified,
      rejected: tutor.rejected,
      shouldShowApprove: (tutor.status === 'pending' || !tutor.status || (!tutor.verified && !tutor.rejected)),
      shouldShowReject: (tutor.status === 'pending' || !tutor.status || (!tutor.verified && !tutor.rejected))
    });
  };

  const showConfirm = (title, message, onConfirm) => {
    setConfirmModal({
      open: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal({ open: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const showAlert = (message) => {
    setConfirmModal({
      open: true,
      title: 'Thông báo',
      message,
      onConfirm: () => setConfirmModal({ open: false, title: '', message: '', onConfirm: null })
    });
  };

  // Helper function để chuẩn hóa URL ảnh
  const toUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
    return `${baseUrl}/${url.replace(/^\/?/, '')}`;
  };

  return (
    <div className="admin-tutors-page">
      {/* Header Section */}
      <div className="admin-tutors-header">
        <div className="admin-tutors-header-content">
          <div className="admin-tutors-title-section">
            <h1 className="admin-tutors-title">Quản lý Gia sư</h1>
            <p className="admin-tutors-subtitle">Duyệt và quản lý các đơn đăng ký làm gia sư</p>
      </div>
          <div className="admin-tutors-stats">
            <div className="admin-stat-card">
              <div className="admin-stat-icon">👥</div>
              <div className="admin-stat-content">
                <span className="admin-stat-number">{pendingTutors.length}</span>
                <span className="admin-stat-label">Chờ duyệt</span>
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="admin-alert admin-alert-error">
          <div className="admin-alert-icon">⚠️</div>
          <div className="admin-alert-content">
            <span className="admin-alert-title">Lỗi</span>
            <span className="admin-alert-message">{error}</span>
          </div>
        </div>
      )}
      
      {successMsg && (
        <div className="admin-alert admin-alert-success">
          <div className="admin-alert-icon">✅</div>
          <div className="admin-alert-content">
            <span className="admin-alert-title">Thành công</span>
            <span className="admin-alert-message">{successMsg}</span>
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="admin-tutors-table-container">
        <div className="admin-table-header">
          <h3 className="admin-table-title">Danh sách đơn đăng ký</h3>
           <div className="admin-table-actions">
             <button 
               className="admin-btn admin-btn-secondary admin-btn-sm"
               onClick={() => {
                 console.log('🧪 Testing API...');
                 fetchTutors();
               }}
             >
               <span className="admin-btn-icon">🔄</span>
               Refresh
             </button>
             <button className="admin-btn admin-btn-secondary admin-btn-sm">
               <span className="admin-btn-icon">📊</span>
               Xuất báo cáo
             </button>
           </div>
          </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead className="admin-table-thead">
              <tr>
                <th className="admin-table-th">Gia sư</th>
                <th className="admin-table-th">Thông tin liên hệ</th>
                <th className="admin-table-th">Trạng thái</th>
                <th className="admin-table-th">Ngày đăng ký</th>
                <th className="admin-table-th admin-table-th-actions">Hành động</th>
                  </tr>
                </thead>
            <tbody className="admin-table-tbody">
              {pendingTutors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="admin-table-empty">
                    <div className="admin-empty-state">
                      <div className="admin-empty-icon">📋</div>
                      <h3 className="admin-empty-title">Không có đơn nào chờ duyệt</h3>
                      <p className="admin-empty-message">Tất cả đơn đăng ký đã được xử lý</p>
                            </div>
                  </td>
                </tr>
              ) : pendingTutors.map(tutor => (
                <tr key={tutor._id} className="admin-table-row">
                  <td className="admin-table-td">
                    <div className="admin-tutor-info">
                      <div className="admin-tutor-avatar">
                        <span>{tutor.user?.full_name?.charAt(0) || tutor.full_name?.charAt(0) || '?'}</span>
                          </div>
                      <div className="admin-tutor-details">
                        <span className="admin-tutor-name">
                          {tutor.user?.full_name || tutor.full_name}
                        </span>
                        <span className="admin-tutor-id">ID: {tutor._id.slice(-8)}</span>
                          </div>
                        </div>
                      </td>
                  <td className="admin-table-td">
                    <div className="admin-contact-info">
                      <div className="admin-contact-item">
                        <span className="admin-contact-icon">📧</span>
                        <span className="admin-contact-text">{tutor.user?.email || tutor.email}</span>
                      </div>
                        </div>
                      </td>
                   <td className="admin-table-td">
                     {tutor.status === 'approved' ? (
                       <span className="admin-status-badge admin-status-approved">
                         <span className="admin-status-icon">✅</span>
                         Đã duyệt
                       </span>
                     ) : tutor.status === 'rejected' ? (
                       <span className="admin-status-badge admin-status-rejected">
                         <span className="admin-status-icon">❌</span>
                         Đã từ chối
                       </span>
                     ) : (
                       <span className="admin-status-badge admin-status-pending">
                         <span className="admin-status-icon">⏳</span>
                         Chờ duyệt
                       </span>
                     )}
                      </td>
                  <td className="admin-table-td">
                    <span className="admin-date">
                      {tutor.createdAt ? new Date(tutor.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                    </span>
                      </td>
                   <td className="admin-table-td admin-table-td-actions">
                     <div className="admin-action-buttons">
                       {/* Chỉ hiển thị button Duyệt nếu status là pending hoặc chưa có status */}
                       {(tutor.status === 'pending' || !tutor.status || (!tutor.verified && !tutor.rejected)) && (
                         <button 
                           className="admin-btn admin-btn-success admin-btn-sm"
                           disabled={actionLoading} 
                           onClick={() => handleApprove(tutor)}
                           title="Duyệt gia sư"
                         >
                           <span className="admin-btn-icon">✅</span>
                           Duyệt
                         </button>
                       )}
                       
                       {/* Chỉ hiển thị button Từ chối nếu status là pending hoặc chưa có status */}
                       {(tutor.status === 'pending' || !tutor.status || (!tutor.verified && !tutor.rejected)) && (
                          <button
                           className="admin-btn admin-btn-danger admin-btn-sm"
                           disabled
                           title="Từ chối đơn"
                         >
                           <span className="admin-btn-icon">❌</span>
                           Từ chối
                          </button>
                       )}
                       
                       {/* Hiển thị trạng thái nếu đã được xử lý */}
                       {tutor.status === 'approved' && (
                         <span className="admin-status-badge admin-status-approved">
                           <span className="admin-status-icon">✅</span>
                           Đã duyệt
                         </span>
                       )}
                       
                       {tutor.status === 'rejected' && (
                         <span className="admin-status-badge admin-status-rejected">
                           <span className="admin-status-icon">❌</span>
                           Đã từ chối
                         </span>
                       )}
                       
                       {/* Button Chi tiết luôn hiển thị */}
                              <button
                         className="admin-btn admin-btn-info admin-btn-sm"
                         onClick={() => handleShowDetail(tutor)}
                         title="Xem chi tiết"
                       >
                         <span className="admin-btn-icon">ℹ️</span>
                         Chi tiết
                              </button>
                       
                       {/* Button Test để debug */}
                              <button
                         className="admin-btn admin-btn-secondary admin-btn-sm"
                         onClick={() => testTutorStatus(tutor)}
                         title="Test trạng thái"
                       >
                         <span className="admin-btn-icon">🧪</span>
                         Test
                              </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
      </div>
      {/* Modal duyệt tutor */}
      {approveModal.open && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={()=>setApproveModal({open:false,tutor:null})}>&times;</button>
            <h3 className="modal-title">
              <span className="approve-icon" role="img" aria-label="approve">✅</span> Duyệt Tutor
            </h3>
            <div className="modal-text">
              Bạn có chắc muốn duyệt <b>{approveModal.tutor.user?.full_name}</b> thành tutor không?
            </div>
            <div className="modal-actions">
              <button className="admin-btn admin-btn-success" disabled={actionLoading} onClick={confirmApprove}>
                {actionLoading ? 'Đang xử lý...' : <><span className="admin-btn-icon">✅</span> Xác nhận duyệt</>}
                  </button>
              <button className="admin-btn admin-btn-secondary" onClick={()=>setApproveModal({open:false,tutor:null})}>
                Hủy
                  </button>
                </div>
          </div>
                  </div>
      )}
       {/* Modal chi tiết tutor */}
       {selectedTutor && (
         <div className="modal-overlay">
           <div className="modal-content modal-content-large">
                        <button
               className="modal-close" 
               onClick={() => setSelectedTutor(null)}
             >
               &times;
                        </button>
             
             <h3 className="modal-title">
               <span className="modal-title-icon">👤</span>
               Chi tiết gia sư: {selectedTutor.user?.full_name || selectedTutor.full_name}
             </h3>

             <div className="tutor-detail-content">
               {/* Thông tin cơ bản */}
               <div className="detail-section">
                 <h4 className="detail-section-title">📋 Thông tin cơ bản</h4>
                 <div className="detail-grid">
                   <div className="detail-item">
                     <span className="detail-label">Họ tên:</span>
                     <span className="detail-value">{selectedTutor.user?.full_name || selectedTutor.full_name}</span>
                   </div>
                   <div className="detail-item">
                     <span className="detail-label">Email:</span>
                     <span className="detail-value">{selectedTutor.user?.email || selectedTutor.email}</span>
                   </div>
                   <div className="detail-item">
                     <span className="detail-label">Số điện thoại:</span>
                     <span className="detail-value">{selectedTutor.user?.phone_number || selectedTutor.phone_number || 'Chưa cập nhật'}</span>
                   </div>
                   <div className="detail-item">
                     <span className="detail-label">Trạng thái:</span>
                     <span className={`detail-value status-${selectedTutor.status || 'pending'}`}>
                       {selectedTutor.status === 'approved' ? '✅ Đã duyệt' :
                        selectedTutor.status === 'rejected' ? '❌ Đã từ chối' : '⏳ Chờ duyệt'}
                     </span>
                   </div>
                 </div>
               </div>

               {/* Thông tin chuyên môn */}
               <div className="detail-section">
                 <h4 className="detail-section-title">🎓 Thông tin chuyên môn</h4>
                 <div className="detail-grid">
                   <div className="detail-item">
                     <span className="detail-label">Môn học:</span>
                     <span className="detail-value">
                       {selectedTutor.subjects && selectedTutor.subjects.length > 0 ? (
                         selectedTutor.subjects.map((subject, index) => (
                           <span key={index} className="subject-tag">
                             {typeof subject === 'string' ? subject : (subject.name || subject)}
                             {typeof subject === 'object' && subject.level && ` (${subject.level})`}
                           </span>
                         ))
                       ) : 'Chưa cập nhật'}
                     </span>
                   </div>
                   <div className="detail-item">
                     <span className="detail-label">Kinh nghiệm:</span>
                     <span className="detail-value">{selectedTutor.experienceYears || selectedTutor.experience || 0} năm</span>
                   </div>
                   <div className="detail-item">
                     <span className="detail-label">Mức phí:</span>
                     <span className="detail-value">
                       {selectedTutor.sessionRate || selectedTutor.hourlyRate || selectedTutor.price || 0} VNĐ/buổi
                     </span>
                   </div>
                   <div className="detail-item">
                     <span className="detail-label">Thành phố:</span>
                     <span className="detail-value">{selectedTutor.city || selectedTutor.location || 'Chưa cập nhật'}</span>
                  </div>
                </div>
              </div>

               {/* Mô tả và giới thiệu */}
               <div className="detail-section">
                 <h4 className="detail-section-title">📝 Mô tả</h4>
                 <div className="detail-description">
                   {selectedTutor.description || selectedTutor.bio || 'Chưa có mô tả'}
                 </div>
      </div>

               {/* Tài liệu đính kèm */}
               <div className="detail-section">
                 <div className="detail-section-header">
                   <h4 className="detail-section-title">📄 Tài liệu đính kèm</h4>
                   <div className="detail-section-actions">
                     <button 
                       className="admin-btn admin-btn-info admin-btn-sm"
                       onClick={() => {
                         // Collect all images
                         const allImages = [];
                         if (selectedTutor.profileImage) allImages.push({url: toUrl(selectedTutor.profileImage), name: 'Ảnh đại diện'});
                         if (selectedTutor.verification?.degreeDocuments) {
                           selectedTutor.verification.degreeDocuments.forEach((doc, i) => {
                             allImages.push({url: toUrl(doc), name: `Bằng cấp ${i+1}`});
                           });
                         }
                         if (selectedTutor.verification?.idDocuments) {
                           selectedTutor.verification.idDocuments.forEach((doc, i) => {
                             allImages.push({url: toUrl(doc), name: `CMND ${i+1}`});
                           });
                         }
                         if (selectedTutor.verification?.otherDocuments) {
                           selectedTutor.verification.otherDocuments.forEach((doc, i) => {
                             allImages.push({url: toUrl(doc), name: `Tài liệu ${i+1}`});
                           });
                         }
                         if (selectedTutor.portfolio) {
                           selectedTutor.portfolio.forEach((item, i) => {
                             allImages.push({url: toUrl(item.image || item), name: item.title || `Portfolio ${i+1}`});
                           });
                         }
                         if (selectedTutor.gallery) {
                           selectedTutor.gallery.forEach((image, i) => {
                             allImages.push({url: toUrl(image), name: `Ảnh ${i+1}`});
                           });
                         }
                         if (selectedTutor.uploads) {
                           selectedTutor.uploads.forEach((upload, i) => {
                             allImages.push({url: toUrl(upload.url || upload), name: upload.name || upload.filename || `Tệp ${i+1}`});
                           });
                         }
                         if (selectedTutor.images) {
                           selectedTutor.images.forEach((image, i) => {
                             allImages.push({url: toUrl(image), name: `Ảnh ${i+1}`});
                           });
                         }
                         
                         console.log('🖼️ Tất cả ảnh:', allImages);
                         showAlert(`Tổng cộng: ${allImages.length} ảnh. Xem console để xem danh sách đầy đủ.`);
                       }}
                     >
                       <span className="admin-btn-icon">🖼️</span>
                       Xem tất cả ảnh
                     </button>
                     
                <button
                       className="admin-btn admin-btn-success admin-btn-sm"
                       onClick={() => {
                         showConfirm(
                           'Xác nhận duyệt',
                           'Bạn có chắc muốn tự động duyệt tất cả tài liệu của gia sư này?',
                           async () => {
                             try {
                               // Auto verify all documents
                               const verificationData = {
                                 degreeStatus: 'verified',
                                 idStatus: 'verified',
                                 otherStatus: 'verified'
                               };
                               
                               await AdminService.updateTutorVerification(selectedTutor._id, verificationData);
                               showAlert('✅ Đã tự động duyệt tất cả tài liệu!');
                               setSelectedTutor(null);
                               fetchTutors(); // Refresh list
                             } catch (error) {
                               console.error('Error auto-verifying:', error);
                               showAlert('❌ Lỗi khi duyệt tài liệu');
                             }
                           }
                         );
                       }}
                     >
                       <span className="admin-btn-icon">✅</span>
                       Tự động duyệt
                </button>
              </div>
                 </div>
                 <div className="document-grid">
                   {/* Ảnh đại diện */}
                   {selectedTutor.profileImage && (
                     <div className="document-category">
                       <h5 className="document-category-title">🖼️ Ảnh đại diện</h5>
                       <div className="document-list">
                         <div className="document-item">
                           <img 
                             src={toUrl(selectedTutor.profileImage)} 
                             alt="Ảnh đại diện"
                             className="document-thumbnail"
                             onClick={() => window.open(toUrl(selectedTutor.profileImage), '_blank')}
                             onError={(e) => {
                               e.target.style.display = 'none';
                               e.target.nextSibling.textContent = 'Không thể tải ảnh';
                             }}
                           />
                           <span className="document-name">Ảnh đại diện</span>
                  </div>
                  </div>
                </div>
                   )}

                   {/* Bằng cấp */}
                   {selectedTutor.verification?.degreeDocuments && selectedTutor.verification.degreeDocuments.length > 0 && (
                     <div className="document-category">
                       <h5 className="document-category-title">🎓 Bằng cấp ({selectedTutor.verification.degreeDocuments.length})</h5>
                       <div className="document-list">
                         {selectedTutor.verification.degreeDocuments.map((doc, index) => (
                           <div key={index} className="document-item">
                             <img 
                               src={toUrl(doc)} 
                               alt={`Bằng cấp ${index + 1}`}
                               className="document-thumbnail"
                               onClick={() => window.open(toUrl(doc), '_blank')}
                               onError={(e) => {
                                 e.target.style.display = 'none';
                                 e.target.nextSibling.textContent = 'Không thể tải ảnh';
                               }}
                             />
                             <span className="document-name">Bằng cấp {index + 1}</span>
                           </div>
                         ))}
                       </div>
                </div>
                   )}

                   {/* CMND/CCCD */}
                   {selectedTutor.verification?.idDocuments && selectedTutor.verification.idDocuments.length > 0 && (
                     <div className="document-category">
                       <h5 className="document-category-title">🆔 CMND/CCCD ({selectedTutor.verification.idDocuments.length})</h5>
                       <div className="document-list">
                         {selectedTutor.verification.idDocuments.map((doc, index) => (
                           <div key={index} className="document-item">
                             <img 
                               src={toUrl(doc)} 
                               alt={`CMND ${index + 1}`}
                               className="document-thumbnail"
                               onClick={() => window.open(toUrl(doc), '_blank')}
                               onError={(e) => {
                                 e.target.style.display = 'none';
                                 e.target.nextSibling.textContent = 'Không thể tải ảnh';
                               }}
                             />
                             <span className="document-name">CMND {index + 1}</span>
                  </div>
                         ))}
                  </div>
                </div>
                   )}

                   {/* Ảnh khác từ verification */}
                   {selectedTutor.verification?.otherDocuments && selectedTutor.verification.otherDocuments.length > 0 && (
                     <div className="document-category">
                       <h5 className="document-category-title">📷 Tài liệu khác ({selectedTutor.verification.otherDocuments.length})</h5>
                       <div className="document-list">
                         {selectedTutor.verification.otherDocuments.map((doc, index) => (
                           <div key={index} className="document-item">
                             <img 
                               src={toUrl(doc)} 
                               alt={`Tài liệu ${index + 1}`}
                               className="document-thumbnail"
                               onClick={() => window.open(toUrl(doc), '_blank')}
                               onError={(e) => {
                                 e.target.style.display = 'none';
                                 e.target.nextSibling.textContent = 'Không thể tải ảnh';
                               }}
                             />
                             <span className="document-name">Tài liệu {index + 1}</span>
                           </div>
                    ))}
                  </div>
                </div>
                   )}

                   {/* Ảnh từ portfolio */}
                   {selectedTutor.portfolio && selectedTutor.portfolio.length > 0 && (
                     <div className="document-category">
                       <h5 className="document-category-title">🎨 Portfolio ({selectedTutor.portfolio.length})</h5>
                       <div className="document-list">
                         {selectedTutor.portfolio.map((item, index) => (
                           <div key={index} className="document-item">
                             <img 
                               src={toUrl(item.image || item)} 
                               alt={`Portfolio ${index + 1}`}
                               className="document-thumbnail"
                               onClick={() => window.open(toUrl(item.image || item), '_blank')}
                               onError={(e) => {
                                 e.target.style.display = 'none';
                                 e.target.nextSibling.textContent = 'Không thể tải ảnh';
                               }}
                             />
                             <span className="document-name">
                               {item.title || `Portfolio ${index + 1}`}
                      </span>
                    </div>
                         ))}
                       </div>
                     </div>
                   )}

                   {/* Ảnh từ gallery */}
                   {selectedTutor.gallery && selectedTutor.gallery.length > 0 && (
                     <div className="document-category">
                       <h5 className="document-category-title">🖼️ Thư viện ảnh ({selectedTutor.gallery.length})</h5>
                       <div className="document-list">
                         {selectedTutor.gallery.map((image, index) => (
                           <div key={index} className="document-item">
                             <img 
                               src={toUrl(image)} 
                               alt={`Ảnh ${index + 1}`}
                               className="document-thumbnail"
                               onClick={() => window.open(toUrl(image), '_blank')}
                               onError={(e) => {
                                 e.target.style.display = 'none';
                                 e.target.nextSibling.textContent = 'Không thể tải ảnh';
                               }}
                             />
                             <span className="document-name">Ảnh {index + 1}</span>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}

                   {/* Tất cả ảnh từ uploads */}
                   {selectedTutor.uploads && selectedTutor.uploads.length > 0 && (
                     <div className="document-category">
                       <h5 className="document-category-title">📁 Tệp đã tải lên ({selectedTutor.uploads.length})</h5>
                       <div className="document-list">
                         {selectedTutor.uploads.map((upload, index) => (
                           <div key={index} className="document-item">
                             <img 
                               src={toUrl(upload.url || upload)} 
                               alt={`Tệp ${index + 1}`}
                               className="document-thumbnail"
                               onClick={() => window.open(toUrl(upload.url || upload), '_blank')}
                               onError={(e) => {
                                 e.target.style.display = 'none';
                                 e.target.nextSibling.textContent = 'Không thể tải ảnh';
                               }}
                             />
                             <span className="document-name">
                               {upload.name || upload.filename || `Tệp ${index + 1}`}
                      </span>
                    </div>
                         ))}
                       </div>
                     </div>
                   )}

                   {/* Debug: Hiển thị tất cả ảnh có thể có */}
                   {selectedTutor.images && selectedTutor.images.length > 0 && (
                     <div className="document-category">
                       <h5 className="document-category-title">🖼️ Ảnh khác ({selectedTutor.images.length})</h5>
                       <div className="document-list">
                         {selectedTutor.images.map((image, index) => (
                           <div key={index} className="document-item">
                             <img 
                               src={toUrl(image)} 
                               alt={`Ảnh ${index + 1}`}
                               className="document-thumbnail"
                               onClick={() => window.open(toUrl(image), '_blank')}
                               onError={(e) => {
                                 e.target.style.display = 'none';
                                 e.target.nextSibling.textContent = 'Không thể tải ảnh';
                               }}
                             />
                             <span className="document-name">Ảnh {index + 1}</span>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}

                   {/* Nếu không có tài liệu */}
                   {(!selectedTutor.verification?.degreeDocuments?.length && 
                     !selectedTutor.verification?.idDocuments?.length && 
                     !selectedTutor.verification?.otherDocuments?.length &&
                     !selectedTutor.portfolio?.length &&
                     !selectedTutor.gallery?.length &&
                     !selectedTutor.uploads?.length &&
                     !selectedTutor.images?.length &&
                     !selectedTutor.profileImage) && (
                     <div className="no-documents">
                       <span className="no-documents-icon">📄</span>
                       <span className="no-documents-text">Chưa có tài liệu đính kèm</span>
                     </div>
                   )}
                  </div>
                </div>
                
               {/* Thông tin xác thực */}
               <div className="detail-section">
                 <h4 className="detail-section-title">✅ Trạng thái xác thực</h4>
                 <div className="verification-grid">
                   <div className="verification-item">
                     <span className="verification-label">Bằng cấp:</span>
                     <div className="verification-controls">
                       <span className={`verification-status ${selectedTutor.verification?.degreeStatus || 'pending'}`}>
                         {selectedTutor.verification?.degreeStatus === 'verified' ? '✅ Đã xác thực' :
                          selectedTutor.verification?.degreeStatus === 'rejected' ? '❌ Từ chối' : '⏳ Chờ xác thực'}
                       </span>
                       {(selectedTutor.verification?.degreeStatus !== 'verified' && selectedTutor.verification?.degreeStatus !== 'rejected') && (
                         <div className="verification-buttons">
                           <button 
                             className="admin-btn admin-btn-success admin-btn-xs"
                             onClick={() => {
                               showConfirm(
                                 'Xác nhận duyệt',
                                 'Bạn có chắc muốn duyệt bằng cấp của gia sư này?',
                                 async () => {
                                   try {
                                     await AdminService.updateTutorVerification(selectedTutor._id, {
                                       degreeStatus: 'verified'
                                     });
                                     showAlert('✅ Đã duyệt bằng cấp!');
                                     setSelectedTutor(null);
                                     fetchTutors();
                                   } catch (error) {
                                     showAlert('❌ Lỗi khi duyệt bằng cấp');
                                   }
                                 }
                               );
                             }}
                           >
                             Duyệt
                           </button>
                           <button 
                             className="admin-btn admin-btn-danger admin-btn-xs"
                             onClick={() => {
                               showConfirm(
                                 'Xác nhận từ chối',
                                 'Bạn có chắc muốn từ chối bằng cấp của gia sư này?',
                                 async () => {
                                   try {
                                     await AdminService.updateTutorVerification(selectedTutor._id, {
                                       degreeStatus: 'rejected'
                                     });
                                     showAlert('❌ Đã từ chối bằng cấp!');
                                     setSelectedTutor(null);
                                     fetchTutors();
                                   } catch (error) {
                                     showAlert('❌ Lỗi khi từ chối bằng cấp');
                                   }
                                 }
                               );
                             }}
                           >
                             Từ chối
                           </button>
                  </div>
                )}
              </div>
                   </div>
                   <div className="verification-item">
                     <span className="verification-label">CMND/CCCD:</span>
                     <div className="verification-controls">
                       <span className={`verification-status ${selectedTutor.verification?.idStatus || 'pending'}`}>
                         {selectedTutor.verification?.idStatus === 'verified' ? '✅ Đã xác thực' :
                          selectedTutor.verification?.idStatus === 'rejected' ? '❌ Từ chối' : '⏳ Chờ xác thực'}
                       </span>
                       {(selectedTutor.verification?.idStatus !== 'verified' && selectedTutor.verification?.idStatus !== 'rejected') && (
                         <div className="verification-buttons">
                <button
                             className="admin-btn admin-btn-success admin-btn-xs"
                             onClick={() => {
                               showConfirm(
                                 'Xác nhận duyệt',
                                 'Bạn có chắc muốn duyệt CMND/CCCD của gia sư này?',
                                 async () => {
                                   try {
                                     await AdminService.updateTutorVerification(selectedTutor._id, {
                                       idStatus: 'verified'
                                     });
                                     showAlert('✅ Đã duyệt CMND/CCCD!');
                                     setSelectedTutor(null);
                                     fetchTutors();
                                   } catch (error) {
                                     showAlert('❌ Lỗi khi duyệt CMND/CCCD');
                                   }
                                 }
                               );
                             }}
                           >
                             Duyệt
                </button>
                <button
                             className="admin-btn admin-btn-danger admin-btn-xs"
                             onClick={() => {
                               showConfirm(
                                 'Xác nhận từ chối',
                                 'Bạn có chắc muốn từ chối CMND/CCCD của gia sư này?',
                                 async () => {
                                   try {
                                     await AdminService.updateTutorVerification(selectedTutor._id, {
                                       idStatus: 'rejected'
                                     });
                                     showAlert('❌ Đã từ chối CMND/CCCD!');
                                     setSelectedTutor(null);
                                     fetchTutors();
                                   } catch (error) {
                                     showAlert('❌ Lỗi khi từ chối CMND/CCCD');
                                   }
                                 }
                               );
                             }}
                           >
                             Từ chối
                </button>
                         </div>
                       )}
                     </div>
                   </div>
                 </div>
               </div>

               {/* Debug: Tất cả dữ liệu */}
               <div className="detail-section">
                 <h4 className="detail-section-title">🔍 Tất cả dữ liệu (Debug)</h4>
                 <div className="debug-data">
                   <pre className="debug-json">
                     {JSON.stringify(selectedTutor, null, 2)}
                   </pre>
                 </div>
               </div>
             </div>

             <div className="modal-actions">
                <button
                 className="admin-btn admin-btn-secondary"
                 onClick={() => setSelectedTutor(null)}
                >
                 Đóng
                </button>
            </div>
          </div>
         </div>
       )}

       {/* Custom Confirm Modal */}
       {confirmModal.open && (
         <div className="modal-overlay">
           <div className="modal-content">
             <h3 className="modal-title">{confirmModal.title}</h3>
             <p className="modal-message">{confirmModal.message}</p>
             <div className="modal-actions">
               <button 
                 className="admin-btn admin-btn-secondary"
                 onClick={() => setConfirmModal({ open: false, title: '', message: '', onConfirm: null })}
               >
                 Hủy
                </button>
                <button
                 className="admin-btn admin-btn-primary"
                 onClick={confirmModal.onConfirm}
                >
                 Xác nhận
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTutors;
