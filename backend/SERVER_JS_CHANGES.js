// ================================================================
// EXACT CODE TO ADD TO server.js
// ================================================================

// STEP 1: Find this section (around line 410-415)
// ================================================================

const authRoutes = require("./src/routes/auth");
const userRoutes = require("./src/routes/user");
const dashboardRoutes = require("./src/routes/dashboard");
const paymentRoutes = require("./src/routes/payment");
const tutorRoutes = require("./src/routes/tutor");
const bookingRoutes = require("./src/routes/booking");
const favoritesRoutes = require("./src/routes/favorites");
const adminRoutes = require("./src/routes/admin");
const adminContractsRoutes = require("./src/routes/admin-contracts");
// ADD THIS LINE BELOW:
const aiRoutes = require("./src/routes/ai");

const reviewRoutes = require("./src/routes/review");
const profileCompletionRoutes = require("./src/routes/profile-completion");
const tutorVerificationRoutes = require("./src/routes/tutor-verification");
const adminVerificationRoutes = require("./src/routes/admin-verification");
const notificationRoutes = require("./src/routes/notification");
const chatRoutes = require("./src/routes/chat");

// ================================================================
// STEP 2: Find this section (around line 425-435)
// ================================================================

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/tutors", tutorRoutes);
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/favorites", favoritesRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/admin/contracts", adminContractsRoutes);
// ADD THIS LINE BELOW:
app.use("/api/v1/ai", aiRoutes);

app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/profile-completion", profileCompletionRoutes);
app.use("/api/v1/tutor-verification", tutorVerificationRoutes);
app.use("/api/v1/admin/verification", adminVerificationRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/chat", chatRoutes);

// ================================================================
// DONE!
// ================================================================
//
// The AI route is now integrated into the server.
// The endpoint /api/v1/ai/chat-query will be available.
//
// Test it with:
// curl -X POST http://localhost:5000/api/v1/ai/chat-query \
//   -H "Content-Type: application/json" \
//   -d '{"message":"Tôi cần tìm gia sư Toán ở Hà Nội"}'
//
