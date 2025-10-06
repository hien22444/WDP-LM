"use client"

import { useSelector, useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { useEffect } from "react"
import { logout } from "../redux/slices/userSlice"
import "./Home.scss"

const Home = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state) => state.user.user)
  const role = useSelector((state) => state.user.user?.account?.role)
  const statusFlag = useSelector((state) => state.user.user?.account?.status_flag)

  // Check if user is blocked (status_flag === 0)
  useEffect(() => {
    console.log("Home - statusFlag:", statusFlag, "type:", typeof statusFlag)
    if (statusFlag === 0 || statusFlag === "0") {
      console.log("Redirecting to blocked page")
      navigate("/blocked")
    }
  }, [statusFlag, navigate])

  const handleLogout = () => {
    dispatch(logout())
    navigate("/signin")
  }

  return (
    <div className="home-container">
      <div className="home-content">
        <h1>Welcome to Dashboard</h1>
        <p>Email: {user.account.email}</p>
        <p>Role: {user.account.role || "User"}</p>
        <p>Status: {statusFlag === 0 || statusFlag === "0" ? "Blocked" : "Active"}</p>
        <p>Debug - statusFlag: {JSON.stringify(statusFlag)}</p>
        <p>Debug - full user: {JSON.stringify(user, null, 2)}</p>
        {role === 'admin' && (
          <button onClick={() => navigate('/admin')} className="logout-btn" style={{marginRight:8}}>
            Go to Admin
          </button>
        )}
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>
    </div>
  )
}

export default Home
