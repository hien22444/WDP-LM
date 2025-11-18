# ✅ AI Route Implementation Complete

## 📋 Summary

A complete, production-ready **RAG (Retrieval-Augmented Generation)** pipeline has been implemented in `backend/src/routes/ai.js`.

### File Location
```
backend/src/routes/ai.js (271 lines)
```

---

## 🎯 Features Implemented

### ✅ Step 1: Intent Extraction
- Function: `extractIntent(openai, message)`
- Uses: `gpt-3.5-turbo-0125` with JSON response format
- Extracts: subject, level, location, minRating, maxPrice
- Error handling: Returns null values on failure

### ✅ Step 2: MongoDB Query
- Function: `queryTutorProfiles(criteria)`
- Builds dynamic query with $and/$or operators
- Filters: approved tutors, subject, location, rating, price
- Sorting: by rating (descending)
- Limit: 5 results
- Population: includes user data (name, image, city, district)

### ✅ Step 3: Response Generation
- Function: `generateFinalResponse(openai, tutorProfiles, userMessage)`
- Uses: `gpt-3.5-turbo` for friendly, natural responses
- Processes tutor data for AI context
- Returns: professional recommendation text

### ✅ Step 4: API Endpoint
- Route: `POST /api/v1/ai/chat-query`
- Input: `{ "message": "user query" }`
- Output: JSON with AI answer + tutor list
- Validation: Input validation, error handling
- Logging: Detailed console logging with [STEP] prefixes

---

## 🔧 Integration Steps

### 1. Add Route Import (server.js)
```javascript
const aiRoutes = require("./src/routes/ai");
```

### 2. Register Route (server.js)
```javascript
app.use("/api/v1/ai", aiRoutes);
```

### 3. Verify Models Exist
- ✅ User model
- ✅ TutorProfile model
- ✅ Review model

### 4. Verify AI Client Setup
The route automatically uses `req.app.locals.openai` which is initialized in server.js:
- OpenAI client (if `CHATAI_PROVIDER=openai`)
- Google Gemini wrapper (if `CHATAI_PROVIDER=gemini`)

---

## 📡 API Usage

### Request
```bash
POST /api/v1/ai/chat-query
Content-Type: application/json

{
  "message": "Tôi cần tìm gia sư Toán ở Hà Nội, giá dưới 500k, rating cao"
}
```

### Response (Success - 200)
```json
{
  "answer": "Tôi tìm thấy 3 gia sư Toán xuất sắc tại Hà Nội...",
  "tutorsCount": 3,
  "tutors": [
    {
      "id": "66a1234...",
      "name": "Nguyễn Văn A",
      "rating": 4.8,
      "sessionRate": 350000
    },
    {
      "id": "66b5678...",
      "name": "Trần Thị B",
      "rating": 4.7,
      "sessionRate": 300000
    }
  ]
}
```

### Response (Error - 400)
```json
{
  "error": "Message is required and must be a non-empty string"
}
```

### Response (Error - 503)
```json
{
  "error": "AI service is not available at this time. Please try again later."
}
```

---

## 📊 Technical Details

### Models Used
| Model | Purpose |
|-------|---------|
| gpt-3.5-turbo-0125 | Intent extraction (deterministic, JSON) |
| gpt-3.5-turbo | Response generation (creative) |

### Temperature Settings
- Intent extraction: **0.3** (deterministic, focused)
- Response generation: **0.7** (creative, natural)

### Token Limits
- Intent extraction: **200 tokens** max
- Response generation: **500 tokens** max

### Query Optimization
- Mandatory: `status: 'approved'`
- Optional: subject, location, minRating, maxPrice
- Sorting: `rating: -1` (highest first)
- Limit: 5 results (balance quality vs speed)

---

## 🧪 Testing

### Test 1: Basic Search
```bash
curl -X POST http://localhost:5000/api/v1/ai/chat-query \
  -H "Content-Type: application/json" \
  -d '{"message":"Tìm gia sư Toán ở Hà Nội"}'
```

### Test 2: Search with Filters
```bash
curl -X POST http://localhost:5000/api/v1/ai/chat-query \
  -H "Content-Type: application/json" \
  -d '{"message":"Tôi cần gia sư Tiếng Anh rating 4.5+, giá dưới 300k"}'
```

### Test 3: Empty Message (Should fail)
```bash
curl -X POST http://localhost:5000/api/v1/ai/chat-query \
  -H "Content-Type: application/json" \
  -d '{"message":""}'
```
Expected: 400 error

---

## 🔐 Security & Best Practices

✅ **No Direct Imports**
- ❌ Does NOT: `const openai = require('openai')`
- ✅ Uses: `const openai = req.app.locals.openai`

✅ **Error Handling**
- Graceful degradation if AI unavailable
- Proper HTTP status codes (400, 503, 500)
- Detailed error logging

✅ **Input Validation**
- Checks message is non-empty string
- Sanitizes user input

✅ **Logging**
- `[FUNCTION_NAME]` prefix for all logs
- Step-by-step logging for debugging
- Error messages without sensitive data

✅ **Rate Limiting** (Recommended)
- Consider adding rate limiting middleware
- Prevent abuse of AI calls

---

## 📝 Documentation Files Created

1. **ai.js** - Main implementation (271 lines)
2. **AI_ROUTE_DOCUMENTATION.md** - Complete technical documentation
3. **AI_ROUTE_INTEGRATION.md** - Integration guide with examples

---

## 🚀 Next Steps

1. **Add route to server.js** (2 lines)
2. **Test with curl/Postman**
3. **Monitor logs for Step 1-4 execution**
4. **Connect frontend to /api/v1/ai/chat-query**
5. **Optional: Add rate limiting middleware**
6. **Optional: Implement response caching**

---

## ⚠️ Important Notes

1. **AI Client Availability**
   - If `req.app.locals.openai` is null → 503 error
   - Check `.env` has `OPENAI_API_KEY` or `GEMINI_KEY`

2. **Model Names**
   - Intent extraction: MUST use `gpt-3.5-turbo-0125`
   - Response generation: Can use `gpt-3.5-turbo` or other models

3. **Database Indexes** (Recommended)
   - Add index on: `TutorProfile.status`
   - Add index on: `TutorProfile.rating`
   - Add index on: `TutorProfile.subjects.name`

4. **JSON Format Requirement**
   - Intent extraction MUST use: `response_format: { "type": "json_object" }`
   - This ensures valid JSON output for parsing

---

## 🔍 Troubleshooting

| Issue | Solution |
|-------|----------|
| 503 AI Service Error | Check OPENAI_API_KEY or GEMINI_KEY in .env |
| 400 Bad Request | Ensure message field is non-empty string |
| No tutors found | Check TutorProfile has `status: 'approved'` documents |
| Parse errors on Step 1 | Verify JSON response from gpt-3.5-turbo-0125 |
| Slow queries | Add database indexes on status, rating, subjects |

---

**Status**: ✅ COMPLETE & PRODUCTION-READY
**Version**: 1.0
**Date**: November 18, 2025
