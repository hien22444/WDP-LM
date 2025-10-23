import React, { useState, useEffect } from 'react';
import { getTutorReviews, markReviewHelpful, reportReview } from '../../services/ReviewService';
import './ReviewList.scss';

const ReviewList = ({ tutorId, showHeader = true }) => {
  const [reviews, setReviews] = useState([]);
  const [ratingStats, setRatingStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    loadReviews();
  }, [tutorId, pagination.page, sortBy]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await getTutorReviews(tutorId, {
        page: pagination.page,
        limit: pagination.limit,
        sortBy
      });
      
      setReviews(response.reviews);
      setRatingStats(response.ratingStats);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleMarkHelpful = async (reviewId) => {
    try {
      await markReviewHelpful(reviewId);
      // Update local state
      setReviews(prev => prev.map(review => 
        review._id === reviewId 
          ? { ...review, helpful: review.helpful + 1 }
          : review
      ));
    } catch (error) {
      console.error('Error marking review as helpful:', error);
    }
  };

  const handleReport = async (reviewId, reason) => {
    try {
      await reportReview(reviewId, reason);
      alert('Đánh giá đã được báo cáo. Cảm ơn bạn đã phản hồi!');
    } catch (error) {
      console.error('Error reporting review:', error);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span
        key={index}
        className={`star ${index < rating ? 'filled' : 'empty'}`}
      >
        ⭐
      </span>
    ));
  };

  const renderRatingStats = () => {
    if (!ratingStats) return null;

    return (
      <div className="rating-stats">
        <div className="overall-rating">
          <div className="rating-number">{ratingStats.rating}</div>
          <div className="rating-stars">
            {renderStars(Math.round(ratingStats.rating))}
          </div>
          <div className="rating-count">
            ({ratingStats.totalReviews} đánh giá)
          </div>
        </div>
        
        <div className="category-stats">
          {Object.entries(ratingStats.categories).map(([key, value]) => (
            <div key={key} className="category-stat">
              <span className="category-name">
                {key === 'teaching' && 'Giảng dạy'}
                {key === 'punctuality' && 'Đúng giờ'}
                {key === 'communication' && 'Giao tiếp'}
                {key === 'preparation' && 'Chuẩn bị'}
                {key === 'friendliness' && 'Thân thiện'}
              </span>
              <div className="category-rating">
                <div className="stars">{renderStars(Math.round(value))}</div>
                <span className="value">{value.toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderReview = (review) => (
    <div key={review._id} className="review-item">
      <div className="review-header">
        <div className="reviewer-info">
          <div className="avatar">
            {review.isAnonymous ? '👤' : (review.student?.avatar ? 
              <img src={review.student.avatar} alt="Avatar" /> : '👤')}
          </div>
          <div className="reviewer-details">
            <div className="name">
              {review.isAnonymous ? 'Người dùng ẩn danh' : review.student?.full_name}
            </div>
            <div className="date">
              {new Date(review.created_at).toLocaleDateString('vi-VN')}
            </div>
          </div>
        </div>
        <div className="review-rating">
          {renderStars(review.rating)}
        </div>
      </div>

      {review.comment && (
        <div className="review-comment">
          {review.comment}
        </div>
      )}

      <div className="review-categories">
        {Object.entries(review.categories).map(([key, value]) => (
          <div key={key} className="category-item">
            <span className="category-label">
              {key === 'teaching' && 'Giảng dạy'}
              {key === 'punctuality' && 'Đúng giờ'}
              {key === 'communication' && 'Giao tiếp'}
              {key === 'preparation' && 'Chuẩn bị'}
              {key === 'friendliness' && 'Thân thiện'}
            </span>
            <div className="category-stars">
              {renderStars(value)}
            </div>
          </div>
        ))}
      </div>

      {review.response && (
        <div className="tutor-response">
          <div className="response-header">
            <strong>Phản hồi từ gia sư</strong>
            <span className="response-date">
              {new Date(review.response.respondedAt).toLocaleDateString('vi-VN')}
            </span>
          </div>
          <div className="response-comment">
            {review.response.comment}
          </div>
        </div>
      )}

      <div className="review-actions">
        <button 
          className="helpful-btn"
          onClick={() => handleMarkHelpful(review._id)}
        >
          👍 Hữu ích ({review.helpful})
        </button>
        <button 
          className="report-btn"
          onClick={() => {
            const reason = prompt('Lý do báo cáo:');
            if (reason) handleReport(review._id, reason);
          }}
        >
          🚨 Báo cáo
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="review-list loading">
        <div className="loading-spinner">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="review-list">
      {showHeader && (
        <div className="review-header-section">
          <h3>Đánh giá và nhận xét</h3>
          {renderRatingStats()}
        </div>
      )}

      <div className="review-controls">
        <div className="sort-controls">
          <label>Sắp xếp theo:</label>
          <select 
            value={sortBy} 
            onChange={(e) => handleSortChange(e.target.value)}
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="highest">Đánh giá cao</option>
            <option value="lowest">Đánh giá thấp</option>
          </select>
        </div>
      </div>

      <div className="reviews-container">
        {reviews.length === 0 ? (
          <div className="no-reviews">
            <p>Chưa có đánh giá nào cho gia sư này.</p>
          </div>
        ) : (
          reviews.map(renderReview)
        )}
      </div>

      {pagination.pages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="page-btn"
          >
            Trước
          </button>
          
          <span className="page-info">
            Trang {pagination.page} / {pagination.pages}
          </span>
          
          <button 
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
            className="page-btn"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewList;
