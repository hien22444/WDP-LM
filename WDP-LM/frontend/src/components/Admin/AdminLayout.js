import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  Calendar, 
  BarChart3, 
  LogOut,
  Menu,
  X,
  Settings,
  Bell
} from 'lucide-react';
import './AdminLayout.modern.css';

const AdminLayout = () => {
  console.log('AdminLayout - Component loaded');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const adminName = 'Admin'; // Có thể lấy từ state

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', color: 'blue' },
    { path: '/admin/users', icon: Users, label: 'Users', color: 'green' },
    { path: '/admin/tutors', icon: GraduationCap, label: 'Tutors', color: 'purple' },
    { path: '/admin/bookings', icon: Calendar, label: 'Bookings', color: 'orange' },
    { path: '/admin/reports', icon: BarChart3, label: 'Reports', color: 'red' },
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
    <div className="admin-layout-root">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="admin-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-logo">
            <div className="admin-logo-icon">🎓</div>
            <div className="admin-logo-text">
              <span className="admin-logo-title">EduMatch</span>
              <span className="admin-logo-subtitle">Admin Panel</span>
            </div>
          </div>
          <button 
            className="admin-sidebar-close"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="admin-sidebar-menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`admin-sidebar-link ${isActive(item.path) ? 'active' : ''} ${item.color}`}
                onClick={() => setSidebarOpen(false)}
              >
                <div className="admin-menu-icon">
                  <Icon size={20} />
                </div>
                <span className="admin-menu-label">{item.label}</span>
                {isActive(item.path) && <div className="admin-menu-indicator" />}
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <div className="admin-user-avatar">
              <span>{adminName.charAt(0)}</span>
            </div>
            <div className="admin-user-details">
              <span className="admin-user-name">{adminName}</span>
              <span className="admin-user-role">Administrator</span>
            </div>
          </div>
          <button onClick={handleLogout} className="admin-logout-btn">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="admin-main">
        {/* Top Header */}
        <header className="admin-header">
          <div className="admin-header-left">
            <button 
              className="admin-menu-toggle"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className="admin-breadcrumb">
              <span>Admin Panel</span>
              <span>/</span>
              <span>{menuItems.find(item => isActive(item.path))?.label || 'Dashboard'}</span>
            </div>
          </div>
          <div className="admin-header-right">
            <button className="admin-notification-btn">
              <Bell size={20} />
              <span className="admin-notification-badge">3</span>
            </button>
            <button className="admin-settings-btn">
              <Settings size={20} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
