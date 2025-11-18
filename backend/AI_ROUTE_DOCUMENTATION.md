# AI Route Documentation - src/routes/ai.js

## Overview
This file implements a **RAG (Retrieval-Augmented Generation)** pipeline for intelligent tutor search. It processes user queries through AI analysis and returns personalized tutor recommendations.

## Architecture

### 4-Step Pipeline

#### **Step 1: Intent Extraction (extractIntent)**
- **Purpose**: Analyze user message and extract search criteria
- **AI Model**: gpt-3.5-turbo-0125
- **Response Format**: JSON object
- **Extracted Fields**:
  - `subject` (string): Subject name (e.g., "Toán", "Tiếng Anh")
  - `level` (string): Education level (e.g., "Tiểu học", "Đại học")
  - `location` (string): City or district
  - `minRating` (number): Minimum rating (1-5)
  - `maxPrice` (number): Maximum session price (VND)

**Error Handling**: Returns null values if extraction fails

---

#### **Step 2: MongoDB Query (queryTutorProfiles)**
- **Purpose**: Search TutorProfile collection based on criteria
- **Database**: MongoDB with Mongoose
- **Query Building**:
  - Mandatory condition: `status: 'approved'`
  - Subject search: `subjects.name` with regex (case-insensitive)
  - Location search: `$or` logic on both `city` and `district`
  - Rating filter: `rating >= minRating`
  - Price filter: `sessionRate <= maxPrice`
  - Combine all: `{ $and: [conditions] }`

**Sorting**: Results sorted by `rating` (descending)
**Limit**: Maximum 5 results returned
**Population**: Includes user data (full_name, image, city, district)

**Error Handling**: Returns empty array if query fails

---

#### **Step 3: Response Generation (generateFinalResponse)**
- **Purpose**: Create natural, friendly response with tutor recommendations
- **AI Model**: gpt-3.5-turbo
- **Data Preparation**:
  - Extract tutor name, rating, reviews, session rate, subjects, location
  - Format as JSON for AI context
  - Include processed data in system prompt

**Fallback Messages**:
- No tutors found → "Không tìm thấy gia sư phù hợp..."
- AI unavailable → "Hệ thống AI tạm thời không khả dụng..."
- General error → "Đã xảy ra lỗi..."

---

#### **Step 4: Response Delivery**
- **Response Format**:
```json
{
  "answer": "Natural language response from AI",
  "tutorsCount": 3,
  "tutors": [
    {
      "id": "...",
      "name": "Gia sư tên",
      "rating": 4.8,
      "sessionRate": 300000
    }
  ]
}
```

---

## API Endpoint

### POST `/api/v1/ai/chat-query`

**Request Body**:
```json
{
  "message": "Tôi cần tìm gia sư Toán ở Hà Nội với giá dưới 500k"
}
```

**Success Response (200)**:
```json
{
  "answer": "Tôi tìm thấy 3 gia sư Toán xuất sắc...",
  "tutorsCount": 3,
  "tutors": [...]
}
```

**Error Response (400)**:
```json
{
  "error": "Message is required and must be a non-empty string"
}
```

**Error Response (503)**:
```json
{
  "error": "AI service is not available at this time."
}
```

**Error Response (500)**:
```json
{
  "error": "Internal server error",
  "message": "..."
}
```

---

## AI Client Integration

### Getting AI Client
```javascript
const openai = req.app.locals.openai;
```

- **Initialized in**: `server.js`
- **Type**: OpenAI client instance OR Google Generative wrapper
- **Never**: Create new client with `require('openai')`
- **Always**: Use `req.app.locals.openai` from Express app

### Supported Providers
1. **OpenAI** (gpt-3.5-turbo)
2. **Google Gemini** (via wrapper in server.js)

---

## Database Models Used

### TutorProfile
- `status` (string): 'approved' | 'pending' | 'rejected'
- `rating` (number): Calculated from reviews
- `totalReviews` (number): Count of reviews
- `sessionRate` (number): Price in VND
- `subjects` (array): `[{name: string, level: string}, ...]`
- `user` (reference): Populated with full_name, image, city, district

### User
- `full_name` (string)
- `image` (string): Avatar URL
- `city` (string)
- `district` (string)

### Review
- Used for calculating tutor ratings (aggregated at TutorProfile level)

---

## Error Handling & Logging

### Logging Pattern
- `[FUNCTION_NAME]` prefix for all console logs
- `console.log()` for info: requests, steps, results
- `console.warn()` for warnings: missing AI client
- `console.error()` for errors: API failures, DB issues

### Graceful Degradation
1. If no AI client → return null criteria
2. If no tutors found → return friendly message
3. If response generation fails → return error message
4. Always return HTTP response (no silent failures)

---

## Integration with server.js

### Route Registration
Add to `server.js` (around line 420+):
```javascript
const aiRoutes = require("./src/routes/ai");
app.use("/api/v1/ai", aiRoutes);
```

### AI Client Availability
The file expects `app.locals.openai` to be set in server.js:
- OpenAI client if `CHATAI_PROVIDER=openai`
- Google Generative wrapper if `CHATAI_PROVIDER=gemini`
- `null` if no provider configured

---

## Environment Variables Required

```dotenv
# For OpenAI
OPENAI_API_KEY=sk-...

# For Google Gemini
GEMINI_KEY=...
CHATAI_PROVIDER=gemini

# Or
CHATAI_PROVIDER=openai
```

---

## Performance Considerations

1. **Temperature Settings**:
   - Intent extraction: 0.3 (deterministic)
   - Response generation: 0.7 (creative)

2. **Token Limits**:
   - Intent extraction: 200 tokens max
   - Response generation: 500 tokens max

3. **Database Queries**:
   - Limit 5 results (balance speed and quality)
   - Indexed fields recommended: `status`, `rating`, `subjects.name`

4. **Caching** (Recommended future improvement):
   - Cache popular searches
   - Cache tutor profiles with TTL

---

## Testing

### Test 1: Basic Search
```bash
curl -X POST http://localhost:5000/api/v1/ai/chat-query \
  -H "Content-Type: application/json" \
  -d '{"message":"Tìm gia sư Toán ở Hà Nội"}'
```

### Test 2: Search with Price Filter
```bash
curl -X POST http://localhost:5000/api/v1/ai/chat-query \
  -H "Content-Type: application/json" \
  -d '{"message":"Tôi cần gia sư Tiếng Anh, giá dưới 300k"}'
```

### Test 3: Empty Message
```bash
curl -X POST http://localhost:5000/api/v1/ai/chat-query \
  -H "Content-Type: application/json" \
  -d '{"message":""}'
```
Expected: 400 error

---

## Future Enhancements

1. **Conversation Memory**: Store chat history for context
2. **User Preferences**: Learn from user interaction patterns
3. **Advanced Filtering**: Education credentials, experience years
4. **Real-time Availability**: Check tutor schedule
5. **Personalization**: Tailor responses based on user history
6. **Multi-language Support**: Handle Tiếng Anh, Tiếng Trung, etc.
7. **Rating Breakdown**: Show ratings by category (communication, expertise, etc.)
8. **Result Ranking**: ML-based ranking instead of simple rating sort

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "AI service is not available" | Check if OPENAI_API_KEY or GEMINI_KEY is set in .env |
| Tutors not found | Verify tutors exist in DB with `status: 'approved'` |
| Slow responses | Check if DB indexes are created on status, rating, subjects |
| JSON parse errors | Ensure response_format uses `{ "type": "json_object" }` |

---

**Last Updated**: November 18, 2025
**Version**: 1.0
**Author**: AI Development Team
