"use client";

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { resetPasswordApi } from "../../../services/ApiService";
import "./ResetPassword.scss";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    if (!tokenFromUrl) {
      toast.error("Invalid reset link");
      navigate("/signin");
    } else {
      setToken(tokenFromUrl);
    }
  }, [searchParams, navigate]);

  // Validate form
  useEffect(() => {
    const isPasswordValid = password.length >= 6;
    const doPasswordsMatch =
      password === confirmPassword && confirmPassword !== "";
    setIsFormValid(isPasswordValid && doPasswordsMatch);
  }, [password, confirmPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid) {
      toast.error("Please check your password requirements");
      return;
    }

    setLoading(true);

    try {
      const response = await resetPasswordApi(token, password);
      toast.success(response.message || "Password reset successfully!");

      // Clear form
      setPassword("");
      setConfirmPassword("");

      // Redirect to sign in
      setTimeout(() => {
        navigate("/signin");
      }, 2000);
    } catch (error) {
      toast.error(
        error.message || "Failed to reset password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        <div className="brand-logo">
          <span className="brand-name">Learnmate</span>
        </div>

        <div className="card-content">
          <h1 className="card-title">Reset Password</h1>
          <p className="card-subtitle">Enter your new password below</p>

          <form onSubmit={handleSubmit} className="reset-form">
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                New Password
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  className="form-input"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
              {password && password.length < 6 && (
                <span className="error-text">
                  Password must be at least 6 characters
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  className="form-input"
                  placeholder="Confirm new password"
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
              {confirmPassword && password !== confirmPassword && (
                <span className="error-text">Passwords do not match</span>
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
                "Reset Password"
              )}
            </button>
          </form>

          <div className="signin-link">
            Remember your password?{" "}
            <Link to="/signin" className="link">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
