const express = require("express");
const router = express.Router();

// Import Mongoose models
const User = require("../models/User");
const TutorProfile = require("../models/TutorProfile");
const Review = require("../models/Review");

/**
 * Bước 1: Hàm extractIntent (KHÔNG dùng AI - dùng Regex để tiết kiệm quota)
 * Phân tích tin nhắn để trích xuất keywords: subject, level, location, minRating, maxPrice
 */
function extractIntent(message) {
  console.log("[extractIntent] Analyzing message:", message);

  const criteria = {
    subject: null,
    level: null,
    location: null,
    minRating: null,
    maxPrice: null,
  };

  // Danh sách môn học
  const subjects = [
    "toán",
    "tiếng anh",
    "tiếng việt",
    "vật lý",
    "hóa học",
    "sinh học",
    "lịch sử",
    "địa lý",
    "tin học",
    "mỹ thuật",
    "thể dục",
    "âm nhạc",
  ];
  for (const subj of subjects) {
    if (message.toLowerCase().includes(subj)) {
      criteria.subject = subj;
      break;
    }
  }

  // Danh sách trình độ
  const levels = [
    "tiểu học",
    "trung học cơ sở",
    "trung học phổ thông",
    "đại học",
  ];
  for (const lvl of levels) {
    if (message.toLowerCase().includes(lvl)) {
      criteria.level = lvl;
      break;
    }
  }

  // Danh sách địa điểm (thành phố/tỉnh)
  const locations = [
    "hà nội",
    "tp.hcm",
    "hồ chí minh",
    "hải phòng",
    "đà nẵng",
    "hải dương",
    "bắc ninh",
    "cần thơ",
    "nha trang",
    "sài gòn",
  ];
  for (const loc of locations) {
    if (message.toLowerCase().includes(loc)) {
      criteria.location = loc;
      break;
    }
  }

  // Tìm giá (ví dụ: "dưới 100k", "tối đa 200000")
  const priceMatch = message.match(
    /(?:dưới|tối đa|giá tối đa)?\\s*(\\d+)\\s*(?:k|đ|000)?/i
  );
  if (priceMatch) {
    let price = parseInt(priceMatch[1]);
    if (priceMatch[0].includes("k") || priceMatch[0].includes("K"))
      price *= 1000;
    criteria.maxPrice = price;
  }

  // Tìm rating (ví dụ: "4 sao", "trên 4 sao")
  const ratingMatch = message.match(/(\\d)\\s*sao/i);
  if (ratingMatch) {
    criteria.minRating = parseInt(ratingMatch[1]);
  }

  console.log("[extractIntent] Extracted criteria:", criteria);
  return criteria;
}

/**
 * Bước 2: Truy vấn MongoDB
 * Xây dựng query dựa trên criteria từ extractIntent
 */
async function queryTutorProfiles(criteria) {
  try {
    const queryConditions = [];

    // Điều kiện bắt buộc: chỉ tìm gia sư đã được duyệt
    queryConditions.push({ status: "approved" });

    // Thêm điều kiện nếu có subject
    if (criteria.subject && typeof criteria.subject === "string") {
      queryConditions.push({
        "subjects.name": { $regex: criteria.subject, $options: "i" },
      });
    }

    // Thêm điều kiện nếu có location (tìm theo city hoặc district)
    if (criteria.location && typeof criteria.location === "string") {
      queryConditions.push({
        $or: [
          { city: { $regex: criteria.location, $options: "i" } },
          { district: { $regex: criteria.location, $options: "i" } },
        ],
      });
    }

    // Thêm điều kiện nếu có minRating
    if (
      criteria.minRating &&
      typeof criteria.minRating === "number" &&
      criteria.minRating > 0
    ) {
      queryConditions.push({ rating: { $gte: criteria.minRating } });
    }

    // Thêm điều kiện nếu có maxPrice
    if (
      criteria.maxPrice &&
      typeof criteria.maxPrice === "number" &&
      criteria.maxPrice > 0
    ) {
      queryConditions.push({ sessionRate: { $lte: criteria.maxPrice } });
    }

    // Kết hợp các điều kiện
    const finalQuery =
      queryConditions.length > 1
        ? { $and: queryConditions }
        : queryConditions[0] || {};

    console.log(
      "[queryTutorProfiles] Final query:",
      JSON.stringify(finalQuery)
    );

    // Thực thi query
    const tutorProfiles = await TutorProfile.find(finalQuery)
      .populate("user", "full_name image city district")
      .sort({ rating: -1 })
      .limit(5);

    console.log(`[queryTutorProfiles] Found ${tutorProfiles.length} tutors`);
    return tutorProfiles;
  } catch (error) {
    console.error("[queryTutorProfiles] Error:", error.message);
    return [];
  }
}

/**
 * Bước 3: Hàm generateFinalResponse
 * Tạo câu trả lời thân thiện dựa vào danh sách gia sư tìm được
 */
function generateFinalResponse(tutorProfiles, userMessage) {
  // Kiểm tra nếu không tìm thấy gia sư nào
  if (!tutorProfiles || tutorProfiles.length === 0) {
    return "Xin lỗi, hiện chưa có gia sư phù hợp với tiêu chí tìm kiếm của bạn. Vui lòng thử lại với các tiêu chí khác hoặc liên hệ với chúng tôi để được hỗ trợ.";
  }

  // Xây dựng danh sách gia sư theo format thân thiện
  let response = "Tôi tìm thấy những gia sư phù hợp với yêu cầu của bạn:\n\n";

  tutorProfiles.forEach((profile, index) => {
    const name = profile.user?.full_name || "Gia sư";
    const rating = profile.rating || 0;
    const rate = profile.sessionRate || 0;
    const subjects =
      profile.subjects?.map((s) => s.name).join(", ") || "Chưa xác định";
    const location = `${profile.user?.city || ""} ${
      profile.user?.district || ""
    }`.trim();

    response += `${index + 1}. **${name}** ⭐ ${rating.toFixed(1)}\n`;
    response += `   📚 Môn: ${subjects}\n`;
    if (location) response += `   📍 Vị trí: ${location}\n`;
    response += `   💰 Giá: ${rate.toLocaleString("vi-VN")}đ/buổi\n`;
    response += `   👉 Nhấn vào profile để xem chi tiết và liên hệ\n\n`;
  });

  response += "Bạn có muốn tìm hiểu thêm về gia sư nào không? 😊";
  return response;
}

/**
 * POST /chat-query
 * Endpoint chính để xử lý câu hỏi về tìm kiếm gia sư
 */
router.post("/chat-query", async (req, res) => {
  try {
    console.log("[POST /chat-query] Request received:", {
      message: req.body.message?.substring(0, 50),
    });

    const { message } = req.body;

    // Validate input
    if (
      !message ||
      typeof message !== "string" ||
      message.trim().length === 0
    ) {
      return res.status(400).json({
        error: "Message is required and must be a non-empty string",
      });
    }

    console.log("[POST /chat-query] Starting RAG pipeline...");

    // Bước 1: Phân tích ý định (KHÔNG dùng AI - dùng Regex)
    console.log("[POST /chat-query] Step 1: Extracting intent...");
    const criteria = extractIntent(message.trim());

    // Bước 2: Truy vấn MongoDB
    console.log("[POST /chat-query] Step 2: Querying tutors...");
    const tutorProfiles = await queryTutorProfiles(criteria);

    // Bước 3: Tạo câu trả lời (KHÔNG dùng AI - dùng Template)
    console.log("[POST /chat-query] Step 3: Generating response...");
    const finalAnswer = generateFinalResponse(tutorProfiles, message.trim());

    // Bước 4: Gửi phản hồi
    console.log("[POST /chat-query] Sending response...");
    return res.json({
      answer: finalAnswer,
      tutorsCount: tutorProfiles.length,
      tutors: tutorProfiles.map((p) => ({
        id: p._id,
        name: p.user?.full_name,
        rating: p.rating,
        sessionRate: p.sessionRate,
      })),
    });
  } catch (error) {
    console.error("[POST /chat-query] Error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

module.exports = router;
