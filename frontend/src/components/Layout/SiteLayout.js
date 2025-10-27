import React from "react";
import { Link, Outlet } from "react-router-dom";

const SiteLayout = ({ children }) => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#111' }}>
            <img src="/edumatch-logo.png" alt="EduMatch" width={32} height={32} />
            <strong>EduMatch</strong>
          </Link>
          <nav style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Link to="/tutor">Tìm gia sư</Link>
            <Link to="/bookings/me">Đặt lịch của tôi</Link>
            <Link to="/bookings/tutor">Yêu cầu gia sư</Link>
            <Link to="/tutor/onboarding" style={{ padding: '6px 10px', border: '1px solid #a78bfa', borderRadius: 8 }}>Trở thành gia sư</Link>
          </nav>
        </div>
      </header>
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <footer style={{ borderTop: '1px solid #e5e7eb', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px', color: '#64748b', fontSize: 14 }}>
          © 2025 EduMatch. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default SiteLayout;


