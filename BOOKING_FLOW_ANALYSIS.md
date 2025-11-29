# 🔍 PHÂN TÍCH LUỒNG BOOKING - HỆ THỐNG LEARNMATE

## 📊 TỔNG QUAN

Hệ thống có **3 LUỒNG BOOKING** chính:

1. ✅ **Custom Booking** - Đặt lịch trực tiếp 1 buổi
2. ✅ **Recurring Booking** - Đặt lịch nhiều buổi (lặp lại theo tuần)
3. ✅ **Slot Booking** - Đặt lịch từ Teaching Slot có sẵn

---

## 🎯 LUỒNG 1: CUSTOM BOOKING (Đặt lịch đơn lẻ)

### **Frontend Flow:**

```javascript
// File: frontend/src/pages/Booking/BookingPage.js
// CHƯA SỬ DỤNG - Code còn tồn tại nhưng UI chỉ hỗ trợ Recurring Booking

const createSingleBooking = async () => {
  const payload = {
    tutorProfileId: tutor.id,
    start: "2024-12-01T14:00:00Z",
    end: "2024-12-01T16:00:00Z", 
    mode: "online",
    price: 200000,
    notes: "Học ôn thi"
  };
  
  await createBooking(payload); // POST /api/bookings
};
```

### **Backend Flow:**

```
POST /api/bookings/
├─ Validate required fields (tutorProfileId, start, end, mode)
├─ Check tutor exists & approved
├─ Check không tự book chính mình
├─ Time validations:
│  ├─ Must be in future
│  ├─ Max 3 months ahead
│  ├─ start < end
│  ├─ Duration: 1-8 hours
├─ Check tutor supports mode (online/offline)
├─ Check tutor availability matches time slot
├─ Check no conflicts with existing bookings
├─ Check no conflicts with teaching slots
├─ Check student has < 5 pending bookings
├─ Price validation (2,000 - 5,000,000 VNĐ)
├─ Create Booking:
│  ├─ status: "pending"
│  ├─ paymentStatus: "none"
│  └─ price: từ client hoặc tutor.sessionRate
└─ Send notification to tutor

Response: { booking, message: "Đặt lịch thành công, chờ gia sư xác nhận" }
```

### **Validation Rules:**

| Quy tắc | Giá trị | Lỗi nếu vi phạm |
|---------|---------|-----------------|
| **Thời gian** | Phải trong tương lai | "Thời gian đặt lịch phải trong tương lai" |
| **Khoảng cách** | Tối đa 3 tháng | "Không thể đặt lịch quá 3 tháng trước" |
| **Thời lượng** | 1-8 giờ | "Mỗi buổi học phải ít nhất 1 giờ" |
| **Giá** | 2,000 - 5,000,000 VNĐ | "Giá buổi học phải từ 2,000 VNĐ đến 5,000,000 VNĐ" |
| **Pending bookings** | Max 5 | "Bạn đã có quá nhiều yêu cầu đang chờ xử lý" |

---

## 🎯 LUỒNG 2: RECURRING BOOKING (Đặt lịch lặp lại)

### **Frontend Flow:**

```javascript
// File: frontend/src/pages/Booking/BookingPage.js (ĐANG SỬ DỤNG)

// Step 1: Load tutor profile & availability
const fetchTutorData = async () => {
  const response = await getTutorProfile(tutorId);
  const data = response.tutor || response;
  
  // Extract availability
  data.availability = [
    { dayOfWeek: 1, start: "08:00", end: "11:30" }, // T2 sáng
    { dayOfWeek: 1, start: "14:00", end: "17:00" }, // T2 chiều
    ...
  ];
  
  setTutor(data);
};

// Step 2: User selects slots from calendar
const toggleSlot = (slot) => {
  // Add/remove slot from selectedSlots array
  // slot: { dayOfWeek, start, end }
};

// Step 3: Auto-calculate booking details
useEffect(() => {
  if (bookingData.start && selectedSlots.length > 0) {
    const numberOfSessions = selectedSlots.length * numberOfWeeks;
    const totalPrice = numberOfSessions * tutor.price;
    // Update state
  }
}, [bookingData.start, selectedSlots, numberOfWeeks]);

// Step 4: Submit recurring booking
const handleSubmit = async () => {
  const payload = {
    tutorProfileId: tutor.id,
    startDate: "2024-12-01", // YYYY-MM-DD only
    selectedSlots: [
      { dayOfWeek: 1, start: "08:00", end: "11:30" },
      { dayOfWeek: 3, start: "14:00", end: "17:00" }
    ],
    numberOfWeeks: 4,
    mode: "online",
    pricePerSession: 200000,
    notes: "Học Toán 12"
  };
  
  await createRecurringBooking(payload); // POST /api/bookings/recurring
};
```

### **Backend Flow:**

```
POST /api/bookings/recurring
├─ Validate required fields
│  ├─ tutorProfileId ✓
│  ├─ startDate ✓
│  ├─ selectedSlots[] ✓
│  ├─ numberOfWeeks ✓
│  ├─ mode ✓
├─ Check tutor exists & approved
├─ Check không tự book chính mình
├─ Check tutor supports mode
├─ Validate startDate in future
├─ Validate numberOfWeeks <= 20
├─ Generate all booking sessions:
│  ├─ For each week (0 to numberOfWeeks-1):
│  │  └─ For each selectedSlot:
│  │     ├─ Calculate sessionDate (target dayOfWeek)
│  │     ├─ Create startTime & endTime
│  │     ├─ Validate duration (1-8 hours)
│  │     └─ Add to bookingsToCreate[]
├─ Check conflicts for each booking:
│  ├─ Check existing bookings
│  └─ Report all conflicts
├─ Create all bookings (Booking.insertMany)
├─ Send notification for first booking
└─ Return count & list

Response: { bookings, count, message: "Đã tạo X buổi học thành công" }
```

### **Example Calculation:**

```javascript
// Input:
startDate: "2024-12-02" (Monday)
selectedSlots: [
  { dayOfWeek: 1, start: "08:00", end: "11:30" }, // Monday morning
  { dayOfWeek: 3, start: "14:00", end: "17:00" }  // Wednesday afternoon
]
numberOfWeeks: 4

// Generated bookings:
[
  // Week 1
  { start: "2024-12-02T08:00", end: "2024-12-02T11:30" }, // Mon W1
  { start: "2024-12-04T14:00", end: "2024-12-04T17:00" }, // Wed W1
  // Week 2
  { start: "2024-12-09T08:00", end: "2024-12-09T11:30" }, // Mon W2
  { start: "2024-12-11T14:00", end: "2024-12-11T17:00" }, // Wed W2
  // Week 3
  { start: "2024-12-16T08:00", end: "2024-12-16T11:30" }, // Mon W3
  { start: "2024-12-18T14:00", end: "2024-12-18T17:00" }, // Wed W3
  // Week 4
  { start: "2024-12-23T08:00", end: "2024-12-23T11:30" }, // Mon W4
  { start: "2024-12-25T14:00", end: "2024-12-25T17:00" }  // Wed W4
]

Total: 8 bookings (2 slots/week × 4 weeks)
```

### **UI Calendar Component:**

```
Availability Grid:
┌────────────┬────┬────┬────┬────┬────┬────┬────┐
│            │ CN │ T2 │ T3 │ T4 │ T5 │ T6 │ T7 │
├────────────┼────┼────┼────┼────┼────┼────┼────┤
│ Buổi sáng  │ −  │ ✓  │ −  │ ✓  │ −  │ ✓  │ −  │
│ 07-11:30   │    │ 🔵 │    │    │    │    │    │
├────────────┼────┼────┼────┼────┼────┼────┼────┤
│ Buổi chiều │ −  │ ✓  │ −  │ ✓  │ −  │ −  │ ✓  │
│ 13-16:30   │    │    │    │ 🔵 │    │    │    │
└────────────┴────┴────┴────┴────┴────┴────┴────┘

Legend:
✓ = Available (clickable)
🔵 = Selected
− = Unavailable
```

---

## 🎯 LUỒNG 3: SLOT BOOKING (Đặt từ Teaching Slot)

### **Flow:**

```
1. Tutor creates Teaching Slot:
   POST /api/bookings/slots
   {
     courseName: "Toán 12 - Giải tích",
     start: "2024-12-01T14:00:00Z",
     end: "2024-12-01T16:00:00Z",
     mode: "online",
     price: 200000,
     capacity: 5
   }
   ↓
   Created: { slotId, status: "open" }

2. Student books from slot:
   POST /api/bookings/slots/:slotId/book
   {
     notes: "Tôi muốn học Toán"
   }
   ↓
   - Check slot available
   - Check capacity
   - Create Booking (status: "accepted" immediately)
   - Reduce slot capacity
   - If capacity = 0: slot.status = "booked"
   - Create TeachingSession
   - Generate roomId
   - Send notifications
```

### **Teaching Slot States:**

| State | Ý nghĩa | Có thể book? |
|-------|---------|--------------|
| `open` | Còn chỗ trống | ✅ Yes |
| `booked` | Đã đủ học viên | ❌ No |
| `cancelled` | Đã hủy | ❌ No |
| `completed` | Đã hoàn thành | ❌ No |

---

## 📋 BOOKING LIFECYCLE (Chi tiết)

### **State Machine:**

```
┌─────────────────────────────────────────────────────────┐
│                   BOOKING STATES                        │
└─────────────────────────────────────────────────────────┘

PENDING (Chờ gia sư xác nhận)
  ├─ Created by student
  ├─ Tutor receives notification
  └─ Waiting for tutor decision
  ↓ (tutor accepts)
  
ACCEPTED (Đã chấp nhận)
  ├─ Tutor signed contract (optional)
  ├─ Generate roomId for video call
  ├─ Create TeachingSession
  ├─ Student receives notification
  └─ Waiting for payment
  ↓ (student pays)
  
PAID (Đã thanh toán)
  ├─ Payment status: "paid"
  ├─ Money in escrow
  ├─ Both parties receive room link
  └─ Waiting for session time
  ↓ (session starts)
  
IN_PROGRESS (Đang diễn ra)
  ├─ Both joined video call
  ├─ Session ongoing
  └─ Tracking attendance
  ↓ (session ends)
  
COMPLETED (Hoàn thành)
  ├─ Release payment:
  │  ├─ 85% → Tutor
  │  └─ 15% → Platform
  ├─ Request student review
  └─ Update tutor rating

Alternative paths:
├─ REJECTED (Tutor từ chối)
│  └─ Student notified
├─ CANCELLED (Hủy bỏ)
│  ├─ Before payment: Free cancellation
│  └─ After payment: Refund 100%
└─ DISPUTED (Tranh chấp)
   └─ Admin resolves
```

### **Tutor Decision Flow:**

```
POST /api/bookings/:id/decision
{
  decision: "accept", // or "reject"
  tutorSignature: "base64..." // optional
}

Validations:
├─ Must be the tutor of this booking
├─ Booking status must be "pending"
├─ Cannot change within 2 hours of start time
├─ If accept: Check tutor has < 20 bookings this week

If ACCEPT:
├─ Generate roomId (WebRTC)
├─ Create TeachingSession:
│  ├─ booking: bookingId
│  ├─ startTime: booking.start
│  ├─ endTime: booking.end
│  ├─ status: "scheduled"
│  └─ roomId: generated
├─ Save tutor signature (if provided)
├─ Check if both signed → contractSigned = true
└─ Send notification to student

If REJECT:
├─ Update booking.status = "rejected"
└─ Send notification to student
```

---

## 💰 PAYMENT FLOW (Tích hợp)

### **Luồng thanh toán:**

```
1. Student creates booking
   ↓
2. Tutor accepts (status: "accepted")
   ↓
3. Student creates payment:
   POST /api/payment/create-payment-link
   {
     product: {
       id: bookingId,
       unitPrice: 200000,
       name: "Toán 12"
     }
   }
   ↓
4. PayOS returns checkout URL
   ↓
5. Student pays via QR/Card
   ↓
6. PayOS webhook:
   POST /api/payment/payos-webhook
   {
     code: "00",
     data: { orderCode, amount }
   }
   ↓
7. Backend updates:
   ├─ Payment.status = "PAID"
   ├─ Booking.paymentStatus = "paid"
   ├─ Booking.paymentId = payment._id
   └─ Send notifications
   ↓
8. Student receives room link
   ↓
9. Session happens
   ↓
10. Complete booking:
    POST /api/bookings/:id/complete
    ↓
11. Release payment:
    ├─ 85% → Tutor bank account
    └─ 15% → Platform fee
```

---

## 🔔 NOTIFICATION EVENTS

| Event | Người nhận | Thời điểm | Service Function |
|-------|------------|-----------|------------------|
| Booking Created | Tutor | Sau khi tạo booking | `notifyTutorBookingCreated()` |
| Booking Accepted | Student | Tutor chấp nhận | `notifyStudentBookingDecision()` |
| Booking Rejected | Student | Tutor từ chối | `notifyStudentBookingDecision()` |
| Payment Success | Student | Thanh toán thành công | `notifyStudentPaymentSuccess()` |
| Payment Success | Tutor | Thanh toán thành công | `notifyTutorPaymentSuccess()` |
| Payment Held | Student | Tiền đang giữ escrow | `notifyStudentPaymentHeld()` |
| Payment Released | Tutor | Nhận tiền sau hoàn thành | `notifyTutorPaymentReleased()` |
| Refund | Student | Hủy sau thanh toán | `notifyStudentRefund()` |
| Dispute | Admin | Có tranh chấp | `notifyAdminDispute()` |

---

## 📹 VIDEO CALL INTEGRATION

### **Room Generation:**

```javascript
// When tutor accepts booking:
const roomId = generateRoomId(); // UUID v4
booking.roomId = roomId;

// Update teaching session:
await TeachingSession.create({
  booking: booking._id,
  roomId: roomId,
  status: "scheduled"
});

// Student joins:
GET /video-call/:roomId
├─ Verify booking exists
├─ Check user is student or tutor
├─ Generate token: generateRoomToken(roomId, userId)
└─ Connect to WebRTC

// Room URL:
https://learnmate.com/room/{roomId}
```

### **WebRTC Events:**

```javascript
Socket.IO events:
├─ "join-room" { roomId, userId }
├─ "offer" / "answer" / "ice-candidate"
├─ "toggle-video" / "toggle-audio"
├─ "screen-share-started" / "screen-share-stopped"
├─ "chat-message" { content }
└─ "leave-room"
```

---

## 🐛 VẤN ĐỀ PHÁT HIỆN & FIX

### **1. Availability undefined** ✅ FIXED

**Vấn đề:**
```javascript
// BookingPage.js - Trước khi fix
const data = await getTutorProfile(tutorId);
console.log(data.availability); // undefined
```

**Nguyên nhân:**
- API trả về: `{ tutor: {...}, message: "..." }`
- Code truy cập: `data.availability` (sai, phải là `data.tutor.availability`)

**Giải pháp:**
```javascript
// BookingPage.js - Sau khi fix
const response = await getTutorProfile(tutorId);
const data = response.tutor || response; // Extract tutor object
console.log(data.availability); // [...]
```

### **2. Missing createRecurringBooking export** ⚠️ CẦN KIỂM TRA

**File:** `frontend/src/services/BookingService.js`

Cần đảm bảo export function:
```javascript
export const createRecurringBooking = async (payload) => {
  const res = await client.post(`/bookings/recurring`, payload);
  return res.data.bookings;
};
```

### **3. Tutor ID consistency** ⚠️ CẦN KIỂM TRA

**Vấn đề:** Nhiều cách gọi ID:
- `tutor._id` (TutorProfile ID)
- `tutor.id` (alias)
- `tutor.userId` (User ID)
- `tutor.user._id` (User ID from populated)

**Cần đảm bảo:**
```javascript
// Khi tạo booking, dùng tutorProfileId (TutorProfile._id)
const payload = {
  tutorProfileId: tutor.id || tutor._id, // NOT tutor.userId
  ...
};
```

---

## 🧪 TESTING CHECKLIST

### **Recurring Booking Flow:**

- [ ] Load tutor profile → availability hiển thị
- [ ] Click chọn slots → selectedSlots cập nhật
- [ ] Thay đổi số tuần → tổng buổi học tự động tính
- [ ] Submit form → gọi API đúng endpoint
- [ ] Backend tạo đúng số bookings
- [ ] Kiểm tra conflicts detection
- [ ] Notification gửi đến tutor
- [ ] Tutor accept → status chuyển thành "accepted"
- [ ] Payment flow → booking.paymentStatus = "paid"
- [ ] Complete → release payment

### **Edge Cases:**

- [ ] Tutor chưa có availability → Show message
- [ ] Chọn 0 slots → Show error
- [ ] Số tuần > 20 → Validation error
- [ ] Conflict với booking khác → Show error chi tiết
- [ ] Network error → Show friendly message
- [ ] Student có > 5 pending bookings → Block

---

## 📊 DATABASE MODELS

### **Booking Model:**

```javascript
{
  tutorProfile: ObjectId (ref: TutorProfile),
  student: ObjectId (ref: User),
  start: Date,
  end: Date,
  mode: "online" | "offline",
  price: Number,
  status: "pending" | "accepted" | "rejected" | "cancelled" | "completed" | "in_progress" | "disputed",
  paymentStatus: "none" | "paid",
  paymentId: String,
  notes: String,
  roomId: String, // WebRTC room
  sessionId: ObjectId (ref: TeachingSession),
  slotId: ObjectId (ref: TeachingSlot),
  
  // Contract fields
  contractSigned: Boolean,
  contractNumber: String,
  studentSignature: String,
  studentSignedAt: Date,
  tutorSignature: String,
  tutorSignedAt: Date,
  contractData: {
    studentName: String,
    studentPhone: String,
    subject: String,
    totalSessions: Number,
    ...
  },
  
  created_at: Date,
  updated_at: Date
}
```

---

## 🎯 RECOMMENDATIONS

### **1. Frontend:**

✅ **Đã có:**
- Recurring booking UI with calendar
- Auto-calculate total price
- Slot selection from availability grid

⚠️ **Cần cải thiện:**
- Add loading states cho từng step
- Better error messages với suggestions
- Confirm dialog trước khi submit
- Show preview của các buổi học được tạo
- Add timezone support

### **2. Backend:**

✅ **Đã có:**
- Comprehensive validation
- Conflict detection
- Notification system
- WebRTC integration

⚠️ **Cần cải thiện:**
- Add transaction for insertMany (rollback nếu fail)
- Better error messages với error codes
- Rate limiting cho booking creation
- Add booking history tracking
- Implement soft delete

### **3. Database:**

⚠️ **Cần thêm:**
- Index trên `(tutorProfile, start, end)` cho conflict check
- Index trên `(student, status)` cho filter
- Archive old completed bookings

---

## 📝 SUMMARY

### **Luồng chính đang hoạt động:**

1. ✅ **Recurring Booking** - UI đầy đủ, backend validation tốt
2. ✅ **Tutor Decision** - Accept/reject với contract support
3. ✅ **Payment Integration** - PayOS webhook working
4. ✅ **Video Call** - Room generation & WebRTC ready
5. ✅ **Notifications** - 9 events covered

### **Điểm mạnh:**

- ✅ Validation rules comprehensive
- ✅ Conflict detection hoạt động tốt
- ✅ Support nhiều mode (online/offline)
- ✅ Escrow payment system
- ✅ WebRTC integration sẵn sàng

### **Cần cải thiện:**

- ⚠️ Error handling & user feedback
- ⚠️ Loading states & UX optimization
- ⚠️ Transaction safety cho batch operations
- ⚠️ Performance optimization (indexes)
- ⚠️ Testing coverage

---

**Ngày phân tích:** November 12, 2025  
**Branch:** Tung-fixpayment-data  
**Người phân tích:** GitHub Copilot
