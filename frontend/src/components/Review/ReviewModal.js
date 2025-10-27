import React, { useState } from 'react';
import { createReview } from '../../services/ReviewService';
import './ReviewModal.scss';

const ReviewModal = ({ isOpen, onClose, booking, onSuccess }) => {
  const [formData, setFormData] = useState({
    rating: 5,
    comment: '',
    categories: {
      teaching: 5,
      punctuality: 5,
      communication: 5,
      preparation: 5,
      friendliness: 5
    },
    isAnonymous: false
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createReview({
        bookingId: booking._id,
        ...formData
      });
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error creating review:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (category, value) => {
    setFormData(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: value
      }
    }));
  };

  const handleOverallRatingChange = (value) => {
    setFormData(prev => ({
      ...prev,
      rating: value,
      categories: {
        teaching: value,
        punctuality: value,
        communication: value,
        preparation: value,
        friendliness: value
      }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="review-modal-overlay">
      <div className="review-modal">
        <div className="review-modal-header">
          <h2>Đánh giá buổi học</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="review-modal-content">
          {booking && (
            <div className="booking-info">
              <h3>Thông tin buổi học</h3>
              <p><strong>Gia sư:</strong> {booking.tutorProfile?.user?.full_name}</p>
              <p><strong>Thời gian:</strong> {new Date(booking.start).toLocaleString('vi-VN')}</p>
              <p><strong>Hình thức:</strong> {booking.mode === 'online' ? 'Trực tuyến' : 'Tại nhà'}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="review-form">
            {/* Overall Rating */}
            <div className="rating-section">
              <label>Đánh giá tổng thể *</label>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    className={`star ${star <= formData.rating ? 'active' : ''}`}
                    onClick={() => handleOverallRatingChange(star)}
                  >
                    ⭐
                  </button>
                ))}
                <span className="rating-text">
                  {formData.rating === 1 && 'Rất tệ'}
                  {formData.rating === 2 && 'Tệ'}
                  {formData.rating === 3 && 'Bình thường'}
                  {formData.rating === 4 && 'Tốt'}
                  {formData.rating === 5 && 'Rất tốt'}
                </span>
              </div>
            </div>

            {/* Category Ratings */}
            <div className="category-ratings">
              <h4>Đánh giá chi tiết</h4>
              
              {Object.entries({
                teaching: 'Chất lượng giảng dạy',
                punctuality: 'Đúng giờ',
                communication: 'Giao tiếp',
                preparation: 'Chuẩn bị bài học',
                friendliness: 'Thân thiện'
              }).map(([key, label]) => (
                <div key={key} className="category-rating">
                  <label>{label}</label>
                  <div className="star-rating small">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        className={`star ${star <= formData.categories[key] ? 'active' : ''}`}
                        onClick={() => handleRatingChange(key, star)}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Comment */}
            <div className="comment-section">
              <label htmlFor="comment">Nhận xét (tùy chọn)</label>
              <textarea
                id="comment"
                value={formData.comment}
                onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Chia sẻ trải nghiệm của bạn về buổi học..."
                maxLength={1000}
                rows={4}
              />
              <div className="char-count">
                {formData.comment.length}/1000 ký tự
              </div>
            </div>

            {/* Anonymous option */}
            <div className="anonymous-section">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.isAnonymous}
                  onChange={(e) => setFormData(prev => ({ ...prev, isAnonymous: e.target.checked }))}
                />
                <span className="checkmark"></span>
                Đánh giá ẩn danh
              </label>
            </div>

            {/* Submit buttons */}
            <div className="form-actions">
              <button type="button" onClick={onClose} className="btn-cancel">
                Hủy
              </button>
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
