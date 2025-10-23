const OpenAI = require("openai");
const TutorProfile = require("../models/TutorProfile");

// Prefer several env var names (developer may set CHATAI_KEY or CHATAI)
const preferredKeyNames = [
  "CHATAI_KEY",
  "CHATAI",
  "CHAT_AI_KEY",
  "OPENAI_API_KEY",
  "OPENAI_KEY",
];
let OPENAI_KEY = "";
let OPENAI_KEY_NAME = null;
for (const n of preferredKeyNames) {
  if (process.env[n] && String(process.env[n]).trim()) {
    OPENAI_KEY = String(process.env[n]).trim();
    OPENAI_KEY_NAME = n;
    break;
  }
}

console.log("[DEBUG] OpenAI key var =", OPENAI_KEY_NAME || "(none)");
console.log("DEBUG: AI key length =", OPENAI_KEY?.length || 0);
let aiEnabled = true;
let openai = null;

// detect key type for logging and guidance
function detectOpenAIKeyType(key) {
  if (!key) return "none";
  if (key.startsWith("sk-proj")) return "project";
  if (key.startsWith("sk-svcacct")) return "service-account";
  if (key.startsWith("sk-")) return "secret";
  return "unknown";
}

const keyType = detectOpenAIKeyType(OPENAI_KEY);

if (!OPENAI_KEY) {
  // No OpenAI key found locally. Check whether a Google/Gemini key is provided
  // via env (server.js supports GEMINI_KEY/GOOGLE_API_KEY). If so, enable AI
  // here and rely on the server-attached client (req.app.locals.openai) at
  // request time.
  const providerEnv = (
    process.env.CHATAI_PROVIDER ||
    process.env.CHATAI_PROVIDER_NAME ||
    ""
  ).toLowerCase();
  const googleKey =
    process.env.GEMINI_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_KEY ||
    process.env.CHATAI_KEY;
  if ((providerEnv === "google" || providerEnv === "gemini") && googleKey) {
    aiEnabled = true;
    openai = null; // will use app.locals.openai when handling a request
    console.log(
      `[AI] No local OpenAI key, but detected ${providerEnv} key in env; AI enabled (using server-provided client if attached).`
    );
  } else {
    console.error("[AI] OPENAI_API_KEY is missing. Using fallback only.");
    aiEnabled = false;
    console.warn("⚠️ AI mode disabled. Using fallback responses only.");
  }
} else {
  // If it's a project/service key, we normally recommend using a secret key.
  if (keyType === "project" || keyType === "service-account") {
    console.warn(
      `[AI] Detected a non-secret OpenAI key type: ${keyType}. By default this is not recommended.`
    );
    // If developer explicitly allows non-secret keys via env, try to initialize client anyway
    const allowNonSecret =
      String(process.env.ALLOW_NONSECRET_OPENAI_KEYS || "").toLowerCase() ===
      "true";
    if (!allowNonSecret) {
      console.error(
        `[AI] To enable using this key type set ALLOW_NONSECRET_OPENAI_KEYS=true in backend/.env. AI will remain disabled.`
      );
      aiEnabled = false;
    }
  }

  if (aiEnabled) {
    try {
      // prefer app-level client if provided by server.js
      if (global?.app && global.app.locals?.openai) {
        openai = global.app.locals.openai;
        console.log(
          "[AI] Using app-level OpenAI client from global.app.locals"
        );
      } else if (typeof require !== "undefined") {
        // fallback to local init
        openai = new OpenAI({ apiKey: OPENAI_KEY });
        console.log(`[AI] OpenAI client initialized (keyType=${keyType}).`);
      }
      if (keyType !== "secret") {
        console.warn(
          "⚠️ You are using a non-secret OpenAI key. Calls may fail if the key lacks permissions or billing. Check OpenAI Dashboard if you see errors."
        );
      }
    } catch (e) {
      console.error(
        "[AI] Failed to initialize OpenAI client:",
        e?.message || e
      );
      aiEnabled = false;
    }
  }

  // If server.js attached an app-level AI client (e.g., Gemini/Google wrapper),
  // enable AI even when this module didn't find a local OPENAI_KEY.
  try {
    if (!aiEnabled && global?.app && global.app.locals?.openai) {
      openai = global.app.locals.openai;
      aiEnabled = true;
      console.log(
        "[AI] Detected app-level AI client; enabling AI and using that client"
      );
    }
  } catch (e) {
    // ignore
  }
}

// Extra safety: if OPENAI_KEY was missing earlier we still want to detect
// an app-level AI client attached by server.js. This runs regardless of
// the earlier branch to ensure aiEnabled is correctly set when using
// Gemini/Google wrapper.
try {
  if (!aiEnabled && global?.app && global.app.locals?.openai) {
    openai = global.app.locals.openai;
    aiEnabled = true;
    console.log("[AI] App-level AI client detected (post-init); AI enabled");
  }
} catch (e) {
  // ignore
}

const conversationHistory = [];
const systemPrompt = `Bạn là chatbot thân thiện giúp người dùng tìm gia sư. Khi người dùng chào, hãy chào lại tự nhiên và thân thiện. Khi họ hỏi tìm gia sư, phân tích các yếu tố: môn học, cấp độ, hình thức (online/offline), địa điểm và yêu cầu khác. Đề xuất gia sư phù hợp dựa trên chuyên môn, kinh nghiệm, mức học phí và lịch dạy. Trả lời bằng tiếng Việt, ngắn gọn, thân mật.`;

function resolveModelForClient(client, defaultModel = "gpt-3.5-turbo") {
  try {
    const prov = (
      process.env.CHATAI_PROVIDER ||
      process.env.CHATAI_PROVIDER_NAME ||
      ""
    ).toLowerCase();
    // If developer explicitly set GEMINI_MODEL / GOOGLE_MODEL use them
    if (prov === "gemini") {
      // Use text-bison-001 as a safer default for Gemini/Google generative API
      return process.env.GEMINI_MODEL || "text-bison-001";
    }
    if (prov === "google" || (client && client.provider === "google")) {
      return process.env.GOOGLE_MODEL || "text-bison-001";
    }
  } catch (e) {
    // ignore
  }
  return defaultModel;
}

function fallbackReply(userMsg) {
  const lower = (userMsg || "").toLowerCase();
  if (!userMsg || userMsg.trim() === "") return "Bạn chưa nhập gì cả 😊";
  if (lower.includes("xin chào") || lower.includes("chào"))
    return "Chào bạn! Mình có thể giúp bạn tìm gia sư. Bạn cần môn gì và ở đâu?";
  if (lower.includes("toán"))
    return "Bạn đang tìm gia sư Toán. Bạn muốn học ở Hà Nội hay TP.HCM?";
  if (lower.includes("anh"))
    return "Bạn đang tìm gia sư Tiếng Anh. Bạn cần luyện giao tiếp hay ngữ pháp?";
  return "Mình đã nhận tin nhắn của bạn. Hiện tại dịch vụ AI chưa khả dụng, bạn có thể cho biết rõ môn học, cấp độ và địa điểm không?";
}

function logOpenAIError(err) {
  console.error("❌ [AI] Error in AI tutor search:", err?.message || err);
  if (err?.response) {
    console.error("🔴 [AI] Response status:", err.response.status);
    if (err.response.data)
      console.error(
        "🔴 [AI] Response data:",
        JSON.stringify(err.response.data, null, 2)
      );
  } else if (err?.error) {
    console.error(
      "🔴 [AI] OpenAI error detail:",
      JSON.stringify(err.error, null, 2)
    );
  } else {
    console.error("⚠️ [AI] Unknown error structure:", err);
  }
}

// Local reply generator: build a friendly Vietnamese summary from items
function localGenerateReply(userMsg, items) {
  if (!items || !items.length) return fallbackReply(userMsg);
  const top = items.slice(0, 5);
  let reply = `Mình đã tìm thấy ${items.length} gia sư phù hợp với yêu cầu của bạn.`;
  reply += "\n\n";
  reply += top
    .map((t, i) => {
      const subjects =
        (t.subjects || []).filter(Boolean).join(", ") || "Chưa cập nhật";
      const city = t.city ? ` — ${t.city}` : "";
      const rating = t.avgRating ? ` — ⭐ ${t.avgRating}/5` : "";
      const courses = (t.courses || []).length
        ? ` • ${t.courses.length} khóa`
        : "";
      return `${i + 1}. ${t.name}${city} — ${subjects}${rating}${courses}`;
    })
    .join("\n");
  reply +=
    "\n\nBạn muốn xem chi tiết gia sư nào (gõ số thứ tự), hoặc lọc thêm?";
  return reply;
}

// --- Helpers: sanitize tutors, parse query, fetch tutors ---
function sanitizeTutors(tutors) {
  // try to enrich with courses and review counts (best-effort)
  const TeachingSlot = (() => {
    try {
      return require("../models/TeachingSlot");
    } catch (e) {
      return null;
    }
  })();

  const TeachingSession = (() => {
    try {
      return require("../models/TeachingSession");
    } catch (e) {
      return null;
    }
  })();

  return Promise.all(
    (tutors || []).map(async (t) => {
      const base = {
        id: t._id,
        name: t.user?.full_name || "Gia s\u01b0",
        avatar: t.user?.avatar || t.avatarUrl || null,
        subjects: (t.subjects || []).map((s) => s.name),
        levels: (t.subjects || []).map((s) => s.level).filter(Boolean),
        experienceYears: t.experienceYears || 0,
        city: t.city || null,
        teachModes: t.teachModes || [],
        sessionRate: t.sessionRate || null,
        bio: t.bio || null,
        reviewCount: t.reviewCount || 0,
        avgRating: t.avgRating || null,
        recentReviews: [],
        courses: [],
      };

      if (TeachingSlot) {
        try {
          const courses = await TeachingSlot.find({
            tutorProfile: t._id,
            status: { $ne: "deleted" },
          })
            .limit(5)
            .lean();
          base.courses = (courses || []).map((c) => ({
            id: c._id,
            courseName: c.courseName,
            start: c.start,
            end: c.end,
            price: c.price,
            mode: c.mode,
          }));
        } catch (e) {
          // ignore
        }
      }

      // Enrich with reviews/ratings from TeachingSession (if available)
      if (TeachingSession) {
        try {
          const agg = await TeachingSession.aggregate([
            { $match: { tutorProfile: t._id, rating: { $ne: null } } },
            {
              $group: {
                _id: "$tutorProfile",
                avgRating: { $avg: "$rating" },
                totalReviews: { $sum: 1 },
              },
            },
          ]).exec();

          if (agg && agg[0]) {
            base.avgRating = Math.round((agg[0].avgRating || 0) * 10) / 10;
            base.reviewCount = agg[0].totalReviews || base.reviewCount || 0;
          }

          const recent = await TeachingSession.find({
            tutorProfile: t._id,
            feedback: { $ne: null },
          })
            .sort({ created_at: -1 })
            .limit(3)
            .select("rating feedback student startTime")
            .populate("student", "full_name")
            .lean();

          base.recentReviews = (recent || []).map((r) => ({
            rating: r.rating || null,
            feedback: r.feedback || null,
            studentName: r.student?.full_name || null,
            date: r.startTime || r.created_at || null,
          }));
        } catch (e) {
          // ignore enrichment errors
        }
      }

      return base;
    })
  );
}

function parseQueryToFilters(text) {
  const q = String(text || "").toLowerCase();
  const filters = {};
  const subjects = [];
  if (q.includes("toán") || q.includes("toan")) subjects.push("Toán");
  if (q.includes("anh")) subjects.push("Tiếng Anh");
  if (subjects.length) filters.subjects = subjects;
  if (q.includes("hà nội") || q.includes("ha noi")) filters.city = "Hà Nội";
  if (q.includes("hồ chí minh") || q.includes("tp.hcm") || q.includes("tphcm"))
    filters.city = "TP.HCM";
  if (q.includes("online")) filters.teachModes = "online";
  if (q.includes("offline")) filters.teachModes = "offline";
  return filters;
}

async function fetchRelevantTutorsFromDB(queryText, limit = 5) {
  try {
    const filters = parseQueryToFilters(queryText);
    const mongoQuery = { status: "approved" };
    if (filters.subjects)
      mongoQuery["subjects.name"] = { $in: filters.subjects };
    if (filters.city) mongoQuery.city = filters.city;
    if (filters.teachModes) mongoQuery.teachModes = filters.teachModes;

    const tutors = await TutorProfile.find(mongoQuery)
      .populate("user", "full_name avatar")
      .sort({ experienceYears: -1 })
      .limit(limit)
      .lean();

    return tutors;
  } catch (err) {
    console.error("[AI] fetchRelevantTutorsFromDB error:", err?.message || err);
    return [];
  }
}

// ===== Chat endpoint =====
const chatCompletion = async (req, res) => {
  try {
    const userMsg = req.body.message?.trim();
    if (!userMsg)
      return res.json({
        success: true,
        message: "Bạn chưa nhập tin nhắn nào cả 😅",
      });

    conversationHistory.push({ role: "user", content: userMsg });
    if (conversationHistory.length > 10) conversationHistory.shift();

    if (!aiEnabled) {
      // Provide a richer local fallback using DB results so chat is still useful
      const tutorsFromDb = await fetchRelevantTutorsFromDB(userMsg, 5);
      const items = await sanitizeTutors(tutorsFromDb);
      const localText = localGenerateReply(userMsg, items);
      conversationHistory.push({ role: "assistant", content: localText });
      return res.json({
        success: true,
        message: localText,
        items,
        fallback: true,
      });
    }

    try {
      // Fetch relevant tutors from DB and provide as context
      const tutorsFromDb = await fetchRelevantTutorsFromDB(userMsg, 5);
      const items = await sanitizeTutors(tutorsFromDb);
      const tutorContext = `Danh sách gia sư phù hợp (tối đa 5): ${JSON.stringify(
        items,
        null,
        2
      )}`;

      // prefer request-scoped client (set by server.js) to support Gemini/Google wrapper
      const client =
        (req && req.app && req.app.locals && req.app.locals.openai) || openai;
      if (!client) {
        throw new Error(
          "AI client not initialized on server. Check GEMINI_KEY/GOOGLE_API_KEY and server startup logs."
        );
      }
      const modelToUse = resolveModelForClient(client, "gpt-3.5-turbo");
      const completion = await client.chat.completions.create({
        model: modelToUse,
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationHistory,
          {
            role: "system",
            content:
              "Sử dụng thông tin gia sư sau để trả lời nếu cần: " +
              tutorContext,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const reply =
        completion?.choices?.[0]?.message?.content ||
        "Xin lỗi, tôi chưa nhận được phản hồi từ AI.";
      if (completion?.raw)
        console.debug("[AI] completion.raw:", completion.raw);
      conversationHistory.push({ role: "assistant", content: reply });
      return res.json({ success: true, message: reply, items });
    } catch (aiErr) {
      console.error("[AI] chatCompletion error object:", aiErr);
      logOpenAIError(aiErr);
      // Extract useful error detail for frontend debugging (non-sensitive)
      let errorDetail = { message: aiErr?.message || "OpenAI error" };
      try {
        if (aiErr?.response) {
          errorDetail.status = aiErr.response.status;
          errorDetail.body = aiErr.response.data || aiErr.response;
        }
      } catch (e) {
        // ignore
      }

      // Provide DB-based fallback suggestions to keep chat useful (using local generator)
      const tutorsFromDb = await fetchRelevantTutorsFromDB(userMsg, 5);
      const items = await sanitizeTutors(tutorsFromDb);
      const localText = localGenerateReply(userMsg, items);
      conversationHistory.push({ role: "assistant", content: localText });
      // Return fallback as HTTP 200 so frontends using axios don't throw on non-2xx
      return res.json({
        success: true,
        message: localText,
        items,
        fallback: true,
        errorDetail,
      });
    }
  } catch (err) {
    console.error("[AI] chatCompletion error:", err);
    return res.json({
      success: false,
      message: "Lỗi khi xử lý chat",
      fallback: true,
    });
  }
};

// ===== Tutor search with AI + MongoDB =====
const searchTutorsWithAI = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || !String(query).trim())
      return res
        .status(400)
        .json({ success: false, message: "Bạn chưa nhập từ khóa tìm kiếm." });

    // ===== Phân tích query =====
    let parsedAnalysis = {
      subjects: [],
      levels: [],
      mode: null,
      location: null,
      other: query,
    };

    if (aiEnabled) {
      const analysisPrompt = `Phân tích yêu cầu tìm gia sư sau và trích xuất các thông tin quan trọng:\n"${query}"\nTrả về JSON với fields: subjects, levels, mode, location, other.`;
      try {
        const client =
          (req && req.app && req.app.locals && req.app.locals.openai) || openai;
        const analysis = await client.chat.completions.create({
          model: resolveModelForClient(client, "gpt-3.5-turbo"),
          messages: [
            {
              role: "system",
              content: "Bạn là một trợ lý trích xuất thông tin có cấu trúc.",
            },
            { role: "user", content: analysisPrompt },
          ],
          temperature: 0,
        });
        if (analysis?.raw) console.debug("[AI] analysis.raw:", analysis.raw);
        try {
          const rawAnalysis = analysis?.choices?.[0]?.message?.content || "";
          if (rawAnalysis && rawAnalysis.trim().startsWith("{")) {
            parsedAnalysis = JSON.parse(rawAnalysis);
          } else {
            console.warn(
              "[AI] Analysis did not return JSON. Raw:",
              rawAnalysis
            );
            // keep parsedAnalysis as defaults (do not disable AI entirely)
          }
        } catch (e) {
          console.error("[AI] Failed to parse analysis JSON:", e.message);
          // keep aiEnabled as-is; we'll fallback to simple parsing later
        }
      } catch (aiErr) {
        console.error("[AI] Analysis error:", aiErr);
        aiEnabled = false;
      }
    }

    if (!aiEnabled) {
      const q = String(query).toLowerCase();
      if (q.includes("toán")) parsedAnalysis.subjects.push("Toán");
      if (q.includes("anh")) parsedAnalysis.subjects.push("Tiếng Anh");
      if (q.includes("hà nội")) parsedAnalysis.location = "Hà Nội";
      if (q.includes("tp.hcm") || q.includes("hồ chí minh"))
        parsedAnalysis.location = "TP.HCM";
    }

    // ===== MongoDB query =====
    const queryConditions = [];
    if (parsedAnalysis.subjects?.length)
      queryConditions.push({ subjects: { $in: parsedAnalysis.subjects } });
    if (parsedAnalysis.levels?.length)
      queryConditions.push({ levels: { $in: parsedAnalysis.levels } });
    if (parsedAnalysis.mode)
      queryConditions.push({ preferredMode: parsedAnalysis.mode });
    if (parsedAnalysis.location)
      queryConditions.push({ "locations.city": parsedAnalysis.location });

    const mongoQuery = queryConditions.length ? { $and: queryConditions } : {};
    const tutors = await TutorProfile.find(mongoQuery)
      .populate("user", "full_name avatar")
      .limit(5)
      .lean();

    const items = await sanitizeTutors(tutors);

    // ===== AI tạo phản hồi (nếu có) =====
    if (aiEnabled && items.length > 0) {
      try {
        const tutorContext = `Danh sách gia sư phù hợp (tối đa 5): ${JSON.stringify(
          items,
          null,
          2
        )}`;
        const responsePrompt = `Dựa trên yêu cầu: "${query}"\n${tutorContext}\nTạo phản hồi thân thiện giới thiệu các lựa chọn, nêu ngắn gọn điểm mạnh/điểm yếu và hướng dẫn cách đặt lịch dựa trên thông tin.`;
        const client2 =
          (req && req.app && req.app.locals && req.app.locals.openai) || openai;
        if (!client2) {
          throw new Error(
            "AI client not initialized on server. Check GEMINI_KEY/GOOGLE_API_KEY and server startup logs."
          );
        }
        const aiResponse = await client2.chat.completions.create({
          model: resolveModelForClient(client2, "gpt-3.5-turbo"),
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: responsePrompt },
          ],
          temperature: 0.7,
        });
        if (aiResponse?.raw)
          console.debug("[AI] aiResponse.raw:", aiResponse.raw);
        const aiMessage = aiResponse?.choices?.[0]?.message?.content || null;
        return res.json({
          success: true,
          tutors,
          items,
          message: aiMessage,
          analysis: parsedAnalysis,
        });
      } catch (err) {
        console.error("[AI] Response error:", err);
        // attach extra error info for debugging
        const errDetail = { message: err?.message || "AI error" };
        if (err?.response) errDetail.response = err.response;
        // fall back to DB-based response using local generator
        aiEnabled = false;
        console.error(
          "[AI] Falling back to DB results. Error detail:",
          errDetail
        );
        const localText = localGenerateReply(query, items);
        return res.json({
          success: true,
          tutors,
          items,
          message: localText,
          analysis: parsedAnalysis,
          fallback: true,
          errorDetail: errDetail,
        });
      }
    }

    // ===== Fallback message nếu không tìm thấy hoặc AI lỗi =====
    const summary = tutors.length
      ? `Tìm được ${tutors.length} gia sư phù hợp.`
      : `Xin lỗi, mình chưa tìm thấy gia sư phù hợp với "${query}". Bạn thử từ khóa khác nhé 😊`;

    return res.json({
      success: true,
      tutors,
      items,
      message: summary,
      analysis: parsedAnalysis,
      fallback: true,
    });
  } catch (error) {
    console.error("[AI] searchTutorsWithAI error:", error);
    return res.json({
      success: true,
      tutors: [],
      message: "Hiện tại không thể tìm gia sư, bạn thử lại sau.",
      analysis: {},
      fallback: true,
    });
  }
};

module.exports = {
  chatCompletion,
  searchTutorsWithAI,
};
