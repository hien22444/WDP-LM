import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, GraduationCap, Calendar, DollarSign, TrendingUp, Clock } from 'lucide-react';
import AdminService from '../../services/AdminService';
import './spark.css';
import './admin.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [presetDays, setPresetDays] = useState('30');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    // draw simple bar chart without external libs
    try {
      const ctx = document.getElementById('revChart');
      if (!ctx || !revenue?.length) return;
      const canvas = ctx;
      const c = canvas.getContext('2d');
      const width = canvas.width = canvas.clientWidth;
      const height = canvas.height;
      c.clearRect(0,0,width,height);
      const max = Math.max(...revenue.map(r => r.totalRevenue || 0), 1);
      const pad = 24;
      const barW = Math.max(8, (width - pad*2) / (revenue.length * 1.5));
      const gap = barW/2;
      c.fillStyle = '#e5e7eb';
      c.fillRect(0, height-1, width, 1);
      revenue.forEach((r, i) => {
        const h = Math.round((r.totalRevenue / max) * (height - pad*2));
        const x = pad + i * (barW + gap);
        const y = height - pad - h;
        c.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--admin-primary') || '#2563eb';
        c.globalAlpha = 0.85;
        c.fillRect(x, y, barW, h);
        c.globalAlpha = 1;
      });
    } catch {}
  }, [revenue]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await AdminService.getDashboardStats();
      const params = {};
      if (dateRange.startDate && dateRange.endDate) {
        params.startDate = dateRange.startDate;
        params.endDate = dateRange.endDate;
      }
      const revenueRes = await AdminService.getRevenueReport(params);
      setStats(response.data.stats);
      setRecentActivity(response.data.recentActivity);
      setRevenue(revenueRes.data || []);
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
      title: 'Tổng người dùng',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'bg-blue-500',
      bg: '#2563eb',
      change: '+12%',
      action: { label: 'Quản lý người dùng', to: '/admin/users' }
    },
    {
      title: 'Tổng gia sư',
      value: stats?.totalTutors || 0,
      icon: GraduationCap,
      color: 'bg-green-500',
      bg: '#16a34a',
      change: '+8%',
      action: { label: 'Quản lý gia sư', to: '/admin/tutors' }
    },
    {
      title: 'Tổng đặt lịch',
      value: stats?.totalBookings || 0,
      icon: Calendar,
      color: 'bg-purple-500',
      bg: '#7c3aed',
      change: '+15%',
      action: { label: 'Quản lý đặt lịch', to: '/admin/bookings' }
    },
    {
      title: 'Tổng doanh thu',
      value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats?.totalRevenue || 0),
      icon: DollarSign,
      color: 'bg-yellow-500',
      bg: '#f59e0b',
      change: '+23%',
      action: { label: 'Xem báo cáo', to: '/admin/reports' }
    },
    {
      title: 'Gia sư chờ duyệt',
      value: stats?.pendingTutors || 0,
      icon: Clock,
      color: 'bg-orange-500',
      change: '-5%',
      action: { label: 'Duyệt hồ sơ', to: '/admin/tutors' }
    },
    {
      title: 'Người dùng hoạt động',
      value: stats?.activeUsers || 0,
      icon: TrendingUp,
      color: 'bg-indigo-500',
      change: '+18%'
    }
  ];

  return (
    <div className="admin-root" style={{ background:'#f5f7fb' }}>
      <div className="admin-container">
        <div>
          <div className="admin-title">Bảng điều khiển</div>
          <div className="admin-sub">Tổng quan hiệu suất nền tảng</div>
        </div>

        {/* 4 KPI chính - fallback CSS thuần để tránh phụ thuộc Tailwind */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {statCards.slice(0,4).map((card, index) => {
            const Icon = card.icon;
            return (
              <div key={index} style={{ background: card.bg, color:'#fff', borderRadius: 14, boxShadow: '0 8px 24px rgba(0,0,0,.12)' }}>
                <div style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 13, opacity: .9 }}>{card.title}</div>
                      <div style={{ marginTop: 4, fontSize: 28, fontWeight: 800 }}>{card.value}</div>
                      <div style={{ marginTop: 4, fontSize: 12, fontWeight: 600, opacity: .9 }}>{card.change}</div>
                    </div>
                    <div style={{ padding: 10, borderRadius: 10, background: 'rgba(255,255,255,.18)' }}>
                      <Icon size={20} color="#fff" />
                    </div>
                  </div>
                  {card.action && (
                    <div style={{ marginTop: 12 }}>
                      <button
                        onClick={() => navigate(card.action.to)}
                        style={{ padding: '6px 10px', fontSize: 12, fontWeight: 700, borderRadius: 8, background: 'rgba(255,255,255,.22)', color: '#fff', border: 'none', cursor: 'pointer' }}
                      >
                        {card.action.label}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Biểu đồ doanh thu + preset thời gian */}
        <div className="admin-section">
          <h3>Doanh thu theo tháng</h3>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex gap-1">
              {['7','30','90'].map((p) => (
                <button key={p} onClick={() => { setPresetDays(p); setDateRange({ startDate:'', endDate:'' }); fetchDashboardData(); }} className="admin-btn" style={{ background: presetDays===p ? '#2563eb' : '#0ea5e9' }}>{p} ngày</button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <input type="date" value={dateRange.startDate} onChange={(e)=>setDateRange(r=>({...r,startDate:e.target.value}))} style={{ border:'1px solid #e2e8f0', borderRadius:8, padding:'6px 8px', fontSize:12 }} />
              <span className="text-sm text-gray-500">đến</span>
              <input type="date" value={dateRange.endDate} onChange={(e)=>setDateRange(r=>({...r,endDate:e.target.value}))} style={{ border:'1px solid #e2e8f0', borderRadius:8, padding:'6px 8px', fontSize:12 }} />
              <button onClick={fetchDashboardData} className="admin-btn">Áp dụng</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[560px]">
              <canvas id="revChart" height="160"></canvas>
            </div>
          </div>
        </div>

        {/* Hoạt động gần đây (gộp) */}
        <div className="admin-section">
          <h3>Hoạt động gần đây</h3>
            <div>
              {recentActivity?.bookings?.map((booking, index) => (
                <div key={index} className="admin-recent-item">
                  <div style={{ width:32, height:32, borderRadius:999, background:'#e2e8f0', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Calendar size={16} color="#475569" />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:600, color:'#0f172a', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {booking.student?.full_name} → {booking.tutorProfile?.user?.full_name}
                    </div>
                    <div style={{ fontSize:12, color:'#64748b' }}>
                      {new Date(booking.start).toLocaleDateString()} - ${booking.price}
                    </div>
                  </div>
                  <div>
                    <span className={`admin-badge ${
                      booking.status === 'completed' ? 'badge-green' :
                      booking.status === 'pending' ? 'badge-yellow' :
                      booking.status === 'cancelled' ? 'badge-red' :
                      'badge-blue'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
              {(!recentActivity?.bookings || recentActivity.bookings.length === 0) && (
                <p style={{ fontSize:13, color:'#64748b' }}>Chưa có hoạt động</p>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;