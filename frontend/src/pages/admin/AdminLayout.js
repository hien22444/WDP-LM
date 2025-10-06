import { NavLink, Outlet } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../redux/slices/userSlice";
import "./admin.scss";

const AdminLayout = () => {
  const dispatch = useDispatch();
  const account = useSelector((s) => s.user.user?.account);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
        <div className="brand">
          <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            <div style={{fontSize: '24px'}}>🎓</div>
            <div>
              <div style={{fontSize: '18px', fontWeight: '700'}}>LearnMate</div>
              <div style={{fontSize: '12px', opacity: 0.8}}>Admin Panel</div>
            </div>
          </div>
        </div>
        <nav>
          <NavLink to="/admin" end>
            <span style={{marginRight: '12px', fontSize: '18px'}}>👥</span>
            <span style={{fontSize: '16px', fontWeight: '600'}}>Quản lý Users</span>
          </NavLink>
          <NavLink to="/admin/bookings">
            <span style={{marginRight: '12px', fontSize: '18px'}}>📅</span>
            <span style={{fontSize: '16px', fontWeight: '600'}}>Quản lý Bookings</span>
          </NavLink>
          <NavLink to="/admin/tutors">
            <span style={{marginRight: '12px', fontSize: '18px'}}>👨‍🏫</span>
            <span style={{fontSize: '16px', fontWeight: '600'}}>Quản lý Tutors</span>
          </NavLink>
          <NavLink to="/admin/categories">
            <span style={{marginRight: '12px', fontSize: '18px'}}>📚</span>
            <span style={{fontSize: '16px', fontWeight: '600'}}>Danh mục</span>
          </NavLink>
          <NavLink to="/admin/packages">
            <span style={{marginRight: '12px', fontSize: '18px'}}>📦</span>
            <span style={{fontSize: '16px', fontWeight: '600'}}>Gói học</span>
          </NavLink>
          <NavLink to="/admin/payments">
            <span style={{marginRight: '12px', fontSize: '18px'}}>💳</span>
            <span style={{fontSize: '16px', fontWeight: '600'}}>Thanh toán</span>
          </NavLink>
          <NavLink to="/admin/content">
            <span style={{marginRight: '12px', fontSize: '18px'}}>📝</span>
            <span style={{fontSize: '16px', fontWeight: '600'}}>Nội dung</span>
          </NavLink>
          <NavLink to="/admin/promotions">
            <span style={{marginRight: '12px', fontSize: '18px'}}>🎯</span>
            <span style={{fontSize: '16px', fontWeight: '600'}}>Khuyến mãi</span>
          </NavLink>
          <NavLink to="/admin/notifications">
            <span style={{marginRight: '12px', fontSize: '18px'}}>🔔</span>
            <span style={{fontSize: '16px', fontWeight: '600'}}>Thông báo</span>
          </NavLink>
          <NavLink to="/admin/reports">
            <span style={{marginRight: '12px', fontSize: '18px'}}>📈</span>
            <span style={{fontSize: '16px', fontWeight: '600'}}>Báo cáo</span>
          </NavLink>
        </nav>
      </aside>
      <main className="admin-main">
        <header className="admin-header">
          <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
            <h1 style={{margin: 0, color: '#1e293b', fontSize: '24px', fontWeight: '600'}}>
              👥 Quản lý Users - LearnMate
            </h1>
          </div>
          <div className="account">
            <span>👤 {account?.email}</span>
            <button onClick={handleLogout}>🚪 Logout</button>
          </div>
        </header>
        <section className="admin-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
};

export default AdminLayout;


