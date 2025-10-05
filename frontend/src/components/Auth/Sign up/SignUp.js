"use client";

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { FaGoogle, FaFacebook } from "react-icons/fa";
import { doRegister, doFacebookLogin } from "../../../redux/actions/authActions";
import "./SignUp.scss";

const SignUp = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
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
    const isValid =
      firstName.trim().length > 0 &&
      lastName.trim().length > 0 &&
      emailRegex.test(email) &&
      password.length >= 8;
    setIsFormValid(isValid);
  }, [firstName, lastName, email, password]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid) {
      return;
    }

    const result = await dispatch(
      doRegister(firstName, lastName, email, password)
    );

    if (result.success) {
      navigate("/verify-account", { state: { email, justRegistered: true, pending: true } });
    }
  };

  const handleGoogleSignup = () => {
    const backendOrigin = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1').replace(/\/api\/v1$/, '');
    window.location.href = backendOrigin + '/google/start';
  };

  const handleFacebookSignup = () => {
    dispatch(doFacebookLogin());
  };

  return (
    <div className="signup-container">
      <div className="signup-content">
        <div className="signup-form-section">
          <div className="form-wrapper">
            <div className="form-header">
              <h1 className="form-title">Create Account</h1>
            </div>

            <form className="signup-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName" className="form-label">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    className="form-input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lastName" className="form-label">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    className="form-input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="form-input"
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
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
                  "Create Account"
                )}
              </button>

              <div className="signin-link">
                Already have an account?{" "}
                <Link to="/signin" className="link">
                  Login
                </Link>
              </div>

              {/* Optional social signups retained but can be hidden until implemented */}
              <div className="divider"><span>or</span></div>
              <div className="oauth-buttons">
                <button type="button" className="oauth-btn google-btn" onClick={handleGoogleSignup} disabled={loading}>
                  <FaGoogle className="oauth-icon" /> Sign up with Google
                </button>
                <button type="button" className="oauth-btn facebook-btn" onClick={handleFacebookSignup} disabled={loading}>
                  <FaFacebook className="oauth-icon" /> Sign up with Facebook
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="signup-image-section">
          <img
            src="/giaoduc2.jpg"
            alt="Beautiful floral artwork"
            className="signup-image"
          />
        </div>
      </div>
    </div>
  );
};

export default SignUp;
