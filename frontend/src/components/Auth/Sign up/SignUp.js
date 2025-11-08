
import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { FaGoogle, FaFacebook } from "react-icons/fa";
import {
  doRegister,
  doFacebookLogin,
} from "../../../redux/actions/authActions";
import "./SignUp.scss";

const SignUp = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);
  const passwordRules = useMemo(() => {
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const hasMinLen = password.length >= 8;
    const passed = [
      hasMinLen,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
    ].filter(Boolean).length;
    const strength =
      passed >= 5
        ? "strong"
        : passed >= 3
        ? "medium"
        : password.length > 0
        ? "weak"
        : "none";
    return { hasUpper, hasLower, hasNumber, hasSpecial, hasMinLen, strength };
  }, [password]);

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
      // Redirect to OTP page instead of verify-account
      navigate("/otp", {
        state: { email, justRegistered: true },
      });
    }
  };

  const handleGoogleSignup = () => {
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
      "google-signup",
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

  const handleFacebookSignup = () => {
    dispatch(doFacebookLogin());
  };

  return (
    <div className="signup-container">
      <div className="signup-content">
        <div className="signup-form-section">
          <div className="form-wrapper">
            <div className="form-header">
              <h1 className="form-title">Tạo tài khoản</h1>
            </div>

            <form className="signup-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName" className="form-label">
                    Tên
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    className="form-input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={loading}
                    placeholder="Nguyễn"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lastName" className="form-label">
                    Họ
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    className="form-input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={loading}
                    placeholder="Văn A"
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
                  placeholder="email@ví dụ.com"
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder="Tối thiểu 8 ký tự"
                />
                <div className="password-hints">
                  <div className={`strength ${passwordRules.strength}`}>
                    <span className="bar"></span>
                    <span className="bar"></span>
                    <span className="bar"></span>
                    <span className="label">
                      {passwordRules.strength === "strong"
                        ? "Mạnh"
                        : passwordRules.strength === "medium"
                        ? "Trung bình"
                        : passwordRules.strength === "weak"
                        ? "Yếu"
                        : ""}
                    </span>
                  </div>
                  <ul className="rules">
                    <li className={passwordRules.hasMinLen ? "ok" : ""}>
                      Tối thiểu 8 ký tự
                    </li>
                    <li className={passwordRules.hasUpper ? "ok" : ""}>
                      Có chữ hoa (A-Z)
                    </li>
                    <li className={passwordRules.hasLower ? "ok" : ""}>
                      Có chữ thường (a-z)
                    </li>
                    <li className={passwordRules.hasNumber ? "ok" : ""}>
                      Có số (0-9)
                    </li>
                    <li className={passwordRules.hasSpecial ? "ok" : ""}>
                      Có ký tự đặc biệt (!@#$...)
                    </li>
                  </ul>
                </div>
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
                  "Tạo tài khoản"
                )}
              </button>

              <div className="signin-link">
                Đã có tài khoản?{" "}
                <Link to="/signin" className="link">
                  Đăng nhập
                </Link>
              </div>

              {/* Optional social signups retained but can be hidden until implemented */}
              <div className="divider">
                <span>hoặc</span>
              </div>
              <div className="oauth-buttons">
                <button
                  type="button"
                  className="oauth-btn google-btn"
                  onClick={handleGoogleSignup}
                  disabled={loading}
                >
                  <FaGoogle className="oauth-icon" /> Đăng ký với Google
                </button>
                <button
                  type="button"
                  className="oauth-btn facebook-btn"
                  onClick={handleFacebookSignup}
                  disabled={loading}
                >
                  <FaFacebook className="oauth-icon" /> Đăng ký với Facebook
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="signup-image-section">
          <img
            src="https://res.cloudinary.com/dnyvwjbbm/image/upload/v1762520025/Hinh-7.-Vai-tro-giao-duc-1024x580_iqhgbt.jpg"
            alt="Beautiful floral artwork"
            className="signup-image"
          />
        </div>
      </div>
    </div>
  );
};

export default SignUp;
