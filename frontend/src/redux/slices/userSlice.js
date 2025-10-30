import { createSlice } from "@reduxjs/toolkit";
import Cookies from "js-cookie";

const initialState = {
  isAuthenticated: !!Cookies.get("accessToken"),
  user: {
    account: {
      email: "",
      role: "",
    },
  },
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.error = null;
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = {
        account: {
          email: "",
          role: "",
        },
      };
      Cookies.remove("accessToken");
      Cookies.remove("refreshToken");
<<<<<<< HEAD
=======
      
      // Clear chat-related localStorage
      localStorage.removeItem("chatMessages");
      localStorage.removeItem("chatNotifications");
      localStorage.removeItem("activeChats");
>>>>>>> Quan3
    },
    registerStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    registerSuccess: (state, action) => {
      state.loading = false;
      // Do NOT authenticate yet; waiting for email verification
      state.isAuthenticated = false;
      state.user = action.payload.user;
      state.error = null;
    },
    setPendingUser: (state, action) => {
      state.user = action.payload.user;
    },
    registerFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  registerStart,
  registerSuccess,
  registerFailure,
  setPendingUser,
} = userSlice.actions;

export default userSlice.reducer;
