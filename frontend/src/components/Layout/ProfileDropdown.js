import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../redux/slices/userSlice";
import "./ProfileDropdown.scss";

const ProfileDropdown = ({ user, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  return (
    <div className="profile-dropdown">
      <div className="profile-header">
        <img src={user.avatar || "/default-avatar.png"} alt={user.name} />
        <div className="user-info">
          <h4>{user.name || "Người dùng"}</h4>
          <p>{user.email}</p>
        </div>
      </div>

      <div className="dropdown-menu">
        <Link to="/profile" onClick={onClose}>
          <i className="fas fa-user"></i>
          Trang cá nhân
        </Link>

        {(user?.role === "learner" ||
          user?.account?.role === "learner" ||
          user?.user?.role === "learner") && (
          <Link to="/favorite-tutors" onClick={onClose}>
            <i className="fas fa-heart"></i>
            Gia sư yêu thích
          </Link>
        )}

        <Link to="/payments" onClick={onClose}>
          <i className="fas fa-wallet"></i>
          Lịch sử thanh toán
        </Link>

        <Link to="/bookings/me" onClick={onClose}>
          <i className="fas fa-calendar"></i>
          Lịch học của tôi
        </Link>

        <Link to="/change-password" onClick={onClose}>
          <i className="fas fa-lock"></i>
          Đổi mật khẩu
        </Link>

        <button onClick={handleLogout}>
          <i className="fas fa-sign-out-alt"></i>
          Đăng xuất
        </button>
      </div>
    </div>
  );
};

export default ProfileDropdown;
