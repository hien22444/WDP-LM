import React, { useEffect, useState } from 'react';

const DebugUserInfo = () => {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    // Get from localStorage
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    setInfo({
      localStorage_user: userStr ? JSON.parse(userStr) : null,
      localStorage_token: token,
      cookies: document.cookie
    });

    // Test API
    fetch('http://localhost:5000/api/v1/auth/me', {
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${token || ''}`
      }
    })
    .then(res => res.json())
    .then(data => {
      setInfo(prev => ({ ...prev, api_response: data }));
    })
    .catch(err => {
      setInfo(prev => ({ ...prev, api_error: err.message }));
    });
  }, []);

  if (!info) return <div>Loading...</div>;

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      background: '#1e1e1e', 
      color: '#d4d4d4', 
      padding: '20px',
      zIndex: 9999,
      maxHeight: '100vh',
      overflow: 'auto',
      fontFamily: 'monospace',
      fontSize: '12px'
    }}>
      <h2 style={{ color: '#4ec9b0' }}>🔍 Debug: Current User Info</h2>
      
      <div style={{ background: '#2d2d2d', padding: '10px', margin: '10px 0', borderRadius: '5px' }}>
        <h3>LocalStorage User:</h3>
        <pre>{JSON.stringify(info.localStorage_user, null, 2)}</pre>
      </div>

      <div style={{ background: '#2d2d2d', padding: '10px', margin: '10px 0', borderRadius: '5px' }}>
        <h3>Token:</h3>
        <pre>{info.localStorage_token || 'No token'}</pre>
      </div>

      <div style={{ background: '#2d2d2d', padding: '10px', margin: '10px 0', borderRadius: '5px' }}>
        <h3>API Response (/auth/me):</h3>
        <pre>{JSON.stringify(info.api_response || info.api_error, null, 2)}</pre>
      </div>

      <button 
        onClick={() => {
          localStorage.clear();
          sessionStorage.clear();
          alert('Cleared! Refresh page.');
          window.location.reload();
        }}
        style={{
          background: '#dc2626',
          color: 'white',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          marginRight: '10px'
        }}
      >
        🗑️ Clear Auth & Reload
      </button>

      <button 
        onClick={() => window.location.href = '/'}
        style={{
          background: '#0e639c',
          color: 'white',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        ❌ Close
      </button>
    </div>
  );
};

export default DebugUserInfo;
