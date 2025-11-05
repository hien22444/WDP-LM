# 🔍 KIỂM TRA SÂU - CÁC VẤN ĐỀ VÀ PHÁT HIỆN

## 📋 TỔNG QUAN

Document này phân tích sâu toàn bộ codebase để phát hiện các vấn đề về:
- 🔐 Security vulnerabilities
- 🐛 Logic bugs
- ⚠️ Edge cases
- 📊 Performance issues
- ✅ Best practices violations
- 🔧 Cải thiện code quality

---

## 🔐 1. SECURITY ISSUES

### **1.1 Authorization Bug trong Booking Route**

**File:** `backend/src/routes/booking.js:954`

**Vấn đề:**
```javascript
// Line 954
const isTutor = String(booking.tutorProfile) === String(req.user.id);
```

**Bug:** So sánh `tutorProfile` (ObjectId của TutorProfile) với `req.user.id` (ObjectId của User) là **SAI**!

**Đúng phải là:**
```javascript
const tutorProfile = await TutorProfile.findById(booking.tutorProfile);
const isTutor = String(tutorProfile?.user) === String(req.user.id);
```

**Ảnh hưởng:** 
- Tutor không thể join room của chính họ
- Authorization check bị bypass trong một số trường hợp

**Severity:** 🔴 HIGH

---

### **1.2 Missing Input Validation**

**File:** `backend/src/routes/wallet.js:32`

**Vấn đề:**
```javascript
const { accountNumber, accountName, bankName, bankCode, branch } = req.body;
// Không có validation!
```

**Rủi ro:**
- SQL Injection (nếu dùng SQL)
- XSS nếu hiển thị trên frontend
- Data corruption

**Cần thêm:**
```javascript
if (!accountNumber || accountNumber.length < 8 || accountNumber.length > 20) {
  return res.status(400).json({ message: "Invalid account number" });
}
if (!/^\d+$/.test(accountNumber)) {
  return res.status(400).json({ message: "Account number must be numeric" });
}
```

**Severity:** 🟡 MEDIUM

---

### **1.3 JWT Secret Default Value**

**File:** `backend/src/services/WebRTCService.js:19`

**Vấn đề:**
```javascript
return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key');
```

**Bug:** Hardcoded fallback secret rất nguy hiểm!

**Fix:**
```javascript
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
return jwt.sign(payload, process.env.JWT_SECRET);
```

**Severity:** 🔴 HIGH

---

### **1.4 Missing Rate Limiting**

**Vấn đề:** Không có rate limiting cho:
- Login endpoints
- Registration endpoints
- Payment endpoints
- Booking creation

**Rủi ro:**
- Brute force attacks
- DDoS
- Abuse of free resources

**Giải pháp:** Cài đặt `express-rate-limit`

**Severity:** 🟡 MEDIUM

---

### **1.5 CORS Configuration**

**File:** `backend/server.js`

**Cần kiểm tra:**
- CORS có cho phép tất cả origins không?
- Credentials có được set đúng không?
- Methods và headers có bị giới hạn không?

**Severity:** 🟡 MEDIUM

---

## 🐛 2. LOGIC BUGS

### **2.1 Race Condition trong Booking Creation**

**File:** `backend/src/routes/booking.js:124-145`

**Vấn đề:**
```javascript
// Check existing booking
const existingBooking = await Booking.findOne({...});
if (existingBooking) {
  errors.push("Khung giờ này đã được đặt...");
}

// Sau đó tạo booking mới (không có transaction!)
const booking = await EscrowService.createEscrowBooking({...});
```

**Bug:** Nếu 2 users đồng thời đặt cùng 1 slot → cả 2 đều pass check và tạo booking!

**Fix:** Sử dụng MongoDB transaction:
```javascript
const session = await mongoose.startSession();
session.startTransaction();
try {
  // Check và create trong transaction
  const existing = await Booking.findOne({...}).session(session);
  if (existing) throw new Error("Slot taken");
  
  const booking = await Booking.create([{...}], { session });
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

**Severity:** 🔴 HIGH

---

### **2.2 Availability Check Logic Sai**

**File:** `backend/src/routes/booking.js:106-121`

**Vấn đề:**
```javascript
const dayOfWeek = startTime.toLocaleDateString("en-US", { weekday: "long" })
  .toLowerCase();
```

**Bug:** 
1. `toLocaleDateString` format khác nhau theo timezone
2. So sánh với `availability.dayOfWeek` (0-6) nhưng đang dùng string ("monday", "tuesday"...)

**Fix:**
```javascript
const dayOfWeek = startTime.getDay(); // 0-6 (Sunday = 0)
const startHour = startTime.toTimeString().slice(0, 5);
const endHour = endTime.toTimeString().slice(0, 5);

const isAvailable = tutor.availability.some(
  (slot) =>
    slot.dayOfWeek === dayOfWeek &&
    slot.start <= startHour &&
    slot.end >= endHour
);
```

**Severity:** 🔴 HIGH

---

### **2.3 Missing Payment Status Check**

**File:** `backend/src/routes/booking.js:775-852`

**Vấn đề:** Endpoint `/payment-success` không kiểm tra:
- Payment đã được verify chưa?
- Payment status có phải "PAID" không?
- Có phải học viên đã thanh toán không?

**Rủi ro:** User có thể fake payment success

**Fix:**
```javascript
// Verify payment với PayOS
const payment = await Payment.findOne({ 
  orderCode: booking.paymentId,
  status: "PAID"
});
if (!payment) {
  return res.status(400).json({ message: "Payment not verified" });
}
```

**Severity:** 🔴 HIGH

---

### **2.4 Escrow Release Double-Count**

**File:** `backend/src/services/EscrowService.js:52-93`

**Vấn đề:** `releasePayment` có thể bị gọi nhiều lần nếu:
- Cron job và manual release cùng chạy
- User refresh page nhiều lần

**Mặc dù có check:**
```javascript
if (booking.paymentStatus !== "held") {
  throw new Error("Payment must be held before release");
}
```

**Nhưng vẫn có race condition!**

**Fix:** Thêm unique constraint hoặc atomic update:
```javascript
const result = await Booking.updateOne(
  { _id: bookingId, paymentStatus: "held" },
  { $set: { paymentStatus: "released" } }
);
if (result.matchedCount === 0) {
  throw new Error("Payment already released or not held");
}
```

**Severity:** 🟡 MEDIUM

---

### **2.5 Cleanup Cron Job Xóa Dữ Liệu Quan Trọng**

**File:** `backend/src/services/CronService.js:179-204`

**Vấn đề:**
```javascript
const result = await Booking.deleteMany({
  status: "completed",
  completedAt: { $lte: ninetyDaysAgo }
});
```

**Bug:** 
- Xóa vĩnh viễn booking data
- Mất lịch sử giao dịch
- Vi phạm compliance (cần giữ records)

**Fix:** Archive thay vì xóa:
```javascript
// Move to archive collection
await BookingArchive.insertMany(bookings);
// Then delete
await Booking.deleteMany({...});
```

**Hoặc:** Chỉ soft delete (set flag `deleted: true`)

**Severity:** 🟡 MEDIUM

---

### **2.6 Tutor Authorization Check Sai**

**File:** `backend/src/routes/booking.js:342-348`

**Vấn đề:**
```javascript
if (role === "tutor") {
  const tutors = await TutorProfile.find({ user: req.user.id }).select("_id");
  filter.tutorProfile = { $in: tutors.map((t) => t._id) };
}
```

**Bug:** Một user có thể có nhiều TutorProfile? (không hợp lý)

**Fix:** Dùng `findOne` thay vì `find`:
```javascript
const tutor = await TutorProfile.findOne({ user: req.user.id });
if (!tutor) return res.json({ items: [] });
filter.tutorProfile = tutor._id;
```

**Severity:** 🟢 LOW

---

## ⚠️ 3. EDGE CASES

### **3.1 Timezone Issues**

**Vấn đề:** Toàn bộ hệ thống không xử lý timezone:
- `new Date()` sử dụng server timezone
- Client có thể ở timezone khác
- Booking time có thể bị sai

**Fix:** 
- Lưu tất cả time dưới dạng UTC
- Convert khi hiển thị cho user
- Hoặc lưu timezone của user

**Severity:** 🟡 MEDIUM

---

### **3.2 Date Range Validation**

**File:** `backend/src/routes/booking.js:69-73`

**Vấn đề:**
```javascript
const threeMonthsFromNow = new Date();
threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
```

**Edge case:** Nếu ngày hiện tại là 31/1 → +3 tháng = 31/4 (không tồn tại!)

**Fix:**
```javascript
const threeMonthsFromNow = new Date();
threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
// Normalize if invalid date
if (threeMonthsFromNow.getMonth() !== (new Date().getMonth() + 3) % 12) {
  threeMonthsFromNow.setDate(0); // Last day of previous month
}
```

**Severity:** 🟢 LOW

---

### **3.3 Empty Availability Array**

**File:** `backend/src/routes/booking.js:112-121`

**Vấn đề:**
```javascript
const isAvailable = tutor.availability.some(...);
```

**Edge case:** Nếu `availability` là array rỗng → `some()` return `false` → đúng!

**Nhưng:** Tutor có thể không set availability nhưng vẫn có thể nhận booking?

**Logic:** Cần quyết định:
- Nếu không có availability → từ chối tất cả booking?
- Hoặc cho phép booking nếu tutor manually accept?

**Severity:** 🟢 LOW

---

### **3.4 Concurrent Slot Booking**

**File:** `backend/src/routes/booking.js:855-942`

**Vấn đề:** Nhiều học viên có thể cùng book 1 slot:
```javascript
// Check slot status
if (slot.status !== "open") { ... }

// Create booking (KHÔNG ATOMIC!)
const booking = await Booking.create({...});

// Update slot
slot.status = "booked";
await slot.save();
```

**Race condition!**

**Fix:** Sử dụng transaction hoặc `findOneAndUpdate` với condition:
```javascript
const updated = await TeachingSlot.findOneAndUpdate(
  { _id: slotId, status: "open" },
  { status: "booked" },
  { new: true }
);
if (!updated) {
  throw new Error("Slot already booked");
}
```

**Severity:** 🔴 HIGH

---

### **3.5 Negative Balance**

**File:** `backend/src/routes/wallet.js:70-75`

**Vấn đề:**
```javascript
if (amount > availableBalance) {
  return res.status(400).json({...});
}
```

**Edge case:** Nếu `availableBalance` là số âm (do bug nào đó)?

**Fix:**
```javascript
if (amount <= 0) {
  return res.status(400).json({ message: "Amount must be positive" });
}
if (availableBalance < 0 || amount > availableBalance) {
  return res.status(400).json({...});
}
```

**Severity:** 🟢 LOW

---

## 📊 4. PERFORMANCE ISSUES

### **4.1 N+1 Query Problem**

**File:** `backend/src/routes/booking.js:339-354`

**Vấn đề:**
```javascript
const items = await Booking.find(filter).sort({ created_at: -1 });
```

**Không populate tutor/student!** → Frontend sẽ cần fetch từng user riêng

**Fix:**
```javascript
const items = await Booking.find(filter)
  .populate("student", "full_name email")
  .populate("tutorProfile", "user")
  .populate("tutorProfile.user", "full_name email")
  .sort({ created_at: -1 });
```

**Severity:** 🟡 MEDIUM

---

### **4.2 Missing Database Indexes**

**File:** `backend/src/models/Booking.js`

**Thiếu indexes cho:**
- `{ student: 1, status: 1 }` (query bookings của student)
- `{ tutorProfile: 1, status: 1 }` (query bookings của tutor)
- `{ paymentStatus: 1, status: 1 }` (cron job queries)

**Fix:** Thêm indexes vào schema

**Severity:** 🟡 MEDIUM

---

### **4.3 Inefficient Availability Check**

**File:** `backend/src/routes/booking.js:112-121`

**Vấn đề:** Check availability bằng JavaScript loop → không optimize

**Nếu có nhiều tutors:** Query sẽ chậm

**Severity:** 🟢 LOW

---

### **4.4 No Caching**

**Vấn đề:** 
- Tutor search không có cache
- User profile không có cache
- Stats không có cache

**Fix:** Implement Redis cache

**Severity:** 🟢 LOW

---

## ✅ 5. CODE QUALITY ISSUES

### **5.1 Inconsistent Error Handling**

**File:** Multiple files

**Vấn đề:**
- Một số nơi: `res.status(500).json({ message: "Failed" })`
- Một số nơi: `res.status(500).json({ error: error.message })`
- Một số nơi: `throw new Error(...)`

**Cần:** Standardize error responses

**Severity:** 🟢 LOW

---

### **5.2 Missing Input Sanitization**

**Vấn đề:** User inputs không được sanitize:
- HTML trong comments/reviews
- SQL injection (nếu dùng raw queries)
- Command injection (nếu dùng exec)

**Fix:** 
- Validate inputs
- Sanitize HTML
- Escape special characters

**Severity:** 🟡 MEDIUM

---

### **5.3 Console.log Trong Production**

**File:** Multiple files

**Vấn đề:** Nhiều `console.log`, `console.error` → tốn performance

**Fix:** Sử dụng logger (winston, pino)

**Severity:** 🟢 LOW

---

### **5.4 Missing Type Validation**

**Vấn đề:** Không dùng Joi/Yup để validate request body

**Fix:** Thêm validation middleware

**Severity:** 🟡 MEDIUM

---

## 🔧 6. MISSING FEATURES

### **6.1 Missing Payment Webhook Verification**

**File:** `backend/src/controllers/paymentController.js`

**Vấn đề:** PayOS webhook không verify signature → có thể bị fake

**Fix:** Verify webhook signature với checksum key

**Severity:** 🔴 HIGH

---

### **6.2 Missing Email Verification Resend Limit**

**File:** `backend/src/controllers/authController.js`

**Vấn đề:** User có thể spam resend verification email

**Fix:** Rate limit hoặc cooldown period

**Severity:** 🟢 LOW

---

### **6.3 Missing Audit Logs**

**Vấn đề:** Không log các actions quan trọng:
- Payment transactions
- Admin actions
- User status changes

**Fix:** Implement audit log system

**Severity:** 🟡 MEDIUM

---

## 📝 7. TÓM TẮT THEO ĐỘ ƯU TIÊN

### **🔴 CRITICAL (Fix ngay):**

1. ✅ **Authorization bug** trong booking route (line 954)
2. ✅ **Race condition** trong booking creation
3. ✅ **Availability check logic sai** (dayOfWeek comparison)
4. ✅ **Missing payment verification** trong payment-success endpoint
5. ✅ **JWT secret default value** trong WebRTCService
6. ✅ **Payment webhook không verify signature**

### **🟡 HIGH PRIORITY:**

1. ✅ **Missing input validation** (wallet, booking, etc.)
2. ✅ **Escrow release race condition**
3. ✅ **Missing rate limiting**
4. ✅ **N+1 query problems**
5. ✅ **Missing database indexes**
6. ✅ **Concurrent slot booking race condition**

### **🟢 MEDIUM/LOW PRIORITY:**

1. ✅ Timezone handling
2. ✅ Date range edge cases
3. ✅ Error handling standardization
4. ✅ Caching implementation
5. ✅ Logging system

---

## 🎯 KẾT LUẬN

**Tổng số vấn đề phát hiện:** 25+

**Phân loại:**
- 🔴 Critical: 6
- 🟡 High: 6
- 🟢 Medium/Low: 13+

**Khuyến nghị:**
1. Fix các critical issues TRƯỚC KHI deploy production
2. Implement proper testing (unit tests, integration tests)
3. Code review process
4. Security audit
5. Performance testing

---

**Document Version:** 1.0  
**Created:** 2025-01-26  
**Last Updated:** 2025-01-26

