import React, { useEffect, useState } from 'react';
import AdminService from '../../services/AdminService';
import './AdminTutors.css';

const AdminTutors = () => {
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [approveModal, setApproveModal] = useState({ open: false, tutor: null });
  const [approveNote, setApproveNote] = useState('');
  const [tutorDetail, setTutorDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [docModal, setDocModal] = useState({ open: false, urls: [], index: 0 });
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTutors();
  }, []);

  const fetchTutors = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await AdminService.getTutors();
      setTutors(res.data.tutors || []);
    } catch (err) {
      setError('Lỗi tải danh sách tutor.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (tutor) => {
    setApproveModal({ open: true, tutor });
    setApproveNote('');
  };

  const confirmApprove = async () => {
    setActionLoading(true);
    try {
      // Đổi role user sang tutor
      await AdminService.updateUserRole(approveModal.tutor.user._id, 'tutor');
      setSuccessMsg('Duyệt tutor thành công!');
      setApproveModal({ open: false, tutor: null });
      fetchTutors();
    } catch (err) {
      setError('Lỗi duyệt tutor.');
    } finally {
      setActionLoading(false);
    }
  };

  // Khi click chi tiết, fetch đầy đủ tutor
  const handleShowDetail = async (tutor) => {
    setDetailLoading(true);
    setSelectedTutor(tutor); // show modal ngay để UX tốt
    try {
      const res = await AdminService.getTutorById(tutor._id);
      setTutorDetail(res.data || tutor);
    } catch (e) {
      setTutorDetail(tutor);
    } finally {
      setDetailLoading(false);
    }
  };

  // Chỉ hiển thị đơn của user chưa có role tutor
  function isNotTutorRole(tutor) {
    return !(tutor.user && tutor.user.role === 'tutor');
  }
  // Đơn đã duyệt: verified=true, user chưa có role tutor
  const approvedTutors = tutors.filter(tutor => tutor.verified && isNotTutorRole(tutor));
  // Đơn bị từ chối: rejected=true, user chưa có role tutor
  const rejectedTutors = tutors.filter(tutor => tutor.rejected && isNotTutorRole(tutor));
  // Đơn chờ duyệt: chưa verified, chưa rejected, user chưa có role tutor
  const pendingTutors = tutors.filter(tutor => !tutor.verified && !tutor.rejected && isNotTutorRole(tutor));

  return (
    <div className="admin-tutors-page upgraded-tutors-page">
      <div className="admin-tutors-header upgraded-header">
        <h2 className="admin-tutors-title upgraded-title">Quản lý Đơn Tutor</h2>
      </div>
      <div className="admin-tutors-filters upgraded-filters upgraded-tutors-filters-row">
        <div className="upgraded-filter-item">
          <label className="admin-tutors-label upgraded-label upgraded-filter-label"><span role="img" aria-label="search">🔍</span> Tìm kiếm</label>
          <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tên, email..." className="admin-tutors-input upgraded-input upgraded-filter-input" />
        </div>
      </div>
      {/* Đơn chờ duyệt */}
      <h3 className="upgraded-title" style={{fontSize:'1.25rem',marginTop:'24px'}}>Đơn chờ duyệt</h3>
      <div className="admin-tutors-table-wrap upgraded-table-wrap upgraded-tutors-table-wrap">
        <table className="admin-tutors-table upgraded-table upgraded-tutors-table">
          <thead className="upgraded-table-header upgraded-tutors-table-header">
            <tr>
              <th className="upgraded-table-th">Tên</th>
              <th className="upgraded-table-th">Email</th>
              <th className="upgraded-table-th">Trạng thái</th>
              <th className="upgraded-table-th">Ngày đăng ký</th>
              <th className="upgraded-table-th">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {pendingTutors.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-6 text-gray-500">Không có đơn nào chờ duyệt.</td></tr>
            ) : pendingTutors.map(tutor => (
              <tr key={tutor._id} className="upgraded-row upgraded-tutors-row">
                <td className="user-name-cell upgraded-cell upgraded-tutors-cell" onClick={()=>handleShowDetail(tutor)}>{tutor.user?.full_name || tutor.full_name}</td>
                <td className="upgraded-cell upgraded-tutors-cell">{tutor.user?.email || tutor.email}</td>
                <td className="upgraded-cell upgraded-tutors-cell">
                  <span className={`badge badge-yellow upgraded-badge-status upgraded-tutors-badge-status`}>
                    <span role="img" aria-label="pending">⏳</span> <b>Chờ duyệt</b>
                  </span>
                </td>
                <td className="upgraded-cell upgraded-tutors-cell">{tutor.createdAt ? new Date(tutor.createdAt).toLocaleDateString() : ''}</td>
                <td className="upgraded-cell upgraded-actions upgraded-tutors-actions">
                  <button className="btn-block upgraded-btn upgraded-btn-block upgraded-tutors-btn" disabled={actionLoading} onClick={()=>handleApprove(tutor)}>
                    <span role="img" aria-label="approve">✅</span> Duyệt
                  </button>
                  <button className="btn-unblock upgraded-btn upgraded-btn-unblock upgraded-tutors-btn" disabled>Từ chối</button>
                  <button className="btn-detail upgraded-btn upgraded-btn-detail upgraded-tutors-btn" onClick={()=>handleShowDetail(tutor)}>
                    <span role="img" aria-label="info">ℹ️</span> Chi tiết
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Modal duyệt tutor */}
      {approveModal.open && (
        <div className="modal-overlay upgraded-modal-overlay upgraded-tutors-modal-overlay">
          <div className="modal-content upgraded-modal-content upgraded-modal-approve upgraded-tutors-modal-content">
            <button className="modal-close upgraded-modal-close upgraded-tutors-modal-close" onClick={()=>setApproveModal({open:false,tutor:null})}>&times;</button>
            <h3 className="modal-title upgraded-modal-title upgraded-modal-title-approve upgraded-tutors-modal-title">
              <span className="approve-icon" role="img" aria-label="approve">✅</span> Duyệt Tutor
            </h3>
            <div className="mb-2 upgraded-modal-approve-text upgraded-tutors-modal-text">
              Bạn có chắc muốn duyệt <b>{approveModal.tutor.user?.full_name}</b> thành tutor không?
            </div>
            <div className="flex justify-end gap-3 upgraded-modal-actions upgraded-tutors-modal-actions">
              <button className="btn-block-confirm upgraded-btn upgraded-btn-block-confirm upgraded-tutors-btn" disabled={actionLoading} onClick={confirmApprove}>
                {actionLoading ? 'Đang xử lý...' : <><span role="img" aria-label="approve">✅</span> <b>Xác nhận duyệt</b></>}
              </button>
              <button className="btn-cancel upgraded-btn upgraded-btn-cancel upgraded-tutors-btn" onClick={()=>setApproveModal({open:false,tutor:null})}>Hủy</button>
            </div>
          </div>
        </div>
      )}
      {/* Modal chi tiết tutor giữ nguyên */}
      {/* Modal xem ảnh tài liệu giữ nguyên */}
    </div>
  );
};

export default AdminTutors;
