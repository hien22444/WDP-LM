# 🕐 CÁCH LỊCH RẢNH HOẠT ĐỘNG TRONG HỆ THỐNG

> Tài liệu chi tiết về cơ chế lịch rảnh (availability) trong EduMatch
> Ngày kiểm tra: 11/11/2025

---

## 📋 MỤC LỤC

1. [Tổng quan](#tổng-quan)
2. [Phân biệt Availability vs Teaching Slots](#phân-biệt-availability-vs-teaching-slots)
3. [Cơ chế hoạt động](#cơ-chế-hoạt-động)
4. [Giao diện người dùng](#giao-diện-người-dùng)
5. [Flow diagram](#flow-diagram)

---

## 🎯 TỔNG QUAN

Hệ thống có **2 loại lịch** khác nhau:

### 1️⃣ **Availability (Lịch rảnh tổng quát)**
- **Mục đích**: Lịch theo **TUẦN** của gia sư (weekly schedule)
- **Ví dụ**: "Tôi rảnh mỗi Thứ 2, 4, 6 từ 18:00-20:00"
- **Lưu trong**: `TutorProfile.availability[]`
- **Format**: `{ dayOfWeek: 1, start: "18:00", end: "20:00" }`
- **Cập nhật qua**: `PUT /api/tutors/me/availability`

### 2️⃣ **Teaching Slots (Lịch dạy cụ thể)**
- **Mục đích**: Lịch dạy **CỤ THỂ** theo ngày giờ chính xác
- **Ví dụ**: "Khóa Python ngày 15/11/2025 18:00-20:00"
- **Lưu trong**: `TeachingSlot` collection
- **Format**: `{ start: Date, end: Date, courseName: "...", status: "open" }`
- **Tạo qua**: `POST /api/bookings/slots`

---

## 🔄 PHÂN BIỆT AVAILABILITY VS TEACHING SLOTS

| Tiêu chí | Availability (Lịch rảnh) | Teaching Slots (Lịch dạy) |
|----------|--------------------------|---------------------------|
| **Loại** | Template theo tuần | Sự kiện cụ thể |
| **Thời gian** | Lặp lại hàng tuần | Ngày giờ chính xác |
| **Mục đích** | Cho learner biết "khi nào rảnh" | Tạo lịch dạy công khai |
| **Bắt buộc** | ✅ Bắt buộc để book | ⚪ Tuỳ chọn |
| **Ví dụ** | "T2,T4,T6: 18-20h" | "15/11 18:00 - Lập trình Python" |
| **Storage** | TutorProfile.availability | TeachingSlot collection |
| **Dùng khi nào** | Luôn luôn (để check rảnh) | Chỉ khi tutor muốn public slot |

---

## ⚙️ CƠ CHẾ HOẠT ĐỘNG

### BƯỚC 1: Gia sư cập nhật lịch rảnh tổng quát

```
GIA SƯ → Vào trang Profile Update → Tab "Lịch rảnh"
         → Chọn ô trong lưới thời khóa biểu
         → Lưu
```

**Component:** `AvailabilityGrid.js`
- Hiển thị lưới 7 ngày × 16h (6:00-22:00)
- Mỗi ô = 30 phút
- Click để chọn/bỏ chọn
- Kéo thả để chọn nhiều ô cùng lúc

**Tính năng:**
- ✅ Thêm nhanh theo preset (Sáng 8-11, Chiều 13-17, Tối 18-21)
- ✅ Chọn theo nhóm ngày (T2-T6, T7-CN, Tất cả)
- ✅ Xóa theo ngày hoặc xóa tất cả
- ✅ Validation: không được overlap trong cùng 1 ngày

**Output:**
```javascript
[
  { dayOfWeek: 1, start: "18:00", end: "20:00" }, // Thứ 2
  { dayOfWeek: 3, start: "18:00", end: "20:00" }, // Thứ 4
  { dayOfWeek: 5, start: "18:00", end: "20:00" }  // Thứ 6
]
```

**Backend API:**
```javascript
PUT /api/tutors/me/availability
Body: {
  "availability": [
    { "dayOfWeek": 1, "start": "18:00", "end": "20:00" }
  ]
}
```

**Validation:**
```javascript
// Line 840-870 trong src/routes/tutor.js
- dayOfWeek phải từ 0-6
- start/end phải format HH:mm
- end > start
- Không overlap trên cùng ngày
```

---

### BƯỚC 2: Learner xem lịch rảnh của tutor

**API Call:**
```javascript
GET /api/tutors/:tutorId/availability
```

**Backend xử lý** (file: `src/routes/tutor.js` line 507-590):

```javascript
1. Lấy lịch tổng quát từ TutorProfile.availability
2. Lấy tất cả bookings đã có (accepted, completed, in_progress)
3. Generate slots cho 56 ngày tới (8 tuần):
   - Loop qua 56 ngày
   - Mỗi ngày check dayOfWeek
   - Tìm availability slots cho ngày đó
   - Check xem có booking nào overlap không
   - Phân loại: available hoặc booked
```

**Response:**
```json
{
  "availability": {
    "weekly": [
      { "dayOfWeek": 1, "start": "18:00", "end": "20:00" }
    ],
    "slots": [
      {
        "date": "2025-11-11T18:00:00.000Z",
        "start": "18:00",
        "end": "20:00",
        "available": true
      },
      {
        "date": "2025-11-13T18:00:00.000Z",
        "start": "18:00",
        "end": "20:00",
        "available": false
      }
    ],
    "booked": [
      {
        "date": "2025-11-13T18:00:00.000Z",
        "start": "18:00",
        "end": "20:00",
        "available": false
      }
    ]
  }
}
```

---

### BƯỚC 3: Learner book lịch

**Khi learner book, backend check 3 điều kiện:**

```javascript
// File: src/routes/booking.js line 100-145

// CHECK 1: Tutor có lịch rảnh tổng quát không?
const dayOfWeek = startTime.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
const isAvailable = tutor.availability.some(
  (slot) => slot.dayOfWeek === dayOfWeek &&
            slot.start <= startHour &&
            slot.end >= endHour
);

if (!isAvailable) {
  return "Gia sư không rảnh trong khung giờ này";
}

// CHECK 2: Có booking nào trùng không?
const existingBooking = await Booking.findOne({
  tutorProfile: tutorProfileId,
  start: { $lt: endTime },
  end: { $gt: startTime },
  status: { $in: ["pending", "accepted", "completed"] }
});

if (existingBooking) {
  return "Khung giờ này đã được đặt bởi học viên khác";
}

// CHECK 3: Có teaching slot trùng không?
const existingSlot = await TeachingSlot.findOne({
  tutorProfile: tutorProfileId,
  start: { $lt: endTime },
  end: { $gt: startTime },
  status: "open"
});

if (existingSlot) {
  return "Khung giờ này đã có slot dạy mở";
}
```

---

## 🎨 GIAO DIỆN NGƯỜI DÙNG

### 1. Gia sư update lịch rảnh

**Component:** `AvailabilityGrid` (frontend/src/pages/Tutor/AvailabilityGrid.js)

**Giao diện:**
```
┌─────────────────────────────────────────────────────────────┐
│ Thời khóa biểu rảnh                                         │
│ [●] Đang chọn  [○] Trống  [─] Vạch giờ                     │
├─────────────────────────────────────────────────────────────┤
│ Thêm nhanh: [T2-T6▼] [18:00▼] → [20:00▼] [Thêm]          │
│ [Sáng 08-11] [Chiều 13-17] [Tối 18-21] | [Xóa tất cả]     │
├─────────┬────┬────┬────┬────┬────┬────┬────┐               │
│         │ T2 │ T3 │ T4 │ T5 │ T6 │ T7 │ CN │               │
├─────────┼────┼────┼────┼────┼────┼────┼────┤               │
│ 06:00   │ □  │ □  │ □  │ □  │ □  │ □  │ □  │               │
│ 06:30   │ □  │ □  │ □  │ □  │ □  │ □  │ □  │               │
│ 07:00   │ □  │ □  │ □  │ □  │ □  │ □  │ □  │               │
│ ...     │    │    │    │    │    │    │    │               │
│ 18:00   │ ■  │ □  │ ■  │ □  │ ■  │ □  │ □  │ ← Selected    │
│ 18:30   │ ■  │ □  │ ■  │ □  │ ■  │ □  │ □  │               │
│ 19:00   │ ■  │ □  │ ■  │ □  │ ■  │ □  │ □  │               │
│ 19:30   │ ■  │ □  │ ■  │ □  │ ■  │ □  │ □  │               │
│ 20:00   │ □  │ □  │ □  │ □  │ □  │ □  │ □  │               │
│ ...     │    │    │    │    │    │    │    │               │
└─────────┴────┴────┴────┴────┴────┴────┴────┘               │
Nhấn để chọn. Giữ chuột và kéo để chọn nhanh.                │
└─────────────────────────────────────────────────────────────┘
```

**Tính năng:**
- ✅ Click để toggle từng ô
- ✅ Drag & drop để chọn nhiều ô
- ✅ Quick add: Chọn preset (Sáng, Chiều, Tối)
- ✅ Quick add: Chọn nhóm ngày (T2-T6, T7-CN, All)
- ✅ Clear per day hoặc clear all
- ✅ Visual feedback: Màu tím cho ô đã chọn

**Code logic:**
```javascript
// Mỗi ô = 30 phút
// Key format: "dayOfWeek-HH:mm" (ví dụ: "1-18:00")
const toKey = (day, time) => `${day}-${time}`;

// Khi save, group các ô liền kề thành slots:
// ["1-18:00", "1-18:30", "1-19:00", "1-19:30"]
// → { dayOfWeek: 1, start: "18:00", end: "20:00" }
```

---

### 2. Learner xem lịch rảnh

**Hiện tại:** CHƯA CÓ UI hiển thị lịch rảnh chi tiết cho learner

**Vấn đề:**
- ❌ TutorProfilePage không fetch availability
- ❌ Không có component hiển thị calendar view
- ❌ Learner không biết tutor rảnh khi nào

**Khuyến nghị:** Cần implement!

---

## 📊 FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                    GIA SƯ WORKFLOW                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 1. Vào /tutor/profile-update                                │
│    Tab "Lịch rảnh"                                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Sử dụng AvailabilityGrid                                 │
│    - Chọn các ô trong lưới 7x32                             │
│    - Hoặc dùng Quick Add                                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Click "Lưu lịch rảnh"                                    │
│    → PUT /api/tutors/me/availability                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Backend validate và lưu vào                              │
│    TutorProfile.availability[]                              │
└─────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────┐
│                   LEARNER WORKFLOW                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 1. Vào /tutor/:id (Xem profile gia sư)                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. ❌ HIỆN TẠI: Không có UI xem availability               │
│    ✅ NÊN CÓ: Calendar view hiển thị lịch rảnh              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Click "Đặt lịch"                                         │
│    → Chọn ngày giờ                                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. POST /api/bookings                                       │
│    Backend check:                                           │
│    ✓ Availability match?                                    │
│    ✓ No booking conflict?                                   │
│    ✓ No slot conflict?                                      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Tạo booking với status "pending"                         │
│    → Tutor nhận notification                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 CHI TIẾT KỸ THUẬT

### Data Structure

**TutorProfile.availability:**
```javascript
[
  {
    dayOfWeek: 1,    // 0=Sun, 1=Mon, ..., 6=Sat
    start: "18:00",  // HH:mm format
    end: "20:00"     // HH:mm format
  }
]
```

**API Response (GET /api/tutors/:id/availability):**
```javascript
{
  availability: {
    weekly: [
      { dayOfWeek: 1, start: "18:00", end: "20:00" }
    ],
    slots: [
      {
        date: "2025-11-11T18:00:00.000Z",
        start: "18:00",
        end: "20:00",
        available: true
      }
    ],
    booked: [
      {
        date: "2025-11-13T18:00:00.000Z",
        start: "18:00",
        end: "20:00",
        available: false
      }
    ]
  }
}
```

### Overlap Detection

**Công thức:**
```javascript
// Booking A overlaps Booking B nếu:
startA < endB  AND  endA > startB

// Ví dụ:
A: [18:00, 20:00]
B: [19:00, 21:00]
Check: 18:00 < 21:00  AND  20:00 > 19:00
→ TRUE → OVERLAP
```

### Generate Slots Algorithm

```javascript
// Pseudo code (src/routes/tutor.js line 520-580)
for (day = 0; day < 56; day++) {
  currentDate = today + day;
  dayOfWeek = currentDate.getDay();
  
  // Tìm availability cho ngày này
  daySlots = availability.filter(a => a.dayOfWeek === dayOfWeek);
  
  for (slot of daySlots) {
    slotStart = createDateTime(currentDate, slot.start);
    slotEnd = createDateTime(currentDate, slot.end);
    
    // Check overlap với bookings
    isBooked = bookings.some(b => 
      slotStart < b.end && slotEnd > b.start
    );
    
    if (isBooked) {
      bookedSlots.push({ date: slotStart, ... });
    } else {
      availableSlots.push({ date: slotStart, ... });
    }
  }
}
```

---

## ⚠️ VẤN ĐỀ HIỆN TẠI

### ❌ Learner không thấy lịch rảnh trực quan

**Vấn đề:**
- TutorProfilePage không call API `GET /api/tutors/:id/availability`
- Không có component calendar để hiển thị
- Learner phải "đoán" xem tutor rảnh khi nào

**Giải pháp đề xuất:**

1. **Fetch availability khi load profile:**
```javascript
useEffect(() => {
  const fetchAvailability = async () => {
    const response = await fetch(`/api/tutors/${id}/availability`);
    const data = await response.json();
    setAvailability(data.availability);
  };
  
  if (id) {
    loadTutorProfile();
    fetchAvailability();
  }
}, [id]);
```

2. **Tạo component AvailabilityCalendar:**
```javascript
<AvailabilityCalendar
  availableSlots={availability.slots}
  bookedSlots={availability.booked}
  onSelectSlot={(slot) => {
    setBookingData({
      start: slot.date,
      end: addHours(slot.date, 2)
    });
    setShowBookingForm(true);
  }}
/>
```

3. **UI Mockup:**
```
┌─────────────────────────────────────────────────────────┐
│ Lịch rảnh của gia sư                                    │
├─────────────────────────────────────────────────────────┤
│ Tuần này: [<] [11-17/11] [>]                           │
├────┬────┬────┬────┬────┬────┬────┐                      │
│ T2 │ T3 │ T4 │ T5 │ T6 │ T7 │ CN │                      │
├────┼────┼────┼────┼────┼────┼────┤                      │
│ 🟢 │    │ 🟢 │    │ 🟢 │    │    │ 18:00-20:00         │
│    │    │    │    │    │    │    │                      │
└────┴────┴────┴────┴────┴────┴────┘                      │
🟢 Còn trống  🔴 Đã đặt                                    │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ TÓM TẮT

### Availability hiện đang hoạt động như sau:

1. ✅ **Gia sư CÓ THỂ** update lịch rảnh tổng quát qua AvailabilityGrid
2. ✅ **Backend CÓ** API để lấy lịch rảnh chi tiết (56 ngày)
3. ✅ **Backend CHECK** availability khi learner book
4. ❌ **Learner KHÔNG THẤY** lịch rảnh trực quan (thiếu UI)

### Cần làm gì để hoàn thiện:

- [ ] Tạo component AvailabilityCalendar cho learner
- [ ] Fetch availability khi load TutorProfilePage
- [ ] Hiển thị lịch dạng calendar với available/booked slots
- [ ] Cho phép click vào slot để book nhanh

---

**📌 Kết luận:** Hệ thống availability đã hoàn chỉnh về **BACKEND** nhưng thiếu **FRONTEND** cho learner xem lịch.
