import React, { useState, useEffect } from 'react';
import AdminService from '../../services/AdminService';
import AdminSidebar from './AdminSidebar';
import './AdminDashboard.css';

const AdminDashboard = ({ currentUser }) => {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await AdminService.getDashboardStats();
      setStats(response.data.stats);
      setRecentActivity(response.data.recentActivity);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: '👤',
      color: 'linear-gradient(135deg,#2563eb 60%,#60a5fa 100%)',
      change: '+12%'
    },
    {
      title: 'Total Tutors',
      value: stats?.totalTutors || 0,
      icon: '🎓',
      color: 'linear-gradient(135deg,#1e40af 60%,#818cf8 100%)',
      change: '+8%'
    },
    {
      title: 'Total Bookings',
      value: stats?.totalBookings || 0,
      icon: '📅',
      color: 'linear-gradient(135deg,#0ea5e9 60%,#38bdf8 100%)',
      change: '+15%'
    },
    {
      title: 'Total Revenue',
      value: `$${stats?.totalRevenue || 0}`,
      icon: '💲',
      color: 'linear-gradient(135deg,#f59e42 60%,#fbbf24 100%)',
      change: '+23%'
    },
    {
      title: 'Pending Tutors',
      value: stats?.pendingTutors || 0,
      icon: '⏰',
      color: 'linear-gradient(135deg,#f43f5e 60%,#fca5a5 100%)',
      change: '-5%'
    },
    {
      title: 'Active Users',
      value: stats?.activeUsers || 0,
      icon: '📈',
      color: 'linear-gradient(135deg,#22c55e 60%,#bbf7d0 100%)',
      change: '+9%'
    }
  ];

  if (!currentUser || currentUser.role !== 'admin') {
    return <div className="admin-no-access">Bạn không có quyền truy cập trang này.</div>;
  }

  return (
    <div className="admin-dashboard-layout">
      <AdminSidebar />
      <div className="admin-dashboard-content">
        {/* Đã xóa header avatar và logout góc phải */}
        <header className="admin-dashboard-header">
          <h1>Admin Dashboard</h1>
        </header>
        <main>
          <div className="admin-stats-grid">
            {statCards.map((stat, idx) => (
              <div className="admin-stat-card" key={idx} style={{background: stat.color}}>
                <div className="admin-stat-icon">{stat.icon}</div>
                <div className="admin-stat-info">
                  <div className="admin-stat-label">{stat.title}</div>
                  <div className="admin-stat-value">{stat.value}</div>
                  <div className="admin-stat-growth">{stat.change}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Users */}
            <div className="bg-white shadow admin-blue-border">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-blue-900 mb-4">
                  Recent Users
                </h3>
                <div className="space-y-3">
                  {recentActivity?.users?.map((user, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full admin-blue-bg flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-700">
                            {user.full_name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.full_name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                          user.role === 'tutor' ? 'bg-blue-200 text-blue-700' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                    </div>
                  )) || (
                    <p className="text-sm text-gray-500">No recent users</p>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Bookings */}
            <div className="bg-white shadow admin-blue-border">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-blue-900 mb-4">
                  Recent Bookings
                </h3>
                <div className="space-y-3">
                  {recentActivity?.bookings?.map((booking, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full admin-blue-bg flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-700">
                            📅
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {booking.student?.full_name} → {booking.tutorProfile?.user?.full_name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {new Date(booking.start).toLocaleDateString()} - ${booking.price}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  )) || (
                    <p className="text-sm text-gray-500">No recent bookings</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
