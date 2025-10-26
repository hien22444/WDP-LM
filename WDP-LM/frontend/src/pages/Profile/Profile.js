import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../redux/slices/userSlice";
import {
  getCurrentUserApi,
  updateUserProfileApi,
  logoutApi,
} from "../../services/ApiService";
import TutorService from "../../services/TutorService";
import { toast } from "react-toastify";
import axios from "axios";
import Cookies from "js-cookie";
import "./Profile.scss";

const Profile = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [updating, setUpdating] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [tutorProfile, setTutorProfile] = useState(null);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  const user = useSelector((state) => state.user);

  // Compute role using the same logic as LandingPage
  const role = useMemo(() => {
    return (
      userProfile?.account?.role ||
      userProfile?.profile?.role ||
      user?.account?.role ||
      user?.profile?.role ||
      user?.role
    );
  }, [userProfile, user]);

  // Fetch user profile data
  const fetchUserProfile = async () => {
    try {
      console.log('🔍 Profile: Fetching user profile...');
      setLoading(true);
      const response = await getCurrentUserApi();
      console.log('✅ Profile: User profile data:', response.user);
      setUserProfile(response.user);
      setError(null);
      
      // Fetch tutor onboarding status in parallel (ignore error silently)
      try {
        const tp = await TutorService.getMyTutorProfile();
        setTutorProfile(tp);
      } catch (e) {
        // Nếu không có tutor profile từ API, kiểm tra localStorage
        const localTutorProfile = localStorage.getItem('tutorProfile');
        if (localTutorProfile) {
          const parsedProfile = JSON.parse(localTutorProfile);
          setTutorProfile(parsedProfile);
        }
      }
    } catch (err) {
      setError("Không thể tải thông tin người dùng");
      console.error("Failed to fetch user profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Hồ Sơ Cá Nhân - Learnova";

    if (!isAuthenticated) {
      navigate("/signin");
      return;
    }

    fetchUserProfile();
  }, [isAuthenticated, navigate]);

  // (debug removed)

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleAvatarKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setDropdownOpen((prev) => !prev);
    }
    if (event.key === "Escape") {
      setDropdownOpen(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case "learner":
        return "Học viên";
      case "tutor":
        return "Gia sư";
      case "admin":
        return "Quản trị";
      default:
        return role;
    }
  };

  const getStatusDisplayName = (status) => {
    switch (status) {
      case "active":
        return "Hoạt động";
      case "pending":
        return "Chờ xác thực";
      case "blocked":
        return "Bị khóa";
      default:
        return status;
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset form
      setEditForm({});
      setIsEditing(false);
    } else {
      // Start editing - populate form with current data
      setEditForm({
        full_name: userProfile?.profile?.full_name || "",
        phone_number: userProfile?.profile?.phone_number || "",
        date_of_birth: userProfile?.profile?.date_of_birth
          ? userProfile.profile.date_of_birth.split("T")[0]
          : "",
        gender: userProfile?.profile?.gender || "",
        address: userProfile?.profile?.address || "",
        city: userProfile?.profile?.city || "",
        image: userProfile?.profile?.image || "",
      });
      setIsEditing(true);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveChanges = async () => {
    try {
      setUpdating(true);
      const response = await updateUserProfileApi(editForm);
      setUserProfile(response.user);
      setIsEditing(false);
      setEditForm({});
      toast.success("Cập nhật thông tin thành công!");
    } catch (error) {
      toast.error(error.message || "Cập nhật thất bại");
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutApi();
      dispatch(logout());
      navigate("/signin");
    } catch (error) {
      console.error("Logout error:", error);
      dispatch(logout());
      navigate("/signin");
    }
  };


  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước file không được vượt quá 5MB");
      return;
    }

    try {
      setUploadingAvatar(true);

      const formData = new FormData();
      formData.append("avatar", file);

      const API_BASE_URL =
        process.env.REACT_APP_API_URL || "http://localhost:5000/api/v1";
      const accessToken = Cookies.get("accessToken");

      const response = await axios.post(
        `${API_BASE_URL}/users/upload-avatar`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${accessToken}`,
          },
          withCredentials: true,
        }
      );

      if (response.data && response.data.imageUrl) {
        // Update user profile with new avatar
        setUserProfile((prev) => ({
          ...prev,
          profile: {
            ...prev.profile,
            image: response.data.imageUrl,
          },
        }));

        toast.success("Cập nhật avatar thành công!");
      }
    } catch (error) {
      console.error("Avatar upload error:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Không thể cập nhật avatar. Vui lòng thử lại!");
      }
    } finally {
      setUploadingAvatar(false);
      // Reset file input
      event.target.value = "";
    }
  };

  if (loading) {
    console.log('🔄 Profile: Loading state is true');
    return (
      <div className="profile-container">
        <div className="profile-loading">
          <div className="loading-spinner"></div>
          <p>Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-container">
        <div className="profile-error">
          <p>{error}</p>
          <button onClick={fetchUserProfile} className="retry-btn">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  console.log('🔍 Profile: Rendering...');
  console.log('  - userProfile:', userProfile);
  console.log('  - tutorProfile:', tutorProfile);
  console.log('  - loading:', loading);
  console.log('  - error:', error);

  return (
    <div className="profile-container">
      <div className="sidebar">
        <div className="sidebar-icons">
          <div
            className="sidebar-icon"
            title="Home"
            onClick={() => navigate("/")}
          >
            <i>
              <svg
                width="23"
                height="23"
                viewBox="0 0 23 23"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8.7998 18.2444V15.1833C8.7998 14.4389 9.41086 13.8278 10.1553 13.8278H12.8442C13.2081 13.8278 13.5571 13.9723 13.8142 14.2294C14.0714 14.4866 14.2159 14.8356 14.2159 15.1994V18.2444C14.2135 18.8556 14.7125 19.3611 15.3236 19.3722H17.4331C18.1609 19.3722 18.8588 19.0833 19.374 18.568C19.8893 18.0528 20.1781 17.3549 20.1781 16.627V9.75001C20.1781 9.15695 19.9 8.59306 19.4248 8.20139L13.1359 2.97917C12.2217 2.20306 10.8837 2.20306 9.96953 2.97917L3.68064 8.20139C3.20544 8.59306 2.92731 9.15695 2.92731 9.75001V16.627C2.92731 18.1364 4.14975 19.3589 5.65919 19.3589H7.76864C8.39309 19.3589 8.89619 18.8558 8.89619 18.2314L8.7998 18.2444Z"
                  stroke="#292D32"
                  strokeWidth="1.40417"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </i>
          </div>
          <div className="sidebar-icon active" title="Profile">
            <i>
              <svg
                width="23"
                height="23"
                viewBox="0 0 23 23"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20.8694 10.6703V4.30472C20.8694 2.90055 20.2703 2.33888 18.7819 2.33888H15C13.5116 2.33888 12.9125 2.90055 12.9125 4.30472V10.6703C12.9125 12.0744 13.5116 12.6361 15 12.6361H18.7819C20.2703 12.6361 20.8694 12.0744 20.8694 10.6703Z"
                  fill="#4182F9"
                />
                <path
                  d="M20.8694 19.0953V17.4103C20.8694 16.0061 20.2703 15.4444 18.7819 15.4444H15C13.5116 15.4444 12.9125 16.0061 12.9125 17.4103V19.0953C12.9125 20.4994 13.5116 21.0611 15 21.0611H18.7819C20.2703 21.0611 20.8694 20.4994 20.8694 19.0953Z"
                  fill="#4182F9"
                />
                <path
                  d="M10.1042 12.7297V19.0953C10.1042 20.4994 9.50505 21.0611 8.01663 21.0611H4.23474C2.74633 21.0611 2.14722 20.4994 2.14722 19.0953V12.7297C2.14722 11.3256 2.74633 10.7639 4.23474 10.7639H8.01663C9.50505 10.7639 10.1042 11.3256 10.1042 12.7297Z"
                  fill="#4182F9"
                />
                <path
                  d="M10.1042 4.30472V5.98972C10.1042 7.39388 9.50505 7.95555 8.01663 7.95555H4.23474C2.74633 7.95555 2.14722 7.39388 2.14722 5.98972V4.30472C2.14722 2.90055 2.74633 2.33888 4.23474 2.33888H8.01663C9.50505 2.33888 10.1042 2.90055 10.1042 4.30472Z"
                  fill="#4182F9"
                />
              </svg>
            </i>
          </div>
          <div
            className="sidebar-icon"
            title="Dashboard"
            onClick={() => navigate("/dashboard")}
          >
            <i>
              <svg
                width="23"
                height="23"
                viewBox="0 0 23 23"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g>
                  <path
                    d="M17.4245 11.7167C19.8584 11.7167 20.8694 10.7806 19.9707 7.71011C19.3623 5.64131 17.5837 3.8627 15.5149 3.25423C12.4444 2.35556 11.5083 3.36656 11.5083 5.80045V8.49645C11.5083 10.7806 12.4444 11.7167 14.3166 11.7167H17.4245Z"
                    stroke="#292D32"
                    strokeWidth="1.40417"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M18.9973 14.2442C18.1267 18.5784 13.9704 21.7237 9.24302 20.9561C5.69516 20.3851 2.84002 17.5299 2.25964 13.9821C1.50139 9.27341 4.628 5.11708 8.94347 4.23714"
                    stroke="#292D32"
                    strokeWidth="1.40417"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              </svg>
            </i>
          </div>
          <div
            className="sidebar-icon"
            title="Messages"
            onClick={() => navigate("/messages")}
          >
            <i>
              <svg
                width="23"
                height="24"
                viewBox="0 0 23 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g>
                  <path
                    d="M17.1063 10.8951V14.6395C17.1063 14.8829 17.0969 15.1169 17.0688 15.3416C16.8535 17.8691 15.3651 19.1235 12.6223 19.1235H12.2479C12.0138 19.1235 11.7892 19.2358 11.6487 19.423L10.5254 20.9208C10.0293 21.5855 9.22422 21.5855 8.72808 20.9208L7.60473 19.423C7.48304 19.2639 7.21158 19.1235 7.00564 19.1235H6.6312C3.645 19.1235 2.14722 18.384 2.14722 14.6395V10.8951C2.14722 8.15227 3.41097 6.66386 5.92911 6.44855C6.15378 6.42047 6.38781 6.4111 6.6312 6.4111H12.6223C15.6085 6.4111 17.1063 7.90889 17.1063 10.8951Z"
                    stroke="#292D32"
                    strokeWidth="1.40417"
                    strokeMiterlimit="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M20.8508 7.15064V10.8951C20.8508 13.6472 19.5871 15.1263 17.0689 15.3416C17.097 15.1169 17.1064 14.8829 17.1064 14.6395V10.8951C17.1064 7.90889 15.6086 6.4111 12.6224 6.4111H6.63128C6.38789 6.4111 6.15387 6.42047 5.9292 6.44855C6.1445 3.93041 7.63292 2.66666 10.3757 2.66666H16.3668C19.353 2.66666 20.8508 4.16444 20.8508 7.15064Z"
                    stroke="#292D32"
                    strokeWidth="1.40417"
                    strokeMiterlimit="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12.9083 13.1979H12.9167"
                    stroke="#292D32"
                    strokeWidth="1.87222"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9.63193 13.1979H9.64036"
                    stroke="#292D32"
                    strokeWidth="1.87222"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6.35557 13.1979H6.36399"
                    stroke="#292D32"
                    strokeWidth="1.87222"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              </svg>
            </i>
          </div>
          <div
            className="sidebar-icon"
            title="Settings"
            onClick={() => navigate("/settings")}
          >
            <i>
              <svg
                width="23"
                height="23"
                viewBox="0 0 23 23"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g>
                  <path
                    d="M11.5084 14.4917C13.0594 14.4917 14.3167 13.2343 14.3167 11.6833C14.3167 10.1323 13.0594 8.87501 11.5084 8.87501C9.95741 8.87501 8.70007 10.1323 8.70007 11.6833C8.70007 13.2343 9.95741 14.4917 11.5084 14.4917Z"
                    stroke="#292D32"
                    stroke-width="1.40417"
                    stroke-miterlimit="10"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M2.14722 12.5071V10.8596C2.14722 9.88601 2.94291 9.08096 3.92583 9.08096C5.62019 9.08096 6.31291 7.88273 5.46105 6.41304C4.97427 5.57054 5.26447 4.47529 6.11633 3.98851L7.7358 3.06176C8.47533 2.62179 9.43016 2.8839 9.87013 3.62343L9.97311 3.80129C10.8156 5.27098 12.201 5.27098 13.0529 3.80129L13.1559 3.62343C13.5959 2.8839 14.5507 2.62179 15.2902 3.06176L16.9097 3.98851C17.7616 4.47529 18.0517 5.57054 17.565 6.41304C16.7131 7.88273 17.4058 9.08096 19.1002 9.08096C20.0737 9.08096 20.8788 9.87665 20.8788 10.8596V12.5071C20.8788 13.4807 20.0831 14.2857 19.1002 14.2857C17.4058 14.2857 16.7131 15.484 17.565 16.9537C18.0517 17.8055 17.7616 18.8914 16.9097 19.3782L15.2902 20.3049C14.5507 20.7449 13.5959 20.4828 13.1559 19.7433L13.0529 19.5654C12.2104 18.0957 10.825 18.0957 9.97311 19.5654L9.87013 19.7433C9.43016 20.4828 8.47533 20.7449 7.7358 20.3049L6.11633 19.3782C5.26447 18.8914 4.97427 17.7962 5.46105 16.9537C6.31291 15.484 5.62019 14.2857 3.92583 14.2857C2.94291 14.2857 2.14722 13.4807 2.14722 12.5071Z"
                    stroke="#292D32"
                    stroke-width="1.40417"
                    stroke-miterlimit="10"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </g>
              </svg>
            </i>
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="profile-header" style={{ gap: 16 }}>
          <div className="welcome-section">
            <h1>Xin chào, {userProfile?.profile?.full_name || "User"}</h1>
            <p className="date">
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          {/* Đã có menu avatar ở header chung, bỏ avatar trong banner để tránh dư */}
        </div>

        {/* Tutor onboarding status banner */}
        {(tutorProfile?.status || (role === "student" && !tutorProfile)) && (
          <div className={`tutor-status-banner status-${tutorProfile?.status || "pending"}`}>
            <div className="status-info">
              <span className="status-dot" />
              <strong>
                {tutorProfile?.status === "approved" &&
                  "Hồ sơ gia sư đã được duyệt"}
                {tutorProfile?.status === "pending" &&
                  "Hồ sơ gia sư đang chờ duyệt"}
                {tutorProfile?.status === "rejected" &&
                  "Hồ sơ gia sư bị từ chối"}
                {tutorProfile?.status === "draft" &&
                  "Bạn chưa hoàn tất đăng ký gia sư"}
                {!tutorProfile?.status && role === "student" &&
                  "Bạn chưa hoàn tất đăng ký gia sư"}
              </strong>
              {/* debug block removed */}
              {tutorProfile?.verification?.adminNotes && (
                <span className="admin-notes">
                  <strong>Ghi chú:</strong>
                  — {tutorProfile.verification.adminNotes}
                </span>
              )}
            </div>
            <div className="status-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate('/tutor/profile-update')}
              >
                Cập nhật hồ sơ gia sư
              </button>
              {tutorProfile?.status === "approved" ? (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => navigate("/dashboard")}
                >
                  Vào bảng điều khiển
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => navigate("/profile")}
                >
                  Xem hồ sơ
                </button>
              )}
            </div>
          </div>
        )}

        <div className="profile-content">
          <div className="profile-card">
            <div className="profile-info">
              <div className="avatar-section">
                <div className="profile-avatar-container">
                  <img
                    src={
                      userProfile?.profile?.image ||
                      "https://res.cloudinary.com/dnyvwjbbm/image/upload/v1760334427/whiteava_m3gka1.jpg"
                    }
                    alt="Profile Avatar"
                    className="profile-avatar"
                    onClick={() =>
                      document.getElementById("avatar-upload-input").click()
                    }
                  />
                  <div
                    className={`profile-avatar-overlay ${
                      uploadingAvatar ? "uploading" : ""
                    }`}
                    onClick={() =>
                      document.getElementById("avatar-upload-input").click()
                    }
                  >
                    {uploadingAvatar ? (
                      <div className="avatar-spinner"></div>
                    ) : (
                      <span>Thay đổi avatar</span>
                    )}
                  </div>
                  <input
                    id="avatar-upload-input"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    style={{ display: "none" }}
                    aria-label="Tải lên ảnh đại diện"
                  />
                </div>
                <div className="user-details">
                  <h2>{userProfile?.profile?.full_name || "Chưa cập nhật"}</h2>
                  <p className="email">{userProfile?.account?.email}</p>
                </div>
              </div>
              <button
                type="button"
                className="edit-btn"
                onClick={handleEditToggle}
              >
                {isEditing ? "Hủy" : "Chỉnh sửa"}
              </button>
              {isEditing && (
                <button
                  className="save-btn"
                  onClick={handleSaveChanges}
                  disabled={updating}
                  type="button"
                >
                  {updating ? "Đang lưu..." : "Lưu"}
                </button>
              )}
            </div>

            <div className="profile-form">
              <h3 className="section-title">Thông tin cá nhân</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="full_name">Họ và Tên</label>
                  <input
                    type="text"
                    name="full_name"
                    id="full_name"
                    value={
                      isEditing
                        ? editForm.full_name || ""
                        : userProfile?.profile?.full_name || ""
                    }
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                    className="form-input"
                    placeholder={isEditing ? "Nhập họ và tên" : undefined}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone_number">Số Điện Thoại</label>
                  <input
                    type="text"
                    name="phone_number"
                    id="phone_number"
                    value={
                      isEditing
                        ? editForm.phone_number || ""
                        : userProfile?.profile?.phone_number || ""
                    }
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                    className="form-input"
                    inputMode="tel"
                    placeholder={isEditing ? "Nhập số điện thoại" : undefined}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={userProfile?.account?.email || ""}
                    readOnly
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="date_of_birth">Ngày Sinh</label>
                  <input
                    type={isEditing ? "date" : "text"}
                    name="date_of_birth"
                    id="date_of_birth"
                    value={
                      isEditing
                        ? editForm.date_of_birth || ""
                        : formatDate(userProfile?.profile?.date_of_birth)
                    }
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                    className="form-input"
                    placeholder={isEditing ? "Chọn ngày sinh" : undefined}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="gender">Giới Tính</label>
                  {isEditing ? (
                    <select
                      name="gender"
                      id="gender"
                      value={editForm.gender || ""}
                      onChange={handleInputChange}
                      className="form-input"
                    >
                      <option value="">Chọn giới tính</option>
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={userProfile?.profile?.gender || ""}
                      readOnly
                      className="form-input"
                    />
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="role">Vai Trò</label>
                  <input
                    type="text"
                    id="role"
                    value={getRoleDisplayName(userProfile?.account?.role)}
                    readOnly
                    className="form-input"
                  />
                </div>
              </div>

              <h3 className="section-title">Địa chỉ</h3>
              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="address">Địa chỉ</label>
                  <textarea
                    name="address"
                    id="address"
                    value={
                      isEditing
                        ? editForm.address || ""
                        : userProfile?.profile?.address || ""
                    }
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                    className="form-textarea"
                    rows="3"
                    placeholder={isEditing ? "Nhập địa chỉ cụ thể" : undefined}
                  />
                </div>
              </div>

              <div className="status-section">
                <div className="status-badge">
                  <span className={`status ${userProfile?.account?.status}`}>
                    {getStatusDisplayName(userProfile?.account?.status)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Profile;
