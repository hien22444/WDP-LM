"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import "./VerifyAccount.scss";
import { ImSpinner9 } from "react-icons/im";
import { verifyAccountApi } from "../../services/ApiService";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api/v1";

const VerifyAccount = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [status, setStatus] = useState("verifying"); // verifying | waiting | success | failed
  const [message, setMessage] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [email] = useState(location.state?.email || "");

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

  const handleResend = async () => {
    if (!email) return;
    setResendLoading(true);
    try {
      await axios.post(`${API_URL}/auth/resend-verification`, { email });
      setMessage(`Verification email resent to ${email}. Please check again.`);
    } catch (err) {
      setMessage(
        err?.response?.data?.message || "Failed to resend verification email"
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
              {email && (
                <button
                  className="retry-btn"
                  onClick={handleResend}
                  disabled={resendLoading}
                >
                  {resendLoading ? "Resending..." : "Resend Verification"}
                </button>
              )}
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
