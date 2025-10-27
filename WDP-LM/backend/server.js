const path = require("path");
const dotenv = require("dotenv");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const connectDB = require("./src/config/database");
const WebRTCSocket = require("./src/socket/webrtcSocket");
const ChatSocket = require("./src/socket/chatSocket");

// ========================
// Load environment variables
// ========================
const loadEnvIf = (p) => {
  try {
    const r = dotenv.config({ path: p, override: false });
    if (r && r.parsed)
      console.log(
        `[dotenv] loaded ${Object.keys(r.parsed).length} vars from ${p}`
      );
  } catch (e) {
    // ignore
  }
};

dotenv.config({ override: false });
loadEnvIf(path.join(__dirname, ".env"));
loadEnvIf(path.join(__dirname, ".env.local"));
loadEnvIf(path.join(__dirname, "../.env"));
loadEnvIf(path.join(__dirname, "../.env.local"));

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
    let text;
    if (buf[0] === 0xff && buf[1] === 0xfe) {
      text = buf.toString("utf16le");
    } else {
      text = buf.toString("utf8");
    }
    const parsed = parseEnvText(text);
    // debug: show raw response body and parsed data
    try {
      console.debug("[server] Google generative raw response:", {
        url,
        respStatus: resp.status,
        respText,
        data,
      });
    } catch (e) {
      // ignore logging failures
    }
    let setCount = 0;
    for (const [k, v] of Object.entries(parsed)) {
      if (process.env[k] === undefined || process.env[k] === "") {
        process.env[k] = v;
        setCount++;
      }
    }
    if (setCount)
      console.log(`[env-fallback] loaded ${setCount} vars from ${p}`);
    return setCount;
  } catch (e) {
    return 0;
  }
};

// Fallback nếu dotenv không hoạt động
if (!process.env.URI_DB && !process.env.MONGO_URI) {
  process.env.URI_DB =
    "mongodb+srv://HieuTD:qbTXXCEIn1G4veK5@learnmate.6rejkx4.mongodb.net/?retryWrites=true&w=majority&appName=LearnMate";
  process.env.PORT = "5000";
  process.env.JWT_SECRET = "learnmate";
  console.log("Using fallback environment variables");
}

// ========================
// Express app setup
// ========================
const app = express();

// --- Initialize AI client once and attach to app.locals ---
// Support providers: 'openai' (default) and 'google'/'gemini' (Google Generative API)
(() => {
  const provider = (
    process.env.CHATAI_PROVIDER ||
    process.env.CHATAI_PROVIDER_NAME ||
    "openai"
  ).toLowerCase();

  // If the provider is google/gemini prefer Google API key env names
  if (provider === "google" || provider === "gemini") {
    const preferredGoogleKeys = [
      "GEMINI_KEY",
      "GEMINI_API_KEY",
      "GOOGLE_API_KEY",
      "GOOGLE_KEY",
      "CHATAI_KEY",
      "OPENAI_API_KEY",
    ];
    let googleKey = null;
    let googleKeyName = null;
    for (const k of preferredGoogleKeys) {
      if (process.env[k] && String(process.env[k]).trim()) {
        googleKey = String(process.env[k]).trim();
        googleKeyName = k;
        break;
      }
    }
    if (googleKey) {
      const apiKey = googleKey;
      // wrapper that exposes chat.completions.create to match existing usage
      app.locals.openai = {
        provider: "google",
        apiKey,
        chat: {
          completions: {
            create: async ({
              model,
              messages = [],
              temperature = 0.7,
              max_tokens = 512,
            }) => {
              try {
                const prompt = (messages || [])
                  .map((m) => `${m.role}: ${m.content}`)
                  .join("\n");

                // ✅ Dùng let để có thể gán lại khi phát hiện model cũ
                let googleModel =
                  model && String(model).trim()
                    ? String(model).trim()
                    : "gemini-1.5-flash-latest";

                // ✅ Tự động thay thế model cũ sang model mới
                if (
                  googleModel.includes("bison") ||
                  googleModel.includes("palm") ||
                  googleModel === "text-bison-001"
                ) {
                  console.warn(
                    `[AI] Outdated model "${googleModel}" detected — switching to "gemini-1.5-flash"`
                  );
                  googleModel = "gemini-1.5-flash"; // ✅ dùng model hợp lệ
                }

                // Try multiple method suffixes (some models support different RPC names)
                const methodSuffixes = [
                  "generateContent",
                  "generateMessage",
                  "generateText",
                  "generate",
                ];

                // Try the requested model first, then fall back to safer defaults if needed
                const fallbackModels = [
                  googleModel,
                  process.env.GEMINI_MODEL ||
                    process.env.GOOGLE_MODEL ||
                    "text-bison-001",
                  "chat-bison-001",
                  "text-bison-001",
                ];

                let lastError = null;
                let data = null;
                let respText = "";
                for (const tryModel of fallbackModels) {
                  for (const suffix of methodSuffixes) {
                    const url = `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(
                      tryModel
                    )}:${suffix}?key=${encodeURIComponent(apiKey)}`;

                    const body = {
                      // Different RPCs expect slightly different payloads; keep a common shape
                      contents: [{ parts: [{ text: prompt }] }],
                      input: prompt,
                      // generationConfig is accepted by many endpoints
                      generationConfig: {
                        temperature: temperature,
                        maxOutputTokens: Math.min(max_tokens || 512, 2048),
                      },
                    };

                    try {
                      const resp = await fetch(url, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(body),
                      });
                      respText = await resp.text();
                      try {
                        data =
                          respText && respText.length
                            ? JSON.parse(respText)
                            : {};
                        console.debug("[Gemini] response:", {
                          tryModel,
                          suffix,
                          data,
                        });
                      } catch (e) {
                        data = respText;
                        console.debug("[Gemini] non-json response", {
                          tryModel,
                          suffix,
                          respText: respText.slice(0, 1000),
                        });
                      }

                      if (!resp.ok) {
                        const err = new Error(
                          `HTTP ${resp.status} ${resp.statusText}`
                        );
                        err.response = { status: resp.status, data };
                        lastError = err;
                        // Try next suffix/model
                        continue;
                      }

                      // Successful response
                      let outText = "";
                      if (data?.candidates && data.candidates[0]) {
                        const parts = data.candidates[0]?.content?.parts || [];
                        if (parts.length && parts[0].text) {
                          outText = parts[0].text;
                        } else {
                          outText =
                            data.candidates[0].content ||
                            data.candidates[0].output ||
                            data.candidates[0].text ||
                            "";
                        }
                      } else if (
                        data?.output &&
                        Array.isArray(data.output) &&
                        data.output[0]
                      ) {
                        outText =
                          data.output[0].content || data.output[0].text || "";
                      } else if (typeof data?.generated_text === "string") {
                        outText = data.generated_text;
                      } else if (typeof data === "string") {
                        outText = data;
                      } else {
                        outText = JSON.stringify(data).slice(0, 1000);
                      }

                      return {
                        choices: [{ message: { content: outText } }],
                        raw: data,
                        meta: { usedModel: tryModel, usedSuffix: suffix },
                      };
                    } catch (e) {
                      // network / parse error; store and continue
                      const err = new Error(e?.message || e);
                      if (e && e.response) err.response = e.response;
                      else
                        err.response = {
                          status: 500,
                          data: e?.message || String(e),
                        };
                      lastError = err;
                      continue;
                    }
                  }
                }

                // If we get here, all attempts failed
                if (lastError) throw lastError;
                return { choices: [{ message: { content: "" } }], raw: data };
              } catch (e) {
                const err = new Error(e?.message || e);
                if (e && e.response) err.response = e.response;
                else
                  err.response = {
                    status: 500,
                    data: e?.message || String(e),
                  };
                throw err;
              }
            },
          },
        },
      };
      const masked = apiKey.length > 8 ? "****" + apiKey.slice(-6) : "****";
      console.log(
        `[server] Google/Gemini generative wrapper initialized (from env ${googleKeyName}, keyPreview=${masked}) and attached to app.locals`
      );
    } else {
      app.locals.openai = null;
      console.log(
        "[server] CHATAI_PROVIDER=google/gemini but no GOOGLE/GEMINI API key found in env"
      );
    }
    return;
  }

  // Fallback: try to initialize official OpenAI client when provider is openai
  try {
    const OpenAI = require("openai");
    const preferredKeyNames = [
      "OPENAI_SECRET",
      "OPENAI_SECRET_KEY",
      "CHATAI_KEY",
      "CHATAI",
      "CHAT_AI_KEY",
      "OPENAI_API_KEY",
      "OPENAI_KEY",
    ];
    let openaiKey = null;
    let openaiKeyName = null;
    for (const k of preferredKeyNames) {
      if (process.env[k] && String(process.env[k]).trim()) {
        openaiKey = String(process.env[k]).trim();
        openaiKeyName = k;
        break;
      }
    }
    if (openaiKey) {
      try {
        app.locals.openai = new (OpenAI.default || OpenAI)({
          apiKey: openaiKey,
        });
        const masked =
          openaiKey.length > 8 ? "****" + openaiKey.slice(-6) : "****";
        console.log(
          `[server] OpenAI client initialized (from env ${
            openaiKeyName || "unknown"
          }, keyPreview=${masked}) and attached to app.locals`
        );
      } catch (e) {
        console.warn(
          "[server] failed to initialize OpenAI client:",
          e?.message || e
        );
        app.locals.openai = null;
      }
    } else {
      app.locals.openai = null;
      console.log("[server] no OpenAI key found in env for app-level client");
    }
  } catch (e) {
    console.warn("[server] openai package not available, skipping OpenAI init");
    app.locals.openai = null;
  }
})();

const firstEnv = (...keys) => {
  for (const k of keys) {
    const v = process.env[k];
    if (v && String(v).trim() !== "")
      return String(v)
        .trim()
        .replace(/^['"]|['"]$/g, "");
  }
  return null;
};

const allowedOrigins = [
  firstEnv("FRONTEND_URL", "CLIENT_URL") || "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Routes
const authRoutes = require("./src/routes/auth");
const userRoutes = require("./src/routes/user");
const dashboardRoutes = require("./src/routes/dashboard");
const paymentRoutes = require("./src/routes/payment");
const tutorRoutes = require("./src/routes/tutor");
const bookingRoutes = require("./src/routes/booking");
const adminRoutes = require("./src/routes/admin");
const aiRoutes = require("./src/routes/ai");
const reviewRoutes = require("./src/routes/review");
const profileCompletionRoutes = require("./src/routes/profile-completion");
const tutorVerificationRoutes = require("./src/routes/tutor-verification");
const adminVerificationRoutes = require("./src/routes/admin-verification");
const notificationRoutes = require("./src/routes/notification");
const {
  googleStart,
  googleRedirect,
} = require("./src/controllers/authController");

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/tutors", tutorRoutes);
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/profile-completion", profileCompletionRoutes);
app.use("/api/v1/tutor-verification", tutorVerificationRoutes);
app.use("/api/v1/admin/verification", adminVerificationRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/wallet", require("./src/routes/wallet"));

// Google OAuth routes
app.get("/google/start", googleStart);
app.get("/google/redirect", googleRedirect);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ message: err.message || "Server error" });
});

// ========================
// Start server with Socket.io
// ========================
const PORT = process.env.PORT || 5000;
connectDB()
  .then(() => {
    // Create HTTP server
    const server = http.createServer(app);
    
    // Initialize WebRTC Socket.io
    const webrtcSocket = new WebRTCSocket(server);
    webrtcSocket.setupWebRTCNamespace();
    
    // Initialize Chat Socket.io (using root namespace)
    const chatSocket = new ChatSocket(webrtcSocket.io);
    chatSocket.initializeChatNamespace();
    
    console.log(`💬 Chat Socket.io: Using /chat namespace`);
    
    // Store socket instances for potential use in routes
    app.locals.webrtcSocket = webrtcSocket;
    app.locals.chatSocket = chatSocket;
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🔌 WebRTC Socket.io namespace: /webrtc`);
      console.log(`📊 Room stats:`, webrtcSocket.getRoomStats());
    });

    // Initialize Cron Jobs
    try {
      const CronManager = require("./src/cron/index");
      const cronManager = new CronManager();
      
      // Graceful shutdown for cron jobs
      process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down gracefully...');
        cronManager.stopAll();
        process.exit(0);
      });
      
      process.on('SIGTERM', () => {
        console.log('\n🛑 Terminating...');
        cronManager.stopAll();
        process.exit(0);
      });
    } catch (error) {
      console.error("❌ Failed to start cron jobs:", error.message);
    }
  })
  .catch((err) => {
    console.error("Failed to connect DB", err);
    process.exit(1);
  });
