import React, { useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import OnboardingWizard from "../../pages/Tutor/OnboardingWizard";
import "./ProtectedOnboarding.scss";

const ProtectedOnboarding = () => {
  const navigate = useNavigate();
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  const userState = useSelector((state) => state.user);
  const hasRedirected = useRef(false);

  // Kiểm tra xem user đã là gia sư chưa
  const isTutor = useMemo(() => {
    const normalize = (v) =>
      typeof v === "string"
        ? v
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
        : "";
    
    let localRole = "";
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const u = JSON.parse(raw);
        localRole = u?.role || u?.account?.role || u?.profile?.role || "";
      }
    } catch (e) {}
    
    const roles = [
      userState?.user?.role,
      userState?.user?.account?.role,
      userState?.user?.profile?.role,
      userState?.account?.role,
      userState?.profile?.role,
      userState?.role,
      localRole,
    ]
      .filter(Boolean)
      .map(normalize);
    
    return roles.some((r) => r === "tutor" || r.includes("giasu") || r.includes("gia su"));
  }, [userState]);

  useEffect(() => {
    if (!isAuthenticated && !hasRedirected.current) {
      hasRedirected.current = true;
      toast.info("Vui lòng đăng nhập để trở thành gia sư", {
        toastId: "onboarding-auth-required"
      });
      navigate("/signin", { 
        state: { from: "/tutor/onboarding" },
        replace: true 
      });
    }
  }, [isAuthenticated, navigate]);

  // Nếu chưa đăng nhập, không render gì cả (sẽ redirect)
  if (!isAuthenticated) {
    return null;
  }

  // Nếu đã là gia sư, hiển thị thông báo thành công
  if (isTutor) {
    return (
      <div className="already-tutor-container">
        <div className="already-tutor-card">
          <div className="success-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <h1>Bạn đã trở thành gia sư!</h1>
          <p>Tài khoản của bạn đã được xác nhận là gia sư.</p>
          <div className="action-buttons">
            <button 
              onClick={() => navigate("/profile")} 
              className="btn-primary"
            >
              <i className="fas fa-user"></i>
              Xem hồ sơ
            </button>
            <button 
              onClick={() => navigate("/tutor/profile-update")} 
              className="btn-secondary"
            >
              <i className="fas fa-edit"></i>
              Cập nhật thông tin
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Nếu chưa là gia sư, hiển thị OnboardingWizard
  return <OnboardingWizard />;
};

export default ProtectedOnboarding;
