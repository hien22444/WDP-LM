import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFavoriteTutors,
  removeFavoriteTutor,
} from "../../services/FavoriteTutorService";
import "./FavoriteTutors.scss";

const FavoriteTutors = () => {
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadFavoriteTutors();
  }, []);

  const loadFavoriteTutors = async () => {
    try {
      setLoading(true);
      const data = await getFavoriteTutors();
      setTutors(data);
    } catch (error) {
      console.error("Error loading favorite tutors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (tutorId) => {
    try {
      await removeFavoriteTutor(tutorId);
      // Reload danh sách sau khi xóa
      loadFavoriteTutors();
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
            {tutors.map((tutor) => (
              <div key={tutor.id} className="tutor-card">
                <div
                  className="tutor-info"
                  onClick={() => handleTutorClick(tutor.id)}
                >
                  <div className="tutor-avatar">
                    <img src={tutor.avatar} alt={tutor.name} />
                    {tutor.verified && (
                      <div className="verified-badge">
                        <i className="fas fa-check-circle"></i>
                      </div>
                    )}
                  </div>

                  <h3 className="tutor-name">{tutor.name}</h3>
                  <div className="tutor-rating">
                    <div className="stars">
                      {[...Array(5)].map((_, i) => (
                        <i
                          key={i}
                          className={`fas fa-star ${
                            i < Math.floor(tutor.rating) ? "filled" : ""
                          }`}
                        />
                      ))}
                    </div>
                    <span className="rating-text">
                      {tutor.rating} ({tutor.reviewCount} đánh giá)
                    </span>
                  </div>

                  <div className="tutor-subjects">
                    {tutor.subjects.map((subject) => (
                      <span key={subject} className="subject-tag">
                        {subject}
                      </span>
                    ))}
                  </div>

                  <div className="tutor-details">
                    <div className="detail-item">
                      <i className="fas fa-map-marker-alt"></i>
                      <span>{tutor.location}</span>
                    </div>
                    <div className="detail-item">
                      <i className="fas fa-clock"></i>
                      <span>{tutor.experience} kinh nghiệm</span>
                    </div>
                  </div>

                  <div className="tutor-price">
                    <span className="price-label">Từ</span>
                    <span className="price-value">
                      {tutor.price.toLocaleString()}đ
                    </span>
                    <span className="price-unit">/buổi</span>
                  </div>
                </div>

                <button
                  className="remove-favorite-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFavorite(tutor.id);
                  }}
                >
                  <i className="fas fa-heart-broken"></i>
                  Xóa khỏi yêu thích
                </button>
              </div>
            ))}
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
