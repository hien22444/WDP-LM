const path = require("path");
const dotenv = require("dotenv");
const fs = require("fs");
// Load envs from multiple common locations without overriding already-set vars
const loadEnvIf = (p) => {
  try {
    const r = dotenv.config({ path: p, override: false });
    if (r && r.parsed) console.log(`[dotenv] loaded ${Object.keys(r.parsed).length} vars from ${p}`);
  } catch (_) {}
};
// 1) default CWD
dotenv.config({ override: false });
// 2) backend/.env (file-relative)
loadEnvIf(path.join(__dirname, ".env"));
// 3) backend/.env.local
loadEnvIf(path.join(__dirname, ".env.local"));
// 4) project root ../.env
loadEnvIf(path.join(__dirname, "../.env"));
// 5) project root ../.env.local
loadEnvIf(path.join(__dirname, "../.env.local"));

// (No env alias normalization)

// Fallback manual loader (handles UTF-16LE saved files on Windows)
const parseEnvText = (text) => {
  const out = {};
  const lines = text.split(/\r?\n/);
  for (const raw of lines) {
    const line = String(raw || "").trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    val = val.replace(/^['"]|['"]$/g, "");
    if (key) out[key] = val;
  }
  return out;
};

const ensureEnvFromFile = (p) => {
  try {
    if (!fs.existsSync(p)) return 0;
    let buf = fs.readFileSync(p);
    if (!buf || !buf.length) return 0;
    // Detect UTF-16LE BOM (FF FE) and decode accordingly
    let text;
    if (buf[0] === 0xFF && buf[1] === 0xFE) {
      text = buf.toString('utf16le');
    } else if (buf[0] === 0xFE && buf[1] === 0xFF) {
      text = buf.toString('utf16le');
    } else {
      text = buf.toString('utf8');
    }
    const parsed = parseEnvText(text);
    let setCount = 0;
    for (const [k, v] of Object.entries(parsed)) {
      if (process.env[k] === undefined || process.env[k] === "") {
        process.env[k] = v;
        setCount++;
      }
    }
    if (setCount) console.log(`[env-fallback] loaded ${setCount} vars from ${p}`);
    return setCount;
  } catch (e) { return 0; }
};

// If after dotenv loads we still miss critical vars, try manual parse
const needGoogle = !(process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_APP_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID);
if (needGoogle) {
  ensureEnvFromFile(path.join(__dirname, ".env"));
  ensureEnvFromFile(path.join(__dirname, ".env.local"));
  ensureEnvFromFile(path.join(__dirname, "../.env"));
  ensureEnvFromFile(path.join(__dirname, "../.env.local"));
}

// Fallback nếu dotenv không hoạt động
if (!process.env.URI_DB && !process.env.MONGO_URI) {
  process.env.URI_DB = "mongodb+srv://HieuTD:qbTXXCEIn1G4veK5@learnmate.6rejkx4.mongodb.net/?retryWrites=true&w=majority&appName=LearnMate";
  process.env.PORT = "5000";
  process.env.JWT_SECRET = "learnmate";
  console.log("Using fallback environment variables");
}

console.log("URI_DB:", process.env.URI_DB ? "Found" : "Not found");
console.log("MONGO_URI:", process.env.MONGO_URI ? "Found" : "Not found");
console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_APP_CLIENT_ID ? "Found" : "Not found");
console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_APP_CLIENT_SECRET ? "Found" : "Not found");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./src/config/database");

const app = express();

// Basic middlewares
const firstEnv = (...keys) => {
  for (const k of keys) {
    const v = process.env[k];
    if (v && String(v).trim() !== '') return String(v).trim().replace(/^['"]|['"]$/g, '');
  }
  return null;
};

const allowedOrigins = [
    firstEnv('FRONTEND_URL', 'CLIENT_URL') || "http://localhost:3000",
	"http://127.0.0.1:3000",
	"http://localhost:3001",
	"http://127.0.0.1:3001",
	"http://localhost:5173",
	"http://127.0.0.1:5173"
];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Health check
app.get("/api/health", (req, res) => {
	res.json({ status: "ok", time: new Date().toISOString() });
});

// Routes
const authRoutes = require("./src/routes/auth");
const userRoutes = require("./src/routes/user");
const dashboardRoutes = require("./src/routes/dashboard");
const tutorRoutes = require("./src/routes/tutor");
const bookingRoutes = require("./src/routes/booking");
const adminRoutes = require("./src/routes/admin");
const { googleStart, googleRedirect } = require('./src/controllers/authController');
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/tutors", tutorRoutes);
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/admin", adminRoutes);
// Root Google OAuth routes matching GOOGLE_APP_CLIENT_REDIRECT_LOGIN
app.get('/google/start', googleStart);
app.get('/google/redirect', googleRedirect);

// Global error handler (basic)
app.use((err, req, res, next) => {
	console.error(err);
	res.status(err.status || 500).json({ message: err.message || "Server error" });
});

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
	app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});
