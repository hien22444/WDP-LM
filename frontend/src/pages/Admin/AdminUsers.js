import { useEffect, useState } from "react";
import AdminService from "../../services/AdminService";
import AdminContractService from "../../services/AdminContractService";
import "./AdminUsers.css";

const STATUS_LABELS = {
  active: { label: "Active", className: "badge-green" },
  pending: { label: "Pending", className: "badge-yellow" },
  blocked: { label: "Blocked", className: "badge-red" },
  banned: { label: "Banned", className: "badge-dark" },
};

const ROLES = [
  { value: "", label: "All Roles" },
  { value: "admin", label: "Admin" },
  { value: "tutor", label: "Tutor" },
  { value: "learner", label: "Learner" },
];

const PER_PAGE_OPTIONS = [10, 25, 50];

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [userContracts, setUserContracts] = useState([]);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [blockModalUser, setBlockModalUser] = useState(null);
  const [blockReason, setBlockReason] = useState("");
  const [blockLoading, setBlockLoading] = useState(false);
  const [blockError, setBlockError] = useState(null);
  const [blockSuccess, setBlockSuccess] = useState(null);
  const [unblockModalUser, setUnblockModalUser] = useState(null);
  const [unblockLoading, setUnblockLoading] = useState(false);
  const [unblockError, setUnblockError] = useState(null);
  const [unblockSuccess, setUnblockSuccess] = useState(null);
  const [banModalUser, setBanModalUser] = useState(null);
  const [banReason, setBanReason] = useState("");
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
      setError("Lỗi tải danh sách user.");
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
      const contractsData = await AdminContractService.getContractsByUserId(
        user._id
      );
      setUserContracts(contractsData?.contracts || []);
    } catch (e) {
      console.error("Error loading contracts:", e);
      setUserContracts([]);
    } finally {
      setContractsLoading(false);
    }
  };

  const handleBlockUser = (user) => {
    setBlockModalUser(user);
    setBlockReason("");
    setBlockError(null);
    setBlockSuccess(null);
  };

  const confirmBlockUser = async () => {
    if (!blockReason.trim()) {
      setBlockError("Vui lòng nhập lý do khóa tài khoản!");
      return;
    }
    setBlockLoading(true);
    setBlockError(null);
    setBlockSuccess(null);
    try {
      await AdminService.blockUser(blockModalUser._id, blockReason);
      setBlockSuccess("Khóa tài khoản thành công!");
      setTimeout(() => {
        setBlockModalUser(null);
        fetchUsers();
      }, 1200);
    } catch (e) {
      setBlockError(e?.response?.data?.message || "Lỗi khi khóa user!");
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
      await AdminService.updateUserStatus(unblockModalUser._id, "active");
      setUnblockSuccess("Mở khóa tài khoản thành công!");
      setTimeout(() => {
        setUnblockModalUser(null);
        fetchUsers();
      }, 1200);
    } catch (e) {
      setUnblockError(e?.response?.data?.message || "Lỗi khi mở khóa user!");
    } finally {
      setUnblockLoading(false);
    }
  };

  const handleBanUser = (user) => {
    setBanModalUser(user);
    setBanReason("");
    setBanError(null);
    setBanSuccess(null);
  };

  const confirmBanUser = async () => {
    if (!banReason.trim()) {
      setBanError("Vui lòng nhập lý do ban tài khoản!");
      return;
    }
    setBanLoading(true);
    setBanError(null);
    setBanSuccess(null);
    try {
      await AdminService.banUser(banModalUser._id, banReason);
      setBanSuccess("Ban tài khoản thành công!");
      setTimeout(() => {
        setBanModalUser(null);
        fetchUsers();
      }, 1200);
    } catch (e) {
      setBanError(e?.response?.data?.message || "Lỗi khi ban user!");
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
          <label className="admin-users-label upgraded-label">
            🔍 Tìm kiếm
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Tên, email..."
            className="admin-users-input upgraded-input"
          />
        </div>
        <div>
          <label className="admin-users-label upgraded-label">🧑‍💼 Role</label>
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
            className="admin-users-input upgraded-input"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="admin-users-label upgraded-label">
            📊 Trạng thái
          </label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="admin-users-input upgraded-input"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <div>
          <label className="admin-users-label upgraded-label">
            📄 Per Page
          </label>
          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setPage(1);
            }}
            className="admin-users-input upgraded-input"
          >
            {PER_PAGE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
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
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-500">
                    Không có user nào.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="upgraded-row">
                    <td
                      className="user-name-cell upgraded-cell"
                      onClick={() => handleShowDetail(user)}
                    >
                      {user.full_name}
                    </td>
                    <td className="upgraded-cell">{user.email}</td>
                    <td className="upgraded-cell">
                      <span
                        className={`badge badge-role badge-role-${user.role} upgraded-badge-role`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="upgraded-cell">
                      <span
                        className={`badge ${
                          STATUS_LABELS[user.status]?.className || ""
                        } upgraded-badge-status`}
                      >
                        {user.status === "active" && <span>🟢</span>}
                        {user.status === "pending" && <span>🟡</span>}
                        {user.status === "blocked" && <span>🔴</span>}
                        {user.status === "banned" && <span>⚫</span>}
                        {STATUS_LABELS[user.status]?.label || user.status}
                      </span>
                    </td>
                    <td className="upgraded-cell">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : ""}
                    </td>
                    <td className="upgraded-cell upgraded-actions">
                      <button
                        className="btn-detail upgraded-btn upgraded-btn-detail"
                        onClick={() => handleShowDetail(user)}
                      >
                        <span role="img" aria-label="info">
                          ℹ️
                        </span>{" "}
                        Chi tiết
                      </button>
                      {user.role !== "admin" &&
                        user.status !== "blocked" &&
                        user.status !== "banned" && (
                          <>
                            <button
                              className="btn-block upgraded-btn upgraded-btn-block"
                              onClick={() => handleBlockUser(user)}
                            >
                              <span role="img" aria-label="block">
                                🚫
                              </span>{" "}
                              Block
                            </button>
                            <button
                              className="btn-ban upgraded-btn upgraded-btn-ban"
                              style={{ marginLeft: 8 }}
                              onClick={() => handleBanUser(user)}
                            >
                              <span role="img" aria-label="ban">
                                ⚫
                              </span>{" "}
                              Ban
                            </button>
                          </>
                        )}
                      {user.status === "blocked" && (
                        <>
                          <span className="badge badge-red ml-2 upgraded-badge-blocked">
                            Đã khóa
                          </span>
                          <button
                            className="btn-unblock upgraded-btn upgraded-btn-unblock"
                            onClick={() => handleUnblockUser(user)}
                          >
                            <span role="img" aria-label="unlock">
                              🔓
                            </span>{" "}
                            Mở khóa
                          </button>
                        </>
                      )}
                      {user.status === "banned" && (
                        <span className="badge badge-dark ml-2 upgraded-badge-banned">
                          Đã ban
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
      {/* Pagination */}
      <div className="admin-users-pagination upgraded-pagination">
        <button
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
          className="btn-page upgraded-btn-page"
        >
          &lt;
        </button>
        <span>
          Trang {pagination.current} / {pagination.pages}
        </span>
        <button
          disabled={page >= pagination.pages}
          onClick={() => setPage(page + 1)}
          className="btn-page upgraded-btn-page"
        >
          &gt;
        </button>
        <span className="ml-4 text-gray-500">Tổng: {pagination.total}</span>
      </div>
      {/* Modal chi tiết user */}
      {selectedUser && (
        <div className="modal-overlay upgraded-modal-overlay">
          <div className="modal-content modal-content-detail modal-content-detail-large upgraded-modal-content">
            <button
              className="modal-close upgraded-modal-close"
              onClick={() => {
                setSelectedUser(null);
                setUserDetail(null);
                setUserContracts([]);
              }}
            >
              &times;
            </button>
            <h3 className="modal-title upgraded-modal-title">Thông tin User</h3>
            {detailLoading ? (
              <div className="flex items-center justify-center h-24">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                <div className="user-detail-grid upgraded-user-detail-grid">
                  <div className="user-detail-avatar upgraded-user-detail-avatar">
                    <img
                      src={
                        userDetail?.image ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          userDetail?.full_name || "U"
                        )}&background=2563eb&color=fff&size=128`
                      }
                      alt="avatar"
                    />
                  </div>
                  <div className="user-detail-info upgraded-user-detail-info">
                    <div>
                      <b>Tên:</b> {userDetail?.full_name}
                    </div>
                    <div>
                      <b>Email:</b> {userDetail?.email}
                    </div>
                    <div>
                      <b>Role:</b>{" "}
                      <span
                        className={`badge badge-role badge-role-${userDetail?.role} upgraded-badge-role`}
                      >
                        {userDetail?.role}
                      </span>
                    </div>
                    <div>
                      <b>Trạng thái:</b>{" "}
                      <span
                        className={`badge ${
                          STATUS_LABELS[userDetail?.status]?.className || ""
                        } upgraded-badge-status`}
                      >
                        {userDetail?.status === "active" && <span>🟢</span>}
                        {userDetail?.status === "pending" && <span>🟡</span>}
                        {userDetail?.status === "blocked" && <span>🔴</span>}
                        {userDetail?.status === "banned" && <span>⚫</span>}
                        {STATUS_LABELS[userDetail?.status]?.label ||
                          userDetail?.status}
                      </span>
                    </div>
                    <div>
                      <b>Ngày tạo:</b>{" "}
                      {userDetail?.created_at
                        ? new Date(userDetail.created_at).toLocaleString()
                        : ""}
                    </div>
                    {userDetail?.phone_number && (
                      <div>
                        <b>Số điện thoại:</b> {userDetail.phone_number}
                      </div>
                    )}
                    {userDetail?.date_of_birth && (
                      <div>
                        <b>Ngày sinh:</b>{" "}
                        {new Date(
                          userDetail.date_of_birth
                        ).toLocaleDateString()}
                      </div>
                    )}
                    {userDetail?.gender && (
                      <div>
                        <b>Giới tính:</b>{" "}
                        {userDetail.gender === "male"
                          ? "Nam"
                          : userDetail.gender === "female"
                          ? "Nữ"
                          : "Khác"}
                      </div>
                    )}
                    {userDetail?.address && (
                      <div>
                        <b>Địa chỉ:</b> {userDetail.address}
                      </div>
                    )}
                    {userDetail?.city && (
                      <div>
                        <b>Thành phố:</b> {userDetail.city}
                      </div>
                    )}
                    {userDetail?.email_verified_at && (
                      <div>
                        <b>Email xác thực:</b>{" "}
                        {new Date(
                          userDetail.email_verified_at
                        ).toLocaleString()}
                      </div>
                    )}
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
                      {userContracts.map((contract) => (
                        <div key={contract._id} className="contract-item">
                          <div className="contract-tutor">
                            <b>Gia sư:</b>{" "}
                            {contract.tutorProfile?.user?.profile?.full_name ||
                              contract.tutorProfile?.user?.email ||
                              "N/A"}
                          </div>
                          <div className="contract-info">
                            <span>
                              <b>Giá:</b> {contract.price?.toLocaleString()}đ
                            </span>
                            <span>
                              <b>Trạng thái:</b>{" "}
                              <span
                                className={`contract-status contract-status-${contract.status}`}
                              >
                                {contract.status}
                              </span>
                            </span>
                            <span>
                              <b>Thanh toán:</b> {contract.paymentStatus}
                            </span>
                          </div>
                          <div className="contract-date">
                            <small>
                              Ngày tạo:{" "}
                              {new Date(contract.created_at).toLocaleDateString(
                                "vi-VN"
                              )}
                            </small>
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
            <button
              className="modal-close upgraded-modal-close"
              onClick={() => setBlockModalUser(null)}
            >
              &times;
            </button>
            <h3 className="modal-title modal-title-block upgraded-modal-title">
              Khóa tài khoản
            </h3>
            <div className="mb-2">
              Nhập lý do khóa tài khoản cho <b>{blockModalUser.full_name}</b>:
            </div>
            <textarea
              className="modal-textarea upgraded-modal-textarea"
              rows={4}
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Nhập lý do..."
              disabled={blockLoading}
            />
            {blockError && (
              <div className="text-red-600 mb-2">{blockError}</div>
            )}
            {blockSuccess && (
              <div className="text-green-600 mb-2">{blockSuccess}</div>
            )}
            <div className="flex justify-end gap-2 upgraded-modal-actions">
              <button
                className="btn-cancel upgraded-btn upgraded-btn-cancel"
                onClick={() => setBlockModalUser(null)}
                disabled={blockLoading}
              >
                Hủy
              </button>
              <button
                className="btn-block-confirm upgraded-btn upgraded-btn-block-confirm"
                onClick={confirmBlockUser}
                disabled={blockLoading}
              >
                {blockLoading ? (
                  "Đang xử lý..."
                ) : (
                  <>
                    <span role="img" aria-label="block">
                      🚫
                    </span>{" "}
                    Xác nhận khóa
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal unblock user */}
      {unblockModalUser && (
        <div className="modal-overlay upgraded-modal-overlay">
          <div className="modal-content modal-content-block upgraded-modal-content upgraded-modal-unblock">
            <button
              className="modal-close upgraded-modal-close"
              onClick={() => setUnblockModalUser(null)}
            >
              &times;
            </button>
            <h3 className="modal-title upgraded-modal-title upgraded-modal-title-unblock">
              <span className="unblock-icon" role="img" aria-label="unlock">
                🔓
              </span>{" "}
              Mở khóa tài khoản
            </h3>
            <div className="mb-2 upgraded-modal-unblock-text">
              Bạn có chắc muốn mở khóa tài khoản cho{" "}
              <b>{unblockModalUser.full_name}</b>?
            </div>
            {unblockError && (
              <div className="text-red-600 mb-2 upgraded-modal-error">
                {unblockError}
              </div>
            )}
            {unblockSuccess && (
              <div className="text-green-600 mb-2 upgraded-modal-success">
                {unblockSuccess}
              </div>
            )}
            <div className="flex justify-end gap-3 upgraded-modal-actions">
              <button
                className="btn-cancel upgraded-btn upgraded-btn-cancel upgraded-btn-unblock-cancel"
                onClick={() => setUnblockModalUser(null)}
                disabled={unblockLoading}
              >
                Hủy
              </button>
              <button
                className="btn-unblock upgraded-btn upgraded-btn-unblock upgraded-btn-unblock-confirm"
                onClick={confirmUnblockUser}
                disabled={unblockLoading}
              >
                {unblockLoading ? (
                  "Đang xử lý..."
                ) : (
                  <>
                    <span role="img" aria-label="unlock">
                      🔓
                    </span>{" "}
                    <b>Xác nhận mở khóa</b>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal ban user */}
      {banModalUser && (
        <div className="modal-overlay upgraded-modal-overlay">
          <div className="modal-content modal-content-ban upgraded-modal-content">
            <button
              className="modal-close upgraded-modal-close"
              onClick={() => setBanModalUser(null)}
            >
              &times;
            </button>
            <h3 className="modal-title modal-title-ban upgraded-modal-title">
              Ban tài khoản
            </h3>
            <div className="mb-2">
              Nhập lý do ban tài khoản cho <b>{banModalUser.full_name}</b>:
            </div>
            <textarea
              className="modal-textarea upgraded-modal-textarea"
              rows={4}
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Nhập lý do..."
              disabled={banLoading}
            />
            {banError && <div className="text-red-600 mb-2">{banError}</div>}
            {banSuccess && (
              <div className="text-green-600 mb-2">{banSuccess}</div>
            )}
            <div className="flex justify-end gap-2 upgraded-modal-actions">
              <button
                className="btn-cancel upgraded-btn upgraded-btn-cancel"
                onClick={() => setBanModalUser(null)}
                disabled={banLoading}
              >
                Hủy
              </button>
              <button
                className="btn-ban-confirm upgraded-btn upgraded-btn-ban-confirm"
                onClick={confirmBanUser}
                disabled={banLoading}
              >
                {banLoading ? (
                  "Đang xử lý..."
                ) : (
                  <>
                    <span role="img" aria-label="ban">
                      ⚫
                    </span>{" "}
                    Xác nhận ban
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
