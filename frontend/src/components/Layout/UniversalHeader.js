import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Cookies from 'js-cookie';
import { logout } from '../../redux/slices/userSlice';

const UniversalHeader = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userState = useSelector((s) => s.user);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  const role = useMemo(() => userState?.account?.role || userState?.profile?.role || userState?.role, [userState]);
  const avatar = useMemo(() => (
    userState?.profile?.image ||
    userState?.account?.image ||
    userState?.user?.image ||
    userState?.user?.avatar ||
    'https://res.cloudinary.com/dnyvwjbbm/image/upload/v1760334427/whiteava_m3gka1.jpg'
  ), [userState]);

  const handleLogout = useCallback(() => {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    localStorage.clear();
    dispatch(logout());
    setIsMenuOpen(false);
    navigate('/');
  }, [dispatch, navigate]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target)) setIsMenuOpen(false);
    };
    if (isMenuOpen) document.addEventListener('click', onClickOutside);
    return () => document.removeEventListener('click', onClickOutside);
  }, [isMenuOpen]);

  return (
    <header style={{ background: '#fff', borderBottom: '1px solid #eef2f7', position: 'sticky', top: 0, zIndex: 1500 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 20, position: 'relative' }}>
        {/* Logo */}
        <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
          <img src="/edumatch-logo.png" alt="EduMatch" width={56} height={56} style={{ borderRadius: '50%', background: '#fff', padding: 6, boxShadow: '0 6px 18px rgba(2,8,23,.14)' }} />
          <span style={{ fontWeight: 800, fontSize: 30, letterSpacing: .35 }}>EduMatch</span>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', gap: 28, marginLeft: 28 }}>
          <button onClick={() => navigate('/tutor')} style={{ background: 'transparent', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Tìm gia sư</button>
          <button onClick={() => navigate('/courses')} style={{ background: 'transparent', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Khóa học</button>
          <button onClick={() => navigate('/tutor/onboarding')} style={{ background: 'transparent', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Trở thành gia sư</button>
          <button onClick={() => navigate('/about')} style={{ background: 'transparent', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Về Chúng Tôi</button>
        </nav>

        {/* Search */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 560, display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #e6eef5', borderRadius: 28, padding: 6, boxShadow: '0 1px 0 rgba(0,0,0,0.02)' }}>
            <input
              value={search}
              onChange={(e)=>setSearch(e.target.value)}
              onKeyDown={(e)=>{ if(e.key==='Enter') navigate(`/tutor?q=${encodeURIComponent(search.trim())}`); }}
              placeholder="Tìm kiếm gia sư, môn học..."
              style={{ flex: 1, border: 'none', outline: 'none', padding: '8px 12px', fontSize: 14, borderRadius: 24 }}
            />
            <button onClick={()=>navigate(`/tutor?q=${encodeURIComponent(search.trim())}`)} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#22c3a6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-search" />
            </button>
          </div>
        </div>

        {/* Avatar */}
        <div ref={dropdownRef} style={{ position: 'relative', zIndex: 2000 }}>
          <img
            src={avatar}
            alt="avatar"
            onClick={()=>setIsMenuOpen(v=>!v)}
            style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', border: '3px solid #ff4fa3', padding: 1, cursor: 'pointer' }}
          />
          <div style={{ position: 'absolute', right: 0, top: 54, background: '#fff', border: '1px solid #e9eef3', borderRadius: 16, boxShadow: '0 12px 28px rgba(2,8,23,.12)', minWidth: 240, overflow: 'hidden', display: isMenuOpen ? 'block' : 'none' }}>
            <button onClick={()=>{ setIsMenuOpen(false); navigate('/profile'); }} style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer' }}>Trang cá nhân</button>
            <button onClick={()=>{ setIsMenuOpen(false); navigate('/courses'); }} style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer' }}>Khóa học của tôi</button>
            <button onClick={()=>{ setIsMenuOpen(false); navigate('/bookings/me'); }} style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer' }}>Lịch học</button>
            <button onClick={()=>{ setIsMenuOpen(false); navigate('/profile'); }} style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer' }}>Thanh toán</button>
            <button onClick={()=>{ setIsMenuOpen(false); navigate('/change-password'); }} style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer' }}>Đổi mật khẩu</button>
            <div style={{ height: 1, background: '#eef2f7' }} />
            <button onClick={handleLogout} style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#e11d48' }}>Đăng xuất</button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default UniversalHeader;


