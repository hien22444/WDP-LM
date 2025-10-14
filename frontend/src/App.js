import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import SignIn from "./components/Auth/Sign in/SignIn";
import SignUp from "./components/Auth/Sign up/SignUp";
import VerifyAccount from "./components/Auth/VerifyAccount";
import LandingPage from "./pages/LandingPage/LandingPage";
import PublicLandingPage from "./pages/LandingPage/PublicLandingPage";
import Profile from "./pages/Profile/Profile";
import UserDashboard from "./pages/DashBoard/UserDashboard";
import OTP from "./components/Auth/Sign up/OTP/OTP";
import ForgotPassword from "./components/Auth/ForgotPassword/ForgotPassword";
import ResetPassword from "./components/Auth/ResetPassword/ResetPassword";
import ChangePassword from "./components/Auth/ChangePassword/ChangePassword";
import OAuthCallback from "./components/Auth/OAuthCallback";

function App() {
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);

  return (
    <Routes>
      {/* Public routes - cho người dùng chưa đăng nhập */}
      <Route 
        path="/" 
        element={!isAuthenticated ? <PublicLandingPage /> : <Navigate to="/home" />} 
      />
      <Route 
        path="/signin" 
        element={!isAuthenticated ? <SignIn /> : <Navigate to="/home" />} 
      />
      <Route 
        path="/signup" 
        element={!isAuthenticated ? <SignUp /> : <Navigate to="/home" />} 
      />
      <Route path="/verify-account" element={<VerifyAccount />} />
      <Route path="/otp" element={<OTP />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/oauth-callback" element={<OAuthCallback />} />

      {/* Protected routes - cho người dùng đã đăng nhập */}
      <Route 
        path="/home" 
        element={isAuthenticated ? <LandingPage /> : <Navigate to="/" />} 
      />
      <Route 
        path="/dashboard" 
        element={isAuthenticated ? <UserDashboard /> : <Navigate to="/" />} 
      />
      <Route 
        path="/profile" 
        element={isAuthenticated ? <Profile /> : <Navigate to="/" />} 
      />
      <Route 
        path="/change-password" 
        element={isAuthenticated ? <ChangePassword /> : <Navigate to="/" />} 
      />

      {/* Redirect any unknown routes */}
      <Route 
        path="*" 
        element={<Navigate to={isAuthenticated ? "/home" : "/"} />} 
      />
    </Routes>
  );
}

export default App;
