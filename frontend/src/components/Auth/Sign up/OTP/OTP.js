
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { verifyOTPApi, resendOTPApi } from "../../../../services/ApiService";
import "./OTP.scss";

const OTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef([]);

  const email = location.state?.email || "";

  useEffect(() => {
    if (!email) {
      toast.error("No email found. Please register again.");
      navigate("/signup");
    }
  }, [email, navigate]);

  useEffect(() => {
    // Auto-focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (index === 5 && value) {
      const fullOtp = [...newOtp.slice(0, 5), value].join("");
      if (fullOtp.length === 6) {
        handleVerify(fullOtp);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    // Handle arrow keys
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();

    // Only process if it's 6 digits
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split("");
      setOtp(newOtp);
      inputRefs.current[5]?.focus();

      // Auto-submit after paste
      setTimeout(() => {
        handleVerify(pastedData);
      }, 100);
    }
  };

  const handleVerify = async (otpCode = null) => {
    const otpValue = otpCode || otp.join("");

    if (otpValue.length !== 6) {
      toast.error("Please enter all 6 digits");
      return;
    }

    setLoading(true);
    try {
      const response = await verifyOTPApi(email, otpValue);

      if (response && response.EC === 0) {
        toast.success("Email verified successfully!");
        navigate("/signin");
      } else {
        toast.error(response?.EM || "Invalid OTP. Please try again.");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      toast.error("Verification failed. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResending(true);
    try {
      const response = await resendOTPApi(email);

      if (response && response.EC === 0) {
        toast.success("OTP has been resent to your email!");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        toast.error(response?.EM || "Failed to resend OTP. Please try again.");
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      toast.error("Failed to resend OTP. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="otp-container">
      <div className="otp-content">
        {/* Image Section */}
        <div className="otp-image-section">
          <img
            src="/otp-image.jpg"
            alt="OTP Verification"
            className="otp-image"
          />
        </div>

        {/* Form Section */}
        <div className="otp-form-section">
          <div className="form-wrapper">
            <div className="form-header">
              <div className="brand-logo">
                <span className="brand-name">Learnmate</span>
              </div>
              <h1 className="form-title">Enter OTP</h1>
              <p className="form-subtitle">
                We have sent OTP to your gmail
                {email && <span className="email-display"> {email}</span>}
              </p>
            </div>

            <div className="otp-form">
              <div className="otp-inputs">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className="otp-input"
                    disabled={loading}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => handleVerify()}
                disabled={loading || otp.join("").length !== 6}
                className={`verify-btn ${
                  loading || otp.join("").length !== 6 ? "disabled" : ""
                }`}
              >
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Verifying...
                  </>
                ) : (
                  "Verify"
                )}
              </button>

              <div className="resend-section">
                <span className="resend-text">Didn't receive code? </span>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resending || loading}
                  className="resend-link"
                >
                  {resending ? "Sending..." : "Resend OTP"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTP;
