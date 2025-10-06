const AdminDashboard = () => {
  return (
    <div>
      <div style={{marginBottom: '32px'}}>
        <h1 style={{color: '#1e293b', fontSize: '32px', fontWeight: '700', margin: '0 0 8px 0'}}>
          🎓 Platform Overview
        </h1>
        <p style={{color: '#64748b', fontSize: '16px', margin: 0}}>
          Monitor and manage your LearnMate tutoring platform
        </p>
      </div>
      
      <div className="kpi-grid">
        <div className="kpi-card">
          <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px'}}>
            <div style={{fontSize: '24px'}}>📅</div>
            <h4>Total Bookings</h4>
          </div>
          <p>1,247</p>
          <div style={{color: '#10b981', fontSize: '14px', fontWeight: '600'}}>↗ +12% this month</div>
        </div>
        
        <div className="kpi-card">
          <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px'}}>
            <div style={{fontSize: '24px'}}>💰</div>
            <h4>Revenue</h4>
          </div>
          <p>$24,580</p>
          <div style={{color: '#10b981', fontSize: '14px', fontWeight: '600'}}>↗ +8% this month</div>
        </div>
        
        <div className="kpi-card">
          <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px'}}>
            <div style={{fontSize: '24px'}}>👨‍🏫</div>
            <h4>Active Tutors</h4>
          </div>
          <p>156</p>
          <div style={{color: '#3b82f6', fontSize: '14px', fontWeight: '600'}}>↗ +5 new this week</div>
        </div>
        
        <div className="kpi-card">
          <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px'}}>
            <div style={{fontSize: '24px'}}>👥</div>
            <h4>Learners</h4>
          </div>
          <p>2,341</p>
          <div style={{color: '#8b5cf6', fontSize: '14px', fontWeight: '600'}}>↗ +23 new this week</div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '24px',
        marginTop: '32px'
      }}>
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{color: '#1e293b', margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600'}}>
            📈 Recent Activity
          </h3>
          <div style={{color: '#64748b'}}>
            <p>• New tutor registration: Sarah Johnson (Math)</p>
            <p>• Booking completed: Advanced Calculus session</p>
            <p>• Payment received: $150 from John Doe</p>
            <p>• New learner signup: Emily Chen</p>
          </div>
        </div>
        
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{color: '#1e293b', margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600'}}>
            🚀 Quick Actions
          </h3>
          <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
            <button style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '12px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500'
            }}>
              📊 View Reports
            </button>
            <button style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              padding: '12px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500'
            }}>
              👥 Manage Users
            </button>
            <button style={{
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              padding: '12px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500'
            }}>
              📝 Create Content
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;


