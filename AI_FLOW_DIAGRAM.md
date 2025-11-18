## 🤖 AI Route: Complete Flow Diagram

```
USER REQUEST
    ↓
┌─────────────────────────────────────────────────────────────┐
│  POST /api/v1/ai/chat-query                                 │
│  {                                                           │
│    "message": "Tôi cần tìm gia sư Toán ở Hà Nội, giá < 500k" │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: INTENT EXTRACTION (AI Call #1)                     │
│  ───────────────────────────────────────────────────────────│
│  Function: extractIntent(openai, message)                  │
│  Model: gpt-3.5-turbo-0125                                  │
│  Format: JSON response_format                               │
│                                                             │
│  INPUT:                                                     │
│    System: "Phân tích yêu cầu tìm kiếm gia sư"            │
│    User: user message                                       │
│                                                             │
│  OUTPUT:                                                    │
│  {                                                          │
│    "subject": "Toán",                                       │
│    "level": null,                                           │
│    "location": "Hà Nội",                                    │
│    "minRating": null,                                       │
│    "maxPrice": 500000                                       │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: MONGODB QUERY                                      │
│  ───────────────────────────────────────────────────────────│
│  Function: queryTutorProfiles(criteria)                    │
│                                                             │
│  BUILD QUERY:                                               │
│  {                                                          │
│    $and: [                                                  │
│      { status: "approved" },                                │
│      { "subjects.name": { $regex: "Toán", $options: "i" } },│
│      {                                                      │
│        $or: [                                               │
│          { "user.city": { $regex: "Hà Nội", ... } },       │
│          { "user.district": { $regex: "Hà Nội", ... } }    │
│        ]                                                    │
│      },                                                     │
│      { sessionRate: { $lte: 500000 } }                     │
│    ]                                                        │
│  }                                                          │
│                                                             │
│  EXECUTE:                                                   │
│  TutorProfile.find(query)                                   │
│    .populate("user", "full_name image city district")      │
│    .sort({ rating: -1 })                                    │
│    .limit(5)                                                │
│                                                             │
│  RESULT: Array of 5 tutors (or fewer)                       │
│  [                                                          │
│    { _id: "...", user: {...}, rating: 4.8, sessionRate: 350000 },│
│    { _id: "...", user: {...}, rating: 4.7, sessionRate: 300000 },│
│    ...                                                      │
│  ]                                                          │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: RESPONSE GENERATION (AI Call #2)                  │
│  ───────────────────────────────────────────────────────────│
│  Function: generateFinalResponse(openai, tutors, message)  │
│  Model: gpt-3.5-turbo                                       │
│                                                             │
│  PROCESS DATA:                                              │
│  [                                                          │
│    {                                                        │
│      "name": "Nguyễn Văn A",                               │
│      "rating": 4.8,                                         │
│      "totalReviews": 42,                                    │
│      "sessionRate": 350000,                                 │
│      "subjects": "Toán, Lý",                               │
│      "city": "Hà Nội",                                     │
│      "district": "Cầu Giấy"                                │
│    },                                                       │
│    ...                                                      │
│  ]                                                          │
│                                                             │
│  INPUT:                                                     │
│    System: "Bạn là trợ lý EduMatch. Tạo câu trả lời..."   │
│             + JSON stringify of processed tutors            │
│    User: original user message                              │
│                                                             │
│  TEMPERATURE: 0.7 (creative)                                │
│  MAX_TOKENS: 500                                            │
│                                                             │
│  OUTPUT:                                                    │
│    "Tôi tìm thấy 3 gia sư Toán xuất sắc tại Hà Nội         │
│     phù hợp với yêu cầu của bạn:                            │
│                                                             │
│     1. Nguyễn Văn A - Rating: 4.8/5 (42 đánh giá)          │
│        Địa điểm: Cầu Giấy, Hà Nội                          │
│        Giá: 350.000 VND/buổi                                │
│        Môn dạy: Toán, Lý                                    │
│                                                             │
│     Các gia sư này đều có rating cao và kinh nghiệm...     │
│     Hãy click vào profile để xem chi tiết và liên hệ!"     │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: SEND RESPONSE                                      │
│  ───────────────────────────────────────────────────────────│
│  res.json({                                                 │
│    "answer": "Tôi tìm thấy 3 gia sư...",                   │
│    "tutorsCount": 3,                                        │
│    "tutors": [                                              │
│      {                                                      │
│        "id": "66a1234...",                                  │
│        "name": "Nguyễn Văn A",                              │
│        "rating": 4.8,                                       │
│        "sessionRate": 350000                                │
│      },                                                     │
│      ...                                                    │
│    ]                                                        │
│  })                                                         │
└─────────────────────────────────────────────────────────────┘
    ↓
CLIENT RECEIVES RESPONSE
```

---

## 📊 API Call Summary

### Call #1: Intent Extraction
```
POST https://api.openai.com/v1/chat/completions
Headers: Authorization: Bearer OPENAI_API_KEY

{
  "model": "gpt-3.5-turbo-0125",
  "response_format": { "type": "json_object" },
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "User message" }
  ],
  "temperature": 0.3,
  "max_tokens": 200
}

RESPONSE: { "subject": "...", "level": "...", ... }
```

### Call #2: Response Generation
```
POST https://api.openai.com/v1/chat/completions
Headers: Authorization: Bearer OPENAI_API_KEY

{
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "system",
      "content": "Bạn là trợ lý EduMatch... [JSON data của tutors]"
    },
    { "role": "user", "content": "User message" }
  ],
  "temperature": 0.7,
  "max_tokens": 500
}

RESPONSE: { "choices": [{ "message": { "content": "Tôi tìm thấy..." } }] }
```

---

## 🔄 Data Flow

```
┌──────────────────┐
│   User Query     │
└────────┬─────────┘
         │
         ↓
┌──────────────────────────────────────┐
│  extractIntent()                     │
│  Query: gpt-3.5-turbo-0125           │
│  Parse JSON response                 │
└────────┬─────────────────────────────┘
         │
         ↓ criteria
┌──────────────────────────────────────┐
│  queryTutorProfiles()                │
│  Build MongoDB query                 │
│  Execute: TutorProfile.find()        │
│  Limit: 5 results                    │
│  Sort: rating -1                     │
└────────┬─────────────────────────────┘
         │
         ↓ tutorProfiles
┌──────────────────────────────────────┐
│  generateFinalResponse()             │
│  Process tutor data                  │
│  Query: gpt-3.5-turbo                │
│  Create natural response             │
└────────┬─────────────────────────────┘
         │
         ↓ answer + tutors
┌──────────────────────────────────────┐
│  Send HTTP 200 Response              │
│  {                                   │
│    answer: "...",                    │
│    tutorsCount: 3,                   │
│    tutors: [...]                     │
│  }                                   │
└──────────────────────────────────────┘
         │
         ↓
    CLIENT RECEIVES
```

---

## 🛠️ Error Handling Flow

```
REQUEST → Validate Input
           ↓
         No AI Client?
         ↓ YES → 503 Error (Service Unavailable)
         ↓ NO
         
         Extract Intent
         ↓
         Failed? → Continue with null criteria
         ↓
         
         Query Database
         ↓
         Failed? → Return 500 Error
         ↓
         
         No tutors? → Return friendly message
         ↓
         
         Generate Response
         ↓
         Failed? → Return error message
         ↓
         
         Send 200 Response
```

---

## 💾 Database Interaction

### Query Built from User Message
```javascript
// Example: User says "Tôi cần gia sư Toán ở Hà Nội, giá < 500k"

criteria = {
  subject: "Toán",
  level: null,
  location: "Hà Nội",
  minRating: null,
  maxPrice: 500000
}

// Build MongoDB query
query = {
  $and: [
    { status: "approved" },
    { "subjects.name": { $regex: "Toán", $options: "i" } },
    {
      $or: [
        { "user.city": { $regex: "Hà Nội", $options: "i" } },
        { "user.district": { $regex: "Hà Nội", $options: "i" } }
      ]
    },
    { sessionRate: { $lte: 500000 } }
  ]
}

// Execute
result = await TutorProfile.find(query)
  .populate("user", "full_name image city district")
  .sort({ rating: -1 })
  .limit(5)
```

---

## 📈 Performance Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| Intent Extraction | 0.3s - 2s | Depends on API latency |
| Database Query | 10-100ms | Depends on indexes |
| Response Generation | 1-3s | Depends on token count |
| **Total Time** | **2-6 seconds** | Real-world typical |
| **Max Tokens (Intent)** | 200 | ~50 words |
| **Max Tokens (Response)** | 500 | ~150 words |
| **API Calls per Request** | 2 | Intent + Response |
| **Database Queries** | 1 | Find with populate |
| **Results Returned** | 5 | Tutor profiles |

---

## 🔐 Security Considerations

✅ **Input Validation**
- Checks message is non-empty string
- Sanitizes regex patterns with $options: 'i'

✅ **Error Handling**
- No sensitive data in error messages
- Proper HTTP status codes

✅ **Rate Limiting** (Recommended)
- Add middleware to prevent abuse
- Limit calls per user/IP

✅ **Token Security**
- AI keys stored in .env
- Never expose keys in logs
- Use secure .env management

---

**Last Updated**: November 18, 2025
