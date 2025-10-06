import { useEffect, useState } from "react";
import apiClient from "../../services/ApiService";
import BlockReasonModal from "../../components/Admin/BlockReasonModal";

const UsersPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [reason, setReason] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/users", { params: { q } });
      setItems(res.data.items || []);
    } catch (e) {
      const msg = e?.response?.data?.message || "Failed to load users";
      setError(msg);
      setItems([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const act = async (id, action) => {
    try {
      if (action === 'block') {
        const user = items.find(x => x._id === id);
        setPendingUser(user);
        setReason("");
        setModalOpen(true);
        return;
      } else {
        await apiClient.post(`/users/${id}/${action}`);
      }
      fetchUsers();
    } catch (e) {
      const msg = e?.response?.data?.message || "Action failed";
      setError(msg);
    }
  };

  const submitBlock = async () => {
    if (!pendingUser) return;
    if (!reason.trim()) return;
    try {
      setLoading(true);
      const res = await apiClient.post(`/users/${pendingUser._id}/block`, { reason });
      setModalOpen(false);
      setPendingUser(null);
      setReason("");
      const preview = res?.data?.previewUrl;
      setError("");
      if (preview) alert(`Email sent. Preview: ${preview}`);
      fetchUsers();
    } catch (e) {
      const msg = e?.response?.data?.message || "Failed to block user";
      const detail = e?.response?.data?.detail;
      setError(detail ? `${msg}: ${detail}` : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{marginBottom: '32px'}}>
        <h1 style={{color: '#1e293b', fontSize: '32px', fontWeight: '700', margin: '0 0 8px 0'}}>
          👥 Quản lý Users
        </h1>
        <p style={{color: '#64748b', fontSize: '16px', margin: 0}}>
          Quản lý tài khoản người dùng, gia sư và học viên trên nền tảng LearnMate
        </p>
      </div>

      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: '1px solid #e2e8f0',
        marginBottom: '24px'
      }}>
        <div style={{display:'flex', gap: '16px', alignItems: 'center', marginBottom: '24px'}}>
          <div style={{flex: 1}}>
            <input 
              placeholder="🔍 Tìm kiếm theo tên hoặc email..." 
              value={q} 
              onChange={(e)=>setQ(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
          <button 
            onClick={fetchUsers} 
            disabled={loading}
            style={{
              background: loading ? '#94a3b8' : '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '16px',
              transition: 'background 0.2s'
            }}
          >
            {loading ? '⏳ Đang tìm...' : '🔍 Tìm kiếm'}
          </button>
        </div>

        <BlockReasonModal
          open={modalOpen}
          userEmail={pendingUser?.email}
          value={reason}
          onChange={setReason}
          onSubmit={submitBlock}
          onClose={() => { setModalOpen(false); setPendingUser(null); }}
          loading={loading}
        />

        {error && (
          <div style={{
            background: '#fef2f2',
            color: '#dc2626',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid #fecaca',
            marginBottom: '16px',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{
          background: '#fff',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid #e2e8f0'
        }}>
          <table style={{width:'100%', borderCollapse:'collapse'}}>
            <thead>
              <tr style={{background: '#f8fafc'}}>
                <th style={{
                  textAlign:'left', 
                  padding:'16px 20px', 
                  color: '#374151',
                  fontWeight: '600',
                  fontSize: '14px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>👤 Tên</th>
                <th style={{
                  textAlign:'left', 
                  padding:'16px 20px', 
                  color: '#374151',
                  fontWeight: '600',
                  fontSize: '14px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>📧 Email</th>
                <th style={{
                  textAlign:'left', 
                  padding:'16px 20px', 
                  color: '#374151',
                  fontWeight: '600',
                  fontSize: '14px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>🎭 Vai trò</th>
                <th style={{
                  textAlign:'left', 
                  padding:'16px 20px', 
                  color: '#374151',
                  fontWeight: '600',
                  fontSize: '14px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>📊 Trạng thái</th>
                <th style={{
                  textAlign:'left', 
                  padding:'16px 20px', 
                  color: '#374151',
                  fontWeight: '600',
                  fontSize: '14px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>🚫 Bị cấm</th>
                <th style={{
                  textAlign:'left', 
                  padding:'16px 20px', 
                  color: '#374151',
                  fontWeight: '600',
                  fontSize: '14px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>⚡ Hành động</th>
              </tr>
            </thead>
            <tbody>
              {(!items || items.length === 0) && !loading && (
                <tr>
                  <td colSpan={6} style={{
                    padding:'40px', 
                    textAlign:'center', 
                    color:'#64748b',
                    fontSize: '16px'
                  }}>
                    <div style={{fontSize: '48px', marginBottom: '16px'}}>🔍</div>
                    <div>Không tìm thấy người dùng nào</div>
                  </td>
                </tr>
              )}
              {items.map((u, index) => (
                <tr key={u._id} style={{
                  background: index % 2 === 0 ? '#fff' : '#f8fafc',
                  transition: 'background 0.2s'
                }}>
                  <td style={{
                    padding:'16px 20px', 
                    borderBottom:'1px solid #f1f5f9',
                    fontWeight: '500',
                    color: '#1e293b'
                  }}>{u.full_name}</td>
                  <td style={{
                    padding:'16px 20px', 
                    borderBottom:'1px solid #f1f5f9',
                    color: '#64748b'
                  }}>{u.email}</td>
                  <td style={{
                    padding:'16px 20px', 
                    borderBottom:'1px solid #f1f5f9'
                  }}>
                    <span style={{
                      background: u.role === 'admin' ? '#fef3c7' : u.role === 'tutor' ? '#dbeafe' : '#f0fdf4',
                      color: u.role === 'admin' ? '#92400e' : u.role === 'tutor' ? '#1e40af' : '#166534',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      {u.role === 'admin' ? '👑 Admin' : u.role === 'tutor' ? '👨‍🏫 Tutor' : '👨‍🎓 Learner'}
                    </span>
                  </td>
                  <td style={{
                    padding:'16px 20px', 
                    borderBottom:'1px solid #f1f5f9'
                  }}>
                    <span style={{
                      background: u.status_flag === 0 ? '#fef2f2' : '#f0fdf4',
                      color: u.status_flag === 0 ? '#dc2626' : '#166534',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {u.status_flag === 0 ? '🚫 Blocked' : '✅ Active'}
                    </span>
                  </td>
                  <td style={{
                    padding:'16px 20px', 
                    borderBottom:'1px solid #f1f5f9',
                    color: u.is_banned ? '#dc2626' : '#166534',
                    fontWeight: '500'
                  }}>
                    {u.is_banned ? '🚫 Có' : '✅ Không'}
                  </td>
                  <td style={{
                    padding:'16px 20px', 
                    borderBottom:'1px solid #f1f5f9'
                  }}>
                    {u.status_flag === 0 ? (
                      <button 
                        onClick={()=>act(u._id, 'unblock')}
                        style={{
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '500',
                          fontSize: '14px',
                          transition: 'background 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.background = '#059669'}
                        onMouseOut={(e) => e.target.style.background = '#10b981'}
                      >
                        🔓 Mở khóa
                      </button>
                    ) : (
                      <button 
                        onClick={()=>act(u._id, 'block')}
                        style={{
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '500',
                          fontSize: '14px',
                          transition: 'background 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.background = '#dc2626'}
                        onMouseOut={(e) => e.target.style.background = '#ef4444'}
                      >
                        🔒 Khóa
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;


