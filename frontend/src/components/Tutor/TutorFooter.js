import React from 'react';

const TutorFooter = () => (
  <div style={{ marginTop: 24, padding: 16, borderTop: '1px solid #e5e7eb', color: '#64748b', fontSize: 14 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
      <div>© {new Date().getFullYear()} LearnMate. All rights reserved.</div>
      <div style={{ display: 'flex', gap: 12 }}>
        <a href="#" style={{ color: '#64748b' }}>Điều khoản</a>
        <a href="#" style={{ color: '#64748b' }}>Chính sách</a>
        <a href="#" style={{ color: '#64748b' }}>Liên hệ</a>
      </div>
    </div>
  </div>
);

export default TutorFooter;


