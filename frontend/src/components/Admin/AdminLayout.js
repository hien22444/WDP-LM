import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  Calendar, 
  BarChart3, 
  LogOut,
} from 'lucide-react';
import './AdminLayout.modern.css';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const adminName = 'Admin'; // Có thể lấy từ state

  const menuItems = [
    // { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' }, // Ẩn Dashboard
    { path: '/admin/users', icon: Users, label: 'Users' },
    { path: '/admin/tutors', icon: GraduationCap, label: 'Tutors' },
    { path: '/admin/bookings', icon: Calendar, label: 'Bookings' },
    { path: '/admin/reports', icon: BarChart3, label: 'Reports' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="admin-layout-root flex">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <span>EduMatch</span>
        </div>
        <nav className="admin-sidebar-menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`admin-sidebar-link${isActive(item.path) ? ' active' : ''}`}
              >
                <Icon />
                <span style={{fontSize: '1rem'}}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="admin-sidebar-footer">
          <button onClick={handleLogout} className="admin-logout-btn">
            <LogOut style={{marginRight: 8}} /> Logout
          </button>
        </div>
      </aside>
      {/* Main content */}
      <div className="admin-main">
        {/* Xóa header avatar và logout góc phải */}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
