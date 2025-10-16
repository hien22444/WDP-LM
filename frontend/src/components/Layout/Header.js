import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../redux/slices/userSlice';
import './Header.scss';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector(state => state.user);
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Normalize common user fields coming from different auth flows
  const displayName = (
    user?.fullName ||
    user?.full_name ||
    user?.name ||
    user?.account?.fullName ||
    user?.profile?.fullName ||
    (user?.email ? user.email.split('@')[0] : null) ||
    'User'
  );
  const avatarUrl = user?.avatar || user?.profile?.avatar || user?.account?.avatar || null;
  const role = user?.account?.role || user?.role || null;
  const roleLabel = role === 'tutor' ? 'Gia sư' : role === 'admin' ? 'Quản trị' : 'Học viên';

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
    setIsUserMenuOpen(false);
  };

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo */}
        <div className="header-logo">
          <Link to="/" className="logo-link">
            <div className="logo-icon">
              <i className="fas fa-graduation-cap"></i>
            </div>
            <span className="logo-text">LearnMate</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="header-nav desktop-nav">
          <ul className="nav-list">
            <li className="nav-item">
              <Link 
                to="/" 
                className={`nav-link ${isActivePath('/') ? 'active' : ''}`}
              >
                Trang chủ
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to="/tutor" 
                className={`nav-link ${isActivePath('/tutor') ? 'active' : ''}`}
              >
                Tìm gia sư
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to="/courses" 
                className={`nav-link ${isActivePath('/courses') ? 'active' : ''}`}
              >
                Khóa học
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to="/about" 
                className={`nav-link ${isActivePath('/about') ? 'active' : ''}`}
              >
                Giới thiệu
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to="/contact" 
                className={`nav-link ${isActivePath('/contact') ? 'active' : ''}`}
              >
                Liên hệ
              </Link>
            </li>
          </ul>
        </nav>

        {/* User Actions */}
        <div className="header-actions">
          {isAuthenticated ? (
            <div className="user-menu">
              <button 
                className="user-menu-trigger"
                onClick={toggleUserMenu}
              >
                <div className="user-avatar">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" />
                  ) : (
                    <i className="fas fa-user"></i>
                  )}
                </div>
                <span className="user-name">{displayName}</span>
                <i className={`fas fa-chevron-down ${isUserMenuOpen ? 'rotated' : ''}`}></i>
              </button>

              {isUserMenuOpen && (
                <div className="user-dropdown">
                  <div className="dropdown-header">
                    <div className="user-info">
                      <div className="user-avatar-large">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar" />
                        ) : (
                          <i className="fas fa-user"></i>
                        )}
                      </div>
                      <div className="user-details">
                        <h4>{displayName}</h4>
                        <p>{user?.email}</p>
                        <span className="user-role">{roleLabel}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="dropdown-menu">
                    <Link 
                      to="/dashboard" 
                      className="dropdown-item"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <i className="fas fa-tachometer-alt"></i>
                      Dashboard
                    </Link>
                    
                    <Link 
                      to="/profile" 
                      className="dropdown-item"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <i className="fas fa-user-edit"></i>
                      Hồ sơ cá nhân
                    </Link>

                    {role === 'tutor' && (
                      <>
                        <Link 
                          to="/tutor/profile" 
                          className="dropdown-item"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <i className="fas fa-chalkboard-teacher"></i>
                          Hồ sơ gia sư
                        </Link>
                        <Link 
                          to="/tutor/schedule" 
                          className="dropdown-item"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <i className="fas fa-calendar-alt"></i>
                          Lịch dạy
                        </Link>
                      </>
                    )}

                    <div className="dropdown-divider"></div>
                    
                    <button 
                      className="dropdown-item logout-item"
                      onClick={handleLogout}
                    >
                      <i className="fas fa-sign-out-alt"></i>
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-outline">
                Đăng nhập
              </Link>
              <Link to="/register" className="btn btn-primary">
                Đăng ký
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button 
            className="mobile-menu-toggle"
            onClick={toggleMobileMenu}
          >
            <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="mobile-nav">
          <nav className="mobile-nav-content">
            <ul className="mobile-nav-list">
              <li className="mobile-nav-item">
                <Link 
                  to="/" 
                  className={`mobile-nav-link ${isActivePath('/') ? 'active' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <i className="fas fa-home"></i>
                  Trang chủ
                </Link>
              </li>
              <li className="mobile-nav-item">
                <Link 
                  to="/tutor" 
                  className={`mobile-nav-link ${isActivePath('/tutor') ? 'active' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <i className="fas fa-search"></i>
                  Tìm gia sư
                </Link>
              </li>
              <li className="mobile-nav-item">
                <Link 
                  to="/about" 
                  className={`mobile-nav-link ${isActivePath('/about') ? 'active' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <i className="fas fa-info-circle"></i>
                  Giới thiệu
                </Link>
              </li>
              <li className="mobile-nav-item">
                <Link 
                  to="/contact" 
                  className={`mobile-nav-link ${isActivePath('/contact') ? 'active' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <i className="fas fa-envelope"></i>
                  Liên hệ
                </Link>
              </li>
            </ul>

            {!isAuthenticated && (
              <div className="mobile-auth-buttons">
                <Link 
                  to="/login" 
                  className="btn btn-outline"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Đăng nhập
                </Link>
                <Link 
                  to="/register" 
                  className="btn btn-primary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-nav-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Overlay for user menu */}
      {isUserMenuOpen && (
        <div 
          className="user-menu-overlay"
          onClick={() => setIsUserMenuOpen(false)}
        ></div>
      )}
    </header>
  );
};

export default Header;
