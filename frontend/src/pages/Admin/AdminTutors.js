import React, { useEffect, useState, useCallback } from "react";
import AdminService from "../../services/AdminService";
import "./AdminTutors.modern.css";

const AdminTutors = () => {
  const [tutors, setTutors] = useState([]);
  const [error, setError] = useState(null);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [approveModal, setApproveModal] = useState({
    open: false,
    tutor: null,
  });
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
  });
  const [rejectModal, setRejectModal] = useState({ open: false, tutor: null });
  const [rejectionReason, setRejectionReason] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // Bắt đầu từ 'all' để xem tất cả
  const [imagePreview, setImagePreview] = useState({
    open: false,
    imageUrl: null,
    title: "",
  });

  const fetchTutors = useCallback(async () => {
    console.log("🔄 fetchTutors called with statusFilter:", statusFilter);
    setError(null);
    try {
      console.log(
        "📡 Calling AdminService.getTutors() with status:",
        statusFilter
      );
      const params =
        statusFilter === "all"
          ? { limit: 1000 }
          : { status: statusFilter, limit: 1000 };
      const res = await AdminService.getTutors(params);
      console.log("📊 Full API response:", res);

      // Backend trả về data trực tiếp trong res.data, không phải res.data.tutors
      const tutorData = res.data?.data || res.data?.tutors || res.data || [];
      console.log("📋 Tutors data:", tutorData);
      console.log("📈 Total records:", tutorData.length);

      // Debug info từ backend
      if (res.data?.debug) {
        console.log("🔍 Backend debug info:", res.data.debug);
      }

      // Status breakdown
      const statusBreakdown = tutorData.reduce((acc, tutor) => {
        const status = tutor.status || "null/undefined";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      console.log("🏷️ Frontend status breakdown:", statusBreakdown);

      // User breakdown
      const userBreakdown = {
        hasUser: tutorData.filter((t) => t.user).length,
        noUser: tutorData.filter((t) => !t.user).length,
      };
      console.log("👥 User breakdown:", userBreakdown);

      const normalized = Array.isArray(tutorData) ? tutorData : [];
      const filtered =
        statusFilter === "all"
          ? normalized.filter((t) => (t?.status || "") !== "draft")
          : normalized;
      setTutors(filtered);
    } catch (err) {
      console.error("❌ Error fetching tutors:", err);
      setError("Lỗi tải danh sách tutor.");
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchTutors();
  }, [fetchTutors]); // Re-fetch khi đổi tab

  const handleApprove = (tutor) => {
    setApproveModal({ open: true, tutor });
  };

  const confirmApprove = async () => {
    console.log("🔍 confirmApprove called");
    console.log("Tutor ID:", approveModal.tutor._id);
    console.log("Tutor data:", approveModal.tutor);

    setActionLoading(true);
    try {
      // Cập nhật status tutor thành approved
      console.log("📡 Calling updateTutorStatus API...");
      const result = await AdminService.updateTutorStatus(
        approveModal.tutor._id,
        "approved"
      );
      console.log("✅ API response:", result);
      console.log("✅ Updated tutor status:", result.data?.status);

      setSuccessMsg(
        "✅ Duyệt đơn gia sư thành công! Email thông báo đã được gửi."
      );
      setApproveModal({ open: false, tutor: null });

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMsg(""), 3000);

      console.log("🔄 Refreshing tutors list...");
      await fetchTutors();

      // Log current tutors after refresh
      console.log("📊 Tutors after refresh:", tutors);
    } catch (err) {
      console.error("❌ Error approving tutor:", err);
      console.error("❌ Error details:", err.response?.data);
      setError(`Lỗi duyệt tutor: ${err.message || "Unknown error"}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = (tutor) => {
    setRejectModal({ open: true, tutor });
    setRejectionReason("");
  };

  const confirmReject = async () => {
    if (!rejectionReason.trim()) {
      setError("Vui lòng nhập lý do từ chối");
      return;
    }

    setActionLoading(true);
    try {
      console.log("📡 Calling updateTutorStatus API (reject)...");
      const result = await AdminService.updateTutorStatus(
        rejectModal.tutor._id,
        "rejected",
        rejectionReason
      );
      console.log("✅ API response:", result);

      setSuccessMsg("❌ Đã từ chối đơn gia sư. Email thông báo đã được gửi.");
      setRejectModal({ open: false, tutor: null });
      setRejectionReason("");

      setTimeout(() => setSuccessMsg(""), 3000);
      await fetchTutors();
    } catch (err) {
      console.error("❌ Error rejecting tutor:", err);
      setError(`Lỗi từ chối đơn: ${err.message || "Unknown error"}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Khi click chi tiết, fetch đầy đủ tutor
  const handleShowDetail = async (tutor) => {
    setSelectedTutor(tutor); // show modal ngay để UX tốt
    try {
      const res = await AdminService.getTutorById(tutor._id);
      const fullTutorData = res.data || tutor;
      console.log("📋 Full tutor data:", fullTutorData);
      console.log("📄 Degree documents sources:", {
        verification_degreeDocuments:
          fullTutorData.verification?.degreeDocuments,
        degreeDocumentUrls: fullTutorData.degreeDocumentUrls,
      });
      console.log("🆔 ID documents sources:", {
        verification_idDocuments: fullTutorData.verification?.idDocuments,
        idDocumentUrls: fullTutorData.idDocumentUrls,
      });
      setSelectedTutor(fullTutorData);
    } catch (e) {
      console.error("Error fetching tutor details:", e);
      setSelectedTutor(tutor);
    }
  };

  const showConfirm = (title, message, onConfirm) => {
    setConfirmModal({
      open: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal({
          open: false,
          title: "",
          message: "",
          onConfirm: null,
        });
      },
    });
  };

  const showAlert = (message) => {
    setConfirmModal({
      open: true,
      title: "Thông báo",
      message,
      onConfirm: () =>
        setConfirmModal({
          open: false,
          title: "",
          message: "",
          onConfirm: null,
        }),
    });
  };

  // Helper function để chuẩn hóa URL ảnh
  const toUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    const baseUrl =
      process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";
    return `${baseUrl}/${url.replace(/^\/?/, "")}`;
  };

  return (
    <div className="admin-tutors-page">
      {/* Header Section */}
      <div className="admin-tutors-header">
        <div className="admin-tutors-header-content">
          <div className="admin-tutors-title-section">
            <h1 className="admin-tutors-title">Quản lý Gia sư</h1>
            <p className="admin-tutors-subtitle">
              Duyệt và quản lý các đơn đăng ký làm gia sư
            </p>
          </div>
          <div className="admin-tutors-stats">
            <div className="admin-stat-card">
              <div className="admin-stat-icon">👥</div>
              <div className="admin-stat-content">
                <span className="admin-stat-number">{tutors.length}</span>
                <span className="admin-stat-label">
                  {statusFilter === "all"
                    ? "Tổng cộng"
                    : statusFilter === "pending"
                    ? "Chờ duyệt"
                    : statusFilter === "approved"
                    ? "Đã duyệt"
                    : statusFilter === "rejected"
                    ? "Đã từ chối"
                    : statusFilter === "draft"
                    ? "Đơn nháp"
                    : "Không xác định"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="admin-tabs">
          <button
            className={`admin-tab ${statusFilter === "all" ? "active" : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            <span className="admin-tab-icon">📋</span>
            <span className="admin-tab-label">Tất Cả</span>
            {statusFilter === "all" && (
              <span className="admin-tab-count">{tutors.length}</span>
            )}
          </button>
          <button
            className={`admin-tab ${
              statusFilter === "pending" ? "active" : ""
            }`}
            onClick={() => setStatusFilter("pending")}
          >
            <span className="admin-tab-icon">⏳</span>
            <span className="admin-tab-label">Đơn Chờ Duyệt</span>
            {statusFilter === "pending" && (
              <span className="admin-tab-count">{tutors.length}</span>
            )}
          </button>
          <button
            className={`admin-tab ${
              statusFilter === "approved" ? "active" : ""
            }`}
            onClick={() => setStatusFilter("approved")}
          >
            <span className="admin-tab-icon">✅</span>
            <span className="admin-tab-label">Đơn Đã Duyệt</span>
            {statusFilter === "approved" && (
              <span className="admin-tab-count">{tutors.length}</span>
            )}
          </button>
          <button
            className={`admin-tab ${
              statusFilter === "rejected" ? "active" : ""
            }`}
            onClick={() => setStatusFilter("rejected")}
          >
            <span className="admin-tab-icon">❌</span>
            <span className="admin-tab-label">Đơn Đã Từ Chối</span>
            {statusFilter === "rejected" && (
              <span className="admin-tab-count">{tutors.length}</span>
            )}
          </button>
          <button
            className={`admin-tab ${statusFilter === "draft" ? "active" : ""}`}
            onClick={() => setStatusFilter("draft")}
          >
            <span className="admin-tab-icon">�</span>
            <span className="admin-tab-label">Đơn Nháp</span>
            {statusFilter === "draft" && (
              <span className="admin-tab-count">{tutors.length}</span>
            )}
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
                console.log("🧪 Testing API...");
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
                <th className="admin-table-th admin-table-th-actions">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="admin-table-tbody">
              {tutors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="admin-table-empty">
                    <div className="admin-empty-state">
                      <div className="admin-empty-icon">📋</div>
                      <h3 className="admin-empty-title">
                        {statusFilter === "all"
                          ? "Không có dữ liệu"
                          : statusFilter === "pending"
                          ? "Không có đơn chờ duyệt"
                          : statusFilter === "approved"
                          ? "Không có đơn đã duyệt"
                          : statusFilter === "rejected"
                          ? "Không có đơn đã từ chối"
                          : statusFilter === "draft"
                          ? "Không có đơn nháp"
                          : "Không có dữ liệu"}
                      </h3>
                      <p className="admin-empty-message">
                        {statusFilter === "all"
                          ? "Hệ thống chưa có đơn đăng ký gia sư nào"
                          : statusFilter === "pending"
                          ? "Tất cả đơn đăng ký đã được xử lý"
                          : statusFilter === "approved"
                          ? "Chưa có gia sư nào được duyệt"
                          : statusFilter === "rejected"
                          ? "Chưa có đơn nào bị từ chối"
                          : statusFilter === "draft"
                          ? "Không có đơn nháp nào"
                          : "Không có dữ liệu"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                tutors.map((tutor) => (
                  <tr key={tutor._id} className="admin-table-row">
                    <td className="admin-table-td">
                      <div className="admin-tutor-info">
                        <div className="admin-tutor-avatar">
                          <span>
                            {tutor.user?.full_name?.charAt(0) ||
                              tutor.full_name?.charAt(0) ||
                              "?"}
                          </span>
                        </div>
                        <div className="admin-tutor-details">
                          <span className="admin-tutor-name">
                            {tutor.user?.full_name || tutor.full_name}
                          </span>
                          <span className="admin-tutor-id">
                            ID: {tutor._id.slice(-8)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="admin-table-td">
                      <div className="admin-contact-info">
                        <div className="admin-contact-item">
                          <span className="admin-contact-icon">📧</span>
                          <span className="admin-contact-text">
                            {tutor.user?.email || tutor.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="admin-table-td">
                      {tutor.status === "approved" ? (
                        <span className="admin-status-badge admin-status-approved">
                          <span className="admin-status-icon">✅</span>
                          Đã duyệt
                        </span>
                      ) : tutor.status === "rejected" ? (
                        <span className="admin-status-badge admin-status-rejected">
                          <span className="admin-status-icon">❌</span>
                          Đã từ chối
                        </span>
                      ) : tutor.status === "draft" ? (
                        <span className="admin-status-badge admin-status-draft">
                          <span className="admin-status-icon">📝</span>
                          Đơn nháp
                        </span>
                      ) : tutor.status === "pending" ? (
                        <span className="admin-status-badge admin-status-pending">
                          <span className="admin-status-icon">⏳</span>
                          Chờ duyệt
                        </span>
                      ) : (
                        <span className="admin-status-badge admin-status-unknown">
                          <span className="admin-status-icon">❓</span>
                          {tutor.status || "Không xác định"}
                        </span>
                      )}
                    </td>
                    <td className="admin-table-td">
                      <span className="admin-date">
                        {tutor.createdAt
                          ? new Date(tutor.createdAt).toLocaleDateString(
                              "vi-VN"
                            )
                          : "N/A"}
                      </span>
                    </td>
                    <td className="admin-table-td admin-table-td-actions">
                      <div className="admin-action-buttons">
                        {/* Chỉ hiển thị button Duyệt khi status là 'pending' */}
                        {tutor.status === "pending" && (
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
                        {tutor.status === "pending" && (
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
                        {tutor.status === "approved" && (
                          <span className="admin-status-badge admin-status-approved">
                            <span className="admin-status-icon">✅</span>
                            Đã duyệt
                          </span>
                        )}

                        {tutor.status === "rejected" && (
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Modal duyệt tutor */}
      {approveModal.open && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button
              className="modal-close"
              onClick={() => setApproveModal({ open: false, tutor: null })}
            >
              &times;
            </button>
            <h3 className="modal-title">
              <span className="approve-icon" role="img" aria-label="approve">
                ✅
              </span>{" "}
              Duyệt Đơn Gia Sư
            </h3>
            <div className="modal-text">
              Bạn có chắc muốn duyệt <b>{approveModal.tutor.user?.full_name}</b>{" "}
              thành gia sư không?
              <br />
              <small
                style={{
                  color: "#6b7280",
                  marginTop: "10px",
                  display: "block",
                }}
              >
                ℹ️ Đơn sẽ được chuyển sang trạng thái "Đã duyệt" và user sẽ nhận
                email thông báo.
              </small>
            </div>
            <div className="modal-actions">
              <button
                className="admin-btn admin-btn-success"
                disabled={actionLoading}
                onClick={confirmApprove}
              >
                {actionLoading ? (
                  "Đang xử lý..."
                ) : (
                  <>
                    <span className="admin-btn-icon">✅</span> Xác nhận duyệt
                  </>
                )}
              </button>
              <button
                className="admin-btn admin-btn-secondary"
                onClick={() => setApproveModal({ open: false, tutor: null })}
              >
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
            <button
              className="modal-close"
              onClick={() => setRejectModal({ open: false, tutor: null })}
            >
              &times;
            </button>
            <h3 className="modal-title" style={{ color: "#ef4444" }}>
              <span className="reject-icon" role="img" aria-label="reject">
                ❌
              </span>{" "}
              Từ Chối Đơn Gia Sư
            </h3>
            <div className="modal-text">
              <p>
                Bạn có chắc muốn từ chối đơn của{" "}
                <b>{rejectModal.tutor.user?.full_name}</b>?
              </p>
              <div style={{ marginTop: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "600",
                    color: "#374151",
                  }}
                >
                  Lý do từ chối <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  className="admin-input"
                  rows="4"
                  placeholder="Nhập lý do từ chối (bắt buộc)..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                />
                <small
                  style={{
                    color: "#6b7280",
                    display: "block",
                    marginTop: "5px",
                  }}
                >
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
                {actionLoading ? (
                  "Đang xử lý..."
                ) : (
                  <>
                    <span className="admin-btn-icon">❌</span> Xác nhận từ chối
                  </>
                )}
              </button>
              <button
                className="admin-btn admin-btn-secondary"
                onClick={() => setRejectModal({ open: false, tutor: null })}
              >
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
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className="cv-avatar-placeholder"
                    style={{
                      display: selectedTutor.profileImage ? "none" : "flex",
                    }}
                  >
                    {(
                      selectedTutor.user?.full_name ||
                      selectedTutor.full_name ||
                      "?"
                    ).charAt(0)}
                  </div>
                </div>
                <div className="cv-status-badge">
                  {selectedTutor.status === "approved" ? (
                    <span className="cv-badge cv-badge-success">
                      <i className="fas fa-check-circle"></i> Đã duyệt
                    </span>
                  ) : selectedTutor.status === "rejected" ? (
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
                <h2 className="cv-name">
                  {selectedTutor.user?.full_name || selectedTutor.full_name}
                </h2>
                <p className="cv-title">Ứng viên Gia sư</p>
                <div className="cv-contact">
                  <div className="cv-contact-item">
                    <i className="fas fa-envelope"></i>
                    <span>
                      {selectedTutor.user?.email || selectedTutor.email}
                    </span>
                  </div>
                  <div className="cv-contact-item">
                    <i className="fas fa-phone"></i>
                    <span>
                      {selectedTutor.user?.phone_number ||
                        selectedTutor.phone_number ||
                        "Chưa cập nhật"}
                    </span>
                  </div>
                  <div className="cv-contact-item">
                    <i className="fas fa-map-marker-alt"></i>
                    <span>
                      {selectedTutor.city ||
                        selectedTutor.location ||
                        "Chưa cập nhật"}
                    </span>
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
                  {selectedTutor.description ||
                    selectedTutor.bio ||
                    "Ứng viên chưa cung cấp mô tả về bản thân"}
                </div>
              </div>

              {/* Experience & Education */}
              <div className="cv-two-columns">
                <div className="cv-column">
                  <div className="cv-section">
                    <h3 className="cv-section-title">
                      <i className="fas fa-graduation-cap"></i> Chuyên môn giảng
                      dạy
                    </h3>
                    <div className="cv-info-grid">
                      <div className="cv-info-item">
                        <div className="cv-info-label">Môn học</div>
                        <div className="cv-info-value">
                          {selectedTutor.subjects &&
                          selectedTutor.subjects.length > 0 ? (
                            <div className="cv-subjects">
                              {selectedTutor.subjects.map((subject, index) => (
                                <span key={index} className="cv-subject-tag">
                                  {typeof subject === "string"
                                    ? subject
                                    : subject.name || subject}
                                  {typeof subject === "object" &&
                                    subject.level && (
                                      <small> ({subject.level})</small>
                                    )}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted">Chưa cập nhật</span>
                          )}
                        </div>
                      </div>
                      <div className="cv-info-item">
                        <div className="cv-info-label">Kinh nghiệm</div>
                        <div className="cv-info-value cv-highlight">
                          {selectedTutor.experienceYears ||
                            selectedTutor.experience ||
                            0}{" "}
                          năm
                        </div>
                      </div>
                      <div className="cv-info-item">
                        <div className="cv-info-label">Mức phí</div>
                        <div className="cv-info-value cv-price">
                          {(
                            selectedTutor.sessionRate ||
                            selectedTutor.hourlyRate ||
                            selectedTutor.price ||
                            0
                          ).toLocaleString()}{" "}
                          VNĐ/buổi
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
                          {selectedTutor.createdAt
                            ? new Date(
                                selectedTutor.createdAt
                              ).toLocaleDateString("vi-VN")
                            : "N/A"}
                        </div>
                      </div>
                      <div className="cv-info-item">
                        <div className="cv-info-label">Khu vực</div>
                        <div className="cv-info-value">
                          {selectedTutor.city ||
                            selectedTutor.location ||
                            "Chưa cập nhật"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CCCD/CCCD - Highlighted Section */}
              {selectedTutor.verification?.idDocuments &&
                selectedTutor.verification.idDocuments.length > 0 && (
                  <div className="cv-section cv-documents-section">
                    <h3 className="cv-section-title">
                      <i className="fas fa-id-card"></i> Giấy tờ tùy thân
                      (CMND/CCCD)
                    </h3>
                    <div className="cv-documents-grid">
                      {selectedTutor.verification.idDocuments.map(
                        (doc, index) => (
                          <div key={index} className="cv-document-card">
                            <div className="cv-document-preview">
                              <img
                                src={toUrl(doc)}
                                alt={`CMND/CCCD ${index + 1}`}
                                onClick={() =>
                                  window.open(toUrl(doc), "_blank")
                                }
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  e.target.nextSibling.style.display = "flex";
                                }}
                              />
                              <div
                                className="cv-document-error"
                                style={{ display: "none" }}
                              >
                                <i className="fas fa-image"></i>
                                <span>Không thể tải ảnh</span>
                              </div>
                            </div>
                            <div className="cv-document-info">
                              <div className="cv-document-name">
                                <i className="fas fa-id-card"></i> CMND/CCCD{" "}
                                {index + 1}
                              </div>
                              <button
                                className="cv-document-view-btn"
                                onClick={() =>
                                  window.open(toUrl(doc), "_blank")
                                }
                              >
                                <i className="fas fa-expand"></i> Xem chi tiết
                              </button>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Bằng cấp - Highlighted Section */}
              {selectedTutor.verification?.degreeDocuments &&
                selectedTutor.verification.degreeDocuments.length > 0 && (
                  <div className="cv-section cv-documents-section">
                    <h3 className="cv-section-title">
                      <i className="fas fa-certificate"></i> Bằng cấp & Chứng
                      chỉ
                    </h3>
                    <div className="cv-documents-grid">
                      {selectedTutor.verification.degreeDocuments.map(
                        (doc, index) => (
                          <div key={index} className="cv-document-card">
                            <div className="cv-document-preview">
                              <img
                                src={toUrl(doc)}
                                alt={`Bằng cấp ${index + 1}`}
                                onClick={() =>
                                  window.open(toUrl(doc), "_blank")
                                }
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  e.target.nextSibling.style.display = "flex";
                                }}
                              />
                              <div
                                className="cv-document-error"
                                style={{ display: "none" }}
                              >
                                <i className="fas fa-image"></i>
                                <span>Không thể tải ảnh</span>
                              </div>
                            </div>
                            <div className="cv-document-info">
                              <div className="cv-document-name">
                                <i className="fas fa-certificate"></i> Bằng cấp{" "}
                                {index + 1}
                              </div>
                              <button
                                className="cv-document-view-btn"
                                onClick={() =>
                                  window.open(toUrl(doc), "_blank")
                                }
                              >
                                <i className="fas fa-expand"></i> Xem chi tiết
                              </button>
                            </div>
                          </div>
                        )
                      )}
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
                        if (selectedTutor.profileImage)
                          allImages.push({
                            url: toUrl(selectedTutor.profileImage),
                            name: "Ảnh đại diện",
                          });
                        if (selectedTutor.verification?.degreeDocuments) {
                          selectedTutor.verification.degreeDocuments.forEach(
                            (doc, i) => {
                              allImages.push({
                                url: toUrl(doc),
                                name: `Bằng cấp ${i + 1}`,
                              });
                            }
                          );
                        }
                        if (selectedTutor.verification?.idDocuments) {
                          selectedTutor.verification.idDocuments.forEach(
                            (doc, i) => {
                              allImages.push({
                                url: toUrl(doc),
                                name: `CMND ${i + 1}`,
                              });
                            }
                          );
                        }
                        if (selectedTutor.verification?.otherDocuments) {
                          selectedTutor.verification.otherDocuments.forEach(
                            (doc, i) => {
                              allImages.push({
                                url: toUrl(doc),
                                name: `Tài liệu ${i + 1}`,
                              });
                            }
                          );
                        }
                        if (selectedTutor.portfolio) {
                          selectedTutor.portfolio.forEach((item, i) => {
                            allImages.push({
                              url: toUrl(item.image || item),
                              name: item.title || `Portfolio ${i + 1}`,
                            });
                          });
                        }
                        if (selectedTutor.gallery) {
                          selectedTutor.gallery.forEach((image, i) => {
                            allImages.push({
                              url: toUrl(image),
                              name: `Ảnh ${i + 1}`,
                            });
                          });
                        }
                        if (selectedTutor.uploads) {
                          selectedTutor.uploads.forEach((upload, i) => {
                            allImages.push({
                              url: toUrl(upload.url || upload),
                              name:
                                upload.name ||
                                upload.filename ||
                                `Tệp ${i + 1}`,
                            });
                          });
                        }
                        if (selectedTutor.images) {
                          selectedTutor.images.forEach((image, i) => {
                            allImages.push({
                              url: toUrl(image),
                              name: `Ảnh ${i + 1}`,
                            });
                          });
                        }

                        console.log("🖼️ Tất cả ảnh:", allImages);
                        showAlert(
                          `Tổng cộng: ${allImages.length} ảnh. Xem console để xem danh sách đầy đủ.`
                        );
                      }}
                    >
                      <span className="admin-btn-icon">🖼️</span>
                      Xem tất cả ảnh
                    </button>

                    <button
                      className="admin-btn admin-btn-success admin-btn-sm"
                      onClick={() => {
                        showConfirm(
                          "Xác nhận duyệt",
                          "Bạn có chắc muốn tự động duyệt tất cả tài liệu của gia sư này?",
                          async () => {
                            try {
                              // Auto verify all documents
                              const verificationData = {
                                degreeStatus: "verified",
                                idStatus: "verified",
                                otherStatus: "verified",
                              };

                              await AdminService.updateTutorVerification(
                                selectedTutor._id,
                                verificationData
                              );
                              showAlert("✅ Đã tự động duyệt tất cả tài liệu!");
                              setSelectedTutor(null);
                              fetchTutors(); // Refresh list
                            } catch (error) {
                              console.error("Error auto-verifying:", error);
                              showAlert("❌ Lỗi khi duyệt tài liệu");
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
                        <h5 className="document-category-title">
                          🖼️ Ảnh đại diện
                        </h5>
                        <div className="document-list">
                          <div className="document-item">
                            <img
                              src={toUrl(selectedTutor.profileImage)}
                              alt="Ảnh đại diện"
                              className="document-thumbnail"
                              onClick={() =>
                                window.open(
                                  toUrl(selectedTutor.profileImage),
                                  "_blank"
                                )
                              }
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.nextSibling.textContent =
                                  "Không thể tải ảnh";
                              }}
                            />
                            <span className="document-name">Ảnh đại diện</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Bằng cấp */}
                    {selectedTutor.verification?.degreeDocuments &&
                      selectedTutor.verification.degreeDocuments.length > 0 && (
                        <div className="document-category">
                          <h5 className="document-category-title">
                            🎓 Bằng cấp (
                            {selectedTutor.verification.degreeDocuments.length})
                          </h5>
                          <div className="document-list">
                            {selectedTutor.verification.degreeDocuments.map(
                              (doc, index) => (
                                <div key={index} className="document-item">
                                  <img
                                    src={toUrl(doc)}
                                    alt={`Bằng cấp ${index + 1}`}
                                    className="document-thumbnail"
                                    onClick={() =>
                                      window.open(toUrl(doc), "_blank")
                                    }
                                    onError={(e) => {
                                      e.target.style.display = "none";
                                      e.target.nextSibling.textContent =
                                        "Không thể tải ảnh";
                                    }}
                                  />
                                  <span className="document-name">
                                    Bằng cấp {index + 1}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {/* CMND/CCCD */}
                    {selectedTutor.verification?.idDocuments &&
                      selectedTutor.verification.idDocuments.length > 0 && (
                        <div className="document-category">
                          <h5 className="document-category-title">
                            🆔 CMND/CCCD (
                            {selectedTutor.verification.idDocuments.length})
                          </h5>
                          <div className="document-list">
                            {selectedTutor.verification.idDocuments.map(
                              (doc, index) => (
                                <div key={index} className="document-item">
                                  <img
                                    src={toUrl(doc)}
                                    alt={`CMND ${index + 1}`}
                                    className="document-thumbnail"
                                    onClick={() =>
                                      window.open(toUrl(doc), "_blank")
                                    }
                                    onError={(e) => {
                                      e.target.style.display = "none";
                                      e.target.nextSibling.textContent =
                                        "Không thể tải ảnh";
                                    }}
                                  />
                                  <span className="document-name">
                                    CMND {index + 1}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {/* Ảnh khác từ verification */}
                    {selectedTutor.verification?.otherDocuments &&
                      selectedTutor.verification.otherDocuments.length > 0 && (
                        <div className="document-category">
                          <h5 className="document-category-title">
                            📷 Tài liệu khác (
                            {selectedTutor.verification.otherDocuments.length})
                          </h5>
                          <div className="document-list">
                            {selectedTutor.verification.otherDocuments.map(
                              (doc, index) => (
                                <div key={index} className="document-item">
                                  <img
                                    src={toUrl(doc)}
                                    alt={`Tài liệu ${index + 1}`}
                                    className="document-thumbnail"
                                    onClick={() =>
                                      window.open(toUrl(doc), "_blank")
                                    }
                                    onError={(e) => {
                                      e.target.style.display = "none";
                                      e.target.nextSibling.textContent =
                                        "Không thể tải ảnh";
                                    }}
                                  />
                                  <span className="document-name">
                                    Tài liệu {index + 1}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {/* Ảnh từ portfolio */}
                    {selectedTutor.portfolio &&
                      selectedTutor.portfolio.length > 0 && (
                        <div className="document-category">
                          <h5 className="document-category-title">
                            🎨 Portfolio ({selectedTutor.portfolio.length})
                          </h5>
                          <div className="document-list">
                            {selectedTutor.portfolio.map((item, index) => (
                              <div key={index} className="document-item">
                                <img
                                  src={toUrl(item.image || item)}
                                  alt={`Portfolio ${index + 1}`}
                                  className="document-thumbnail"
                                  onClick={() =>
                                    window.open(
                                      toUrl(item.image || item),
                                      "_blank"
                                    )
                                  }
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextSibling.textContent =
                                      "Không thể tải ảnh";
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
                    {selectedTutor.gallery &&
                      selectedTutor.gallery.length > 0 && (
                        <div className="document-category">
                          <h5 className="document-category-title">
                            🖼️ Thư viện ảnh ({selectedTutor.gallery.length})
                          </h5>
                          <div className="document-list">
                            {selectedTutor.gallery.map((image, index) => (
                              <div key={index} className="document-item">
                                <img
                                  src={toUrl(image)}
                                  alt={`Ảnh ${index + 1}`}
                                  className="document-thumbnail"
                                  onClick={() =>
                                    window.open(toUrl(image), "_blank")
                                  }
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextSibling.textContent =
                                      "Không thể tải ảnh";
                                  }}
                                />
                                <span className="document-name">
                                  Ảnh {index + 1}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Tất cả ảnh từ uploads */}
                    {selectedTutor.uploads &&
                      selectedTutor.uploads.length > 0 && (
                        <div className="document-category">
                          <h5 className="document-category-title">
                            📁 Tệp đã tải lên ({selectedTutor.uploads.length})
                          </h5>
                          <div className="document-list">
                            {selectedTutor.uploads.map((upload, index) => (
                              <div key={index} className="document-item">
                                <img
                                  src={toUrl(upload.url || upload)}
                                  alt={`Tệp ${index + 1}`}
                                  className="document-thumbnail"
                                  onClick={() =>
                                    window.open(
                                      toUrl(upload.url || upload),
                                      "_blank"
                                    )
                                  }
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextSibling.textContent =
                                      "Không thể tải ảnh";
                                  }}
                                />
                                <span className="document-name">
                                  {upload.name ||
                                    upload.filename ||
                                    `Tệp ${index + 1}`}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Debug: Hiển thị tất cả ảnh có thể có */}
                    {selectedTutor.images &&
                      selectedTutor.images.length > 0 && (
                        <div className="document-category">
                          <h5 className="document-category-title">
                            🖼️ Ảnh khác ({selectedTutor.images.length})
                          </h5>
                          <div className="document-list">
                            {selectedTutor.images.map((image, index) => (
                              <div key={index} className="document-item">
                                <img
                                  src={toUrl(image)}
                                  alt={`Ảnh ${index + 1}`}
                                  className="document-thumbnail"
                                  onClick={() =>
                                    window.open(toUrl(image), "_blank")
                                  }
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextSibling.textContent =
                                      "Không thể tải ảnh";
                                  }}
                                />
                                <span className="document-name">
                                  Ảnh {index + 1}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Nếu không có tài liệu */}
                    {!selectedTutor.verification?.degreeDocuments?.length &&
                      !selectedTutor.verification?.idDocuments?.length &&
                      !selectedTutor.verification?.otherDocuments?.length &&
                      !selectedTutor.portfolio?.length &&
                      !selectedTutor.gallery?.length &&
                      !selectedTutor.uploads?.length &&
                      !selectedTutor.images?.length &&
                      !selectedTutor.profileImage && (
                        <div className="no-documents">
                          <span className="no-documents-icon">📄</span>
                          <span className="no-documents-text">
                            Chưa có tài liệu đính kèm
                          </span>
                        </div>
                      )}
                  </div>
                </div>
              )}

              {/* Thông tin xác thực - UI mới với preview ảnh rõ ràng */}
              <div className="detail-section verification-section-enhanced">
                <h4 className="detail-section-title verification-title">
                  <span className="verification-title-icon">✅</span>
                  Trạng thái xác thực
                </h4>

                {/* Xác thực Bằng cấp */}
                <div className="verification-card">
                  <div className="verification-card-header">
                    <div className="verification-header-left">
                      <h5 className="verification-card-title">
                        <span className="verification-icon">🎓</span>
                        Bằng cấp
                      </h5>
                      <></>
                    </div>
                  </div>

                  {/* Hiển thị ảnh bằng cấp */}
                  {(() => {
                    // Lấy ảnh từ nhiều nguồn: verification.degreeDocuments hoặc degreeDocumentUrls
                    const degreeDocs =
                      selectedTutor.verification?.degreeDocuments ||
                      selectedTutor.degreeDocumentUrls ||
                      [];
                    return degreeDocs.length > 0 ? (
                      <div className="verification-documents-section">
                        <div className="verification-documents-header">
                          <p className="document-count-text">
                            📄 Có {degreeDocs.length} tài liệu bằng cấp
                          </p>
                          <p className="verification-hint">
                            ⚠️ Vui lòng xem ảnh trước khi duyệt
                          </p>
                        </div>
                        <div className="verification-documents-grid">
                          {degreeDocs.map((cert, index) => (
                            <div
                              key={index}
                              className="verification-document-item"
                            >
                              <div className="verification-document-preview">
                                <img
                                  src={toUrl(cert)}
                                  alt={`Bằng cấp ${index + 1}`}
                                  className="verification-document-thumbnail"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextSibling.style.display = "flex";
                                  }}
                                />
                                <div
                                  className="verification-document-error"
                                  style={{ display: "none" }}
                                >
                                  <span>❌ Không thể tải ảnh</span>
                                </div>
                                <div className="verification-document-overlay">
                                  <button
                                    className="verification-view-btn"
                                    onClick={() => {
                                      setImagePreview({
                                        open: true,
                                        imageUrl: toUrl(cert),
                                        title: `Bằng cấp ${index + 1}`,
                                      });
                                    }}
                                  >
                                    <span className="view-btn-icon">👁️</span>
                                    Xem ảnh
                                  </button>
                                </div>
                              </div>
                              <p className="verification-document-label">
                                Bằng cấp {index + 1}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="no-document-notice">
                        <span className="no-document-icon">📋</span>
                        <p>Chưa có tài liệu bằng cấp</p>
                      </div>
                    );
                  })()}

                  {/* Buttons xác thực - chỉ hiển thị khi có tài liệu và chưa xác thực */}
                  {(() => {
                    const degreeDocs =
                      selectedTutor.verification?.degreeDocuments ||
                      selectedTutor.degreeDocumentUrls ||
                      [];
                    return (
                      false &&
                      degreeDocs.length > 0 &&
                      selectedTutor.verification?.degreeStatus !== "verified" &&
                      selectedTutor.verification?.degreeStatus !==
                        "rejected" && (
                        <div className="verification-actions">
                          <button
                            className="admin-btn admin-btn-success admin-btn-sm"
                            onClick={() => {
                              showConfirm(
                                "Xác nhận duyệt bằng cấp",
                                "Bạn có chắc muốn duyệt tài liệu bằng cấp của gia sư này?",
                                async () => {
                                  try {
                                    await AdminService.updateTutorVerification(
                                      selectedTutor._id,
                                      { degreeStatus: "verified" }
                                    );
                                    showAlert("✅ Đã duyệt bằng cấp!");
                                    await fetchTutors();
                                    // Refresh selected tutor data
                                    try {
                                      const res =
                                        await AdminService.getTutorById(
                                          selectedTutor._id
                                        );
                                      setSelectedTutor(
                                        res.data || selectedTutor
                                      );
                                    } catch (e) {
                                      console.error(
                                        "Error refreshing tutor:",
                                        e
                                      );
                                    }
                                  } catch (error) {
                                    showAlert("❌ Lỗi khi duyệt bằng cấp");
                                  }
                                }
                              );
                            }}
                          >
                            <span className="admin-btn-icon">✅</span>
                            Duyệt
                          </button>
                          <button
                            className="admin-btn admin-btn-danger admin-btn-sm"
                            onClick={() => {
                              showConfirm(
                                "Xác nhận từ chối bằng cấp",
                                "Bạn có chắc muốn từ chối tài liệu bằng cấp của gia sư này?",
                                async () => {
                                  try {
                                    await AdminService.updateTutorVerification(
                                      selectedTutor._id,
                                      { degreeStatus: "rejected" }
                                    );
                                    showAlert("❌ Đã từ chối bằng cấp!");
                                    await fetchTutors();
                                    // Refresh selected tutor data
                                    try {
                                      const res =
                                        await AdminService.getTutorById(
                                          selectedTutor._id
                                        );
                                      setSelectedTutor(
                                        res.data || selectedTutor
                                      );
                                    } catch (e) {
                                      console.error(
                                        "Error refreshing tutor:",
                                        e
                                      );
                                    }
                                  } catch (error) {
                                    showAlert("❌ Lỗi khi từ chối bằng cấp");
                                  }
                                }
                              );
                            }}
                          >
                            <span className="admin-btn-icon">❌</span>
                            Từ chối
                          </button>
                        </div>
                      )
                    );
                  })()}
                </div>

                {/* Xác thực CMND/CCCD */}
                <div className="verification-card">
                  <div className="verification-card-header">
                    <div className="verification-header-left">
                      <h5 className="verification-card-title">
                        <span className="verification-icon">🆔</span>
                        CMND/CCCD
                      </h5>
                      <></>
                    </div>
                  </div>

                  {/* Hiển thị ảnh CMND/CCCD */}
                  {(() => {
                    // Lấy ảnh từ nhiều nguồn: verification.idDocuments hoặc idDocumentUrls
                    const idDocs =
                      selectedTutor.verification?.idDocuments ||
                      selectedTutor.idDocumentUrls ||
                      [];
                    return idDocs.length > 0 ? (
                      <div className="verification-documents-section">
                        <div className="verification-documents-header">
                          <p className="document-count-text">
                            📄 Có {idDocs.length} tài liệu CMND/CCCD
                          </p>
                          <p className="verification-hint">
                            ⚠️ Vui lòng xem ảnh trước khi duyệt
                          </p>
                        </div>
                        <div className="verification-documents-grid">
                          {idDocs.map((idImg, index) => (
                            <div
                              key={index}
                              className="verification-document-item"
                            >
                              <div className="verification-document-preview">
                                <img
                                  src={toUrl(idImg)}
                                  alt={`CMND/CCCD ${index + 1}`}
                                  className="verification-document-thumbnail"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextSibling.style.display = "flex";
                                  }}
                                />
                                <div
                                  className="verification-document-error"
                                  style={{ display: "none" }}
                                >
                                  <span>❌ Không thể tải ảnh</span>
                                </div>
                                <div className="verification-document-overlay">
                                  <button
                                    className="verification-view-btn"
                                    onClick={() => {
                                      setImagePreview({
                                        open: true,
                                        imageUrl: toUrl(idImg),
                                        title: `CMND/CCCD ${index + 1}`,
                                      });
                                    }}
                                  >
                                    <span className="view-btn-icon">👁️</span>
                                    Xem ảnh
                                  </button>
                                </div>
                              </div>
                              <p className="verification-document-label">
                                CMND/CCCD {index + 1}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="no-document-notice">
                        <span className="no-document-icon">📋</span>
                        <p>Chưa có tài liệu CMND/CCCD</p>
                      </div>
                    );
                  })()}

                  {/* Buttons xác thực - chỉ hiển thị khi có tài liệu và chưa xác thực */}
                  {(() => {
                    const idDocs =
                      selectedTutor.verification?.idDocuments ||
                      selectedTutor.idDocumentUrls ||
                      [];
                    return (
                      false &&
                      idDocs.length > 0 &&
                      selectedTutor.verification?.idStatus !== "verified" &&
                      selectedTutor.verification?.idStatus !== "rejected" && (
                        <div className="verification-actions">
                          <button
                            className="admin-btn admin-btn-success admin-btn-sm"
                            onClick={() => {
                              showConfirm(
                                "Xác nhận duyệt CMND/CCCD",
                                "Bạn có chắc muốn duyệt tài liệu CMND/CCCD của gia sư này?",
                                async () => {
                                  try {
                                    await AdminService.updateTutorVerification(
                                      selectedTutor._id,
                                      { idStatus: "verified" }
                                    );
                                    showAlert("✅ Đã duyệt CMND/CCCD!");
                                    await fetchTutors();
                                    // Refresh selected tutor data
                                    try {
                                      const res =
                                        await AdminService.getTutorById(
                                          selectedTutor._id
                                        );
                                      setSelectedTutor(
                                        res.data || selectedTutor
                                      );
                                    } catch (e) {
                                      console.error(
                                        "Error refreshing tutor:",
                                        e
                                      );
                                    }
                                  } catch (error) {
                                    showAlert("❌ Lỗi khi duyệt CMND/CCCD");
                                  }
                                }
                              );
                            }}
                          >
                            <span className="admin-btn-icon">✅</span>
                            Duyệt
                          </button>
                          <button
                            className="admin-btn admin-btn-danger admin-btn-sm"
                            onClick={() => {
                              showConfirm(
                                "Xác nhận từ chối CMND/CCCD",
                                "Bạn có chắc muốn từ chối tài liệu CMND/CCCD của gia sư này?",
                                async () => {
                                  try {
                                    await AdminService.updateTutorVerification(
                                      selectedTutor._id,
                                      { idStatus: "rejected" }
                                    );
                                    showAlert("❌ Đã từ chối CMND/CCCD!");
                                    await fetchTutors();
                                    // Refresh selected tutor data
                                    try {
                                      const res =
                                        await AdminService.getTutorById(
                                          selectedTutor._id
                                        );
                                      setSelectedTutor(
                                        res.data || selectedTutor
                                      );
                                    } catch (e) {
                                      console.error(
                                        "Error refreshing tutor:",
                                        e
                                      );
                                    }
                                  } catch (error) {
                                    showAlert("❌ Lỗi khi từ chối CMND/CCCD");
                                  }
                                }
                              );
                            }}
                          >
                            <span className="admin-btn-icon">❌</span>
                            Từ chối
                          </button>
                        </div>
                      )
                    );
                  })()}
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

      {/* Image Preview Modal */}
      {imagePreview.open && (
        <div
          className="modal-overlay image-preview-overlay"
          onClick={() =>
            setImagePreview({ open: false, imageUrl: null, title: "" })
          }
        >
          <div
            className="image-preview-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="image-preview-close"
              onClick={() =>
                setImagePreview({ open: false, imageUrl: null, title: "" })
              }
            >
              &times;
            </button>
            <h3 className="image-preview-title">{imagePreview.title}</h3>
            <div className="image-preview-container">
              <img
                src={imagePreview.imageUrl}
                alt={imagePreview.title}
                className="image-preview-img"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
              <div className="image-preview-error" style={{ display: "none" }}>
                <span>❌ Không thể tải ảnh</span>
              </div>
            </div>
            <div className="image-preview-actions">
              <button
                className="admin-btn admin-btn-secondary"
                onClick={() => window.open(imagePreview.imageUrl, "_blank")}
              >
                <span className="admin-btn-icon">🔗</span>
                Mở trong tab mới
              </button>
              <button
                className="admin-btn admin-btn-primary"
                onClick={() =>
                  setImagePreview({ open: false, imageUrl: null, title: "" })
                }
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
                onClick={() =>
                  setConfirmModal({
                    open: false,
                    title: "",
                    message: "",
                    onConfirm: null,
                  })
                }
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
