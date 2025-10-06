import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../redux/slices/userSlice";

const BlockedPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/signin");
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      padding: '20px',
      textAlign: 'center',
      backgroundColor: '#f8fafc'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        maxWidth: '500px',
        width: '100%'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🚫</div>
        <h1 style={{ color: '#dc2626', marginBottom: '16px' }}>Account Blocked</h1>
        <p style={{ color: '#64748b', marginBottom: '24px', lineHeight: '1.6' }}>
          Your account has been temporarily blocked by an administrator. 
          Please contact support if you believe this is an error.
        </p>
        <button 
          onClick={handleLogout}
          style={{
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600'
          }}
        >
          Return to Login
        </button>
      </div>
    </div>
  );
};

export default BlockedPage;
