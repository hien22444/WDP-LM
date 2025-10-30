import React, { useState, useEffect } from 'react';
<<<<<<< HEAD
import { Users, GraduationCap, Calendar, DollarSign, TrendingUp, Clock } from 'lucide-react';
import AdminService from '../../services/AdminService';

const AdminDashboard = () => {
=======
import AdminService from '../../services/AdminService';
import AdminSidebar from './AdminSidebar';
import './AdminDashboard.modern.css';

const AdminDashboard = ({ currentUser }) => {
>>>>>>> Quan3
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
<<<<<<< HEAD
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
=======
      <div className="admin-loading">
        <div className="admin-spinner"></div>
>>>>>>> Quan3
      </div>
    );
  }

  const statCards = [
    {
<<<<<<< HEAD
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Total Tutors',
      value: stats?.totalTutors || 0,
      icon: GraduationCap,
      color: 'bg-green-500',
      change: '+8%'
    },
    {
      title: 'Total Bookings',
      value: stats?.totalBookings || 0,
      icon: Calendar,
      color: 'bg-purple-500',
      change: '+15%'
    },
    {
      title: 'Total Revenue',
      value: `$${stats?.totalRevenue || 0}`,
      icon: DollarSign,
      color: 'bg-yellow-500',
      change: '+23%'
    },
    {
      title: 'Pending Tutors',
      value: stats?.pendingTutors || 0,
      icon: Clock,
      color: 'bg-orange-500',
      change: '-5%'
    },
    {
      title: 'Active Users',
      value: stats?.activeUsers || 0,
      icon: TrendingUp,
      color: 'bg-indigo-500',
      change: '+18%'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your platform's performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`p-3 rounded-md ${card.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {card.title}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {card.value}
                        </div>
                        <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                          {card.change}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Users
            </h3>
            <div className="space-y-3">
              {recentActivity?.users?.map((user, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
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
                      user.role === 'admin' ? 'bg-red-100 text-red-800' :
                      user.role === 'tutor' ? 'bg-blue-100 text-blue-800' :
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
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Bookings
            </h3>
            <div className="space-y-3">
              {recentActivity?.bookings?.map((booking, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-gray-600" />
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
=======
      title: 'Tổng người dùng',
      value: stats?.totalUsers || 0,
      icon: '👤',
      color: 'blue',
      change: '+12%',
      description: 'Tổng số người dùng đã đăng ký'
    },
    {
      title: 'Tổng gia sư',
      value: stats?.totalTutors || 0,
      icon: '🎓',
      color: 'purple',
      change: '+8%',
      description: 'Số gia sư đã được duyệt'
    },
    {
      title: 'Tổng đặt lịch',
      value: stats?.totalBookings || 0,
      icon: '📅',
      color: 'green',
      change: '+15%',
      description: 'Tổng số buổi học đã đặt'
    },
    {
      title: 'Doanh thu',
      value: `${stats?.totalRevenue || 0} VNĐ`,
      icon: '💲',
      color: 'orange',
      change: '+23%',
      description: 'Tổng doanh thu hệ thống'
    },
    {
      title: 'Chờ duyệt',
      value: stats?.pendingTutors || 0,
      icon: '⏰',
      color: 'red',
      change: '-5%',
      description: 'Gia sư chờ duyệt'
    },
    {
      title: 'Người dùng hoạt động',
      value: stats?.activeUsers || 0,
      icon: '✅',
      color: 'green',
      change: '+9%',
      description: 'Người dùng đang hoạt động'
    }
  ];

  if (!currentUser || currentUser.role !== 'admin') {
    return <div className="admin-no-access">Bạn không có quyền truy cập trang này.</div>;
  }

  return (
    <div className="admin-dashboard">
      {/* Welcome Section */}
      <div className="admin-welcome">
        <div className="admin-welcome-content">
          <h1 className="admin-welcome-title">Chào mừng đến với Admin Panel</h1>
          <p className="admin-welcome-subtitle">Quản lý và theo dõi hệ thống EduMatch</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="admin-stats-grid">
        {statCards.map((stat, idx) => (
          <div className={`admin-stat-card ${stat.color}`} key={idx}>
            <div className="admin-stat-header">
              <div className="admin-stat-icon">{stat.icon}</div>
              <div className="admin-stat-change">
                <span>📈</span>
                {stat.change}
              </div>
            </div>
            <div className="admin-stat-content">
              <div className="admin-stat-value">{stat.value}</div>
              <div className="admin-stat-title">{stat.title}</div>
              <div className="admin-stat-description">{stat.description}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Activity Section */}
      <div className="admin-activity">
        <div className="admin-activity-grid">
          {/* Recent Users */}
          <div className="admin-activity-card">
            <div className="admin-activity-header">
              <h3 className="admin-activity-title">Người dùng mới</h3>
              <a href="/admin/users" className="admin-activity-link">Xem tất cả</a>
            </div>
            <div className="admin-activity-list">
              {recentActivity?.users?.length > 0 ? (
                recentActivity.users.map((user, index) => (
                  <div key={index} className="admin-activity-item">
                    <div className="admin-activity-avatar">
                      {user.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="admin-activity-content">
                      <div className="admin-activity-text">{user.full_name}</div>
                      <div className="admin-activity-time">
                        {new Date(user.created_at).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="admin-empty">
                  <div className="admin-empty-icon">👥</div>
                  <div className="admin-empty-title">Chưa có người dùng mới</div>
                  <div className="admin-empty-message">Sẽ hiển thị khi có người dùng đăng ký</div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="admin-activity-card">
            <div className="admin-activity-header">
              <h3 className="admin-activity-title">Đặt lịch gần đây</h3>
              <a href="/admin/bookings" className="admin-activity-link">Xem tất cả</a>
            </div>
            <div className="admin-activity-list">
              {recentActivity?.bookings?.length > 0 ? (
                recentActivity.bookings.map((booking, index) => (
                  <div key={index} className="admin-activity-item">
                    <div className="admin-activity-avatar">📅</div>
                    <div className="admin-activity-content">
                      <div className="admin-activity-text">
                        {booking.student?.full_name} - {booking.tutorProfile?.user?.full_name}
                      </div>
                      <div className="admin-activity-time">
                        {new Date(booking.start).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                    <div className={`admin-activity-status ${booking.status}`}>
                      {booking.status === 'completed' ? 'Hoàn thành' :
                       booking.status === 'pending' ? 'Chờ xử lý' : 'Đã hủy'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="admin-empty">
                  <div className="admin-empty-icon">📅</div>
                  <div className="admin-empty-title">Chưa có đặt lịch</div>
                  <div className="admin-empty-message">Sẽ hiển thị khi có buổi học được đặt</div>
                </div>
>>>>>>> Quan3
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
