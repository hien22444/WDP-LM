import React, {
  useMemo,
  useRef,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import Cookies from "js-cookie";
import { logout } from "../../redux/slices/userSlice";
import NotificationCenter from "../Notifications/NotificationCenter";
import { toast } from "react-toastify";
import "./UniversalHeader.scss";

const UniversalHeader = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userState = useSelector((s) => s.user);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const dropdownRef = useRef(null);

  const role = useMemo(
    () =>
      userState?.account?.role || userState?.profile?.role || userState?.role,
    [userState]
  );
  const avatar = useMemo(
    () =>
      userState?.profile?.image ||
      userState?.account?.image ||
      userState?.user?.image ||
      userState?.user?.avatar ||
      "https://res.cloudinary.com/dnyvwjbbm/image/upload/v1760334427/whiteava_m3gka1.jpg",
    [userState]
  );

  const handleLogout = useCallback(() => {
    Cookies.remove("accessToken");
    Cookies.remove("refreshToken");
    localStorage.clear();
    dispatch(logout());
    setIsMenuOpen(false);
    navigate("/");
  }, [dispatch, navigate]);

  // Handle join room with code
  const handleJoinRoom = useCallback(() => {
    if (!roomCode.trim()) {
      toast.error("Vui lòng nhập mã phòng học");
      return;
    }

    // Navigate to room with code
    navigate(`/room/${roomCode.trim()}`);
    setShowRoomModal(false);
    setRoomCode("");
  }, [roomCode, navigate]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target)) setIsMenuOpen(false);
    };
    if (isMenuOpen) document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, [isMenuOpen]);

  return (
    <header className="universal-header">
      <div className="header-container">
        {/* Logo */}
        <div className="logo-container" onClick={() => navigate("/")}>
          <img
            src="/edumatch-logo.png"
            alt="EduMatch"
            className="logo-image"
          />
          <span className="logo-text">EduMatch</span>
        </div>

        {/* Nav */}
        <nav className="main-nav">
          <button className="nav-button" onClick={() => navigate("/courses")}>
            Tìm gia sư
          </button>
          <button className="nav-button" onClick={() => navigate("/courses")}>
            Khóa học
          </button>
          <button className="nav-button" onClick={() => navigate("/tutor/onboarding")}>
            Trở thành gia sư
          </button>
          <button className="nav-button" onClick={() => navigate("/about")}>
            Về Chúng Tôi
          </button>
        </nav>

        {/* Search */}
        <div className="search-container">
          <div className="search-box">
            <input
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
              className="search-button"
            >
              <i className="fas fa-search" />
            </button>
          </div>
        </div>

        {/* Notifications */}
        <NotificationCenter />

        {/* Join Room Button */}
        <button
          onClick={() => setShowRoomModal(true)}
          className="join-room-button"
        >
          <i className="fas fa-video"></i>
          Phòng Học
        </button>

        {/* Avatar */}
        <div ref={dropdownRef} className="avatar-container">
          <img
            src={avatar}
            alt="avatar"
            onClick={() => setIsMenuOpen((v) => !v)}
            className="avatar-image"
          />
          <div className={`user-dropdown ${isMenuOpen ? 'open' : ''}`}>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                navigate("/profile");
              }}
              className="dropdown-item"
            >
              Trang cá nhân
            </button>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                navigate("/courses");
              }}
              className="dropdown-item"
            >
              Khóa học của tôi
            </button>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                navigate("/bookings/me");
              }}
              className="dropdown-item"
            >
              Lịch học
            </button>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                navigate("/payments");
              }}
              className="dropdown-item"
            >
              Lịch sử thanh toán
            </button>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                navigate("/change-password");
              }}
              className="dropdown-item"
            >
              Đổi mật khẩu
            </button>
            <div className="dropdown-divider" />
            <button
              onClick={handleLogout}
              className="dropdown-item logout"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>

      {/* Join Room Modal */}
      {showRoomModal && (
        <div className="modal-overlay" onClick={() => setShowRoomModal(false)}>
          <div className="room-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tham gia phòng học</h3>
              <button
                onClick={() => setShowRoomModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <label>Mã phòng học</label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder="Nhập mã phòng học..."
                className="room-code-input"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleJoinRoom();
                  }
                }}
                autoFocus
              />
              <p className="input-help">
                Nhập mã phòng học được cung cấp bởi gia sư
              </p>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowRoomModal(false)}
                className="btn-cancel"
              >
                Hủy
              </button>
              <button
                onClick={handleJoinRoom}
                className="btn-join"
              >
                <i className="fas fa-video"></i>
                Tham gia
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default UniversalHeader;
