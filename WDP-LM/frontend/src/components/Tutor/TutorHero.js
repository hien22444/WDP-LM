import React from 'react';
import { useNavigate } from 'react-router-dom';

const TutorHero = () => {
  const navigate = useNavigate();
  return (
    <div style={{
      borderRadius: 16,
      padding: 24,
      background: 'linear-gradient(135deg, #eef2ff 0%, #e9d5ff 100%)',
      border: '1px solid #e5e7eb',
      marginBottom: 16
    }}>
      <h1 style={{ margin: 0 }}>Tìm gia sư và khóa học phù hợp</h1>
      <p style={{ color: '#475569', marginTop: 6 }}>
        Khám phá các khóa học mở hoặc đăng lịch dạy để học viên đặt ngay.
      </p>
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/tutor/publish')} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #4f46e5', background: '#4f46e5', color: '#fff' }}>Đăng khóa học</button>
        <button onClick={() => navigate('/courses')} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff' }}>Xem khóa học mở</button>
      </div>
    </div>
  );
};

export default TutorHero;


