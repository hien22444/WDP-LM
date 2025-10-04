"use client"

import { useSelector, useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { logout } from "../redux/slices/userSlice"
import "./Home.scss"

const Home = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state) => state.user.user)

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
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>
    </div>
  )
}

export default Home
