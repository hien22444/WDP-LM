import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
<<<<<<< HEAD
import ChatBot from "./components/ChatBot/ChatBot";
=======
// TEMPORARILY DISABLED - Causing lag
// import ChatBot from "./components/ChatBot/ChatBot";
>>>>>>> Quan3
import SignIn from "./components/Auth/Sign in/SignIn";
import SignUp from "./components/Auth/Sign up/SignUp";
import VerifyAccount from "./components/Auth/VerifyAccount";
import LandingPage from "./pages/LandingPage/LandingPage";
import PublicLandingPage from "./pages/LandingPage/PublicLandingPage";
import Profile from "./pages/Profile/Profile";
import PaymentsHistory from "./pages/Profile/PaymentsHistory";
import OrderSummary from "./pages/Payment/OrderSummary";
<<<<<<< HEAD
=======
import PaymentSuccess from "./pages/Payment/PaymentSuccess";
>>>>>>> Quan3
import UserDashboard from "./pages/DashBoard/UserDashboard";
import OTP from "./components/Auth/Sign up/OTP/OTP";
import ForgotPassword from "./components/Auth/ForgotPassword/ForgotPassword";
import ResetPassword from "./components/Auth/ResetPassword/ResetPassword";
import ChangePassword from "./components/Auth/ChangePassword/ChangePassword";
import OAuthCallback from "./components/Auth/OAuthCallback";
import OnboardingWizard from "./pages/Tutor/OnboardingWizard";
<<<<<<< HEAD
import SearchTutors from "./pages/Tutor/SearchTutors";
import TutorProfilePage from "./pages/Tutor/TutorProfilePage";
import TutorBookings from "./pages/Tutor/TutorBookings";
import TutorSchedule from "./pages/Tutor/TutorSchedule";
import StudentBookings from "./pages/Tutor/StudentBookings";
import TutorPublishSlot from "./pages/Tutor/TutorPublishSlot";
import TutorOpenCourses from "./pages/Tutor/TutorOpenCourses";
import CourseDetail from "./pages/Tutor/CourseDetail";
=======
import TutorProfilePage from "./pages/Tutor/TutorProfilePage";
import TutorProfileUpdatePage from "./pages/Tutor/TutorProfileUpdatePage";
import TutorBookings from "./pages/Tutor/TutorBookings";
import TutorSchedule from "./pages/Tutor/TutorSchedule";
import StudentBookings from "./pages/Tutor/StudentBookings";
import ContractPage from "./pages/Contract/ContractPage";
import TutorPublishSlot from "./pages/Tutor/TutorPublishSlot";
import TutorOpenCourses from "./pages/Tutor/TutorOpenCourses";
import TutorList from "./pages/Tutor/TutorList";
import CourseDetail from "./pages/Tutor/CourseDetail";
import Wallet from "./pages/Tutor/Wallet";
>>>>>>> Quan3
// Layout components
import MainLayout from "./components/Layout/MainLayout";
// Admin imports
import AdminLayout from "./components/Admin/AdminLayout";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminUsers from "./pages/Admin/AdminUsers";
import AdminTutors from "./pages/Admin/AdminTutors";
import AdminBookings from "./pages/Admin/AdminBookings";
<<<<<<< HEAD
import AdminReports from "./pages/Admin/AdminReports";

function App() {
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  const userRole = useSelector((state) => state.user.user?.role);

  return (
=======
import AdminContracts from "./pages/Admin/AdminContracts";
import AdminContractDetail from "./pages/Admin/AdminContractDetail";
import AdminReports from "./pages/Admin/AdminReports";
import About from "./pages/About/About";
import VideoCallRoom from "./components/VideoCall/VideoCallRoom";
import SimpleVideoCall from "./components/VideoCall/SimpleVideoCall";
import GoogleMeetStyle from "./components/VideoCall/GoogleMeetStyle";
import ProfileCompletionModal from "./components/ProfileCompletion/ProfileCompletionModal";
import { useState, useEffect } from "react";
import authService from "./services/AuthService";
// TEMPORARILY DISABLED - Causing lag
// import { ChatProvider } from "./contexts/ChatContext";
// import ChatManager from "./components/Chat/ChatManager";

function App() {
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  const userRole = useSelector((state) => state.user.user?.role || state.user.user?.account?.role);
  
  // Debug admin access
  const userState = useSelector((state) => state.user);
  console.log('App - isAuthenticated:', isAuthenticated);
  console.log('App - userRole:', userRole);
  console.log('App - userState:', userState);
  console.log('App - user.user:', userState.user);
  console.log('App - user.account:', userState.user?.account);
  console.log('App - can access admin:', isAuthenticated && userRole === "admin");
  
  // Profile completion state
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  const [profileCompletion, setProfileCompletion] = useState(null);

  // Check if user needs to complete profile
  useEffect(() => {
    if (isAuthenticated) {
      const needsCompletion = authService.needsProfileCompletion();
      const completionData = authService.getProfileCompletionStatus();
      
      if (needsCompletion && completionData) {
        setProfileCompletion(completionData);
        setShowProfileCompletion(true);
      }
    }
  }, [isAuthenticated]);

  const handleProfileCompletion = (result) => {
    // Update profile completion status in localStorage
    if (result.profileCompleted) {
      const updatedCompletion = { ...profileCompletion, completed: true };
      localStorage.setItem("profileCompletion", JSON.stringify(updatedCompletion));
      setProfileCompletion(updatedCompletion);
    }
    setShowProfileCompletion(false);
  };

  return (
    // TEMPORARILY DISABLED ChatProvider - Causing lag and unwanted socket connections
    // <ChatProvider>
>>>>>>> Quan3
    <>
      <Routes>
        {/* Public routes without layout */}
        <Route
          path="/"
          element={
            !isAuthenticated ? <PublicLandingPage /> : <Navigate to="/home" />
          }
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
<<<<<<< HEAD
=======
        {/* Fullscreen onboarding (no MainLayout) */}
        <Route
          path="/tutor/onboarding"
          element={isAuthenticated ? <OnboardingWizard /> : <Navigate to="/" />}
        />
        <Route
          path="/tutor/profile-update"
          element={isAuthenticated ? <TutorProfileUpdatePage /> : <Navigate to="/" />}
        />
        <Route
          path="/contract/:id"
          element={isAuthenticated ? <ContractPage /> : <Navigate to="/" />}
        />
>>>>>>> Quan3
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/oauth-callback" element={<OAuthCallback />} />

        {/* Admin routes - chỉ admin mới truy cập được */}
        <Route
          path="/admin"
          element={
            isAuthenticated && userRole === "admin" ? (
              <AdminLayout />
            ) : (
              <Navigate to="/" />
            )
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="tutors" element={<AdminTutors />} />
          <Route path="bookings" element={<AdminBookings />} />
<<<<<<< HEAD
=======
          <Route path="contracts" element={<AdminContracts />} />
          <Route path="contracts/:id" element={<AdminContractDetail />} />
>>>>>>> Quan3
          <Route path="reports" element={<AdminReports />} />
        </Route>

        {/* Protected routes with MainLayout */}
        <Route element={<MainLayout />}>
          <Route
            path="/home"
            element={isAuthenticated ? <LandingPage /> : <Navigate to="/" />}
          />
          <Route
            path="/tutor/publish"
            element={
              isAuthenticated ? <TutorPublishSlot /> : <Navigate to="/" />
            }
          />
          <Route
            path="/dashboard"
            element={isAuthenticated ? <UserDashboard /> : <Navigate to="/" />}
          />
          <Route path="/courses" element={<TutorOpenCourses />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
<<<<<<< HEAD
          <Route path="/tutor" element={<SearchTutors />} />
=======
          <Route path="/tutors" element={<TutorList />} />
>>>>>>> Quan3
          <Route path="/tutor/:id" element={<TutorProfilePage />} />
          <Route
            path="/bookings/tutor"
            element={isAuthenticated ? <TutorBookings /> : <Navigate to="/" />}
          />
          <Route
            path="/bookings/me"
            element={
              isAuthenticated ? <StudentBookings /> : <Navigate to="/" />
            }
          />
          <Route
            path="/tutor/schedule"
            element={isAuthenticated ? <TutorSchedule /> : <Navigate to="/" />}
          />
          <Route
<<<<<<< HEAD
=======
            path="/tutor/wallet"
            element={isAuthenticated ? <Wallet /> : <Navigate to="/" />}
          />
          <Route
>>>>>>> Quan3
            path="/tutor/publish-slot"
            element={
              isAuthenticated ? <TutorPublishSlot /> : <Navigate to="/" />
            }
          />
<<<<<<< HEAD
          <Route
            path="/tutor/onboarding"
            element={
              isAuthenticated ? <OnboardingWizard /> : <Navigate to="/" />
            }
          />
=======
          {/** Onboarding moved to top-level for full-screen layout */}
>>>>>>> Quan3
          <Route
            path="/profile"
            element={isAuthenticated ? <Profile /> : <Navigate to="/" />}
          />
          <Route
            path="/payments"
            element={
              isAuthenticated ? <PaymentsHistory /> : <Navigate to="/" />
            }
          />
          <Route path="/payment/order-summary" element={<OrderSummary />} />
<<<<<<< HEAD
=======
          <Route path="/payment-success" element={<PaymentSuccess />} />
>>>>>>> Quan3
          <Route
            path="/change-password"
            element={isAuthenticated ? <ChangePassword /> : <Navigate to="/" />}
          />
          {/* Public pages with layout */}
<<<<<<< HEAD
          <Route path="/about" element={<div>About Page</div>} />
=======
          <Route path="/about" element={<About />} />
        <Route path="/room/:roomId" element={<GoogleMeetStyle />} />
>>>>>>> Quan3
          <Route path="/contact" element={<div>Contact Page</div>} />
          <Route path="/help" element={<div>Help Page</div>} />
          <Route path="/faq" element={<div>FAQ Page</div>} />
        </Route>

        {/* Redirect any unknown routes */}
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? "/home" : "/"} />}
        />
      </Routes>
<<<<<<< HEAD
      {/* Global ChatBot: shown on all routes (fixed bottom-right by CSS) */}
      <ChatBot />
=======
      
      {/* Profile Completion Modal */}
      <ProfileCompletionModal
        isOpen={showProfileCompletion}
        onClose={() => setShowProfileCompletion(false)}
        profileCompletion={profileCompletion}
        onComplete={handleProfileCompletion}
      />
      
      {/* Global ChatBot: shown on all routes (fixed bottom-right by CSS) */}
      {/* TEMPORARILY DISABLED - Causing lag */}
      {/* <ChatBot /> */}
      
      {/* Global Chat Manager: manages all chat widgets */}
      {/* TEMPORARILY DISABLED - Causing lag */}
      {/* <ChatManager /> */}
    {/* </ChatProvider> */}
>>>>>>> Quan3
    </>
  );
}

export default App;
