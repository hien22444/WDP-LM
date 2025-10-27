# 📅 HỆ THỐNG ĐẶT LỊCH HỌC

## 📖 TỔNG QUAN

Hệ thống đặt lịch học cho phép học viên tìm gia sư, xem lịch trống, và đặt lịch học với nhiều tính năng: payment escrow, WebRTC video call, automatic notifications.

---

## 🎯 LUỒNG ĐẶT LỊCH HỌC

### **Luồng 1: Đặt lịch trực tiếp (Custom Booking)**

```
1. Học viên tìm kiếm gia sư
   ↓
2. Xem profile gia sư
   ↓
3. Click "Đặt lịch học"
   ↓
4. Điền form đặt lịch:
   - Chọn thời gian (start, end)
   - Chọn hình thức (online/offline)
   - Điền ghi chú
   - Xác nhận giá
   ↓
5. Submit → Tạo booking với status: "pending"
   ↓
6. Gia sư nhận notification
   ↓
7. Gia sư chấp nhận/từ chối
   ↓
8. Nếu chấp nhận:
   - Booking status: "accepted"
   - Payment status: "held" (escrow)
   - Tạo TeachingSession
   - Tạo roomId cho video call
   ↓
9. Học viên thanh toán
   ↓
10. Diễn ra buổi học
    ↓
11. Hoàn thành buổi học
    ↓
12. Release payment: 85% → Gia sư, 15% → Platform
```

---

### **Luồng 2: Đặt lịch từ slot trống**

```
1. Gia sư tạo teaching slots (lịch trống)
   - Chọn thời gian cụ thể
   - Set giá, mô tả
   - Publish slot
   ↓
2. Học viên xem slot trống
   ↓
3. Click "Đặt lịch từ slot này"
   ↓
4. Điền ghi chú (optional)
   ↓
5. Submit → Tạo booking
   - Booking.status = "pending"
   - Booking.slotId = slot._id
   - Slot.status = "booked"
   ↓
6. Gia sư xác nhận
   ↓
7. Tương tự luồng 1 từ bước 8
```

---

## 📊 CẤU TRÚC DỮ LIỆU

### **Booking Model**

```javascript
{
  tutorProfile: ObjectId,      // Reference to TutorProfile
  student: ObjectId,            // Reference to User
  start: Date,                  // Start time
  end: Date,                    // End time
  mode: String,                 // "online" | "offline"
  price: Number,                // Giá buổi học
  status: String,               // "pending" | "accepted" | "rejected" | "cancelled" | "completed" | "in_progress" | "disputed"
  notes: String,                // Ghi chú từ học viên
  
  // Payment fields
  paymentStatus: String,        // "none" | "prepaid" | "postpaid" | "escrow" | "held" | "released" | "refunded"
  escrowAmount: Number,         // Số tiền giữ trong escrow
  platformFee: Number,          // Phí platform (15%)
  tutorPayout: Number,          // Số tiền gia sư nhận (85%)
  refundAmount: Number,         // Số tiền hoàn lại
  paymentId: String,            // ID giao dịch PayOS
  
  // Cancellation fields
  cancellationReason: String,
  cancelledBy: String,          // "student" | "tutor" | "admin"
  cancelledAt: Date,
  
  // Completion fields
  completedAt: Date,
  
  // Dispute fields
  disputeReason: String,
  disputeOpenedAt: Date,
  disputeResolvedAt: Date,
  
  // Video call fields
  sessionId: ObjectId,          // Reference to TeachingSession
  roomId: String,               // WebRTC room ID
  slotId: ObjectId,             // Reference to TeachingSlot (nếu đặt từ slot)
  
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔌 API ENDPOINTS

### **1. Tạo booking**

```http
POST /api/v1/bookings
Content-Type: application/json
Authorization: Bearer <token>

{
  "tutorProfileId": "64a1b2c3d4e5f6789012345",
  "start": "2025-02-01T19:00:00.000Z",
  "end": "2025-02-01T21:00:00.000Z",
  "mode": "online",
  "price": 200000,
  "notes": "Học chương trình lớp 12"
}
```

**Response:**
```json
{
  "booking": {
    "_id": "...",
    "status": "pending",
    "paymentStatus": "escrow",
    "..."
  },
  "message": "Đặt lịch thành công, chờ gia sư xác nhận"
}
```

---

### **2. Gia sư chấp nhận/từ chối**

```http
POST /api/v1/bookings/:id/decision
Content-Type: application/json
Authorization: Bearer <tutor_token>

{
  "decision": "accept"  // or "reject"
}
```

**Khi accept:**
- Booking.status → "accepted"
- Payment.status → "held"
- Tạo TeachingSession
- Generate roomId cho video call
- Gửi notification cho học viên

---

### **3. Liệt kê bookings của user**

```http
GET /api/v1/bookings/me?role=student
Authorization: Bearer <token>
```

**Query params:**
- `role`: "student" | "tutor"

---

### **4. Thống kê bookings**

```http
GET /api/v1/bookings/stats?role=student
Authorization: Bearer <token>
```

**Response:**
```json
{
  "stats": {
    "total": 50,
    "pending": 5,
    "accepted": 30,
    "completed": 15,
    "cancelled": 5,
    "rejected": 5,
    "weekly": 12
  }
}
```

---

## 🎮 TÍNH NĂNG ĐẶC BIỆT

### **1. Escrow Payment**

Khi booking được tạo:
```javascript
const booking = await EscrowService.createEscrowBooking({
  tutorProfile: tutor._id,
  student: student._id,
  start,
  end,
  mode,
  price: 200000
});

// Tự động tính:
// - escrowAmount: 200000
// - platformFee: 30000 (15%)
// - tutorPayout: 170000 (85%)
```

Khi gia sư chấp nhận:
```javascript
await EscrowService.holdPayment(booking._id);
// Payment status: "escrow" → "held"
```

Khi hoàn thành:
```javascript
await EscrowService.releasePayment(booking._id);
// Chia tiền: 85% → gia sư, 15% → platform
```

---

### **2. WebRTC Video Call**

Khi gia sư chấp nhận:
```javascript
const roomId = generateRoomId(); // e.g., "ABC123XYZ"
booking.roomId = roomId;

// Tạo TeachingSession với roomId
const session = await TeachingSession.create({
  booking: booking._id,
  roomId,
  // ...
});
```

Học viên/gia sư join:
```javascript
// Lấy token
POST /api/v1/bookings/:id/join-token

// Response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "roomId": "ABC123XYZ",
  "role": "student",
  "roomUrl": "https://learnmate.vn/room/ABC123XYZ?token=..."
}

// Join vào WebRTC room
```

---

### **3. Notifications**

**Tạo booking:**
```javascript
await notifyTutorBookingCreated(booking);
// Email gia sư: "Bạn có yêu cầu đặt lịch mới"
```

**Gia sư chấp nhận:**
```javascript
await notifyStudentBookingDecision(booking, "accept");
// Email học viên: "Gia sư đã chấp nhận yêu cầu"
// + Gửi room code và link video call
```

**Thanh toán thành công:**
```javascript
await notifyStudentPaymentSuccess(booking);
await notifyTutorPaymentSuccess(booking);
```

---

## ⚠️ VALIDATION RULES

### **Khi tạo booking:**

1. ✅ Thời gian phải trong tương lai
2. ✅ Không đặt quá 3 tháng trước
3. ✅ Thời lượng tối thiểu: 1 giờ
4. ✅ Thời lượng tối đa: 8 giờ
5. ✅ Không xung đột với booking khác
6. ✅ Gia sư phải rảnh trong khung giờ này
7. ✅ Gia sư phải hỗ trợ mode (online/offline)
8. ✅ Giá: 2,000 - 5,000,000 VNĐ
9. ✅ Học viên không đặt với chính mình
10. ✅ Tối đa 5 pending bookings

### **Khi gia sư chấp nhận:**

1. ✅ Booking phải ở status "pending"
2. ✅ Không thay đổi trong vòng 2h trước giờ học
3. ✅ Tối đa 20 accepted bookings/tuần
4. ✅ Gia sư đã được approved

---

## 📱 FRONTEND INTEGRATION

### **Tạo booking**

```javascript
import { createBooking } from './services/BookingService';

const handleCreateBooking = async () => {
  try {
    const booking = await createBooking({
      tutorProfileId: tutor._id,
      start: bookingData.start,
      end: bookingData.end,
      mode: bookingData.mode,
      price: tutor.sessionRate,
      notes: bookingData.notes
    });
    
    // Redirect to success page
    navigate(`/bookings/success/${booking._id}`);
  } catch (error) {
    // Toast error (auto handled by BookingService)
  }
};
```

---

### **Gia sư xác nhận**

```javascript
import { tutorDecision } from './services/BookingService';

const handleAccept = async (bookingId) => {
  try {
    await tutorDecision(bookingId, 'accept');
    // Reload bookings
    loadMyBookings();
  } catch (error) {
    // Handle error
  }
};
```

---

### **Join video call**

```javascript
import { getRoomToken } from './services/BookingService';

const joinVideoCall = async (bookingId) => {
  try {
    const { roomUrl } = await getRoomToken(bookingId);
    // Open WebRTC room
    window.open(roomUrl, '_blank');
  } catch (error) {
    // Handle error
  }
};
```

---

## 🎨 UI COMPONENTS

### **1. Booking Form**

```jsx
<BookingForm 
  tutor={tutor}
  onSuccess={(booking) => navigate(`/bookings/success/${booking._id}`)}
/>
```

**Fields:**
- Date picker (start/end)
- Mode selector (online/offline)
- Notes textarea
- Price display
- Submit button

---

### **2. Booking List**

```jsx
<BookingList 
  bookings={bookings}
  role="student" // or "tutor"
  onAction={(action, bookingId) => {
    // Handle accept/reject/complete
  }}
/>
```

**Actions:**
- Student: Complete, Cancel, Dispute
- Tutor: Accept, Reject, Complete

---

### **3. Booking Card**

```jsx
<BookingCard 
  booking={booking}
  role="student"
  onJoin={() => joinVideoCall(booking._id)}
/>
```

**Displays:**
- Date & time
- Status badge
- Tutor/Student info
- Price & payment status
- Actions (Join, Complete, Cancel)

---

## 💡 BEST PRACTICES

### **1. Real-time Updates**

Use Socket.io để update booking status:
```javascript
socket.on('booking:status_changed', (booking) => {
  // Update booking in list
  updateBookingInList(booking);
});
```

### **2. Caching**

Cache tutor availability:
```javascript
const availability = useMemo(() => {
  return calculateAvailability(tutor.weeklySchedule, existingBookings);
}, [tutor, existingBookings]);
```

### **3. Optimistic Updates**

```javascript
const handleAccept = async () => {
  // Update UI immediately
  setBookingStatus('accepted');
  
  try {
    await tutorDecision(bookingId, 'accept');
  } catch (error) {
    // Revert on error
    setBookingStatus('pending');
  }
};
```

---

## 🔐 SECURITY

### **Authorization Checks:**

```javascript
// Tutor can only accept their own bookings
if (String(booking.tutorProfile.user) !== req.user.id) {
  return res.status(403).json({ message: "Not authorized" });
}

// Student can only cancel their own bookings
if (String(booking.student) !== req.user.id) {
  return res.status(403).json({ message: "Not authorized" });
}
```

### **Input Validation:**

```javascript
const validator = {
  start: Joi.date().greater('now').required(),
  end: Joi.date().greater(Joi.ref('start')).required(),
  mode: Joi.string().valid('online', 'offline').required(),
  price: Joi.number().min(2000).max(5000000).required()
};
```

---

## 📈 METRICS & ANALYTICS

### **Booking Stats:**

```javascript
const stats = {
  total: 1000,           // Total bookings
  pending: 50,           // Awaiting tutor response
  accepted: 600,         // Confirmed bookings
  completed: 300,        // Finished sessions
  cancelled: 30,         // Cancelled bookings
  rejected: 20,          // Rejected by tutor
  weekly: 50,            // This week's bookings
  revenue: 200000000,    // Total revenue (VNĐ)
  conversionRate: 0.85   // Accept rate (85%)
};
```

---

## 🚀 NEXT STEPS

### **Planned Features:**

1. ⏳ **Recurring bookings** (đặt lịch định kỳ)
2. ⏳ **Group bookings** (lớp học nhiều người)
3. ⏳ **Waitlist** (danh sách chờ)
4. ⏳ **Smart scheduling** (AI đề xuất thời gian)
5. ⏳ **Calendar integration** (Google/Outlook)

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-26  
**Author:** System Documentation
