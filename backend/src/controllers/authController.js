const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const { OAuth2Client } = require("google-auth-library");

// ----- Minimal env resolvers (match your original .env keys) -----
const strip = (v) =>
  (v || "")
    .toString()
    .trim()
    .replace(/^['"]|['"]$/g, "");
const getFirstEnv = (...keys) => {
  for (const k of keys) {
    const val = process.env[k];
    if (val !== undefined && val !== null && String(val).trim() !== "")
      return strip(val);
  }
  return null;
};

const resolveGoogleClientId = () => getFirstEnv("GOOGLE_APP_CLIENT_ID");

const resolveGoogleClientSecret = () => getFirstEnv("GOOGLE_APP_CLIENT_SECRET");

const resolveGoogleRedirectUri = () => {
  const backendBase =
    getFirstEnv("BACKEND_PUBLIC_URL") || "http://localhost:5000";
  const v = getFirstEnv("GOOGLE_APP_CLIENT_REDIRECT_LOGIN");
  return v || `${backendBase}/google/redirect`;
};

let googleCodeClient = null;
const getGoogleCodeClient = () => {
  if (googleCodeClient) return googleCodeClient;
  const clientId = resolveGoogleClientId();
  const clientSecret = resolveGoogleClientSecret();
  const redirectUri = resolveGoogleRedirectUri();
  if (!clientId || !clientSecret) return null;
  googleCodeClient = new OAuth2Client(clientId, clientSecret, redirectUri);
  return googleCodeClient;
};

let googleClient = null;
const getGoogleClient = () => {
  if (googleClient) return googleClient;
  const cid = resolveGoogleClientId();
  if (!cid) return null;
  googleClient = new OAuth2Client(cid);
  return googleClient;
};

// (no debug endpoints in minimal version)

// ---------- Helpers ----------
const signAccessToken = (userId) => {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });
};

const signRefreshToken = (userId) => {
  return jwt.sign(
    { sub: userId, type: "refresh" },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
    }
  );
};

const buildUserPayload = (user) => {
  return {
    account: {
      email: user.email,
      role: user.role,
      status: user.status,
    },
    profile: {
      full_name: user.full_name,
      city: user.city,
      gender: user.gender,
    },
  };
};

// Helper function to calculate profile completion
const calculateProfileCompletion = (user) => {
  const requiredFields = {
    basic_info: ["full_name", "date_of_birth", "gender"],
    contact_info: ["phone_number", "address", "city"],
    preferences: ["preferences"],
  };

  const missingFields = [];
  let completedFields = 0;
  let totalFields = 0;

  // Check basic info
  requiredFields.basic_info.forEach((field) => {
    totalFields++;
    if (user[field]) {
      completedFields++;
    } else {
      missingFields.push(field);
    }
  });

  // Check contact info
  requiredFields.contact_info.forEach((field) => {
    totalFields++;
    if (user[field]) {
      completedFields++;
    } else {
      missingFields.push(field);
    }
  });

  // Check preferences
  requiredFields.preferences.forEach((field) => {
    totalFields++;
    if (user[field]) {
      completedFields++;
    } else {
      missingFields.push(field);
    }
  });

  const percentage = Math.round((completedFields / totalFields) * 100);

  // Determine next step
  let nextStep = null;
  if (percentage < 33) {
    nextStep = "basic_info";
  } else if (percentage < 66) {
    nextStep = "contact_info";
  } else if (percentage < 100) {
    nextStep = "preferences";
  } else {
    nextStep = "completed";
  }

  return {
    percentage,
    missingFields,
    nextStep,
  };
};

let cachedTransporter = null;
const createTransporter = () => {
  if (cachedTransporter) return cachedTransporter;
  // Support both simplified Gmail service and custom SMTP
  let user =
    process.env.MAIL_SDN_USERNAME ||
    process.env.MAIL_LEARNMATE_USERNAME ||
    process.env.MAIL_USERNAME;
  let pass =
    process.env.MAIL_SDN_PASSWORD ||
    process.env.MAIL_LEARNMATE_PASSWORD ||
    process.env.MAIL_PASSWORD;

  // Sanitize: trim & strip quotes
  const strip = (v) => (v || "").trim().replace(/^['"]|['"]$/g, "");
  user = strip(user);
  pass = strip(pass);

  // If password looks like Gmail app password with spaces (e.g. 'abcd efgh ijkl mnop'), collapse spaces
  if (
    pass &&
    pass.split(" ").length > 1 &&
    pass.replace(/\s/g, "").length === 16
  ) {
    console.log("[mail] Collapsing spaces in app password");
    pass = pass.replace(/\s/g, "");
  }

  if (!user || !pass) {
    console.warn("⚠️ Missing mail credentials -> mock mode");
    return null;
  }

  const host = process.env.MAIL_HOST;
  const port = process.env.MAIL_PORT
    ? Number(process.env.MAIL_PORT)
    : undefined;
  const secure = process.env.MAIL_SECURE === "true";

  try {
    cachedTransporter = host
      ? nodemailer.createTransport({ host, port, secure, auth: { user, pass } })
      : nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
  } catch (e) {
    console.error("[mail] Failed to create transporter", e.message);
    return null;
  }
  return cachedTransporter;
};

// Unified mail helper returns boolean success
const sendMail = async ({ to, subject, html }) => {
  const from =
    process.env.MAIL_FROM ||
    process.env.MAIL_SDN_USERNAME ||
    process.env.MAIL_LEARNMATE_USERNAME ||
    process.env.MAIL_USERNAME ||
    "no-reply@learnmate.local";
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log("[mail:mock]", { to, subject });
      return { ok: true, mode: "mock" };
    }
    // Verify connection once (ignore failures but log them)
    try {
      await transporter.verify();
    } catch (vErr) {
      console.warn("[mail:verify warning]", vErr.message);
    }
    const info = await transporter.sendMail({ from, to, subject, html });
    return { ok: true, mode: "real", id: info.messageId };
  } catch (err) {
    console.error("[mail:error]", err.message);
    return { ok: false, mode: "error", error: err.message };
  }
};

// ---------- Controllers ----------
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    if (!firstName || !lastName || !email || !password)
      return res.status(400).json({ message: "Missing required fields" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(409).json({ message: "Email already registered" });

    const password_hash = await bcrypt.hash(password, 10);
    const verify_token = crypto.randomBytes(40).toString("hex");
    const verify_token_expires = new Date(Date.now() + 1000 * 60 * 60 * 24);

    const user = await User.create({
      full_name: `${firstName} ${lastName}`,
      email,
      password_hash,
      verify_token,
      verify_token_expires,
      status: "pending",
    });

    const verifyLink = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/verify-account?token=${verify_token}`;
    const mailResult = await sendMail({
      to: email,
      subject: "Verify your account",
      html: `<p>Nhấn vào nút bên dưới để xác minh tài khoản của bạn:</p><p><a style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-weight:600" href="${verifyLink}" target="_blank" rel="noopener">Click here to verify</a></p><p>Liên kết hết hạn sau 24 giờ.</p><p>Nếu bạn không tạo tài khoản, hãy bỏ qua email này.</p>`,
    });

    if (!mailResult.ok) {
      // If email send fails, remove the user to enforce rule "only stored after email works"
      await User.deleteOne({ _id: user._id });
      return res
        .status(500)
        .json({ message: "Could not send verification email" });
    }

    res.status(201).json({
      status: "pending",
      mail: mailResult.mode,
      message:
        "Registration submitted. Please check your email to verify your account.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration failed" });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Missing credentials" });
    const user = await User.findOne({ email }).select(
      "+password_hash +refresh_tokens"
    );
    if (!user)
      return res.status(401).json({ message: "Invalid email or password" });

    // Check account status
    if (user.status === "banned") {
      return res.status(403).json({
        message:
          "Tài khoản của bạn đã bị cấm vĩnh viễn. Vui lòng liên hệ admin để biết thêm chi tiết.",
        reason: user.ban_reason || "Vi phạm chính sách sử dụng",
        status: "banned",
      });
    }
    if (user.status === "blocked") {
      return res.status(403).json({
        message:
          "Tài khoản của bạn đã bị khóa tạm thời. Vui lòng liên hệ admin để biết thêm chi tiết.",
        reason: user.block_reason || "Tài khoản đang bị tạm khóa",
        status: "blocked",
      });
    }
    if (user.status !== "active") {
      return res.status(403).json({
        message: "Please verify your email before logging in.",
        status: user.status,
      });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ message: "Invalid email or password" });
    const accessToken = signAccessToken(user._id.toString());
    const refreshToken = signRefreshToken(user._id.toString());
    user.refresh_tokens.push(refreshToken);
    await user.save();

    // Check profile completion
    const profileCompletion = calculateProfileCompletion(user);

    res.json({
      accessToken,
      refreshToken,
      user: buildUserPayload(user),
      profileCompletion: {
        completed: user.profile_completed,
        step: user.profile_completion_step,
        firstLogin: user.first_login,
        percentage: profileCompletion.percentage,
        missingFields: profileCompletion.missingFields,
        nextStep: profileCompletion.nextStep,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user: buildUserPayload(user) });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user" });
  }
};

exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ message: "Missing refresh token" });
    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (e) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }
    const user = await User.findById(payload.sub).select("+refresh_tokens");
    if (!user || !user.refresh_tokens.includes(refreshToken))
      return res.status(401).json({ message: "Invalid refresh token" });

    const newAccess = signAccessToken(user._id.toString());
    res.json({ accessToken: newAccess });
  } catch (err) {
    res.status(500).json({ message: "Failed to refresh token" });
  }
};

// Provide Google config to frontend dynamically
exports.googleConfig = async (req, res) => {
  const cid = resolveGoogleClientId();
  if (!cid) return res.status(404).json({ clientId: null });
  res.json({ clientId: cid });
};

// ---- Full-page Google OAuth (Authorization Code Flow) ----
exports.googleStart = async (req, res) => {
  try {
    const client = getGoogleCodeClient();
    if (!client) return res.status(500).send("Google OAuth not configured");
    const state = crypto.randomBytes(16).toString("hex");
    res.cookie("g_state", state, { maxAge: 5 * 60 * 1000, sameSite: "lax" });
    const url = client.generateAuthUrl({
      scope: ["openid", "email", "profile"],
      access_type: "offline",
      prompt: "consent",
      state,
    });
    return res.redirect(302, url);
  } catch (e) {
    console.error("[googleStart]", e.message);
    res.status(500).send("Failed to start Google login");
  }
};

// (no diagnostic endpoint in minimal version)

exports.googleRedirect = async (req, res) => {
  try {
    const { code, state, error } = req.query;
    if (error) return res.status(400).send("Google authorization error");
    if (!code) return res.status(400).send("Missing code");
    if (!state || req.cookies?.g_state !== state)
      return res.status(400).send("Invalid state");
    const client = getGoogleCodeClient();
    if (!client) return res.status(500).send("Client not configured");
    const tokenResp = await client.getToken(code);
    const idToken = tokenResp.tokens.id_token;
    if (!idToken) return res.status(401).send("No id_token");
    const verifyClient = getGoogleClient();
    let ticket;
    try {
      ticket = await verifyClient.verifyIdToken({
        idToken,
        audience: resolveGoogleClientId(),
      });
    } catch (e) {
      return res.status(401).send("Invalid id_token");
    }
    const payload = ticket.getPayload();
    const email = payload.email;
    const fullName =
      payload.name ||
      `${payload.given_name || ""} ${payload.family_name || ""}`.trim();
    if (!email) return res.status(400).send("Email not available");
    let user = await User.findOne({ email }).select("+refresh_tokens");
    if (!user) {
      user = await User.create({
        full_name: fullName || "Google User",
        email,
        status: "active",
        email_verified_at: new Date(),
      });
    } else {
      // Check if account is banned or blocked
      if (user.status === "banned") {
        return res
          .status(403)
          .send(
            `Tài khoản đã bị cấm vĩnh viễn. Lý do: ${
              user.ban_reason || "Vi phạm chính sách"
            }`
          );
      }
      if (user.status === "blocked") {
        return res
          .status(403)
          .send(
            `Tài khoản đã bị khóa. Lý do: ${
              user.block_reason || "Tạm khóa bởi admin"
            }`
          );
      }
      // Only activate if pending verification
      if (user.status === "pending") {
        user.status = "active";
        user.email_verified_at = user.email_verified_at || new Date();
        user.verify_token = null;
        user.verify_token_expires = null;
      }
    }
    const accessToken = signAccessToken(user._id.toString());
    const refreshToken = signRefreshToken(user._id.toString());
    if (!user.refresh_tokens.includes(refreshToken))
      user.refresh_tokens.push(refreshToken);
    await user.save();
    const frontend = process.env.FRONTEND_URL || "http://localhost:3000";
    res.clearCookie("g_state");
    const redirect = `${frontend}/oauth-callback#provider=google&accessToken=${encodeURIComponent(
      accessToken
    )}&refreshToken=${encodeURIComponent(refreshToken)}`;
    return res.redirect(302, redirect);
  } catch (e) {
    console.error("[googleRedirect]", e.message);
    res.status(500).send("Google redirect failed");
  }
};

// Google OAuth (credential from Google Identity Services)
exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential)
      return res.status(400).json({ message: "Missing credential" });
    const client = getGoogleClient();
    if (!client)
      return res.status(500).json({ message: "Google client not configured" });
    let ticket;
    try {
      const aud = resolveGoogleClientId();
      ticket = await client.verifyIdToken({
        idToken: credential,
        audience: aud,
      });
    } catch (e) {
      return res.status(401).json({ message: "Invalid Google token" });
    }
    const payload = ticket.getPayload();
    const email = payload.email;
    const fullName =
      payload.name ||
      `${payload.given_name || ""} ${payload.family_name || ""}`.trim();
    if (!email)
      return res
        .status(400)
        .json({ message: "Google account has no public email" });

    let user = await User.findOne({ email }).select("+refresh_tokens");
    if (!user) {
      user = await User.create({
        full_name: fullName || "Google User",
        email,
        status: "active",
        email_verified_at: new Date(),
      });
    } else {
      // Check if account is banned or blocked
      if (user.status === "banned") {
        return res.status(403).json({
          message: "Tài khoản đã bị cấm vĩnh viễn. Vui lòng liên hệ admin.",
          reason: user.ban_reason || "Vi phạm chính sách sử dụng",
          status: "banned",
        });
      }
      if (user.status === "blocked") {
        return res.status(403).json({
          message: "Tài khoản đã bị khóa. Vui lòng liên hệ admin.",
          reason: user.block_reason || "Tạm khóa bởi admin",
          status: "blocked",
        });
      }
      // Only activate if pending verification
      if (user.status === "pending") {
        user.status = "active";
        user.email_verified_at = user.email_verified_at || new Date();
        user.verify_token = null;
        user.verify_token_expires = null;
      }
    }
    const accessToken = signAccessToken(user._id.toString());
    const refreshToken = signRefreshToken(user._id.toString());
    if (!user.refresh_tokens.includes(refreshToken))
      user.refresh_tokens.push(refreshToken);
    await user.save();
    res.json({ accessToken, refreshToken, user: buildUserPayload(user) });
  } catch (err) {
    console.error("[googleLogin]", err.message);
    res.status(500).json({ message: "Google login failed" });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      try {
        const payload = jwt.verify(
          refreshToken,
          process.env.REFRESH_TOKEN_SECRET
        );
        const user = await User.findById(payload.sub).select("+refresh_tokens");
        if (user) {
          user.refresh_tokens = user.refresh_tokens.filter(
            (t) => t !== refreshToken
          );
          await user.save();
        }
      } catch (e) {
        /* ignore */
      }
    }
    res.json({ message: "Logged out" });
  } catch (err) {
    res.status(500).json({ message: "Logout failed" });
  }
};

exports.verifyAccount = async (req, res) => {
  try {
    let { token } = req.query;
    if (!token) return res.status(400).json({ message: "Missing token" });
    token = String(token).trim();
    // Basic validation length ~80 hex chars (40 bytes)
    if (!/^[a-f0-9]{80}$/i.test(token)) {
      console.warn("[verifyAccount] token format invalid", token);
    }
    const user = await User.findOne({
      verify_token: token,
      verify_token_expires: { $gt: new Date() },
    });
    if (!user) {
      console.warn("[verifyAccount] token not found or expired", { token });
      return res.status(400).json({ message: "Invalid or expired token" });
    }
    if (user.status === "active")
      return res.json({ message: "Account already verified" });
    user.status = "active";
    user.email_verified_at = new Date();
    user.verify_token = null;
    user.verify_token_expires = null;
    await user.save();
    res.json({ message: "Account verified. You can now sign in." });
  } catch (err) {
    console.error("[verifyAccount]", err.message);
    res.status(500).json({ message: "Verification failed" });
  }
};

// Resend verification email
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Missing email" });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.status === "active")
      return res.status(400).json({ message: "Email already verified" });
    // generate new token
    user.verify_token = crypto.randomBytes(40).toString("hex");
    user.verify_token_expires = new Date(Date.now() + 1000 * 60 * 60 * 24);
    await user.save();
    const link = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/verify-account?token=${user.verify_token}`;
    const mailResult = await sendMail({
      to: email,
      subject: "Resend verification",
      html: `<p>Nhấn nút để xác minh tài khoản của bạn:</p><p><a style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-weight:600" href='${link}' target="_blank" rel="noopener">Click here to verify</a></p>`,
    });
    if (!mailResult.ok)
      return res.status(500).json({ message: "Could not send email" });
    res.json({ message: "Verification email resent", mail: mailResult.mode });
  } catch (err) {
    console.error("[resendVerification]", err.message);
    res.status(500).json({ message: "Failed to resend verification" });
  }
};

exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp_code = otp;
    user.otp_expires = new Date(Date.now() + 1000 * 60 * 10);
    await user.save();
    await sendMail({
      to: email,
      subject: "Your OTP",
      html: `<p>OTP: <b>${otp}</b></p>`,
    });
    res.json({ message: "OTP resent" });
  } catch (err) {
    res.status(500).json({ message: "Failed to resend OTP" });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.otp_code)
      return res.status(400).json({ message: "Invalid OTP" });
    if (user.otp_code !== otp || user.otp_expires < new Date())
      return res.status(400).json({ message: "Invalid or expired OTP" });
    user.otp_code = null;
    user.otp_expires = null;
    user.status = "active";
    await user.save();
    res.json({ message: "OTP verified" });
  } catch (err) {
    res.status(500).json({ message: "Failed to verify OTP" });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    // Always respond with generic message to prevent email enumeration timing
    const genericMsg = "If the email exists, a reset link has been sent";
    const user = await User.findOne({ email });
    if (!user) return res.json({ message: genericMsg });
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.reset_password_token = resetToken;
    user.reset_password_expires = new Date(Date.now() + 1000 * 60 * 30); // 30m
    await user.save();
    const link = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/reset-password?token=${resetToken}`;
    const mailResult = await sendMail({
      to: email,
      subject: "Reset your password",
      html: `<p>You requested a password reset.</p><p>Click the link below (valid 30 minutes):</p><p><a href='${link}'>Reset Password</a></p><p>If you did not request this, you can ignore this email.</p>`,
    });
    return res.json({
      message: genericMsg,
      mail: mailResult.mode,
      mailOk: mailResult.ok,
    });
  } catch (err) {
    console.error("[forgotPassword]", err.message);
    return res.status(500).json({ message: "Failed to process request" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password)
      return res.status(400).json({ message: "Missing fields" });
    const user = await User.findOne({
      reset_password_token: token,
      reset_password_expires: { $gt: new Date() },
    }).select("+password_hash");
    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });
    user.password_hash = await bcrypt.hash(password, 10);
    user.reset_password_token = null;
    user.reset_password_expires = null;
    await user.save();
    res.json({ message: "Password updated" });
  } catch (err) {
    res.status(500).json({ message: "Failed to reset password" });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current password and new password are required" });
    }

    const user = await User.findById(req.user.id).select("+password_hash");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.password_hash) {
      return res.status(400).json({
        message:
          "Account doesn't have a password set. Please use social login or reset password.",
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password_hash
    );
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Check if new password is different from current
    const isSamePassword = await bcrypt.compare(
      newPassword,
      user.password_hash
    );
    if (isSamePassword) {
      return res.status(400).json({
        message: "New password must be different from current password",
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await User.findByIdAndUpdate(req.user.id, {
      password_hash: hashedNewPassword,
    });

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Failed to change password" });
  }
};
