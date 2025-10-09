import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { loginSuccess, loginFailure, loginStart } from '../../redux/slices/userSlice';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

// Utility to parse hash fragment into an object
function parseHash(hash) {
  const h = hash.replace(/^#/, '');
  return h.split('&').reduce((acc, pair) => {
    const [k, v] = pair.split('=');
    if (k) acc[decodeURIComponent(k)] = decodeURIComponent(v || '');
    return acc;
  }, {});
}

export default function OAuthCallback() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const exec = async () => {
      dispatch(loginStart());
      try {
        const data = parseHash(window.location.hash);
        if (!data.accessToken || !data.refreshToken) {
          dispatch(loginFailure('Missing tokens in callback'));
          return navigate('/signin');
        }
        // Store tokens
        Cookies.set('accessToken', data.accessToken, { expires: 7 });
        Cookies.set('refreshToken', data.refreshToken, { expires: 30 });
        // Fetch user profile to populate store
        try {
          const res = await axios.get(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${data.accessToken}` } });
          dispatch(loginSuccess({ user: res.data.user }));
        } catch (e) {
          // If /me fails, still set minimal user placeholder
          dispatch(loginSuccess({ user: { account: { email: '', role: '', status: 'active' } } }));
        }
        navigate('/home');
      } catch (e) {
        dispatch(loginFailure('OAuth callback failed'));
        navigate('/signin');
      }
    };
    exec();
  }, [dispatch, navigate]);

  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',flexDirection:'column',fontFamily:'sans-serif'}}>
      <h2>Signing you in…</h2>
      <p>Please wait while we complete your Google login.</p>
    </div>
  );
}
