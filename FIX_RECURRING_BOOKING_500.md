# 🔧 FIX: Recurring Booking 500 Error

## 🐛 VẤN ĐỀ

Khi tạo recurring booking, backend trả về lỗi **500 Internal Server Error**:

```
POST http://localhost:5000/api/v1/bookings/recurring 500 (Internal Server Error)
Error: Failed to create recurring booking
```

### **Request Payload:**
```json
{
  "tutorProfileId": "6912ea95632743326fda0082",
  "startDate": "2025-11-15",
  "selectedSlots": [
    { "dayOfWeek": 0, "start": "07:00", "end": "11:30" },
    { "dayOfWeek": 1, "start": "13:00", "end": "16:30" },
    { "dayOfWeek": 2, "start": "07:00", "end": "11:30" },
    { "dayOfWeek": 3, "start": "13:00", "end": "16:30" },
    { "dayOfWeek": 4, "start": "07:00", "end": "11:30" }
  ],
  "numberOfWeeks": 1,
  "mode": "offline",
  "pricePerSession": 2000,
  "notes": "123"
}
```

---

## 🔍 NGUYÊN NHÂN

### **Root Cause: Type Mismatch**

Backend code đang cố map `slot.dayOfWeek` như **string**, nhưng frontend gửi lên là **number**:

**Backend (SAI):**
```javascript
const dayOfWeekMap = {
  'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 
  'Thursday': 4, 'Friday': 5, 'Saturday': 6
};

for (const slot of selectedSlots) {
  const targetDayOfWeek = dayOfWeekMap[slot.dayOfWeek]; // ❌ undefined
  // slot.dayOfWeek = 0 (number), không phải 'Sunday' (string)
}
```

**Frontend gửi:**
```javascript
selectedSlots: [
  { dayOfWeek: 0, start: "07:00", end: "11:30" } // ← dayOfWeek is NUMBER
]
```

**Kết quả:**
- `targetDayOfWeek = dayOfWeekMap[0] = undefined`
- `daysToAdd = undefined - currentDayOfWeek = NaN`
- `sessionDate.setDate(firstDate.getDate() + NaN) = Invalid Date`
- Code crash → 500 Error

---

## ✅ GIẢI PHÁP

### **1. Fix Backend Logic** ✅

**File:** `backend/src/routes/booking.js` (dòng ~280)

**Trước:**
```javascript
const dayOfWeekMap = {
  'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 
  'Thursday': 4, 'Friday': 5, 'Saturday': 6
};

for (let week = 0; week < numberOfWeeks; week++) {
  for (const slot of selectedSlots) {
    const targetDayOfWeek = dayOfWeekMap[slot.dayOfWeek]; // ❌ undefined
```

**Sau:**
```javascript
for (let week = 0; week < numberOfWeeks; week++) {
  for (const slot of selectedSlots) {
    // slot.dayOfWeek is already a number (0-6) from frontend
    const targetDayOfWeek = typeof slot.dayOfWeek === 'number' 
      ? slot.dayOfWeek 
      : parseInt(slot.dayOfWeek); // ✅ Handle both number and string
    
    const currentDayOfWeek = firstDate.getDay();
    
    // Calculate days to add to get to target day in first week
    let daysToAdd = targetDayOfWeek - currentDayOfWeek;
    if (daysToAdd < 0) daysToAdd += 7;
```

### **2. Add Better Error Logging** ✅

**Thêm logging để debug:**

```javascript
console.log('📅 [Recurring Booking] Request received:', {
  tutorProfileId,
  startDate,
  selectedSlots,
  numberOfWeeks,
  mode,
  pricePerSession,
  userId: req.user.id
});

// ... trong loop
console.log(`✅ [Recurring Booking] Created session for week ${week + 1}, day ${targetDayOfWeek}, ${slot.start}-${slot.end}`);

// ... khi có lỗi
console.error('❌ [Recurring Booking] Error:', e);
console.error('❌ [Recurring Booking] Stack trace:', e.stack);
```

### **3. Improve Error Messages** ✅

**Trước:**
```javascript
errors.push(`Buổi học ${slot.dayOfWeek} - ${slot.start} phải ít nhất 1 giờ`);
// Output: "Buổi học 0 - 07:00 phải ít nhất 1 giờ" (confusing)
```

**Sau:**
```javascript
const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
errors.push(`Buổi học ${dayNames[targetDayOfWeek]} - ${slot.start} phải ít nhất 1 giờ`);
// Output: "Buổi học CN - 07:00 phải ít nhất 1 giờ" (clear)
```

---

## 🧪 TESTING

### **Test Case 1: Single Week, Multiple Slots**

**Input:**
```json
{
  "startDate": "2025-11-15",  // Friday
  "selectedSlots": [
    { "dayOfWeek": 0, "start": "07:00", "end": "11:30" },  // Sunday
    { "dayOfWeek": 1, "start": "13:00", "end": "16:30" }   // Monday
  ],
  "numberOfWeeks": 1
}
```

**Expected Output:**
```javascript
[
  { start: "2025-11-17T07:00:00Z", end: "2025-11-17T11:30:00Z" }, // Sun Nov 17
  { start: "2025-11-18T13:00:00Z", end: "2025-11-18T16:30:00Z" }  // Mon Nov 18
]
```

**Calculation:**
```
startDate: 2025-11-15 (Friday, dayOfWeek = 5)

Slot 1: dayOfWeek = 0 (Sunday)
  daysToAdd = 0 - 5 = -5 → -5 + 7 = 2
  sessionDate = Nov 15 + 2 = Nov 17 (Sunday) ✅

Slot 2: dayOfWeek = 1 (Monday)
  daysToAdd = 1 - 5 = -4 → -4 + 7 = 3
  sessionDate = Nov 15 + 3 = Nov 18 (Monday) ✅
```

### **Test Case 2: Multiple Weeks**

**Input:**
```json
{
  "startDate": "2025-11-15",
  "selectedSlots": [
    { "dayOfWeek": 1, "start": "08:00", "end": "11:30" }  // Monday
  ],
  "numberOfWeeks": 2
}
```

**Expected Output:**
```javascript
[
  { start: "2025-11-18T08:00:00Z", end: "2025-11-18T11:30:00Z" }, // Mon Nov 18 (Week 1)
  { start: "2025-11-25T08:00:00Z", end: "2025-11-25T11:30:00Z" }  // Mon Nov 25 (Week 2)
]
```

### **Test Case 3: Edge Case - Past Date Validation**

**Input:**
```json
{
  "startDate": "2025-11-10",  // Past date
  "selectedSlots": [...]
}
```

**Expected Response:**
```json
{
  "message": "Validation failed",
  "errors": ["Ngày bắt đầu phải trong tương lai"]
}
```

---

## 📋 VALIDATION RULES

| Rule | Check | Error Message |
|------|-------|---------------|
| **tutorProfileId** | Required | "Thiếu thông tin gia sư" |
| **startDate** | Required | "Thiếu ngày bắt đầu" |
| **startDate** | Must be future | "Ngày bắt đầu phải trong tương lai" |
| **selectedSlots** | Not empty | "Chưa chọn buổi học" |
| **numberOfWeeks** | >= 1 | "Số tuần học không hợp lệ" |
| **numberOfWeeks** | <= 20 | "Số tuần học không được quá 20" |
| **mode** | Required | "Thiếu hình thức dạy học" |
| **mode** | In tutor.teachModes | "Gia sư không hỗ trợ hình thức dạy..." |
| **Session duration** | 1-8 hours | "Buổi học ... phải ít nhất 1 giờ" |
| **Conflict** | No overlapping bookings | "Buổi học ngày ... đã bị trùng" |

---

## 🔄 FLOW DIAGRAM

```
Frontend Request
  ↓
POST /api/bookings/recurring
  ↓
[1] Validate required fields
  ├─ tutorProfileId ✓
  ├─ startDate ✓
  ├─ selectedSlots ✓
  ├─ numberOfWeeks ✓
  └─ mode ✓
  ↓
[2] Check tutor exists & approved
  ↓
[3] Validate business rules
  ├─ Not booking own profile
  ├─ Tutor supports mode
  ├─ startDate in future
  └─ numberOfWeeks <= 20
  ↓
[4] Generate booking sessions
  ├─ For each week (0 to numberOfWeeks-1)
  │  └─ For each slot in selectedSlots
  │     ├─ Calculate target date
  │     ├─ Create startTime & endTime
  │     ├─ Validate duration (1-8h)
  │     └─ Add to bookingsToCreate[]
  ↓
[5] Check conflicts
  ├─ Query existing bookings
  ├─ Check time overlaps
  └─ Report conflicts
  ↓
[6] Create all bookings
  ├─ Booking.insertMany(bookingsToCreate)
  └─ Return count & list
  ↓
[7] Send notification
  └─ notifyTutorBookingCreated(bookings[0])
  ↓
Response: 201 Created
{
  bookings: [...],
  count: 5,
  message: "Đã tạo 5 buổi học thành công"
}
```

---

## 📊 EXAMPLE CONSOLE OUTPUT (After Fix)

```
📅 [Recurring Booking] Request received: {
  tutorProfileId: '6912ea95632743326fda0082',
  startDate: '2025-11-15',
  selectedSlots: [
    { dayOfWeek: 0, start: '07:00', end: '11:30' },
    { dayOfWeek: 1, start: '13:00', end: '16:30' },
    { dayOfWeek: 2, start: '07:00', end: '11:30' },
    { dayOfWeek: 3, start: '13:00', end: '16:30' },
    { dayOfWeek: 4, start: '07:00', end: '11:30' }
  ],
  numberOfWeeks: 1,
  mode: 'offline',
  pricePerSession: 2000,
  userId: '6912e923415acc00ae1ead25'
}

✅ [Recurring Booking] Created session for week 1, day 0, 07:00-11:30
✅ [Recurring Booking] Created session for week 1, day 1, 13:00-16:30
✅ [Recurring Booking] Created session for week 1, day 2, 07:00-11:30
✅ [Recurring Booking] Created session for week 1, day 3, 13:00-16:30
✅ [Recurring Booking] Created session for week 1, day 4, 07:00-11:30

📋 [Recurring Booking] Generated 5 bookings to create

💾 [Recurring Booking] Creating 5 bookings...
✅ [Recurring Booking] Successfully created 5 bookings
```

---

## ✅ CHECKLIST

- [x] Fix `dayOfWeek` type handling (number vs string)
- [x] Add comprehensive logging
- [x] Improve error messages (use day names)
- [x] Add request/response logging
- [x] Handle edge cases (past dates, invalid duration)
- [x] Return detailed error in development mode
- [ ] Test with real data
- [ ] Verify conflict detection works
- [ ] Check notification sent correctly

---

## 🎯 NEXT STEPS

1. **Restart backend server** để apply changes
2. **Test lại booking flow** với payload giống như trên
3. **Check backend logs** để verify logging hoạt động
4. **Test edge cases:**
   - Chọn nhiều slots × nhiều tuần
   - Conflict với booking khác
   - Invalid duration
   - Past date

---

**Ngày fix:** November 12, 2025  
**Branch:** Tung-fixpayment-data  
**File changed:** `backend/src/routes/booking.js`  
**Lines:** ~206-390
