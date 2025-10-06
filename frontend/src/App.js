import { Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import SignIn from "./components/Auth/Sign in/SignIn";
import SignUp from "./components/Auth/Sign up/SignUp";
import VerifyAccount from "./components/Auth/VerifyAccount";
import Home from "./pages/Home";
import OTP from "./components/Auth/Sign up/OTP/OTP";
import ForgotPassword from "./components/Auth/ForgotPassword/ForgotPassword";
import ResetPassword from "./components/Auth/ResetPassword/ResetPassword"; 
import OAuthCallback from "./components/Auth/OAuthCallback";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import { CategoriesPage, TutorsPage, PackagesPage, BookingsPage, PaymentsPage, ContentPage, PromotionsPage, NotificationsPage, ReportsPage } from "./pages/admin/placeholderPages";
import UsersPage from "./pages/admin/UsersPage";
import BlockedPage from "./pages/BlockedPage";
import { useEffect } from "react";
import { getCurrentUserApi } from "./services/ApiService";
import { loginSuccess, loginStart, loginFailure } from "./redux/slices/userSlice";

function App() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  const role = useSelector((state) => state.user.user?.account?.role);

  // Bootstrap: fetch current user on initial load if we have tokens but no role yet
  useEffect(() => {
    const init = async () => {
      if (isAuthenticated && !role) {
        try {
          dispatch(loginStart());
          const res = await getCurrentUserApi();
          dispatch(loginSuccess({ user: res.user }));
        } catch (e) {
          dispatch(loginFailure("Failed to restore session"));
        }
      }
    };
    init();
  }, [isAuthenticated, role, dispatch]);

  return (
    <Routes>
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/verify-account" element={<VerifyAccount />} />
      <Route path="/otp" element={<OTP />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/oauth-callback" element={<OAuthCallback />} />
      <Route path="/blocked" element={<BlockedPage />} />

      {/* Admin routes */}
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<UsersPage />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="tutors" element={<TutorsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="packages" element={<PackagesPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="content" element={<ContentPage />} />
        <Route path="promotions" element={<PromotionsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
