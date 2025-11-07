import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import "./PublicLayout.scss";

const PublicLayout = () => {
  const navigate = useNavigate();
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [search, setSearch] = useState("");

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
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      setShowBackToTop(scrollTop > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="public-layout">
      {/* Public Header */}
      <header className="public-header">
        <div className="header-wrapper">
          {/* Logo */}
          <div className="logo" onClick={() => navigate("/")}>
            <img
              src="/edumatch-logo.png"
              alt="EduMatch"
              className="brand-logo"
            />
          </div>

          {/* Navigation */}
          <nav className="nav">
            <a href="/tutors">Tìm gia sư</a>
            <a href="/courses">Khóa học mở</a>
            <a href="/tutor/onboarding">Trở thành gia sư</a>
            <a href="/about">Về Chúng Tôi</a>
          </nav>

          {/* Search and Auth Buttons */}
          <div className="right-section">
            {/* Search bar */}
            <div className="search-container">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    navigate(`/courses?q=${encodeURIComponent(search.trim())}`);
                }}
                placeholder="Tìm kiếm gia sư, môn học..."
                className="search-input"
              />
              <button
                onClick={() =>
                  navigate(`/courses?q=${encodeURIComponent(search.trim())}`)
                }
                className="search-btn"
              >
                <i className="fas fa-search"></i>
              </button>
            </div>

            {/* Auth buttons */}
            <div className="auth-buttons">
              <button
                className="signin-btn"
                onClick={() => navigate("/signin")}
              >
                Sign In
              </button>
              <button
                className="signup-btn"
                onClick={() => navigate("/signup")}
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="public-content">
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

export default PublicLayout;
