import React from 'react';
import { useNavigate } from 'react-router-dom';

const BackHomeButton = ({ className }) => {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate('/')}
      className={className}
      style={{
        padding: '8px 12px',
        borderRadius: 8,
        border: '1px solid #e5e7eb',
        background: '#fff',
        cursor: 'pointer'
      }}
    >
      ← Trang chủ
    </button>
  );
};

export default BackHomeButton;


