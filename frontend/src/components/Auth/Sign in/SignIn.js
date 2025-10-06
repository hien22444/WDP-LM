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
  const role = useSelector((state) => state.user.user?.account?.role);

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (role === "admin") return navigate("/admin");
      return navigate("/");
    }
  }, [isAuthenticated, role, navigate]);

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
      if (role === "admin") return navigate("/admin");
      navigate("/");
    }
  };

  const handleGoogleLogin = () => {
    const backendOrigin = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1').replace(/\/api\/v1$/, '');
    window.location.href = backendOrigin + '/google/start';
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
              <h1 className="form-title">Welcome Back 👋</h1>
              <p className="form-subtitle">
                <br />
                Sign in to start.
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
                  placeholder="Example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  className="form-input"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="forgot-password">
                <Link to="/forgot-password" className="forgot-link">
                  Forgot Password?
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
                  "Sign in"
                )}
              </button>

              <div className="divider">
                <span>Or</span>
              </div>

              <div className="oauth-buttons">
                <button
                  type="button"
                  className="oauth-btn google-btn"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  <FaGoogle className="oauth-icon" />
                  Sign in with Google
                </button>

                <button
                  type="button"
                  className="oauth-btn facebook-btn"
                  onClick={handleFacebookLogin}
                  disabled={loading}
                >
                  <FaFacebook className="oauth-icon" />
                  Sign in with Facebook
                </button>
              </div>

              <div className="signup-link">
                Don't you have an account?{" "}
                <Link to="/signup" className="link">
                  Sign up
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
