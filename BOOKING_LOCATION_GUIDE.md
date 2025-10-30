# 📍 VỊ TRÍ CÁC PHẦN ĐẶT LỊCH HỌC

## 🗂️ CẤU TRÚC THƯ MỤC

```
WDP-LM/
├── frontend/src/
│   ├── pages/
│   │   ├── Tutor/
│   │   │   ├── TutorProfilePage.js          ← Form đặt lịch (modal)
│   │   │   ├── TutorBookings.js             ← Gia sư xem yêu cầu
│   │   │   ├── StudentBookings.js           ← Học viên xem lịch đã đặt
│   │   │   ├── TutorPublishSlot.js          ← Gia sư tạo slot trống
│   │   │   └── TutorSchedule.js             ← Lịch dạy của gia sư
│   │   └── ...
│   └── services/
│       └── BookingService.js                ← API calls
│
└── backend/src/
    ├── routes/
    │   └── booking.js                       ← API endpoints
    ├── models/
    │   └── Booking.js                       ← Booking schema
    └── services/
        └── EscrowService.js                 ← Payment logic
```

---

## 🎯 CÁC PHẦN ĐẶT LỊCH HỌC

### **1. FORM ĐẶT LỊCH (Modal)**

**File:** `frontend/src/pages/Tutor/TutorProfilePage.js`

**Vị trí trong code:** Lines 1095-1236

**Chức năng:**
- Modal popup khi học viên click "Đặt lịch học"
- Form gồm:
  - Thời gian bắt đầu/kết thúc (datetime picker)
  - Hình thức (online/offline)
  - Ghi chú
  - Hiển thị giá
- Submit → Gọi API tạo booking

**Trigger button:** 
- Dòng 188: Button "Đặt lịch học" ở tab "Thông tin"
- Dòng 208: Button "Đặt lịch" ở tab "Lịch dạy"

---

### **2. HỌC VIÊN XEM LỊCH ĐÃ ĐẶT**

**File:** `frontend/src/pages/Tutor/StudentBookings.js`

**Route:** `/bookings/me`

**Chức năng:**
- Hiển thị danh sách bookings học viên đã đặt
- Table gồm:
  - Gia sư
  - Thời gian
  - Hình thức
  - Giá
  - Trạng thái

**API:** `GET /api/v1/bookings/me?role=student`

---

### **3. GIA SƯ XEM YÊU CẦU ĐẶT LỊCH**

**File:** `frontend/src/pages/Tutor/TutorBookings.js`

**Route:** `/bookings/tutor`

**Chức năng:**
- Hiển thị danh sách bookings từ học viên
- Table gồm:
  - Học sinh
  - Thời gian
  - Hình thức
  - Giá
  - Trạng thái
  - Hành động (Chấp nhận/Từ chối)

**API:** `GET /api/v1/bookings/me?role=tutor`

**Actions:**
- Accept: `POST /api/v1/bookings/:id/decision` (decision=accept)
- Reject: `POST /api/v1/bookings/:id/decision` (decision=reject)

---

### **4. GIA SƯ TẠO SLOT TRỐNG**

**File:** `frontend/src/pages/Tutor/TutorPublishSlot.js`

**Route:** `/tutor/publish-slot`

**Chức năng:**
- Gia sư tạo teaching slot (lịch trống)
- Học viên có thể đặt trực tiếp từ slot này

---

### **5. API SERVICE**

**File:** `frontend/src/services/BookingService.js`

**Functions:**
```javascript
// Tạo booking
createBooking(payload)

// Liệt kê bookings
listMyBookings(role)  // 'student' or 'tutor'

// Gia sư chấp nhận/từ chối
tutorDecision(id, decision)  // 'accept' or 'reject'

// Đặt từ slot
bookFromSlot(slotId, notes)

// Hoàn thành buổi học
completeSession(bookingId)

// Hủy booking
cancelBooking(bookingId, reason)

// Mở tranh chấp
openDispute(bookingId, reason)
```

---

### **6. BACKEND API**

**File:** `backend/src/routes/booking.js`

**Endpoints:**

```javascript
// Tạo booking
POST /api/v1/bookings
Body: { tutorProfileId, start, end, mode, price, notes }

// Gia sư chấp nhận/từ chối
POST /api/v1/bookings/:id/decision
Body: { decision: 'accept' | 'reject' }

// Liệt kê bookings
GET /api/v1/bookings/me?role=student|tutor

// Thống kê
GET /api/v1/bookings/stats?role=student|tutor

// Hoàn thành
POST /api/v1/bookings/:id/complete

// Hủy
POST /api/v1/bookings/:id/cancel
Body: { reason }

// Tranh chấp
POST /api/v1/bookings/:id/dispute
Body: { reason }

// Đặt từ slot
POST /api/v1/bookings/slots/:slotId/book
Body: { notes }

// Join video call
POST /api/v1/bookings/:id/join-token
```

---

### **7. DATABASE MODEL**

**File:** `backend/src/models/Booking.js`

**Schema:**
```javascript
{
  tutorProfile: ObjectId,      // Gia sư
  student: ObjectId,            // Học viên
  start: Date,                  // Thời gian bắt đầu
  end: Date,                    // Thời gian kết thúc
  mode: String,                 // 'online' | 'offline'
  price: Number,                // Giá
  status: String,               // 'pending' | 'accepted' | 'rejected' | 'completed'...
  paymentStatus: String,        // 'escrow' | 'held' | 'released'...
  // ... (xem Booking.js)
}
```

---

## 🚀 CÁCH TRUY CẬP

### **Học viên:**

1. **Đặt lịch mới:**
   ```
   Truy cập: /tutor/:id (TutorProfilePage)
   → Click "Đặt lịch học"
   → Điền form → Submit
   ```

2. **Xem lịch đã đặt:**
   ```
   URL: /bookings/me
   → Xem tất cả bookings của mình
   ```

### **Gia sư:**

1. **Xem yêu cầu đặt lịch:**
   ```
   URL: /bookings/tutor
   → Xem tất cả requests từ học viên
   → Chấp nhận/Từ chối
   ```

2. **Tạo slot trống:**
   ```
   URL: /tutor/publish-slot
   → Tạo teaching slot
   → Học viên có thể đặt ngay
   ```

---

## 📝 CODE SAMPLES

### **Tạo booking từ frontend:**

```javascript
// Trong TutorProfilePage.js
const handleBookingSubmit = async (e) => {
  e.preventDefault();
  
  try {
    const booking = await BookingService.createBooking({
      tutorProfileId: tutor._id,
      start: bookingData.start,
      end: bookingData.end,
      mode: bookingData.mode,
      price: tutor.price,
      notes: bookingData.notes
    });
    
    // Redirect to success page
    navigate(`/bookings/success/${booking._id}`);
  } catch (error) {
    console.error('Error creating booking:', error);
  }
};
```

---

### **Gia sư chấp nhận booking:**

```javascript
// Trong TutorBookings.js
const handleAccept = async (bookingId) => {
  try {
    await BookingService.tutorDecision(bookingId, 'accept');
    // Reload list
    loadBookings();
  } catch (error) {
    console.error('Error accepting booking:', error);
  }
};
```

---

## 🔗 ROUTING

**App.js routes:**

```javascript
// Form đặt lịch (embedded trong TutorProfilePage)
<Route path="/tutor/:id" element={<TutorProfilePage />} />

// Học viên xem lịch
<Route path="/bookings/me" element={<StudentBookings />} />

// Gia sư xem requests
<Route path="/bookings/tutor" element={<TutorBookings />} />

// Tạo slot
<Route path="/tutor/publish-slot" element={<TutorPublishSlot />} />
```

---

## 🎨 UI COMPONENTS

### **Booking Form Modal:**
- File: `TutorProfilePage.js` (lines 1099-1236)
- Styling: `TutorProfilePage.scss`

### **Booking List (Student):**
- File: `StudentBookings.js`
- Styling: `StudentBookings.scss`

### **Booking List (Tutor):**
- File: `TutorBookings.js`
- Styling: `TutorBookings.scss`

---

## 📊 DATA FLOW

```
User clicks "Đặt lịch học"
        ↓
TutorProfilePage.js → handleBookingSubmit()
        ↓
BookingService.createBooking()
        ↓
POST /api/v1/bookings
        ↓
Backend: booking.js → Create booking
        ↓
EscrowService.createEscrowBooking()
        ↓
Save to MongoDB → Return booking
        ↓
Toast notification → Redirect
```

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-26  
**Author:** System Documentation
