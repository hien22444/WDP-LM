"use client";

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { FaGoogle, FaFacebook } from "react-icons/fa";
import {
  doLogin,
  doGoogleLogin,
  doFacebookLogin,
} from "../../../redux/actions/authActions";
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
    // Ensure Google script loaded (Identity Services). If not, inject.
    if (!window.google || !window.google.accounts) {
      const scriptId = 'google-oauth';
      if (!document.getElementById(scriptId)) {
        const s = document.createElement('script');
        s.src = 'https://accounts.google.com/gsi/client';
        s.async = true;
        s.defer = true;
        s.id = scriptId;
        s.onload = () => dispatch(doGoogleLogin());
        document.head.appendChild(s);
      } else {
        document.getElementById(scriptId).addEventListener('load', () => dispatch(doGoogleLogin()), { once: true });
      }
    } else {
      dispatch(doGoogleLogin());
    }
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
