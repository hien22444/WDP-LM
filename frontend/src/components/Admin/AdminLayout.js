import React, { useState, useEffect } from 'react';
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
  CreditCard,
  FolderCog,
  Server,
  Sun,
  Moon
} from 'lucide-react';
import { useSelector } from 'react-redux';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem('adminTheme') === 'dark'; } catch { return false; }
  });
  const [primary, setPrimary] = useState(() => {
    try { return localStorage.getItem('adminPrimary') || '#2563eb'; } catch { return '#2563eb'; }
  });
  const location = useLocation();
  const navigate = useNavigate();
  const userState = useSelector((state) => state.user);
  const user = userState?.user || userState;
  const userRole = (user?.role || user?.account?.role || userState?.account?.role || userState?.role || '').toLowerCase();

  const allMenuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Bảng điều khiển', roles: ['admin', 'staff'] },
    { path: '/admin/users', icon: Users, label: 'Người dùng', roles: ['admin', 'support'] },
    { path: '/admin/tutors', icon: GraduationCap, label: 'Gia sư', roles: ['admin', 'moderator', 'staff'] },
    { path: '/admin/bookings', icon: Calendar, label: 'Đặt lịch', roles: ['admin', 'moderator', 'staff', 'support'] },
    { path: '/admin/reports', icon: BarChart3, label: 'Báo cáo', roles: ['admin', 'staff'] },
    { path: '/admin/categories', icon: FolderCog, label: 'Danh mục', roles: ['admin', 'staff'] },
    { path: '/admin/payments', icon: CreditCard, label: 'Thanh toán', roles: ['admin', 'staff'] },
    { path: '/admin/settings', icon: Settings, label: 'Cài đặt', roles: ['admin'] },
    { path: '/admin/system', icon: Server, label: 'Hệ thống', roles: ['admin'] }
  ];

  const menuItems = allMenuItems.filter(item => !item.roles || item.roles.includes(userRole));

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

  useEffect(() => {
    try { localStorage.setItem('adminTheme', isDark ? 'dark' : 'light'); } catch {}
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  useEffect(() => {
    try { localStorage.setItem('adminPrimary', primary); } catch {}
    document.documentElement.style.setProperty('--admin-primary', primary);
  }, [primary]);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'}`}>
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-bold text-gray-900">Bảng quản trị</h1>
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
        <div className="flex flex-col flex-grow bg-white/90 backdrop-blur border-r border-gray-200">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-xl font-extrabold" style={{color:'var(--admin-primary, #2563eb)'}}>Bảng quản trị</h1>
          </div>
          <nav className="flex-1 px-4 py-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md mb-1 transition-colors ${
                    isActive(item.path)
                      ? 'bg-blue-600/10 text-blue-700 ring-1 ring-blue-600/20'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 ${isActive(item.path) ? 'text-blue-700' : ''}`} />
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
              Đăng xuất
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white/80 backdrop-blur px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:hidden">
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
                onClick={() => setIsDark(!isDark)}
                className="flex items-center gap-x-2 text-sm font-semibold leading-6 text-gray-900"
                title="Chuyển chế độ sáng/tối"
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <div className="flex items-center gap-2">
                <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} title="Màu chủ đạo" className="h-6 w-6 p-0 border-0 bg-transparent" />
                {/* Preset brand colors */}
                <div className="flex gap-1">
                  {['#2563eb','#10b981','#7c3aed','#ef4444','#f59e0b'].map((c) => (
                    <button key={c} onClick={() => setPrimary(c)} className="h-5 w-5 rounded-full" style={{backgroundColor:c}} title={c}></button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-x-2 text-sm font-semibold leading-6 text-gray-900"
              >
                <LogOut className="h-6 w-6" />
                Đăng xuất
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Admin identity banner */}
            <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-blue-900">
                  Bạn đang ở khu vực quản trị.
                  <span className="ml-2 font-semibold">{user?.full_name || user?.email}</span>
                  <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                    Vai trò: {userRole}
                  </span>
                </div>
                <div className="text-xs text-blue-700">{new Date().toLocaleString()}</div>
              </div>
            </div>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;