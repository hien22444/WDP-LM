import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { fetchFavorites, removeFromFavorites } from "../../redux/favoriteSlice";
import "./FavoriteTutors.scss";

const FavoriteTutors = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { favorites: tutors, loading } = useSelector(
    (state) => state.favorites
  );
  const user = useSelector((state) => state.user.user);

  useEffect(() => {
    // Chỉ load favorites khi user đã đăng nhập và là learner
    if (user?.account?.role === "learner") {
      dispatch(fetchFavorites());
    }
  }, [dispatch, user]);

  const handleRemoveFavorite = async (tutorId) => {
    try {
      dispatch(removeFromFavorites(tutorId));
    } catch (error) {
      console.error("Error removing favorite tutor:", error);
    }
  };

  const handleTutorClick = (tutorId) => {
    navigate(`/tutor/${tutorId}`);
  };

  return (
    <div className="favorite-tutors">
      <div className="favorite-tutors-header">
        <div className="container">
          <h1>Gia Sư Yêu Thích</h1>
          <p>Danh sách gia sư bạn đã lưu</p>
        </div>
      </div>

      <div className="container favorite-tutors-content">
        {loading ? (
          <div className="loading">Đang tải...</div>
        ) : tutors.length > 0 ? (
          <div className="tutors-grid">
            {tutors.map((tutorRaw) => {
              // Normalize tutor fields since API may return different shapes
              const tutor = tutorRaw || {};
              const id = tutor._id || tutor.id || tutor.tutorProfileId;
              const avatar =
                tutor.avatar ||
                tutor.avatarUrl ||
                tutor.user?.image ||
                tutor.user?.profile?.image ||
                "https://res.cloudinary.com/dnyvwjbbm/image/upload/v1760334427/whiteava_m3gka1.jpg";
              const name =
                tutor.name ||
                tutor.user?.full_name ||
                tutor.user?.fullName ||
                "Gia sư";
              const rating =
                typeof tutor.rating === "number" ? tutor.rating : 0;
              const reviewCount = tutor.reviewCount || tutor.totalReviews || 0;

              // Subjects can be array of strings or objects
              const subjects = Array.isArray(tutor.subjects)
                ? tutor.subjects.map((s) =>
                    typeof s === "string" ? s : s?.name || s?.subject || ""
                  )
                : [];

              // Price may be in different fields
              const rawPrice =
                tutor.price || tutor.sessionRate || tutor.pricePerSession || 0;
              const hasPrice =
                typeof rawPrice === "number" &&
                !isNaN(rawPrice) &&
                rawPrice > 0;
              const priceDisplay = hasPrice
                ? `${rawPrice.toLocaleString("vi-VN")}đ`
                : "Liên hệ";

              return (
                <div key={id || Math.random()} className="tutor-card">
                  <div
                    className="tutor-info"
                    onClick={() => id && handleTutorClick(id)}
                  >
                    <div className="tutor-avatar">
                      <img
                        src={avatar}
                        alt={name}
                        onError={(e) => (e.target.src = "/default-avatar.png")}
                      />
                      {tutor.verified && (
                        <div className="verified-badge">
                          <i className="fas fa-check-circle"></i>
                        </div>
                      )}
                    </div>

                    <h3 className="tutor-name">{name}</h3>
                    <div className="tutor-rating">
                      <div className="stars">
                        {[...Array(5)].map((_, i) => (
                          <i
                            key={i}
                            className={`fas fa-star ${
                              i < Math.floor(rating) ? "filled" : ""
                            }`}
                          />
                        ))}
                      </div>
                      <span className="rating-text">
                        {rating} ({reviewCount} đánh giá)
                      </span>
                    </div>

                    <div className="tutor-subjects">
                      {subjects.map((subject, idx) => (
                        <span key={idx} className="subject-tag">
                          {subject}
                        </span>
                      ))}
                    </div>

                    <div className="tutor-details">
                      <div className="detail-item">
                        <i className="fas fa-map-marker-alt"></i>
                        <span>{tutor.location || tutor.city || ""}</span>
                      </div>
                      <div className="detail-item">
                        <i className="fas fa-clock"></i>
                        <span>
                          {tutor.experience || tutor.experienceYears
                            ? `${
                                tutor.experience || tutor.experienceYears
                              } kinh nghiệm`
                            : ""}
                        </span>
                      </div>
                    </div>

                    <div className="tutor-price">
                      <span className="price-label">Từ</span>
                      <span className="price-value">{priceDisplay}</span>
                      <span className="price-unit">/buổi</span>
                    </div>
                  </div>

                  <button
                    className="remove-favorite-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFavorite(id);
                    }}
                  >
                    <i className="fas fa-heart-broken"></i>
                    Xóa khỏi yêu thích
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="no-results">
            <i className="far fa-heart"></i>
            <h3>Chưa có gia sư yêu thích</h3>
            <p>Hãy thêm gia sư vào danh sách yêu thích của bạn</p>
            <button onClick={() => navigate("/tutors")}>Tìm gia sư ngay</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoriteTutors;
