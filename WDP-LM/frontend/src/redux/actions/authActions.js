import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import {
  loginStart,
  loginSuccess,
  loginFailure,
  registerStart,
  registerSuccess,
  registerFailure,
  logout,
} from "../slices/userSlice";
import { googleAuthApi, getCurrentUserApi } from "../../services/ApiService";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api/v1";

const fetchMe = async () => {
  try {
    const accessToken = Cookies.get("accessToken");
    console.log("fetchMe - accessToken:", accessToken ? "exists" : "missing");
    if (!accessToken) return null;
    const res = await getCurrentUserApi();
    console.log("fetchMe - API response:", res);
    return res.user;
  } catch (e) {
    console.error("fetchMe - Error:", e);
    return null;
  }
};

export const doLogin = (email, password) => async (dispatch) => {
  dispatch(loginStart());

  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password,
    });

    const { accessToken, refreshToken, user } = response.data;

    // Save tokens to cookies
    Cookies.set("accessToken", accessToken, { expires: 7 });
    Cookies.set("refreshToken", refreshToken, { expires: 30 });

    // Optional: sync latest user (in case backend changed format)
    const serverUser = await fetchMe();
    dispatch(loginSuccess({ user: serverUser || user }));
    toast.success("Login successful!");

    return { success: true };
  } catch (error) {
    const errorMessage =
      error.response?.data?.message || "Login failed. Please try again.";
    dispatch(loginFailure(errorMessage));
    toast.error(errorMessage);

    return { success: false, error: errorMessage };
  }
};

export const doRegister =
  (firstName, lastName, email, password) => async (dispatch) => {
    dispatch(registerStart());
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        firstName,
        lastName,
        email,
        password,
      });
      // New flow: no tokens returned, simply pending status
      toast.success(
        response.data.message || "Please check your email to verify."
      );
      dispatch(
        registerSuccess({
          user: { account: { email, role: "", status: "pending" } },
        })
      );
      return { success: true, pending: true };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Registration failed. Please try again.";
      dispatch(registerFailure(errorMessage));
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

export const resendVerification = (email) => async () => {
  try {
    const res = await axios.post(`${API_URL}/auth/resend-verification`, {
      email,
    });
    toast.success(res.data.message || "Verification email resent.");
    return { success: true };
  } catch (error) {
    const msg =
      error.response?.data?.message || "Failed to resend verification email";
    toast.error(msg);
    return { success: false, error: msg };
  }
};

export const doGoogleLogin = () => async (dispatch) => {
  let clientId =
    process.env.REACT_APP_GOOGLE_CLIENT_ID || window.__GOOGLE_CLIENT_ID__;
  if (!clientId) {
    try {
      const cfg = await axios.get(`${API_URL}/auth/google-config`);
      clientId = cfg.data?.clientId;
    } catch (e) {
      /* ignore here; handled below */
    }
  }
  if (!clientId) {
    toast.error("Google Client ID not configured");
    return { success: false };
  }

  // Ensure script loaded
  const ensureScript = () =>
    new Promise((resolve, reject) => {
      if (window.google && window.google.accounts && window.google.accounts.id)
        return resolve();
      const existing = document.getElementById("google-oauth");
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener(
          "error",
          () => reject(new Error("Failed to load Google SDK")),
          { once: true }
        );
        return;
      }
      const s = document.createElement("script");
      s.id = "google-oauth";
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Failed to load Google SDK"));
      document.head.appendChild(s);
    });

  try {
    await ensureScript();
  } catch (e) {
    toast.error(e.message || "Cannot load Google services");
    return { success: false };
  }

  if (!(window.google && window.google.accounts && window.google.accounts.id)) {
    toast.error("Google SDK not available");
    return { success: false };
  }

  return new Promise((resolve) => {
    try {
      if (window.google.accounts.id.disableAutoSelect) {
        window.google.accounts.id.disableAutoSelect();
      }
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (resp) => {
          if (!resp || !resp.credential) {
            toast.error("Google login cancelled");
            return resolve({ success: false });
          }
          try {
            const data = await googleAuthApi(resp.credential);
            const { accessToken, refreshToken, user } = data;
            Cookies.set("accessToken", accessToken, { expires: 7 });
            Cookies.set("refreshToken", refreshToken, { expires: 30 });
            dispatch(loginSuccess({ user }));
            toast.success("Logged in with Google");
            resolve({ success: true });
          } catch (e) {
            const msg = e.message || "Google authentication failed";
            toast.error(msg);
            resolve({ success: false, error: msg });
          }
        },
        ux_mode: "popup",
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: false,
      });

      // Prompt once to open the popup (no auto One Tap takeover)
      window.google.accounts.id.prompt();
    } catch (e) {
      toast.error("Failed to initialize Google login");
      resolve({ success: false });
    }
  });
};

export const doFacebookLogin = () => async (dispatch) => {
  toast.info("Facebook login will be implemented");
  // Implement Facebook OAuth flow here
};

export const loadCurrentUser = () => async (dispatch) => {
  try {
    console.log("loadCurrentUser - Starting...");
    const user = await fetchMe();
    console.log("loadCurrentUser - User data:", user);
    if (user) {
      dispatch(loginSuccess({ user }));
      console.log("loadCurrentUser - Success, user loaded");
      return { success: true, user };
    } else {
      // No valid token or user not found
      console.log("loadCurrentUser - No user found, logging out");
      dispatch(logout());
      return { success: false, error: "No valid session" };
    }
  } catch (error) {
    console.error("loadCurrentUser - Error:", error);
    dispatch(logout());
    return { success: false, error: error.message };
  }
};
