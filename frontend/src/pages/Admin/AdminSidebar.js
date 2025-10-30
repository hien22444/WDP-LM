import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const menu = [
  { label: 'Users', key: 'users', path: '/admin/users' },
  { label: 'Tutors', key: 'tutors', path: '/admin/tutors' },
  { label: 'Bookings', key: 'bookings', path: '/admin/bookings' },
  { label: 'Reports', key: 'reports', path: '/admin/reports' }
];

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-title">Admin Panel</div>
      <nav>
        {menu.map(item => (
          <button
            key={item.key}
            className={`admin-sidebar-btn${location.pathname.startsWith(item.path) ? ' active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default AdminSidebar;
