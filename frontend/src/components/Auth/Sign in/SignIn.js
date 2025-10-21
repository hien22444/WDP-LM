"use client";

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { FaGoogle, FaFacebook } from "react-icons/fa";
import { doLogin, doFacebookLogin } from "../../../redux/actions/authActions";
import "./SignIn.scss";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  const loading = useSelector((state) => state.user.loading);

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  // Validate form
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email) && password.length >= 8;
    setIsFormValid(isValid);
  }, [email, password]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid) {
      return;
    }

    const result = await dispatch(doLogin(email, password));

    if (result.success) {
      navigate("/");
    }
  };

  const handleGoogleLogin = () => {
    const backendOrigin = (
      process.env.REACT_APP_API_URL || "http://localhost:5000/api/v1"
    ).replace(/\/api\/v1$/, "");
    const googleAuthUrl = `${backendOrigin}/google/start`;

    // Calculate center position
    const width = 600;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    // Open popup window centered
    const popup = window.open(
      googleAuthUrl,
      "google-login",
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no`
    );

    // Listen for popup to close or receive message
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        // Check if user is logged in after popup closes
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    }, 1000);
  };

  const handleFacebookLogin = () => {
    dispatch(doFacebookLogin());
  };

  return (
    <div className="signin-container">
      <div className="signin-content">
        <div className="signin-form-section">
          <div className="form-wrapper">
            <div className="form-header">
              <h1 className="form-title">Chào mừng bạn trở lại 👋</h1>
              <p className="form-subtitle">
                Đăng nhập để tiếp tục học và kết nối với gia sư phù hợp.
              </p>
            </div>

            <form className="signin-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="form-input"
                  placeholder="email@ví dụ.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  id="password"
                  className="form-input"
                  placeholder="Tối thiểu 8 ký tự"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="forgot-password">
                <Link to="/forgot-password" className="forgot-link">
                  Quên mật khẩu?
                </Link>
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
                  "Đăng nhập"
                )}
              </button>

              <div className="divider">
                <span>Hoặc</span>
              </div>

              <div className="oauth-buttons">
                <button
                  type="button"
                  className="oauth-btn google-btn"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  <FaGoogle className="oauth-icon" />
                  Đăng nhập với Google
                </button>

                <button
                  type="button"
                  className="oauth-btn facebook-btn"
                  onClick={handleFacebookLogin}
                  disabled={loading}
                >
                  <FaFacebook className="oauth-icon" />
                  Đăng nhập với Facebook
                </button>
              </div>

              <div className="signup-link">
                Chưa có tài khoản?{" "}
                <Link to="/signup" className="link">
                  Đăng ký
                </Link>
              </div>
            </form>

            {/* Updated footer text */}
            <div className="footer-text">© 2025 ALL RIGHTS RESERVED</div>
          </div>
        </div>

        <div className="signin-image-section">
          <img
            src="/giaoduc.jpg"
            alt="Beautiful floral arrangement"
            className="signin-image"
          />
        </div>
      </div>
    </div>
  );
};

export default SignIn;
