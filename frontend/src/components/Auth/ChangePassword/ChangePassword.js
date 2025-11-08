
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { changePasswordApi } from "../../../services/ApiService";
import "./ChangePassword.scss";

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Validate form
  useEffect(() => {
    const isCurrentPasswordValid = currentPassword.length >= 1;
    const isNewPasswordValid = newPassword.length >= 6;
    const doPasswordsMatch =
      newPassword === confirmPassword && confirmPassword !== "";
    const isDifferentPassword = currentPassword !== newPassword;
    
    setIsFormValid(
      isCurrentPasswordValid && 
      isNewPasswordValid && 
      doPasswordsMatch && 
      isDifferentPassword
    );
  }, [currentPassword, newPassword, confirmPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid) {
      toast.error("Vui lòng kiểm tra các yêu cầu mật khẩu");
      return;
    }

    setLoading(true);

    try {
      const response = await changePasswordApi(currentPassword, newPassword);
      toast.success(response.message || "Đổi mật khẩu thành công!");

      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Redirect to profile after delay
      setTimeout(() => {
        navigate("/profile");
      }, 2000);
    } catch (error) {
      toast.error(
        error.message || "Đổi mật khẩu thất bại. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-container">
      <div className="change-password-card">
        <div className="brand-logo">
          <span className="brand-name">Learnova</span>
        </div>

        <div className="card-content">
          <h1 className="card-title">Đổi Mật Khẩu</h1>
          <p className="card-subtitle">Nhập mật khẩu hiện tại và mật khẩu mới của bạn</p>

          <form onSubmit={handleSubmit} className="change-form">
            <div className="form-group">
              <label htmlFor="currentPassword" className="form-label">
                Mật Khẩu Hiện Tại
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  id="currentPassword"
                  className="form-input"
                  placeholder="Nhập mật khẩu hiện tại"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  tabIndex={-1}
                >
                  {showCurrentPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
              {currentPassword && currentPassword.length < 1 && (
                <span className="error-text">
                  Vui lòng nhập mật khẩu hiện tại
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="newPassword" className="form-label">
                Mật Khẩu Mới
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showNewPassword ? "text" : "password"}
                  id="newPassword"
                  className="form-input"
                  placeholder="Nhập mật khẩu mới"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  tabIndex={-1}
                >
                  {showNewPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
              {newPassword && newPassword.length < 6 && (
                <span className="error-text">
                  Mật khẩu mới phải có ít nhất 6 ký tự
                </span>
              )}
              {currentPassword && newPassword && currentPassword === newPassword && (
                <span className="error-text">
                  Mật khẩu mới phải khác mật khẩu hiện tại
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Xác Nhận Mật Khẩu Mới
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  className="form-input"
                  placeholder="Xác nhận mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <FiEyeOff size={20} />
                  ) : (
                    <FiEye size={20} />
                  )}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <span className="error-text">Mật khẩu xác nhận không khớp</span>
              )}
            </div>

            <button
              type="submit"
              className={`submit-btn ${
                !isFormValid || loading ? "disabled" : ""
              }`}
              disabled={!isFormValid || loading}
            >
              {loading ? (
                <span className="loading-spinner"></span>
              ) : (
                "Đổi Mật Khẩu"
              )}
            </button>
          </form>

          <div className="back-link">
            <button 
              onClick={() => navigate("/profile")} 
              className="link-button"
            >
              ← Quay lại hồ sơ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;