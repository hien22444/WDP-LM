// INTEGRATION GUIDE: Add AI Routes to server.js

// ================================================================
// STEP 1: Add this import near other route imports (around line 410)
// ================================================================

const aiRoutes = require("./src/routes/ai");


// ================================================================
// STEP 2: Register the route (around line 430, after other routes)
// ================================================================

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/tutors", tutorRoutes);
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/favorites", favoritesRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/admin/contracts", adminContractsRoutes);
app.use("/api/v1/ai", aiRoutes);                              // ADD THIS LINE
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/profile-completion", profileCompletionRoutes);
app.use("/api/v1/tutor-verification", tutorVerificationRoutes);
app.use("/api/v1/admin/verification", adminVerificationRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/chat", chatRoutes);


// ================================================================
// WHAT HAPPENS INTERNALLY
// ================================================================
// 
// When a POST request comes to /api/v1/ai/chat-query:
//
// 1. Express routes it to aiRoutes
// 2. The route handler in ai.js receives: req.body.message
// 3. It accesses the AI client via: req.app.locals.openai
//    (This was initialized in server.js earlier)
// 4. It runs the 4-step RAG pipeline:
//    - Step 1: extractIntent() calls AI to parse user message
//    - Step 2: queryTutorProfiles() searches MongoDB
//    - Step 3: generateFinalResponse() calls AI to create response
//    - Step 4: Returns JSON with answer and tutor list
// 5. Client receives response with AI-generated answer
//


// ================================================================
// TESTING THE ROUTE
// ================================================================

// After starting the server, test with:
// 
// curl -X POST http://localhost:5000/api/v1/ai/chat-query \
//   -H "Content-Type: application/json" \
//   -d '{"message":"Tôi cần tìm gia sư Toán ở Hà Nội"}'
//
// Expected response:
// {
//   "answer": "Tôi tìm thấy 3 gia sư Toán xuất sắc...",
//   "tutorsCount": 3,
//   "tutors": [
//     {"id": "...", "name": "...", "rating": 4.8, "sessionRate": 300000},
//     ...
//   ]
// }
//


// ================================================================
// ENVIRONMENT VARIABLES NEEDED
// ================================================================

// In .env or .env.local:
//
// # For OpenAI
// CHATAI_PROVIDER=openai
// OPENAI_API_KEY=sk-proj-...
//
// # OR for Google Gemini
// CHATAI_PROVIDER=gemini
// GEMINI_KEY=AIza...
//


// ================================================================
// DEPENDENCIES & MODELS
// ================================================================

// The ai.js file uses:
// - express
// - ../models/User
// - ../models/TutorProfile
// - ../models/Review
//
// Make sure these models exist and are properly defined
//


// ================================================================
// FRONTEND USAGE EXAMPLE (React)
// ================================================================

/*
const [message, setMessage] = useState("");
const [response, setResponse] = useState(null);
const [loading, setLoading] = useState(false);

const handleSearch = async () => {
  setLoading(true);
  try {
    const res = await fetch("/api/v1/ai/chat-query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const data = await res.json();
    setResponse(data);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    setLoading(false);
  }
};

return (
  <div>
    <input 
      value={message}
      onChange={(e) => setMessage(e.target.value)}
      placeholder="Tìm gia sư..."
    />
    <button onClick={handleSearch} disabled={loading}>
      {loading ? "Đang tìm kiếm..." : "Tìm kiếm"}
    </button>
    
    {response && (
      <div>
        <p>{response.answer}</p>
        <div>
          {response.tutors.map(t => (
            <div key={t.id}>
              <h4>{t.name}</h4>
              <p>Rating: {t.rating}/5 | Giá: {t.sessionRate.toLocaleString()} VND</p>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);
*/
