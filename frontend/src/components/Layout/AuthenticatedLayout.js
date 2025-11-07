import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import UniversalHeader from "./UniversalHeader";
import PublicLayout from "./PublicLayout";
import "./AuthenticatedLayout.scss";

const AuthenticatedLayout = () => {
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    // Add Font Awesome CSS if not already loaded
    if (!document.querySelector('link[href*="font-awesome"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css";
      document.head.appendChild(link);
    }

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setShowBackToTop(scrollTop > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // If user is not authenticated, show PublicLayout
  if (!isAuthenticated) {
    return <PublicLayout />;
  }

  // Otherwise, show authenticated layout with UniversalHeader
  return (
    <div className="authenticated-layout">
      {/* Use UniversalHeader - same as LandingPage/MainLayout */}
      <UniversalHeader />

      {/* Main Content */}
      <main className="authenticated-content">
        <Outlet />
      </main>

      {/* Back to Top Button */}
      <button
        className={`back-to-top ${showBackToTop ? "visible" : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Lên đầu trang"
      >
        <i className="fas fa-chevron-up"></i>
      </button>
    </div>
  );
};

export default AuthenticatedLayout;
