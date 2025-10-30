<<<<<<< HEAD
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Trash2, UserCheck, UserX } from 'lucide-react';
import AdminService from '../../services/AdminService';
=======
import { useEffect, useState } from 'react';
import AdminService from '../../services/AdminService';
import AdminContractService from '../../services/AdminContractService';
import './AdminUsers.css';

const STATUS_LABELS = {
  active: { label: 'Active', className: 'badge-green' },
  pending: { label: 'Pending', className: 'badge-yellow' },
  blocked: { label: 'Blocked', className: 'badge-red' },
  banned: { label: 'Banned', className: 'badge-dark' }
};

const ROLES = [
  { value: '', label: 'All Roles' },
  { value: 'admin', label: 'Admin' },
  { value: 'tutor', label: 'Tutor' },
  { value: 'learner', label: 'Learner' },
];

const PER_PAGE_OPTIONS = [10, 25, 50];
>>>>>>> Quan3

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
<<<<<<< HEAD
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    role: '',
    status: '',
    search: ''
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await AdminService.getUsers(filters);
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await AdminService.updateUserStatus(userId, newStatus);
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await AdminService.deleteUser(userId);
        fetchUsers(); // Refresh the list
      } catch (error) {
        console.error('Error deleting user:', error);
      }
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
      active: { color: 'bg-green-100 text-green-800', label: 'Active' },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      blocked: { color: 'bg-red-100 text-red-800', label: 'Blocked' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      admin: { color: 'bg-red-100 text-red-800', label: 'Admin' },
      tutor: { color: 'bg-blue-100 text-blue-800', label: 'Tutor' },
      learner: { color: 'bg-green-100 text-green-800', label: 'Learner' }
    };
    const config = roleConfig[role] || roleConfig.learner;
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage all users in the system
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="tutor">Tutor</option>
              <option value="learner">Learner</option>
            </select>
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
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="blocked">Blocked</option>
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

      {/* Users Table */}
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
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {user.full_name?.charAt(0)?.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.full_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(user.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {user.status === 'active' ? (
                            <button
                              onClick={() => handleStatusChange(user._id, 'blocked')}
                              className="text-red-600 hover:text-red-900"
                              title="Block User"
                            >
                              <UserX className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusChange(user._id, 'active')}
                              className="text-green-600 hover:text-green-900"
                              title="Activate User"
                            >
                              <UserCheck className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete User"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
=======
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [userContracts, setUserContracts] = useState([]);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [blockModalUser, setBlockModalUser] = useState(null);
  const [blockReason, setBlockReason] = useState('');
  const [blockLoading, setBlockLoading] = useState(false);
  const [blockError, setBlockError] = useState(null);
  const [blockSuccess, setBlockSuccess] = useState(null);
  const [unblockModalUser, setUnblockModalUser] = useState(null);
  const [unblockLoading, setUnblockLoading] = useState(false);
  const [unblockError, setUnblockError] = useState(null);
  const [unblockSuccess, setUnblockSuccess] = useState(null);
  const [banModalUser, setBanModalUser] = useState(null);
  const [banReason, setBanReason] = useState('');
  const [banLoading, setBanLoading] = useState(false);
  const [banError, setBanError] = useState(null);
  const [banSuccess, setBanSuccess] = useState(null);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, [search, role, status, perPage, page]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await AdminService.getUsers({
        search,
        role,
        status,
        limit: perPage,
        page,
      });
      setUsers(res.data.users || []);
      setPagination(res.data.pagination || { current: 1, pages: 1, total: 0 });
    } catch (err) {
      setError('Lỗi tải danh sách user.');
    } finally {
      setLoading(false);
    }
  };

  // Khi click chi tiết, fetch đầy đủ user
  const handleShowDetail = async (user) => {
    setDetailLoading(true);
    setContractsLoading(true);
    setSelectedUser(user); // show modal ngay để UX tốt
    setUserContracts([]);
    
    try {
      const res = await AdminService.getUserById(user._id);
      setUserDetail(res.data || user); // fallback nếu API lỗi
    } catch (e) {
      setUserDetail(user);
    } finally {
      setDetailLoading(false);
    }

    // Fetch contracts của user
    try {
      const contractsData = await AdminContractService.getContractsByUserId(user._id);
      setUserContracts(contractsData?.contracts || []);
    } catch (e) {
      console.error('Error loading contracts:', e);
      setUserContracts([]);
    } finally {
      setContractsLoading(false);
    }
  };

  const handleBlockUser = (user) => {
    setBlockModalUser(user);
    setBlockReason('');
    setBlockError(null);
    setBlockSuccess(null);
  };

  const confirmBlockUser = async () => {
    if (!blockReason.trim()) {
      setBlockError('Vui lòng nhập lý do khóa tài khoản!');
      return;
    }
    setBlockLoading(true);
    setBlockError(null);
    setBlockSuccess(null);
    try {
      await AdminService.blockUser(blockModalUser._id, blockReason);
      setBlockSuccess('Khóa tài khoản thành công!');
      setTimeout(() => {
        setBlockModalUser(null);
        fetchUsers();
      }, 1200);
    } catch (e) {
      setBlockError(e?.response?.data?.message || 'Lỗi khi khóa user!');
    } finally {
      setBlockLoading(false);
    }
  };

  const handleUnblockUser = (user) => {
    setUnblockModalUser(user);
    setUnblockError(null);
    setUnblockSuccess(null);
  };

  const confirmUnblockUser = async () => {
    setUnblockLoading(true);
    setUnblockError(null);
    setUnblockSuccess(null);
    try {
      await AdminService.updateUserStatus(unblockModalUser._id, 'active');
      setUnblockSuccess('Mở khóa tài khoản thành công!');
      setTimeout(() => {
        setUnblockModalUser(null);
        fetchUsers();
      }, 1200);
    } catch (e) {
      setUnblockError(e?.response?.data?.message || 'Lỗi khi mở khóa user!');
    } finally {
      setUnblockLoading(false);
    }
  };

  const handleBanUser = (user) => {
    setBanModalUser(user);
    setBanReason('');
    setBanError(null);
    setBanSuccess(null);
  };

  const confirmBanUser = async () => {
    if (!banReason.trim()) {
      setBanError('Vui lòng nhập lý do ban tài khoản!');
      return;
    }
    setBanLoading(true);
    setBanError(null);
    setBanSuccess(null);
    try {
      await AdminService.banUser(banModalUser._id, banReason);
      setBanSuccess('Ban tài khoản thành công!');
      setTimeout(() => {
        setBanModalUser(null);
        fetchUsers();
      }, 1200);
    } catch (e) {
      setBanError(e?.response?.data?.message || 'Lỗi khi ban user!');
    } finally {
      setBanLoading(false);
    }
  };

  return (
    <div className="admin-users-page">
      <div className="admin-users-header upgraded-header">
        <h2 className="admin-users-title upgraded-title">Quản lý Users</h2>
      </div>
      <div className="admin-users-filters upgraded-filters">
          <div>
          <label className="admin-users-label upgraded-label">🔍 Tìm kiếm</label>
          <input type="text" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Tên, email..." className="admin-users-input upgraded-input" />
          </div>
          <div>
          <label className="admin-users-label upgraded-label">🧑‍💼 Role</label>
          <select value={role} onChange={e=>{setRole(e.target.value);setPage(1);}} className="admin-users-input upgraded-input">
            {ROLES.map(r=>(<option key={r.value} value={r.value}>{r.label}</option>))}
            </select>
          </div>
          <div>
          <label className="admin-users-label upgraded-label">📊 Trạng thái</label>
          <select value={status} onChange={e=>{setStatus(e.target.value);setPage(1);}} className="admin-users-input upgraded-input">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div>
          <label className="admin-users-label upgraded-label">📄 Per Page</label>
          <select value={perPage} onChange={e=>{setPerPage(Number(e.target.value));setPage(1);}} className="admin-users-input upgraded-input">
            {PER_PAGE_OPTIONS.map(opt=>(<option key={opt} value={opt}>{opt}</option>))}
            </select>
          </div>
        </div>
      <div className="admin-users-table-wrap upgraded-table-wrap">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-red-600 mb-4">{error}</div>
        ) : (
          <table className="admin-users-table upgraded-table">
            <thead>
              <tr>
                <th>Tên</th>
                <th>Email</th>
                <th>Role</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Hành động</th>
                  </tr>
                </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-6 text-gray-500">Không có user nào.</td></tr>
              ) : users.map(user => (
                <tr key={user._id} className="upgraded-row">
                  <td className="user-name-cell upgraded-cell" onClick={()=>handleShowDetail(user)}>{user.full_name}</td>
                  <td className="upgraded-cell">{user.email}</td>
                  <td className="upgraded-cell"><span className={`badge badge-role badge-role-${user.role} upgraded-badge-role`}>{user.role}</span></td>
                  <td className="upgraded-cell">
                    <span className={`badge ${STATUS_LABELS[user.status]?.className || ''} upgraded-badge-status`}>
                      {user.status === 'active' && <span>🟢</span>}
                      {user.status === 'pending' && <span>🟡</span>}
                      {user.status === 'blocked' && <span>🔴</span>}
                      {user.status === 'banned' && <span>⚫</span>}
                      {STATUS_LABELS[user.status]?.label || user.status}
                              </span>
                      </td>
                  <td className="upgraded-cell">{user.created_at ? new Date(user.created_at).toLocaleDateString() : ''}</td>
                  <td className="upgraded-cell upgraded-actions">
                    <button className="btn-detail upgraded-btn upgraded-btn-detail" onClick={()=>handleShowDetail(user)}>
                      <span role="img" aria-label="info">ℹ️</span> Chi tiết
                    </button>
                    {user.role !== 'admin' && user.status !== 'blocked' && user.status !== 'banned' && (
                      <>
                        <button className="btn-block upgraded-btn upgraded-btn-block" onClick={()=>handleBlockUser(user)}>
                          <span role="img" aria-label="block">🚫</span> Block
                            </button>
                        <button className="btn-ban upgraded-btn upgraded-btn-ban" style={{marginLeft:8}} onClick={()=>handleBanUser(user)}>
                          <span role="img" aria-label="ban">⚫</span> Ban
                            </button>
                      </>
                    )}
                    {user.status === 'blocked' && (
                      <>
                        <span className="badge badge-red ml-2 upgraded-badge-blocked">Đã khóa</span>
                        <button className="btn-unblock upgraded-btn upgraded-btn-unblock" onClick={()=>handleUnblockUser(user)}>
                          <span role="img" aria-label="unlock">🔓</span> Mở khóa
                          </button>
                      </>
                    )}
                    {user.status === 'banned' && (
                      <span className="badge badge-dark ml-2 upgraded-badge-banned">Đã ban</span>
                    )}
>>>>>>> Quan3
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
<<<<<<< HEAD
            </div>

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
=======
        )}
            </div>
            {/* Pagination */}
      <div className="admin-users-pagination upgraded-pagination">
        <button disabled={page<=1} onClick={()=>setPage(page-1)} className="btn-page upgraded-btn-page">&lt;</button>
        <span>Trang {pagination.current} / {pagination.pages}</span>
        <button disabled={page>=pagination.pages} onClick={()=>setPage(page+1)} className="btn-page upgraded-btn-page">&gt;</button>
        <span className="ml-4 text-gray-500">Tổng: {pagination.total}</span>
      </div>
      {/* Modal chi tiết user */}
      {selectedUser && (
        <div className="modal-overlay upgraded-modal-overlay">
          <div className="modal-content modal-content-detail modal-content-detail-large upgraded-modal-content">
            <button className="modal-close upgraded-modal-close" onClick={()=>{setSelectedUser(null);setUserDetail(null);setUserContracts([]);}}>&times;</button>
            <h3 className="modal-title upgraded-modal-title">Thông tin User</h3>
            {detailLoading ? (
              <div className="flex items-center justify-center h-24"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
            ) : (
              <>
                <div className="user-detail-grid upgraded-user-detail-grid">
                  <div className="user-detail-avatar upgraded-user-detail-avatar">
                    <img src={userDetail?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(userDetail?.full_name||'U')}&background=2563eb&color=fff&size=128`} alt="avatar" />
                  </div>
                  <div className="user-detail-info upgraded-user-detail-info">
                    <div><b>Tên:</b> {userDetail?.full_name}</div>
                    <div><b>Email:</b> {userDetail?.email}</div>
                    <div><b>Role:</b> <span className={`badge badge-role badge-role-${userDetail?.role} upgraded-badge-role`}>{userDetail?.role}</span></div>
                    <div><b>Trạng thái:</b> <span className={`badge ${STATUS_LABELS[userDetail?.status]?.className || ''} upgraded-badge-status`}>
                      {userDetail?.status === 'active' && <span>🟢</span>}
                      {userDetail?.status === 'pending' && <span>🟡</span>}
                      {userDetail?.status === 'blocked' && <span>🔴</span>}
                      {userDetail?.status === 'banned' && <span>⚫</span>}
                      {STATUS_LABELS[userDetail?.status]?.label || userDetail?.status}
                    </span></div>
                    <div><b>Ngày tạo:</b> {userDetail?.created_at ? new Date(userDetail.created_at).toLocaleString() : ''}</div>
                    {userDetail?.phone_number && <div><b>Số điện thoại:</b> {userDetail.phone_number}</div>}
                    {userDetail?.date_of_birth && <div><b>Ngày sinh:</b> {new Date(userDetail.date_of_birth).toLocaleDateString()}</div>}
                    {userDetail?.gender && <div><b>Giới tính:</b> {userDetail.gender === 'male' ? 'Nam' : userDetail.gender === 'female' ? 'Nữ' : 'Khác'}</div>}
                    {userDetail?.address && <div><b>Địa chỉ:</b> {userDetail.address}</div>}
                    {userDetail?.city && <div><b>Thành phố:</b> {userDetail.city}</div>}
                    {userDetail?.email_verified_at && <div><b>Email xác thực:</b> {new Date(userDetail.email_verified_at).toLocaleString()}</div>}
                  </div>
                </div>

                {/* Lịch sử hợp đồng */}
                <div className="user-contracts-section">
                  <h4 className="contracts-section-title">
                    📋 Lịch sử hợp đồng ({userContracts.length})
                  </h4>
                  {contractsLoading ? (
                    <div className="flex items-center justify-center h-16">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : userContracts.length === 0 ? (
                    <div className="no-contracts">
                      <p>Chưa có hợp đồng nào</p>
                    </div>
                  ) : (
                    <div className="contracts-list">
                      {userContracts.map(contract => (
                        <div key={contract._id} className="contract-item">
                          <div className="contract-tutor">
                            <b>Gia sư:</b> {contract.tutorProfile?.user?.profile?.full_name || contract.tutorProfile?.user?.email || 'N/A'}
                          </div>
                          <div className="contract-info">
                            <span><b>Giá:</b> {contract.price?.toLocaleString()}đ</span>
                            <span><b>Trạng thái:</b> <span className={`contract-status contract-status-${contract.status}`}>{contract.status}</span></span>
                            <span><b>Thanh toán:</b> {contract.paymentStatus}</span>
                          </div>
                          <div className="contract-date">
                            <small>Ngày tạo: {new Date(contract.created_at).toLocaleDateString('vi-VN')}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {/* Modal block user */}
      {blockModalUser && (
        <div className="modal-overlay upgraded-modal-overlay">
          <div className="modal-content modal-content-block upgraded-modal-content">
            <button className="modal-close upgraded-modal-close" onClick={()=>setBlockModalUser(null)}>&times;</button>
            <h3 className="modal-title modal-title-block upgraded-modal-title">Khóa tài khoản</h3>
            <div className="mb-2">Nhập lý do khóa tài khoản cho <b>{blockModalUser.full_name}</b>:</div>
            <textarea
              className="modal-textarea upgraded-modal-textarea"
              rows={4}
              value={blockReason}
              onChange={e=>setBlockReason(e.target.value)}
              placeholder="Nhập lý do..."
              disabled={blockLoading}
            />
            {blockError && <div className="text-red-600 mb-2">{blockError}</div>}
            {blockSuccess && <div className="text-green-600 mb-2">{blockSuccess}</div>}
            <div className="flex justify-end gap-2 upgraded-modal-actions">
              <button className="btn-cancel upgraded-btn upgraded-btn-cancel" onClick={()=>setBlockModalUser(null)} disabled={blockLoading}>Hủy</button>
              <button className="btn-block-confirm upgraded-btn upgraded-btn-block-confirm" onClick={confirmBlockUser} disabled={blockLoading}>
                {blockLoading ? 'Đang xử lý...' : <><span role="img" aria-label="block">🚫</span> Xác nhận khóa</>}
                  </button>
                </div>
          </div>
        </div>
      )}
      {/* Modal unblock user */}
      {unblockModalUser && (
        <div className="modal-overlay upgraded-modal-overlay">
          <div className="modal-content modal-content-block upgraded-modal-content upgraded-modal-unblock">
            <button className="modal-close upgraded-modal-close" onClick={()=>setUnblockModalUser(null)}>&times;</button>
            <h3 className="modal-title upgraded-modal-title upgraded-modal-title-unblock">
              <span className="unblock-icon" role="img" aria-label="unlock">🔓</span> Mở khóa tài khoản
            </h3>
            <div className="mb-2 upgraded-modal-unblock-text">
              Bạn có chắc muốn mở khóa tài khoản cho <b>{unblockModalUser.full_name}</b>?
                  </div>
            {unblockError && <div className="text-red-600 mb-2 upgraded-modal-error">{unblockError}</div>}
            {unblockSuccess && <div className="text-green-600 mb-2 upgraded-modal-success">{unblockSuccess}</div>}
            <div className="flex justify-end gap-3 upgraded-modal-actions">
              <button className="btn-cancel upgraded-btn upgraded-btn-cancel upgraded-btn-unblock-cancel" onClick={()=>setUnblockModalUser(null)} disabled={unblockLoading}>Hủy</button>
              <button className="btn-unblock upgraded-btn upgraded-btn-unblock upgraded-btn-unblock-confirm" onClick={confirmUnblockUser} disabled={unblockLoading}>
                {unblockLoading ? 'Đang xử lý...' : <><span role="img" aria-label="unlock">🔓</span> <b>Xác nhận mở khóa</b></>}
                        </button>
>>>>>>> Quan3
                  </div>
                </div>
              </div>
            )}
<<<<<<< HEAD
          </>
        )}
      </div>
=======
      {/* Modal ban user */}
      {banModalUser && (
        <div className="modal-overlay upgraded-modal-overlay">
          <div className="modal-content modal-content-ban upgraded-modal-content">
            <button className="modal-close upgraded-modal-close" onClick={()=>setBanModalUser(null)}>&times;</button>
            <h3 className="modal-title modal-title-ban upgraded-modal-title">Ban tài khoản</h3>
            <div className="mb-2">Nhập lý do ban tài khoản cho <b>{banModalUser.full_name}</b>:</div>
            <textarea
              className="modal-textarea upgraded-modal-textarea"
              rows={4}
              value={banReason}
              onChange={e=>setBanReason(e.target.value)}
              placeholder="Nhập lý do..."
              disabled={banLoading}
            />
            {banError && <div className="text-red-600 mb-2">{banError}</div>}
            {banSuccess && <div className="text-green-600 mb-2">{banSuccess}</div>}
            <div className="flex justify-end gap-2 upgraded-modal-actions">
              <button className="btn-cancel upgraded-btn upgraded-btn-cancel" onClick={()=>setBanModalUser(null)} disabled={banLoading}>Hủy</button>
              <button className="btn-ban-confirm upgraded-btn upgraded-btn-ban-confirm" onClick={confirmBanUser} disabled={banLoading}>
                {banLoading ? 'Đang xử lý...' : <><span role="img" aria-label="ban">⚫</span> Xác nhận ban</>}
              </button>
            </div>
          </div>
        </div>
      )}
>>>>>>> Quan3
    </div>
  );
};

export default AdminUsers;
