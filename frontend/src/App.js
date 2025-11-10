// import { Routes, Route, Navigate } from "react-router-dom";
// import { useSelector } from "react-redux";
// // TEMPORARILY DISABLED - Causing lag
// // import ChatBot from "./components/ChatBot/ChatBot";
// import SignIn from "./components/Auth/Sign in/SignIn";
// import SignUp from "./components/Auth/Sign up/SignUp";
// import VerifyAccount from "./components/Auth/VerifyAccount";
// import LandingPage from "./pages/LandingPage/LandingPage";
// import PublicLandingPage from "./pages/LandingPage/PublicLandingPage";
// import Profile from "./pages/Profile/Profile";
// import PaymentsHistory from "./pages/Profile/PaymentsHistory";
// import OrderSummary from "./pages/Payment/OrderSummary";
// import PaymentSuccess from "./pages/Payment/PaymentSuccess";
// import UserDashboard from "./pages/DashBoard/UserDashboard";
// import OTP from "./components/Auth/Sign up/OTP/OTP";
// import ForgotPassword from "./components/Auth/ForgotPassword/ForgotPassword";
// import ResetPassword from "./components/Auth/ResetPassword/ResetPassword";
// import ChangePassword from "./components/Auth/ChangePassword/ChangePassword";
// import OAuthCallback from "./components/Auth/OAuthCallback";
// import OnboardingWizard from "./pages/Tutor/OnboardingWizard";
// import TutorProfilePage from "./pages/Tutor/TutorProfilePage";
// import TutorProfileUpdatePage from "./pages/Tutor/TutorProfileUpdatePage";
// import TutorBookings from "./pages/Tutor/TutorBookings";
// import TutorSchedule from "./pages/Tutor/TutorSchedule";
// import StudentBookings from "./pages/Tutor/StudentBookings";
// import ContractPage from "./pages/Contract/ContractPage";
// import TutorPublishSlot from "./pages/Tutor/TutorPublishSlot";
// import TutorOpenCourses from "./pages/Tutor/TutorOpenCourses";
// import TutorList from "./pages/Tutor/TutorList";
// import CourseDetail from "./pages/Tutor/CourseDetail";
// // Layout components
// import MainLayout from "./components/Layout/MainLayout";
// // Admin imports
// import AdminLayout from "./components/Admin/AdminLayout";
// import AdminDashboard from "./pages/Admin/AdminDashboard";
// import AdminUsers from "./pages/Admin/AdminUsers";
// import AdminTutors from "./pages/Admin/AdminTutors";
// import AdminBookings from "./pages/Admin/AdminBookings";
// import AdminContracts from "./pages/Admin/AdminContracts";
// import AdminContractDetail from "./pages/Admin/AdminContractDetail";
// import AdminReports from "./pages/Admin/AdminReports";
// import About from "./pages/About/About";
// import VideoCallRoom from "./components/VideoCall/VideoCallRoom";
// import SimpleVideoCall from "./components/VideoCall/SimpleVideoCall";
// import GoogleMeetStyle from "./components/VideoCall/GoogleMeetStyle";
// import ProfileCompletionModal from "./components/ProfileCompletion/ProfileCompletionModal";
// import { useState, useEffect } from "react";
// import authService from "./services/AuthService";
// // TEMPORARILY DISABLED - Causing lag
// // import { ChatProvider } from "./contexts/ChatContext";
// // import ChatManager from "./components/Chat/ChatManager";

// function App() {
//   const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
//   const userRole = useSelector(
//     (state) => state.user.user?.role || state.user.user?.account?.role
//   );

//   // Debug admin access
//   const userState = useSelector((state) => state.user);
//   console.log("App - isAuthenticated:", isAuthenticated);
//   console.log("App - userRole:", userRole);
//   console.log("App - userState:", userState);
//   console.log("App - user.user:", userState.user);
//   console.log("App - user.account:", userState.user?.account);
//   console.log(
//     "App - can access admin:",
//     isAuthenticated && userRole === "admin"
//   );

//   // Profile completion state
//   const [showProfileCompletion, setShowProfileCompletion] = useState(false);
//   const [profileCompletion, setProfileCompletion] = useState(null);

//   // Check if user needs to complete profile
//   useEffect(() => {
//     if (isAuthenticated) {
//       const needsCompletion = authService.needsProfileCompletion();
//       const completionData = authService.getProfileCompletionStatus();

//       if (needsCompletion && completionData) {
//         setProfileCompletion(completionData);
//         setShowProfileCompletion(true);
//       }
//     }
//   }, [isAuthenticated]);

//   const handleProfileCompletion = (result) => {
//     // Update profile completion status in localStorage
//     if (result.profileCompleted) {
//       const updatedCompletion = { ...profileCompletion, completed: true };
//       localStorage.setItem(
//         "profileCompletion",
//         JSON.stringify(updatedCompletion)
//       );
//       setProfileCompletion(updatedCompletion);
//     }
//     setShowProfileCompletion(false);
//   };

//   return (
//     // TEMPORARILY DISABLED ChatProvider - Causing lag and unwanted socket connections
//     // <ChatProvider>
//     <>
//       <Routes>
//         {/* Public routes without layout */}
//         <Route
//           path="/"
//           element={
//             !isAuthenticated ? <PublicLandingPage /> : <Navigate to="/home" />
//           }
//         />
//         <Route
//           path="/signin"
//           element={!isAuthenticated ? <SignIn /> : <Navigate to="/home" />}
//         />
//         <Route
//           path="/signup"
//           element={!isAuthenticated ? <SignUp /> : <Navigate to="/home" />}
//         />
//         <Route path="/verify-account" element={<VerifyAccount />} />
//         <Route path="/otp" element={<OTP />} />
//         {/* Fullscreen onboarding (no MainLayout) */}
//         <Route
//           path="/tutor/onboarding"
//           element={isAuthenticated ? <OnboardingWizard /> : <Navigate to="/" />}
//         />
//         <Route
//           path="/tutor/profile-update"
//           element={
//             isAuthenticated ? <TutorProfileUpdatePage /> : <Navigate to="/" />
//           }
//         />
//         <Route
//           path="/contract/:id"
//           element={isAuthenticated ? <ContractPage /> : <Navigate to="/" />}
//         />
//         <Route path="/forgot-password" element={<ForgotPassword />} />
//         <Route path="/reset-password" element={<ResetPassword />} />
//         <Route path="/oauth-callback" element={<OAuthCallback />} />

//         {/* Admin routes - chỉ admin mới truy cập được */}
//         <Route
//           path="/admin"
//           element={
//             isAuthenticated && userRole === "admin" ? (
//               <AdminLayout />
//             ) : (
//               <Navigate to="/" />
//             )
//           }
//         >
//           <Route index element={<AdminDashboard />} />
//           <Route path="users" element={<AdminUsers />} />
//           <Route path="tutors" element={<AdminTutors />} />
//           <Route path="bookings" element={<AdminBookings />} />
//           <Route path="contracts" element={<AdminContracts />} />
//           <Route path="contracts/:id" element={<AdminContractDetail />} />
//           <Route path="reports" element={<AdminReports />} />
//         </Route>

//         {/* Protected routes with MainLayout */}
//         <Route element={<MainLayout />}>
//           <Route
//             path="/home"
//             element={isAuthenticated ? <LandingPage /> : <Navigate to="/" />}
//           />
//           <Route
//             path="/tutor/publish"
//             element={
//               isAuthenticated ? <TutorPublishSlot /> : <Navigate to="/" />
//             }
//           />
//           <Route
//             path="/dashboard"
//             element={isAuthenticated ? <UserDashboard /> : <Navigate to="/" />}
//           />
//           <Route path="/courses" element={<TutorOpenCourses />} />
//           <Route path="/courses/:id" element={<CourseDetail />} />
//           <Route path="/tutors" element={<TutorList />} />
//           <Route path="/tutor/:id" element={<TutorProfilePage />} />
//           <Route
//             path="/bookings/tutor"
//             element={isAuthenticated ? <TutorBookings /> : <Navigate to="/" />}
//           />
//           <Route
//             path="/bookings/me"
//             element={
//               isAuthenticated ? <StudentBookings /> : <Navigate to="/" />
//             }
//           />
//           <Route
//             path="/tutor/schedule"
//             element={isAuthenticated ? <TutorSchedule /> : <Navigate to="/" />}
//           />
//           <Route
//             path="/tutor/publish-slot"
//             element={
//               isAuthenticated ? <TutorPublishSlot /> : <Navigate to="/" />
//             }
//           />
//           {/** Onboarding moved to top-level for full-screen layout */}
//           <Route
//             path="/profile"
//             element={isAuthenticated ? <Profile /> : <Navigate to="/" />}
//           />
//           <Route
//             path="/payments"
//             element={
//               isAuthenticated ? <PaymentsHistory /> : <Navigate to="/" />
//             }
//           />
//           <Route path="/payment/order-summary" element={<OrderSummary />} />
//           <Route path="/payment-success" element={<PaymentSuccess />} />
//           <Route
//             path="/change-password"
//             element={isAuthenticated ? <ChangePassword /> : <Navigate to="/" />}
//           />
//           {/* Public pages with layout */}
//           <Route path="/about" element={<About />} />
//           <Route path="/room/:roomId" element={<GoogleMeetStyle />} />
//           <Route path="/contact" element={<div>Contact Page</div>} />
//           <Route path="/help" element={<div>Help Page</div>} />
//           <Route path="/faq" element={<div>FAQ Page</div>} />
//         </Route>

//         {/* Redirect any unknown routes */}
//         <Route
//           path="*"
//           element={<Navigate to={isAuthenticated ? "/home" : "/"} />}
//         />
//       </Routes>

//       {/* Profile Completion Modal */}
//       <ProfileCompletionModal
//         isOpen={showProfileCompletion}
//         onClose={() => setShowProfileCompletion(false)}
//         profileCompletion={profileCompletion}
//         onComplete={handleProfileCompletion}
//       />

//       {/* Global ChatBot: shown on all routes (fixed bottom-right by CSS) */}
//       {/* TEMPORARILY DISABLED - Causing lag */}
//       {/* <ChatBot /> */}

//       {/* Global Chat Manager: manages all chat widgets */}
//       {/* TEMPORARILY DISABLED - Causing lag */}
//       {/* <ChatManager /> */}
//       {/* </ChatProvider> */}
//     </>
//   );
// }

// export default App;

import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import SignIn from "./components/Auth/Sign in/SignIn";
import SignUp from "./components/Auth/Sign up/SignUp";
import VerifyAccount from "./components/Auth/VerifyAccount";
import LandingPage from "./pages/LandingPage/LandingPage";
import PublicLandingPage from "./pages/LandingPage/PublicLandingPage";
import Profile from "./pages/Profile/Profile";
import PaymentsHistory from "./pages/Profile/PaymentsHistory";
import OrderSummary from "./pages/Payment/OrderSummary";
import PaymentSuccess from "./pages/Payment/PaymentSuccess";
import UserDashboard from "./pages/DashBoard/UserDashboard";
import OTP from "./components/Auth/Sign up/OTP/OTP";
import ForgotPassword from "./components/Auth/ForgotPassword/ForgotPassword";
import ResetPassword from "./components/Auth/ResetPassword/ResetPassword";
import ChangePassword from "./components/Auth/ChangePassword/ChangePassword";
import OAuthCallback from "./components/Auth/OAuthCallback";
import ProtectedOnboarding from "./components/Auth/ProtectedOnboarding";
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
import ChatLayout from "./components/Layout/ChatLayout";
import AuthenticatedLayout from "./components/Layout/AuthenticatedLayout";
import AdminLayout from "./components/Admin/AdminLayout";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminUsers from "./pages/Admin/AdminUsers";
import AdminTutors from "./pages/Admin/AdminTutors";
import AdminBookings from "./pages/Admin/AdminBookings";
import AdminContracts from "./pages/Admin/AdminContracts";
import AdminContractDetail from "./pages/Admin/AdminContractDetail";
import AdminReports from "./pages/Admin/AdminReports";
import About from "./pages/About/About";
import GoogleMeetStyle from "./components/VideoCall/GoogleMeetStyle";
import ProfileCompletionModal from "./components/ProfileCompletion/ProfileCompletionModal";
import PaymentCancel from "./pages/Payment/PaymentCancel";
import { useState, useEffect } from "react";
import authService from "./services/AuthService";

// ✅ Import Chat Context đúng cách
import { ChatProvider } from "./contexts/ChatContext";
import ChatManager from "./components/Chat/ChatManager";
import MessagesPage from "./pages/Messages";
import ChatWidget from "./components/ChatBot/ChatWidget";

function App() {
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  const userRole = useSelector(
    (state) => state.user.user?.role || state.user.user?.account?.role
  );

  // Debug
  const userState = useSelector((state) => state.user);
  console.log("App - isAuthenticated:", isAuthenticated);
  console.log("App - userRole:", userRole);
  console.log("App - userState:", userState);

  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  const [profileCompletion, setProfileCompletion] = useState(null);

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
    if (result.profileCompleted) {
      const updatedCompletion = { ...profileCompletion, completed: true };
      localStorage.setItem(
        "profileCompletion",
        JSON.stringify(updatedCompletion)
      );
      setProfileCompletion(updatedCompletion);
    }
    setShowProfileCompletion(false);
  };

  return (
    <ChatProvider>
      <Routes>
        {/* Public routes */}
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
        <Route path="/tutor/onboarding" element={<ProtectedOnboarding />} />
        <Route
          path="/tutor/profile-update"
          element={
            isAuthenticated ? <TutorProfileUpdatePage /> : <Navigate to="/" />
          }
        />
        <Route
          path="/contract/:id"
          element={isAuthenticated ? <ContractPage /> : <Navigate to="/" />}
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/oauth-callback" element={<OAuthCallback />} />

        {/* Admin routes */}
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
          <Route path="contracts" element={<AdminContracts />} />
          <Route path="contracts/:id" element={<AdminContractDetail />} />
          <Route path="reports" element={<AdminReports />} />
        </Route>

        {/* Public/Authenticated Routes - Automatically switches layout based on auth status */}
        <Route element={<AuthenticatedLayout />}>
          <Route path="/tutors" element={<TutorList />} />
          <Route path="/tutor/:id" element={<TutorProfilePage />} />
          <Route path="/courses" element={<TutorOpenCourses />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<div>Contact Page</div>} />
          <Route path="/help" element={<div>Help Page</div>} />
          <Route path="/faq" element={<div>FAQ Page</div>} />
        </Route>

        {/* Protected routes - Dashboard and other features */}
        <Route element={<ChatLayout />}>
          <Route
            path="/home"
            element={isAuthenticated ? <LandingPage /> : <Navigate to="/" />}
          />
          <Route
            path="/dashboard"
            element={isAuthenticated ? <UserDashboard /> : <Navigate to="/" />}
          />

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
            path="/tutor/publish-slot"
            element={
              isAuthenticated ? <TutorPublishSlot /> : <Navigate to="/" />
            }
          />
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
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/cancel" element={<PaymentCancel />} />
          <Route
            path="/change-password"
            element={isAuthenticated ? <ChangePassword /> : <Navigate to="/" />}
          />
          <Route
            path="/messages"
            element={
              isAuthenticated ? (
                userRole === "tutor" ? (
                  <MessagesPage />
                ) : (
                  <Navigate
                    to="/dashboard"
                    replace
                    state={{ from: "messages" }}
                  />
                )
              ) : (
                <Navigate to="/signin" replace state={{ from: "messages" }} />
              )
            }
          />
          <Route path="/room/:roomId" element={<GoogleMeetStyle />} />
        </Route>

        {/* Redirect unknown routes */}
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? "/home" : "/"} />}
        />
      </Routes>

      {/* Profile Completion Modal */}
      <ProfileCompletionModal
        isOpen={showProfileCompletion}
        onClose={() => setShowProfileCompletion(false)}
        profileCompletion={profileCompletion}
        onComplete={handleProfileCompletion}
      />

      {/* Floating AI chat widget */}
      <ChatWidget />
    </ChatProvider>
  );
}

export default App;
