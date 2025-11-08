
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { forgotPasswordApi } from "../../../services/ApiService";
import "./ForgotPassword.scss";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Validate email
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsFormValid(emailRegex.test(email));
  }, [email]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid) {
      toast.error("Please enter a valid email address");
      return;
    }
    setLoading(true);

    try {
      const response = await forgotPasswordApi(email);
      toast.success(response.message || "Reset link sent to your email!");

      // Clear form
      setEmail("");

      // Optionally redirect to sign in after a delay
      setTimeout(() => {
        navigate("/signin");
      }, 3000);
    } catch (error) {
      toast.error(
        error.message || "Failed to send reset link. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <div className="brand-logo">
          <span className="brand-name">Learnmate</span>
        </div>

        <div className="card-content">
          <h1 className="card-title">Forgot password?</h1>
          <p className="card-subtitle">
            Enter your email address and we'll send a link to reset password
          </p>

          <form onSubmit={handleSubmit} className="forgot-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="form-input"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoFocus
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
                "Send Reset Link"
              )}
            </button>
          </form>

          <div className="signin-link">
            Go to{" "}
            <Link to="/signin" className="link">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
