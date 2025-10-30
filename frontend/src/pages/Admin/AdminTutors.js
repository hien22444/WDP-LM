<<<<<<< HEAD
import React, { useState, useEffect, useCallback } from 'react';
import { Search, CheckCircle, XCircle, Eye } from 'lucide-react';
import AdminService from '../../services/AdminService';

const AdminTutors = () => {
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: '',
    search: ''
  });

  const fetchTutors = useCallback(async () => {
    try {
      setLoading(true);
      const response = await AdminService.getTutors(filters);
      setTutors(response.data.tutors);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching tutors:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTutors();
  }, [fetchTutors]);

  const handleStatusChange = async (tutorId, newStatus) => {
    try {
      await AdminService.updateTutorStatus(tutorId, newStatus);
      fetchTutors(); // Refresh the list
    } catch (error) {
      console.error('Error updating tutor status:', error);
    }
  };

  // const handleVerificationUpdate = async (tutorId, verificationData) => {
  //   try {
  //     await AdminService.updateTutorVerification(tutorId, verificationData);
  //     fetchTutors(); // Refresh the list
  //     setShowModal(false);
  //   } catch (error) {
  //     console.error('Error updating tutor verification:', error);
  //   }
  // };

  const handleViewTutor = async (tutorId) => {
    try {
      const response = await AdminService.getTutorById(tutorId);
      setSelectedTutor(response.data);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching tutor details:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' }
    };
    const config = statusConfig[status] || statusConfig.draft;
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getVerificationBadge = (verification) => {
    const idStatus = verification?.idStatus || 'none';
    const degreeStatus = verification?.degreeStatus || 'none';
    
    if (idStatus === 'approved' && degreeStatus === 'approved') {
      return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Verified</span>;
    } else if (idStatus === 'pending' || degreeStatus === 'pending') {
      return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
    } else {
      return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Not Verified</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tutors Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage tutor profiles and verifications
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tutors..."
                className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Per Page
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tutors Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tutor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subjects
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Verification
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tutors.map((tutor) => (
                    <tr key={tutor._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {tutor.user?.full_name?.charAt(0)?.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {tutor.user?.full_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {tutor.user?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {tutor.subjects?.slice(0, 2).map(subject => subject.name).join(', ')}
                          {tutor.subjects?.length > 2 && '...'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(tutor.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getVerificationBadge(tutor.verification)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${tutor.sessionRate}/session
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewTutor(tutor._id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {tutor.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(tutor._id, 'approved')}
                                className="text-green-600 hover:text-green-900"
                                title="Approve"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleStatusChange(tutor._id, 'rejected')}
                                className="text-red-600 hover:text-red-900"
                                title="Reject"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
=======
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
  const [rejectModal, setRejectModal] = useState({ open: false, tutor: null });
  const [rejectionReason, setRejectionReason] = useState('');
  const [roleFilter, setRoleFilter] = useState('learner'); // 'learner' | 'tutor' | 'all'

  useEffect(() => {
    fetchTutors();
  }, [roleFilter]); // Re-fetch khi đổi tab

  const fetchTutors = async () => {
    console.log('🔄 fetchTutors called with roleFilter:', roleFilter);
    setError(null);
    try {
      console.log('📡 Calling AdminService.getTutors() with role:', roleFilter);
      const res = await AdminService.getTutors({ role: roleFilter });
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
      
      setSuccessMsg('✅ Duyệt đơn gia sư thành công! User đã được chuyển sang role tutor.');
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

  const handleReject = (tutor) => {
    setRejectModal({ open: true, tutor });
    setRejectionReason('');
  };

  const confirmReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Vui lòng nhập lý do từ chối');
      return;
    }

    setActionLoading(true);
    try {
      console.log('📡 Calling updateTutorStatus API (reject)...');
      const result = await AdminService.updateTutorStatus(
        rejectModal.tutor._id, 
        'rejected', 
        rejectionReason
      );
      console.log('✅ API response:', result);
      
      setSuccessMsg('❌ Đã từ chối đơn gia sư. Email thông báo đã được gửi.');
      setRejectModal({ open: false, tutor: null });
      setRejectionReason('');
      
      setTimeout(() => setSuccessMsg(''), 3000);
      await fetchTutors();
    } catch (err) {
      console.error('❌ Error rejecting tutor:', err);
      setError(`Lỗi từ chối đơn: ${err.message || 'Unknown error'}`);
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

  // Thống kê counts cho tabs
  const pendingCount = tutors.filter(t => t.status === 'pending').length;
  const approvedCount = tutors.filter(t => t.status === 'approved').length;

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
                <span className="admin-stat-number">{tutors.length}</span>
                <span className="admin-stat-label">
                  {roleFilter === 'learner' ? 'Chờ duyệt' : 
                   roleFilter === 'tutor' ? 'Đã duyệt' : 'Tổng cộng'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="admin-tabs">
          <button 
            className={`admin-tab ${roleFilter === 'learner' ? 'active' : ''}`}
            onClick={() => setRoleFilter('learner')}
          >
            <span className="admin-tab-icon">⏳</span>
            <span className="admin-tab-label">Đơn Chờ Duyệt</span>
            {roleFilter === 'learner' && <span className="admin-tab-count">{tutors.length}</span>}
          </button>
          <button 
            className={`admin-tab ${roleFilter === 'tutor' ? 'active' : ''}`}
            onClick={() => setRoleFilter('tutor')}
          >
            <span className="admin-tab-icon">✅</span>
            <span className="admin-tab-label">Đơn Đã Duyệt</span>
            {roleFilter === 'tutor' && <span className="admin-tab-count">{tutors.length}</span>}
          </button>
          <button 
            className={`admin-tab ${roleFilter === 'all' ? 'active' : ''}`}
            onClick={() => setRoleFilter('all')}
          >
            <span className="admin-tab-icon">📋</span>
            <span className="admin-tab-label">Tất Cả</span>
            {roleFilter === 'all' && <span className="admin-tab-count">{tutors.length}</span>}
          </button>
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
              {tutors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="admin-table-empty">
                    <div className="admin-empty-state">
                      <div className="admin-empty-icon">📋</div>
                      <h3 className="admin-empty-title">
                        {roleFilter === 'learner' ? 'Không có đơn chờ duyệt' :
                         roleFilter === 'tutor' ? 'Không có đơn đã duyệt' : 'Không có dữ liệu'}
                      </h3>
                      <p className="admin-empty-message">
                        {roleFilter === 'learner' ? 'Tất cả đơn đăng ký đã được xử lý' :
                         roleFilter === 'tutor' ? 'Chưa có gia sư nào được duyệt' : 'Không có dữ liệu'}
                      </p>
                            </div>
                  </td>
                </tr>
              ) : tutors.map(tutor => (
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
                       
                       {/* Chỉ hiển thị button Từ chối nếu status là pending */}
                       {tutor.status === 'pending' && (
                          <button
                           className="admin-btn admin-btn-danger admin-btn-sm"
                           disabled={actionLoading}
                           onClick={() => handleReject(tutor)}
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
                     </div>
>>>>>>> Quan3
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
<<<<<<< HEAD

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(pagination.current - 1)}
                    disabled={pagination.current === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.current + 1)}
                    disabled={pagination.current === pagination.pages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">
                        {(pagination.current - 1) * filters.limit + 1}
                      </span>{' '}
                      to{' '}
                      <span className="font-medium">
                        {Math.min(pagination.current * filters.limit, pagination.total)}
                      </span>{' '}
                      of{' '}
                      <span className="font-medium">{pagination.total}</span>{' '}
                      results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === pagination.current
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Tutor Details Modal */}
      {showModal && selectedTutor && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Tutor Details
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="text-sm text-gray-900">{selectedTutor.user?.full_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-sm text-gray-900">{selectedTutor.user?.email}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bio</label>
                  <p className="text-sm text-gray-900">{selectedTutor.bio || 'No bio provided'}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Experience</label>
                    <p className="text-sm text-gray-900">{selectedTutor.experienceYears} years</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Session Rate</label>
                    <p className="text-sm text-gray-900">${selectedTutor.sessionRate}/session</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subjects</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedTutor.subjects?.map((subject, index) => (
                      <span key={index} className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {subject.name} {subject.level && `(${subject.level})`}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Verification Status</label>
                  <div className="mt-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">ID Document:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedTutor.verification?.idStatus === 'approved' ? 'bg-green-100 text-green-800' :
                        selectedTutor.verification?.idStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedTutor.verification?.idStatus || 'none'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Degree Document:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedTutor.verification?.degreeStatus === 'approved' ? 'bg-green-100 text-green-800' :
                        selectedTutor.verification?.degreeStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedTutor.verification?.degreeStatus || 'none'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {selectedTutor.verification?.adminNotes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Admin Notes</label>
                    <p className="text-sm text-gray-900">{selectedTutor.verification.adminNotes}</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Close
                </button>
                <button
                  onClick={() => handleStatusChange(selectedTutor._id, 'approved')}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleStatusChange(selectedTutor._id, 'rejected')}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Reject
                </button>
              </div>
=======
      </div>
      {/* Modal duyệt tutor */}
      {approveModal.open && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={()=>setApproveModal({open:false,tutor:null})}>&times;</button>
            <h3 className="modal-title">
              <span className="approve-icon" role="img" aria-label="approve">✅</span> Duyệt Đơn Gia Sư
            </h3>
            <div className="modal-text">
              Bạn có chắc muốn duyệt <b>{approveModal.tutor.user?.full_name}</b> thành gia sư không?
              <br/>
              <small style={{color: '#6b7280', marginTop: '10px', display: 'block'}}>
                ℹ️ User sẽ tự động được chuyển từ role "learner" sang "tutor" và nhận email thông báo.
              </small>
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

      {/* Modal từ chối tutor */}
      {rejectModal.open && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={()=>setRejectModal({open:false,tutor:null})}>&times;</button>
            <h3 className="modal-title" style={{color: '#ef4444'}}>
              <span className="reject-icon" role="img" aria-label="reject">❌</span> Từ Chối Đơn Gia Sư
            </h3>
            <div className="modal-text">
              <p>Bạn có chắc muốn từ chối đơn của <b>{rejectModal.tutor.user?.full_name}</b>?</p>
              <div style={{marginTop: '15px'}}>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151'}}>
                  Lý do từ chối <span style={{color: '#ef4444'}}>*</span>
                </label>
                <textarea
                  className="admin-input"
                  rows="4"
                  placeholder="Nhập lý do từ chối (bắt buộc)..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
                <small style={{color: '#6b7280', display: 'block', marginTop: '5px'}}>
                  ℹ️ User sẽ nhận email với lý do từ chối này.
                </small>
              </div>
            </div>
            <div className="modal-actions">
              <button 
                className="admin-btn admin-btn-danger" 
                disabled={actionLoading || !rejectionReason.trim()} 
                onClick={confirmReject}
              >
                {actionLoading ? 'Đang xử lý...' : <><span className="admin-btn-icon">❌</span> Xác nhận từ chối</>}
              </button>
              <button className="admin-btn admin-btn-secondary" onClick={()=>setRejectModal({open:false,tutor:null})}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
       {/* Modal chi tiết tutor */}
       {selectedTutor && (
         <div className="modal-overlay">
           <div className="modal-content modal-content-cv">
                        <button
               className="modal-close" 
               onClick={() => setSelectedTutor(null)}
             >
               &times;
                        </button>
             
             {/* CV Header - Professional Profile */}
             <div className="cv-header">
               <div className="cv-avatar-section">
                 <div className="cv-avatar">
                   {selectedTutor.profileImage ? (
                     <img 
                       src={toUrl(selectedTutor.profileImage)} 
                       alt="Profile"
                       onError={(e) => {
                         e.target.style.display = 'none';
                         e.target.nextSibling.style.display = 'flex';
                       }}
                     />
                   ) : null}
                   <div className="cv-avatar-placeholder" style={{display: selectedTutor.profileImage ? 'none' : 'flex'}}>
                     {(selectedTutor.user?.full_name || selectedTutor.full_name || '?').charAt(0)}
                   </div>
                 </div>
                 <div className="cv-status-badge">
                   {selectedTutor.status === 'approved' ? (
                     <span className="cv-badge cv-badge-success">
                       <i className="fas fa-check-circle"></i> Đã duyệt
                     </span>
                   ) : selectedTutor.status === 'rejected' ? (
                     <span className="cv-badge cv-badge-danger">
                       <i className="fas fa-times-circle"></i> Đã từ chối
                     </span>
                   ) : (
                     <span className="cv-badge cv-badge-warning">
                       <i className="fas fa-clock"></i> Chờ duyệt
                     </span>
                   )}
                 </div>
               </div>
               <div className="cv-header-info">
                 <h2 className="cv-name">{selectedTutor.user?.full_name || selectedTutor.full_name}</h2>
                 <p className="cv-title">Ứng viên Gia sư</p>
                 <div className="cv-contact">
                   <div className="cv-contact-item">
                     <i className="fas fa-envelope"></i>
                     <span>{selectedTutor.user?.email || selectedTutor.email}</span>
                   </div>
                   <div className="cv-contact-item">
                     <i className="fas fa-phone"></i>
                     <span>{selectedTutor.user?.phone_number || selectedTutor.phone_number || 'Chưa cập nhật'}</span>
                   </div>
                   <div className="cv-contact-item">
                     <i className="fas fa-map-marker-alt"></i>
                     <span>{selectedTutor.city || selectedTutor.location || 'Chưa cập nhật'}</span>
                   </div>
                 </div>
               </div>
             </div>

             <div className="tutor-detail-content cv-body">
               {/* Professional Summary */}
               <div className="cv-section">
                 <h3 className="cv-section-title">
                   <i className="fas fa-user-tie"></i> Tóm tắt chuyên môn
                 </h3>
                 <div className="cv-summary">
                   {selectedTutor.description || selectedTutor.bio || 'Ứng viên chưa cung cấp mô tả về bản thân'}
                 </div>
               </div>

               {/* Experience & Education */}
               <div className="cv-two-columns">
                 <div className="cv-column">
                   <div className="cv-section">
                     <h3 className="cv-section-title">
                       <i className="fas fa-graduation-cap"></i> Chuyên môn giảng dạy
                     </h3>
                     <div className="cv-info-grid">
                       <div className="cv-info-item">
                         <div className="cv-info-label">Môn học</div>
                         <div className="cv-info-value">
                           {selectedTutor.subjects && selectedTutor.subjects.length > 0 ? (
                             <div className="cv-subjects">
                               {selectedTutor.subjects.map((subject, index) => (
                                 <span key={index} className="cv-subject-tag">
                                   {typeof subject === 'string' ? subject : (subject.name || subject)}
                                   {typeof subject === 'object' && subject.level && <small> ({subject.level})</small>}
                                 </span>
                               ))}
                             </div>
                           ) : <span className="text-muted">Chưa cập nhật</span>}
                         </div>
                       </div>
                       <div className="cv-info-item">
                         <div className="cv-info-label">Kinh nghiệm</div>
                         <div className="cv-info-value cv-highlight">
                           {selectedTutor.experienceYears || selectedTutor.experience || 0} năm
                         </div>
                       </div>
                       <div className="cv-info-item">
                         <div className="cv-info-label">Mức phí</div>
                         <div className="cv-info-value cv-price">
                           {(selectedTutor.sessionRate || selectedTutor.hourlyRate || selectedTutor.price || 0).toLocaleString()} VNĐ/buổi
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>

                 <div className="cv-column">
                   <div className="cv-section">
                     <h3 className="cv-section-title">
                       <i className="fas fa-info-circle"></i> Thông tin bổ sung
                     </h3>
                     <div className="cv-info-grid">
                       <div className="cv-info-item">
                         <div className="cv-info-label">ID Hồ sơ</div>
                         <div className="cv-info-value">
                           <code>{selectedTutor._id.slice(-12)}</code>
                         </div>
                       </div>
                       <div className="cv-info-item">
                         <div className="cv-info-label">Ngày đăng ký</div>
                         <div className="cv-info-value">
                           {selectedTutor.createdAt ? new Date(selectedTutor.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                         </div>
                       </div>
                       <div className="cv-info-item">
                         <div className="cv-info-label">Khu vực</div>
                         <div className="cv-info-value">
                           {selectedTutor.city || selectedTutor.location || 'Chưa cập nhật'}
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>

               {/* CCCD/CCCD - Highlighted Section */}
               {selectedTutor.verification?.idDocuments && selectedTutor.verification.idDocuments.length > 0 && (
                 <div className="cv-section cv-documents-section">
                   <h3 className="cv-section-title">
                     <i className="fas fa-id-card"></i> Giấy tờ tùy thân (CMND/CCCD)
                   </h3>
                   <div className="cv-documents-grid">
                     {selectedTutor.verification.idDocuments.map((doc, index) => (
                       <div key={index} className="cv-document-card">
                         <div className="cv-document-preview">
                           <img 
                             src={toUrl(doc)} 
                             alt={`CMND/CCCD ${index + 1}`}
                             onClick={() => window.open(toUrl(doc), '_blank')}
                             onError={(e) => {
                               e.target.style.display = 'none';
                               e.target.nextSibling.style.display = 'flex';
                             }}
                           />
                           <div className="cv-document-error" style={{display: 'none'}}>
                             <i className="fas fa-image"></i>
                             <span>Không thể tải ảnh</span>
                           </div>
                         </div>
                         <div className="cv-document-info">
                           <div className="cv-document-name">
                             <i className="fas fa-id-card"></i> CMND/CCCD {index + 1}
                           </div>
                           <button 
                             className="cv-document-view-btn"
                             onClick={() => window.open(toUrl(doc), '_blank')}
                           >
                             <i className="fas fa-expand"></i> Xem chi tiết
                           </button>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               )}

               {/* Bằng cấp - Highlighted Section */}
               {selectedTutor.verification?.degreeDocuments && selectedTutor.verification.degreeDocuments.length > 0 && (
                 <div className="cv-section cv-documents-section">
                   <h3 className="cv-section-title">
                     <i className="fas fa-certificate"></i> Bằng cấp & Chứng chỉ
                   </h3>
                   <div className="cv-documents-grid">
                     {selectedTutor.verification.degreeDocuments.map((doc, index) => (
                       <div key={index} className="cv-document-card">
                         <div className="cv-document-preview">
                           <img 
                             src={toUrl(doc)} 
                             alt={`Bằng cấp ${index + 1}`}
                             onClick={() => window.open(toUrl(doc), '_blank')}
                             onError={(e) => {
                               e.target.style.display = 'none';
                               e.target.nextSibling.style.display = 'flex';
                             }}
                           />
                           <div className="cv-document-error" style={{display: 'none'}}>
                             <i className="fas fa-image"></i>
                             <span>Không thể tải ảnh</span>
                           </div>
                         </div>
                         <div className="cv-document-info">
                           <div className="cv-document-name">
                             <i className="fas fa-certificate"></i> Bằng cấp {index + 1}
                           </div>
                           <button 
                             className="cv-document-view-btn"
                             onClick={() => window.open(toUrl(doc), '_blank')}
                           >
                             <i className="fas fa-expand"></i> Xem chi tiết
                           </button>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               )}

               {/* Tài liệu khác */}
               {(selectedTutor.verification?.otherDocuments?.length > 0 || 
                 selectedTutor.portfolio?.length > 0 || 
                 selectedTutor.gallery?.length > 0) && (
                 <div className="cv-section">
                   <div className="cv-section-header">
                     <h3 className="cv-section-title">
                       <i className="fas fa-folder-open"></i> Tài liệu bổ sung
                     </h3>
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
               )}
                
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
>>>>>>> Quan3
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTutors;
