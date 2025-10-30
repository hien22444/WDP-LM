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
<<<<<<< HEAD
  X
} from 'lucide-react';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/users', icon: Users, label: 'Users' },
    { path: '/admin/tutors', icon: GraduationCap, label: 'Tutors' },
    { path: '/admin/bookings', icon: Calendar, label: 'Bookings' },
    { path: '/admin/reports', icon: BarChart3, label: 'Reports' },
=======
  X,
  Settings,
  Bell,
  FileText
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
    { path: '/admin/contracts', icon: FileText, label: 'Contracts', color: 'indigo' },
    { path: '/admin/reports', icon: BarChart3, label: 'Reports', color: 'red' },
>>>>>>> Quan3
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
<<<<<<< HEAD
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
            <button onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md mb-1 ${
                    isActive(item.path)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
          </div>
          <nav className="flex-1 px-4 py-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md mb-1 ${
                    isActive(item.path)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:hidden">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <button
                onClick={handleLogout}
                className="flex items-center gap-x-2 text-sm font-semibold leading-6 text-gray-900"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
=======
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
>>>>>>> Quan3
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
