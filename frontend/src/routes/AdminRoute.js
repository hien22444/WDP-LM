import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const AdminRoute = ({ children }) => {
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  const role = useSelector((state) => state.user.user?.account?.role);

  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  // While role is still loading on first boot, avoid redirecting away
  if (role === undefined || role === null || role === "") {
    return <div style={{padding:24}}>Loading…</div>;
  }
  if (role !== "admin") return <Navigate to="/" replace />;

  return children;
};

export default AdminRoute;


