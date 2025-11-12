import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminContractService from '../../services/AdminContractService';
import './AdminContracts.css';

const AdminContracts = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    status: 'all',
    contractSigned: undefined,
    search: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const [selectedContract, setSelectedContract] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadContracts();
    loadStats();
  }, [pagination.page, filters]);

  const loadContracts = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      };
      const data = await AdminContractService.getAllContracts(params);
      setContracts(data.contracts);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error loading contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await AdminContractService.getContractStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSearch = (e) => {
    setFilters({ ...filters, search: e.target.value });
    setPagination({ ...pagination, page: 1 });
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setPagination({ ...pagination, page: 1 });
  };

  const handleViewContract = (contract) => {
    navigate(`/admin/contracts/${contract._id}`);
  };

  const handleUpdateStatus = async (contract, newStatus) => {
    try {
      await AdminContractService.updateContractStatus(contract._id, newStatus);
      loadContracts();
      loadStats();
      setShowStatusModal(false);
      setSelectedContract(null);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDeleteContract = async () => {
    if (!selectedContract) return;
    
    try {
      await AdminContractService.deleteContract(selectedContract._id, 'Deleted by admin');
      loadContracts();
      loadStats();
      setShowDeleteModal(false);
      setSelectedContract(null);
    } catch (error) {
      console.error('Error deleting contract:', error);
    }
  };

  const handleExportCSV = async () => {
    try {
      await AdminContractService.exportToCSV();
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'Chờ xác nhận', class: 'status-pending' },
      accepted: { label: 'Đã chấp nhận', class: 'status-accepted' },
      rejected: { label: 'Đã từ chối', class: 'status-rejected' },
      cancelled: { label: 'Đã hủy', class: 'status-cancelled' },
      completed: { label: 'Hoàn thành', class: 'status-completed' },
      in_progress: { label: 'Đang học', class: 'status-in-progress' },
      disputed: { label: 'Tranh chấp', class: 'status-disputed' }
    };
    const { label, class: className } = statusMap[status] || { label: status, class: '' };
    return <span className={`status-badge ${className}`}>{label}</span>;
  };

  const getPaymentStatusBadge = (status) => {
    const statusMap = {
      none: { label: 'Chưa thanh toán', class: 'payment-none' },
      prepaid: { label: 'Trả trước', class: 'payment-prepaid' },
      postpaid: { label: 'Trả sau', class: 'payment-postpaid' },
      escrow: { label: 'Đang giữ', class: 'payment-escrow' },
      held: { label: 'Đã khóa', class: 'payment-held' },
      released: { label: 'Đã giải phóng', class: 'payment-released' },
      refunded: { label: 'Đã hoàn tiền', class: 'payment-refunded' }
    };
    const { label, class: className } = statusMap[status] || { label: status, class: '' };
    return <span className={`payment-badge ${className}`}>{label}</span>;
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
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="admin-contracts">
      {/* Modern Header */}
      <div className="admin-contracts-header">
        <div className="header-content">
          <div className="header-title-section">
            <div className="header-icon-wrapper">
              <i className="fas fa-file-contract"></i>
            </div>
            <div>
              <h1>Quản lý Hợp đồng</h1>
              <p className="header-description">
                Quản lý tất cả các hợp đồng giữa học viên và gia sư
              </p>
            </div>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-export" onClick={handleExportCSV}>
            <i className="fas fa-download"></i>
            <span>Xuất CSV</span>
          </button>
        </div>
      </div>

      {/* Modern Statistics Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card stat-card-total">
            <div className="stat-card-inner">
              <div className="stat-icon-wrapper total">
                <i className="fas fa-file-contract"></i>
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.totalContracts}</div>
                <div className="stat-label">Tổng hợp đồng</div>
              </div>
            </div>
            <div className="stat-card-decoration"></div>
          </div>
          <div className="stat-card stat-card-signed">
            <div className="stat-card-inner">
              <div className="stat-icon-wrapper signed">
                <i className="fas fa-signature"></i>
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.signedContracts}</div>
                <div className="stat-label">Đã ký</div>
              </div>
            </div>
            <div className="stat-card-decoration"></div>
          </div>
          <div className="stat-card stat-card-pending">
            <div className="stat-card-inner">
              <div className="stat-icon-wrapper pending">
                <i className="fas fa-clock"></i>
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.pendingContracts}</div>
                <div className="stat-label">Chờ xác nhận</div>
              </div>
            </div>
            <div className="stat-card-decoration"></div>
          </div>
          <div className="stat-card stat-card-active">
            <div className="stat-card-inner">
              <div className="stat-icon-wrapper active">
                <i className="fas fa-play-circle"></i>
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.activeContracts}</div>
                <div className="stat-label">Đang hoạt động</div>
              </div>
            </div>
            <div className="stat-card-decoration"></div>
          </div>
          <div className="stat-card stat-card-completed">
            <div className="stat-card-inner">
              <div className="stat-icon-wrapper completed">
                <i className="fas fa-check-circle"></i>
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.completedContracts}</div>
                <div className="stat-label">Hoàn thành</div>
              </div>
            </div>
            <div className="stat-card-decoration"></div>
          </div>
          <div className="stat-card stat-card-disputed">
            <div className="stat-card-inner">
              <div className="stat-icon-wrapper disputed">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.disputedContracts}</div>
                <div className="stat-label">Tranh chấp</div>
              </div>
            </div>
            <div className="stat-card-decoration"></div>
          </div>
          <div className="stat-card stat-card-revenue">
            <div className="stat-card-inner">
              <div className="stat-icon-wrapper revenue">
                <i className="fas fa-dollar-sign"></i>
              </div>
              <div className="stat-content">
                <div className="stat-value">{formatCurrency(stats.totalRevenue)}</div>
                <div className="stat-label">Tổng doanh thu</div>
              </div>
            </div>
            <div className="stat-card-decoration"></div>
          </div>
          <div className="stat-card stat-card-platform">
            <div className="stat-card-inner">
              <div className="stat-icon-wrapper platform">
                <i className="fas fa-hand-holding-usd"></i>
              </div>
              <div className="stat-content">
                <div className="stat-value">{formatCurrency(stats.platformRevenue)}</div>
                <div className="stat-label">Doanh thu platform</div>
              </div>
            </div>
            <div className="stat-card-decoration"></div>
          </div>
        </div>
      )}

      {/* Modern Filters Section */}
      <div className="filters-section">
        <div className="filter-controls">
          <div className="search-box-wrapper">
            <div className="search-box">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Tìm kiếm theo số hợp đồng, tên học viên, email..."
                value={filters.search}
                onChange={handleSearch}
              />
            </div>
          </div>
          <div className="filter-group">
            <label className="filter-label">Trạng thái</label>
            <select
              className="filter-select"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ xác nhận</option>
              <option value="accepted">Đã chấp nhận</option>
              <option value="rejected">Đã từ chối</option>
              <option value="cancelled">Đã hủy</option>
              <option value="completed">Hoàn thành</option>
              <option value="in_progress">Đang học</option>
              <option value="disputed">Tranh chấp</option>
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Tình trạng ký</label>
            <select
              className="filter-select"
              value={filters.contractSigned === undefined ? 'all' : filters.contractSigned}
              onChange={(e) => handleFilterChange('contractSigned', e.target.value === 'all' ? undefined : e.target.value === 'true')}
            >
              <option value="all">Tất cả hợp đồng</option>
              <option value="true">Đã ký</option>
              <option value="false">Chưa ký</option>
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Sắp xếp theo</label>
            <select
              className="filter-select"
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            >
              <option value="created_at">Ngày tạo</option>
              <option value="start">Ngày bắt đầu</option>
              <option value="price">Giá</option>
              <option value="status">Trạng thái</option>
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Thứ tự</label>
            <select
              className="filter-select"
              value={filters.sortOrder}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
            >
              <option value="desc">Giảm dần</option>
              <option value="asc">Tăng dần</option>
            </select>
          </div>
        </div>
      </div>

      {/* Modern Contracts Table */}
      <div className="contracts-table-container">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : contracts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <i className="fas fa-inbox"></i>
            </div>
            <h3>Không có hợp đồng nào</h3>
            <p>Chưa có hợp đồng nào trong hệ thống</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="contracts-table">
              <thead>
                <tr>
                  <th>Học viên</th>
                  <th>Gia sư</th>
                  <th>Thời gian</th>
                  <th>Giá</th>
                  <th>Trạng thái</th>
                  <th>Thanh toán</th>
                  <th>Đã ký</th>
                  <th>Ngày tạo</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract) => (
                  <tr 
                    key={contract._id}
                    className="contract-row"
                    onClick={() => handleViewContract(contract)}
                  >
                    <td>
                      <div className="user-info">
                        <div className="user-avatar">
                          <i className="fas fa-user-graduate"></i>
                        </div>
                        <div className="user-details">
                          <div className="user-name">
                            {contract.contractData?.studentName || 
                             contract.student?.profile?.full_name || 
                             'N/A'}
                          </div>
                          <div className="user-email">
                            {contract.contractData?.studentEmail || 
                             contract.student?.email || 
                             'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar tutor-avatar">
                          <i className="fas fa-chalkboard-teacher"></i>
                        </div>
                        <div className="user-details">
                          <div className="user-name">
                            {contract.tutorProfile?.user?.profile?.full_name || 
                             contract.tutorProfile?.user?.email || 
                             'N/A'}
                          </div>
                          <div className="user-email">
                            {contract.tutorProfile?.user?.email || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="time-info">
                        <div className="time-item">
                          <i className="fas fa-calendar-alt"></i>
                          <span>{formatDate(contract.start)}</span>
                        </div>
                        <div className="time-separator">
                          <i className="fas fa-arrow-right"></i>
                        </div>
                        <div className="time-item">
                          <i className="fas fa-calendar-check"></i>
                          <span>{formatDate(contract.end)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="price-cell">
                      <div className="price-wrapper">
                        <span className="price-value">{formatCurrency(contract.price)}</span>
                      </div>
                    </td>
                    <td>{getStatusBadge(contract.status)}</td>
                    <td>{getPaymentStatusBadge(contract.paymentStatus)}</td>
                    <td className="signed-cell">
                      {contract.contractSigned ? (
                        <span className="signed-badge signed-yes">
                          <i className="fas fa-check-circle"></i>
                          <span>Đã ký</span>
                        </span>
                      ) : (
                        <span className="signed-badge signed-no">
                          <i className="fas fa-times-circle"></i>
                          <span>Chưa ký</span>
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="date-cell">
                        <i className="fas fa-clock"></i>
                        <span>{formatDate(contract.created_at)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pagination">
          <button
            className="btn-page"
            disabled={pagination.page === 1}
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
          >
            <i className="fas fa-chevron-left"></i>
            Trước
          </button>
          <div className="page-info">
            Trang {pagination.page} / {pagination.pages} ({pagination.total} hợp đồng)
          </div>
          <button
            className="btn-page"
            disabled={pagination.page === pagination.pages}
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
          >
            Sau
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedContract && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Cập nhật trạng thái hợp đồng</h3>
              <button className="btn-close" onClick={() => setShowStatusModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>
                Chọn trạng thái mới cho hợp đồng{' '}
                <strong>{selectedContract.contractNumber || selectedContract._id.substring(0, 8)}</strong>
              </p>
              <div className="status-options">
                <button
                  className="status-option pending"
                  onClick={() => handleUpdateStatus(selectedContract, 'pending')}
                >
                  Chờ xác nhận
                </button>
                <button
                  className="status-option accepted"
                  onClick={() => handleUpdateStatus(selectedContract, 'accepted')}
                >
                  Đã chấp nhận
                </button>
                <button
                  className="status-option rejected"
                  onClick={() => handleUpdateStatus(selectedContract, 'rejected')}
                >
                  Đã từ chối
                </button>
                <button
                  className="status-option cancelled"
                  onClick={() => handleUpdateStatus(selectedContract, 'cancelled')}
                >
                  Đã hủy
                </button>
                <button
                  className="status-option in-progress"
                  onClick={() => handleUpdateStatus(selectedContract, 'in_progress')}
                >
                  Đang học
                </button>
                <button
                  className="status-option completed"
                  onClick={() => handleUpdateStatus(selectedContract, 'completed')}
                >
                  Hoàn thành
                </button>
                <button
                  className="status-option disputed"
                  onClick={() => handleUpdateStatus(selectedContract, 'disputed')}
                >
                  Tranh chấp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedContract && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Xác nhận xóa hợp đồng</h3>
              <button className="btn-close" onClick={() => setShowDeleteModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>
                Bạn có chắc chắn muốn xóa hợp đồng{' '}
                <strong>{selectedContract.contractNumber || selectedContract._id.substring(0, 8)}</strong>?
              </p>
              <p className="warning">
                <i className="fas fa-exclamation-triangle"></i>
                Hành động này sẽ đánh dấu hợp đồng là đã hủy và không thể hoàn tác.
              </p>
              <div className="modal-actions">
                <button
                  className="btn-secondary"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Hủy
                </button>
                <button
                  className="btn-danger"
                  onClick={handleDeleteContract}
                >
                  Xóa hợp đồng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContracts;

