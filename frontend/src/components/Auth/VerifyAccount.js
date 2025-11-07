
import { useEffect, useRef, useState } from "react";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import "./VerifyAccount.scss";
import { ImSpinner9 } from "react-icons/im";
import {
  verifyAccountApi,
  resendOTPApi,
} from "../../services/ApiService";
import { toast } from "react-toastify";

const VerifyAccount = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [status, setStatus] = useState("verifying"); // verifying | waiting | success | failed
  const [message, setMessage] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const resendBtnRef = useRef(null);
  const [email, setEmail] = useState(location.state?.email || "");

  // Lắng nghe cross-tab success trong MỌI trạng thái
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "__verify_success__") {
        setStatus("success");
        setMessage("Account verified. Redirecting...");
        setTimeout(() => navigate("/signin"), 1400);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [navigate]);

  useEffect(() => {
    const token = searchParams.get("token") || searchParams.get("t");

    // Không có token => trang chờ (từ /signup) hoặc link không hợp lệ
    if (!token) {
      if (location.state?.pending && location.state?.email) {
        setStatus("waiting");
        setMessage(
          `A verification email has been sent to ${location.state.email}. Please check your inbox (and spam folder).`
        );
      } else {
        setStatus("failed");
        setMessage("Invalid verification link.");
      }
      return;
    }

    // Có token => gọi verify
    (async () => {
      try {
        const res = await verifyAccountApi(token);
        // Chuẩn hoá message bất kể backend trả dạng nào
        const msg =
          res?.data?.message ||
          res?.message ||
          (typeof res?.data === "string" ? res.data : undefined) ||
          "Your account has been verified.";

        setStatus("success");
        setMessage(msg);

        try {
          window.localStorage.setItem(
            "__verify_success__",
            Date.now().toString()
          );
        } catch {}

        setTimeout(() => {
          let closed = false;
          try {
            window.close();
            if (window.closed) closed = true;
          } catch {}
          if (!closed) navigate("/signin");
        }, 900);
      } catch (error) {
        const apiMsg =
          error?.response?.data?.message ||
          error?.response?.message ||
          error?.message ||
          "";

        // Trường hợp backend trả "already verified" vẫn coi là thành công
        if (/already\s*verified/i.test(apiMsg) || /verified/i.test(apiMsg)) {
          setStatus("success");
          setMessage(apiMsg || "Your account is already verified.");
          try {
            window.localStorage.setItem(
              "__verify_success__",
              Date.now().toString()
            );
          } catch {}
          setTimeout(() => {
            let closed = false;
            try {
              window.close();
              if (window.closed) closed = true;
            } catch {}
            if (!closed) navigate("/signin");
          }, 900);
          return;
        }

        // Nếu thật sự lỗi (token hết hạn, CORS, v.v.)
        setStatus("failed");
        setMessage(apiMsg || "Verification failed. Please try again.");
      }
    })();
    // Không phụ thuộc vào location.state để tránh verify lại vô tình
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const isEmailValid = (val) =>
    /[^@\s]+@[^@\s]+\.[^@\s]+/.test(String(val || "").trim());

  // Tự động focus + scroll tới nút resend khi ở trạng thái waiting
  useEffect(() => {
    if (
      status === "waiting" &&
      resendBtnRef.current &&
      cooldown === 0 &&
      !resendLoading
    ) {
      try {
        resendBtnRef.current.focus();
        resendBtnRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      } catch {}
    }
  }, [status, cooldown, resendLoading]);

  const handleResend = async () => {
    if (!email || !isEmailValid(email) || resendLoading || cooldown > 0) return;
    setResendLoading(true);
    try {
      await resendOTPApi(email);
      setMessage(`OTP đã được gửi lại đến ${email}. Vui lòng kiểm tra email.`);
      setCooldown(60);
      toast.success("Đã gửi lại mã OTP. Vui lòng kiểm tra hộp thư/spam.");
      // Simple analytics: đếm số lần resend trong localStorage
      try {
        const k = "verify_resend_count";
        const current =
          parseInt(window.localStorage.getItem(k) || "0", 10) || 0;
        window.localStorage.setItem(k, String(current + 1));
      } catch {}
    } catch (err) {
      setMessage(
        err?.message ||
          err?.response?.data?.message ||
          "Không thể gửi lại mã OTP"
      );
      toast.error(
        err?.message ||
          err?.response?.data?.message ||
          "Không thể gửi lại mã OTP"
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="verify-account-container">
      <div className="verify-content">
        <div className="verify-card">
          {status === "verifying" && (
            <div className="verify-status">
              <ImSpinner9 className="spinner" />
              <h2 className="verify-title">Verifying Your Account</h2>
              <p className="verify-message">
                Please wait while we verify your email address...
              </p>
            </div>
          )}

          {status === "waiting" && (
            <div className="verify-status">
              <ImSpinner9 className="spinner" />
              <h2 className="verify-title">Check Your Email</h2>
              <p className="verify-message">{message}</p>
              <div className="verify-actions">
                {!email && (
                  <div className="inline-input">
                    <input
                      type="email"
                      placeholder="Nhập email để gửi lại liên kết"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                )}
                <button
                  className="retry-btn"
                  onClick={handleResend}
                  disabled={
                    resendLoading || cooldown > 0 || !isEmailValid(email)
                  }
                  ref={resendBtnRef}
                >
                  {resendLoading
                    ? "Resending..."
                    : cooldown > 0
                    ? `Resend in ${cooldown}s`
                    : "Resend Verification"}
                </button>
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="verify-status success">
              <div className="success-icon">✓</div>
              <h2 className="verify-title">Account Verified!</h2>
              <p className="verify-message">{message}</p>
              <p className="verify-redirect">Closing & redirecting...</p>
            </div>
          )}

          {status === "failed" && (
            <div className="verify-status failed">
              <div className="error-icon">✕</div>
              <h2 className="verify-title">Verification Failed</h2>
              <p className="verify-message">{message}</p>
              <div className="verify-actions">
                <div className="inline-input">
                  <input
                    type="email"
                    placeholder="Nhập email để gửi lại liên kết xác minh"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <button
                  className="retry-btn"
                  onClick={handleResend}
                  disabled={
                    resendLoading || cooldown > 0 || !isEmailValid(email)
                  }
                >
                  {resendLoading
                    ? "Resending..."
                    : cooldown > 0
                    ? `Resend in ${cooldown}s`
                    : "Resend Verification"}
                </button>
              </div>
              <button className="retry-btn" onClick={() => navigate("/signup")}>
                Back to Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyAccount;
