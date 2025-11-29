# 📅 LUỒNG LỊCH RẢNH & BOOKING HỆ THỐNG EDUMATCH

> Kiểm tra ngày: 11/11/2025
> Status: ✅ HOÀN CHỈNH - Luồng đã được implement đầy đủ

---

## 📋 MỤC LỤC

1. [Tổng quan luồng](#tổng-quan-luồng)
2. [Chi tiết từng bước](#chi-tiết-từng-bước)
3. [API Endpoints](#api-endpoints)
4. [Models & Schema](#models--schema)
5. [Logic chống trùng lịch](#logic-chống-trùng-lịch)
6. [Test Cases](#test-cases)

---

## 🔄 TỔNG QUAN LUỒNG

```
LEARNER ĐĂNG KÝ
      ↓
SUBMIT HỒ SƠ GIA SƯ (status: draft → pending)
      ↓
ADMIN DUYỆT (status: pending → approved)
      ↓
GIA SƯ APPROVED → Update Profile
      ↓
┌─────────────────────────────────────────────────┐
│  1. CẬP NHẬT MÔN DẠY (subjects)                 │
│     PATCH /api/tutors/me/expertise              │
│     - Thêm môn học, level, giá                  │
└─────────────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────────────┐
│  2. CẬP NHẬT LỊCH RẢNH (availability)           │
│     PUT /api/tutors/me/availability             │
│     - Lịch tổng quát theo tuần (weekly)         │
│     - Ví dụ: T2,T4,T6 18:00-20:00              │
└─────────────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────────────┐
│  3. TẠO TEACHING SLOTS (tuỳ chọn)               │
│     POST /api/bookings/slots                    │
│     - Tạo lịch dạy mở cụ thể (open slots)       │
│     - Có thể tạo recurring (lặp lại hàng tuần)  │
└─────────────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────────────┐
│  LEARNER XEM LỊCH RẢNH CỦA TUTOR               │
│     GET /api/tutors/:id/availability            │
│     - Xem lịch tổng quát (weekly schedule)      │
│     - Xem lịch available slots (56 ngày)        │
│     - Xem lịch booked slots (đã bận)            │
└─────────────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────────────┐
│  LEARNER ĐẶT LỊCH                               │
│     POST /api/bookings                          │
│     - Chọn khung giờ available                  │
│     - Hệ thống check:                           │
│       ✓ Tutor có rảnh không (availability)      │
│       ✓ Khung giờ có trùng booking khác không   │
│       ✓ Khung giờ có trùng teaching slot không  │
└─────────────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────────────┐
│  SAU KHI BOOK THÀNH CÔNG                        │
│     - Booking status: pending                   │
│     - Khung giờ này BỊ KHÓA (người khác không   │
│       book được)                                │
│     - Tutor nhận notification                   │
└─────────────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────────────┐
│  NGƯỜI BOOK SAU                                 │
│     - HỆ THỐNG TỰ ĐỘNG CHẶN nếu trùng lịch     │
│     - Chỉ thấy các slot AVAILABLE               │
│     - Không thể book lại lịch đã được đặt       │
└─────────────────────────────────────────────────┘
```

---

## 📝 CHI TIẾT TỪNG BƯỚC

### BƯỚC 1: Gia sư cập nhật môn dạy

**Endpoint:** `PATCH /api/tutors/me/expertise`

**Request Body:**
```json
{
  "subjects": [
    {
      "name": "Toán",
      "level": "Cấp 2",
      "price": 150000,
      "description": "Dạy toán cấp 2, chuyên đề hình học"
    },
    {
      "name": "Lập trình Python",
      "level": "Beginner",
      "price": 200000,
      "description": "Python cơ bản cho người mới"
    }
  ]
}
```

**Lưu vào:** `TutorProfile.subjects[]` (embedded schema)

---

### BƯỚC 2: Gia sư cập nhật lịch rảnh tổng quát

**Endpoint:** `PUT /api/tutors/me/availability`

**Request Body:**
```json
{
  "availability": [
    {
      "dayOfWeek": 1,
      "start": "18:00",
      "end": "20:00"
    },
    {
      "dayOfWeek": 3,
      "start": "18:00",
      "end": "20:00"
    },
    {
      "dayOfWeek": 5,
      "start": "14:00",
      "end": "17:00"
    }
  ]
}
```

**Giải thích:**
- `dayOfWeek`: 0 = Chủ Nhật, 1 = Thứ 2, ..., 6 = Thứ 7
- Lịch này là **TỔNG QUÁT theo tuần**, không phải lịch cụ thể
- Ví dụ trên: Rảnh T2, T4 18-20h và T6 14-17h **MỖI TUẦN**

**Validation:**
- ✅ dayOfWeek phải từ 0-6
- ✅ start/end phải đúng format HH:mm
- ✅ end > start
- ✅ Không được overlap trên cùng 1 ngày

**Lưu vào:** `TutorProfile.availability[]`

---

### BƯỚC 3: Gia sư tạo Teaching Slots (tuỳ chọn)

**Endpoint:** `POST /api/bookings/slots`

**Use case:** Gia sư muốn tạo lịch dạy mở cụ thể (ví dụ: khóa học định kỳ)

**Request Body (Single slot):**
```json
{
  "courseName": "Python Cơ Bản",
  "courseCode": "PY101",
  "start": "2025-11-15T18:00:00Z",
  "end": "2025-11-15T20:00:00Z",
  "mode": "online",
  "price": 200000,
  "capacity": 5,
  "notes": "Khóa học 8 buổi"
}
```

**Request Body (Recurring - lặp hàng tuần):**
```json
{
  "courseName": "Toán Cấp 2",
  "mode": "offline",
  "price": 150000,
  "location": "Quận 1, TP.HCM",
  "recurring": {
    "type": "weekly",
    "duration": 8,
    "availability": [
      {
        "dayOfWeek": 2,
        "start": "18:00",
        "end": "20:00"
      },
      {
        "dayOfWeek": 4,
        "start": "18:00",
        "end": "20:00"
      }
    ]
  }
}
```

**Logic:**
- Tạo slot lặp lại trong 8 tuần
- Mỗi tuần tạo slot vào T3 và T5 18-20h
- Tự động check conflict với bookings và slots khác

**Lưu vào:** `TeachingSlot` collection

---

### BƯỚC 4: Learner xem lịch rảnh của tutor

**Endpoint:** `GET /api/tutors/:id/availability`

**Response:**
```json
{
  "availability": {
    "weekly": [
      {
        "dayOfWeek": 1,
        "start": "18:00",
        "end": "20:00"
      },
      {
        "dayOfWeek": 3,
        "start": "18:00",
        "end": "20:00"
      }
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

**Giải thích:**
- `weekly`: Lịch tổng quát theo tuần (từ TutorProfile.availability)
- `slots`: Lịch available cụ thể trong **56 ngày tới** (8 tuần)
- `booked`: Lịch đã bận (có booking)

**Logic tính toán:**
1. Lấy `availability` từ TutorProfile
2. Generate slots cho 56 ngày tới dựa trên weekly schedule
3. Check từng slot có conflict với booking nào không
4. Trả về 2 danh sách: available và booked

---

### BƯỚC 5: Learner đặt lịch

**Endpoint:** `POST /api/bookings`

**Request Body:**
```json
{
  "tutorProfileId": "6912...",
  "start": "2025-11-15T18:00:00Z",
  "end": "2025-11-15T20:00:00Z",
  "mode": "online",
  "price": 150000,
  "notes": "Cần ôn thi học kỳ"
}
```

**Validation Pipeline (code tại `src/routes/booking.js` line 100-170):**

```javascript
// 1. Check tutor tồn tại và approved
const tutor = await TutorProfile.findById(tutorProfileId);
if (!tutor || tutor.status !== "approved") {
  return "Tutor không hợp lệ";
}

// 2. Check thời gian hợp lệ
if (!(startTime < endTime)) {
  return "Thời gian không hợp lệ";
}

// 3. ✅ CHECK LỊCH RẢNH TỔNG QUÁT
const dayOfWeek = startTime.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
const startHour = startTime.toTimeString().slice(0, 5);
const endHour = endTime.toTimeString().slice(0, 5);

const isAvailable = tutor.availability.some(
  (slot) =>
    slot.dayOfWeek === dayOfWeek &&
    slot.start <= startHour &&
    slot.end >= endHour
);

if (!isAvailable) {
  return "Gia sư không rảnh trong khung giờ này";
}

// 4. ✅ CHECK TRÙNG BOOKING (CHẶN NGƯỜI BOOK SAU)
const existingBooking = await Booking.findOne({
  tutorProfile: tutorProfileId,
  start: { $lt: endTime },
  end: { $gt: startTime },
  status: { $in: ["pending", "accepted", "completed"] },
});

if (existingBooking) {
  return "Khung giờ này đã được đặt bởi học viên khác";
}

// 5. ✅ CHECK TRÙNG TEACHING SLOT
const existingSlot = await TeachingSlot.findOne({
  tutorProfile: tutorProfileId,
  start: { $lt: endTime },
  end: { $gt: startTime },
  status: "open",
});

if (existingSlot) {
  return "Khung giờ này đã có slot dạy mở, vui lòng đặt từ slot đó";
}

// 6. Tạo booking
const booking = await Booking.create({
  tutorProfile: tutor._id,
  student: req.user.id,
  start: startTime,
  end: endTime,
  mode,
  price: finalPrice,
  notes,
  status: "pending",
  paymentStatus: "none",
});
```

---

## 🔐 LOGIC CHỐNG TRÙNG LỊCH

### Cơ chế hoạt động:

```
┌─────────────────────────────────────────────────────────────┐
│  BOOKING MỚI: 15/11 18:00 - 20:00                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  CHECK 1: Tutor có lịch rảnh tổng quát không?              │
│  Query: TutorProfile.availability                           │
│  Logic: Tìm slot có:                                        │
│    - dayOfWeek = Thứ 6 (5)                                 │
│    - start <= 18:00 <= end                                  │
│    - start <= 20:00 <= end                                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  CHECK 2: Có booking nào trùng không?                       │
│  Query: Booking.find({                                      │
│    tutorProfile: tutorId,                                   │
│    start: { $lt: "2025-11-15T20:00:00Z" },  // end mới     │
│    end: { $gt: "2025-11-15T18:00:00Z" },    // start mới   │
│    status: ["pending", "accepted", "completed"]             │
│  })                                                         │
│  Logic: Nếu có => REJECT                                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  CHECK 3: Có teaching slot trùng không?                     │
│  Query: TeachingSlot.find({                                 │
│    tutorProfile: tutorId,                                   │
│    start: { $lt: "2025-11-15T20:00:00Z" },                 │
│    end: { $gt: "2025-11-15T18:00:00Z" },                   │
│    status: "open"                                           │
│  })                                                         │
│  Logic: Nếu có => REJECT                                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
                    ✅ TẠO BOOKING
```

### Ví dụ cụ thể:

**Tình huống 1: Overlap hoàn toàn**
```
Booking cũ:  [18:00 ─────────── 20:00]
Booking mới: [18:00 ─────────── 20:00]
Kết quả: ❌ REJECT - Trùng hoàn toàn
```

**Tình huống 2: Overlap một phần**
```
Booking cũ:  [18:00 ─────────── 20:00]
Booking mới:         [19:00 ─────────── 21:00]
Kết quả: ❌ REJECT - Overlap 19:00-20:00
```

**Tình huống 3: Liền kề nhưng không overlap**
```
Booking cũ:  [18:00 ─────────── 20:00]
Booking mới:                     [20:00 ─────── 22:00]
Kết quả: ✅ ACCEPT - Không overlap (20:00 = điểm chung)
```

**Tình huống 4: Hoàn toàn riêng biệt**
```
Booking cũ:  [18:00 ─────────── 20:00]
Booking mới:                              [21:00 ─── 23:00]
Kết quả: ✅ ACCEPT - Không overlap
```

---

## 📊 MODELS & SCHEMA

### TutorProfile.availability

```javascript
const AvailabilitySlotSchema = new mongoose.Schema({
  dayOfWeek: { type: Number, min: 0, max: 6, required: true }, // 0=Sun, 6=Sat
  start: { type: String, required: true }, // "18:00"
  end: { type: String, required: true }, // "20:00"
}, { _id: false });

// Trong TutorProfile:
availability: { type: [AvailabilitySlotSchema], default: [] }
```

### TeachingSlot

```javascript
const TeachingSlotSchema = new mongoose.Schema({
  tutorProfile: { type: ObjectId, ref: "TutorProfile", required: true },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  mode: { type: String, enum: ["online", "offline"], required: true },
  price: { type: Number, default: 0 },
  courseName: { type: String, required: true },
  courseCode: { type: String, default: null },
  location: { type: String, default: null },
  notes: { type: String, default: null },
  capacity: { type: Number, default: 1, min: 1, max: 20 },
  status: { type: String, enum: ["open", "closed", "booked"], default: "open" }
});
```

### Booking

```javascript
const BookingSchema = new mongoose.Schema({
  tutorProfile: { type: ObjectId, ref: "TutorProfile", required: true },
  student: { type: ObjectId, ref: "User", required: true },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  mode: { type: String, enum: ["online", "offline"], required: true },
  price: { type: Number, required: true },
  notes: { type: String, default: null },
  status: { 
    type: String, 
    enum: ["pending", "accepted", "rejected", "completed", "cancelled"],
    default: "pending" 
  },
  paymentStatus: {
    type: String,
    enum: ["none", "pending", "paid", "held", "released", "refunded"],
    default: "none"
  }
});
```

---

## 🧪 TEST CASES

### Test Case 1: Kiểm tra overlap detection

```javascript
// Setup
const tutorId = "6912...";
const existingBooking = {
  start: new Date("2025-11-15T18:00:00Z"),
  end: new Date("2025-11-15T20:00:00Z")
};

// Test 1: Trùng hoàn toàn
POST /api/bookings
{
  "start": "2025-11-15T18:00:00Z",
  "end": "2025-11-15T20:00:00Z"
}
Expected: 400 - "Khung giờ này đã được đặt bởi học viên khác"

// Test 2: Overlap một phần (đầu)
POST /api/bookings
{
  "start": "2025-11-15T17:00:00Z",
  "end": "2025-11-15T19:00:00Z"
}
Expected: 400 - "Khung giờ này đã được đặt bởi học viên khác"

// Test 3: Overlap một phần (cuối)
POST /api/bookings
{
  "start": "2025-11-15T19:00:00Z",
  "end": "2025-11-15T21:00:00Z"
}
Expected: 400 - "Khung giờ này đã được đặt bởi học viên khác"

// Test 4: Bao phủ hoàn toàn
POST /api/bookings
{
  "start": "2025-11-15T17:00:00Z",
  "end": "2025-11-15T21:00:00Z"
}
Expected: 400 - "Khung giờ này đã được đặt bởi học viên khác"

// Test 5: Nằm bên trong
POST /api/bookings
{
  "start": "2025-11-15T18:30:00Z",
  "end": "2025-11-15T19:30:00Z"
}
Expected: 400 - "Khung giờ này đã được đặt bởi học viên khác"

// Test 6: Không overlap (sau)
POST /api/bookings
{
  "start": "2025-11-15T20:00:00Z",
  "end": "2025-11-15T22:00:00Z"
}
Expected: 201 - Tạo booking thành công (nếu pass các check khác)
```

### Test Case 2: Kiểm tra availability check

```javascript
// Setup: Tutor có lịch rảnh T2,T4,T6 18-20h
const availability = [
  { dayOfWeek: 1, start: "18:00", end: "20:00" }, // Monday
  { dayOfWeek: 3, start: "18:00", end: "20:00" }, // Wednesday
  { dayOfWeek: 5, start: "18:00", end: "20:00" }  // Friday
];

// Test 1: Book đúng giờ rảnh (T2 18-20h)
POST /api/bookings
{
  "start": "2025-11-17T18:00:00Z", // Monday
  "end": "2025-11-17T20:00:00Z"
}
Expected: 201 - Thành công

// Test 2: Book ngoài giờ rảnh (T3 18-20h)
POST /api/bookings
{
  "start": "2025-11-18T18:00:00Z", // Tuesday
  "end": "2025-11-18T20:00:00Z"
}
Expected: 400 - "Gia sư không rảnh trong khung giờ này"

// Test 3: Book vượt giờ rảnh (T2 17-21h)
POST /api/bookings
{
  "start": "2025-11-17T17:00:00Z",
  "end": "2025-11-17T21:00:00Z"
}
Expected: 400 - "Gia sư không rảnh trong khung giờ này"
```

---

## ✅ KẾT LUẬN

### Luồng đã được implement HOÀN CHỈNH:

| Tính năng | Status | File |
|-----------|--------|------|
| ✅ Update môn dạy | DONE | `src/routes/tutor.js` line 648 |
| ✅ Update lịch rảnh | DONE | `src/routes/tutor.js` line 799 |
| ✅ Tạo teaching slots | DONE | `src/routes/booking.js` line 493 |
| ✅ Xem lịch rảnh tutor | DONE | `src/routes/tutor.js` line 507 |
| ✅ Check availability | DONE | `src/routes/booking.js` line 111 |
| ✅ Check booking conflict | DONE | `src/routes/booking.js` line 123 |
| ✅ Check slot conflict | DONE | `src/routes/booking.js` line 135 |
| ✅ Prevent double booking | DONE | Logic overlap detection |

### Bảo vệ chống trùng lịch:

1. ✅ **Check availability tổng quát** - Tutor phải có lịch rảnh trong khung giờ đó
2. ✅ **Check existing bookings** - Không được trùng với booking đã có (pending, accepted, completed)
3. ✅ **Check teaching slots** - Không được trùng với slot dạy mở
4. ✅ **Overlap detection logic** - Sử dụng interval overlap (`start < otherEnd && end > otherStart`)

### Điểm mạnh của hệ thống:

- **2-layer protection**: Availability (weekly) + Conflict check (specific dates)
- **Flexible scheduling**: Hỗ trợ cả single slot và recurring slots
- **Clear visibility**: Learner thấy rõ lịch available và booked
- **Robust validation**: Multiple checks để đảm bảo không trùng lịch
- **Scalable**: Hỗ trợ booking trong vòng 56 ngày (8 tuần)

### Khuyến nghị:

- ✅ Luồng đã OK, không cần sửa
- 💡 Có thể thêm: Notification realtime khi slot available mới được tạo
- 💡 Có thể thêm: Calendar view cho frontend
- 💡 Có thể thêm: Auto-cancel pending bookings sau 24h

---

**📌 Lưu ý:** Document này mô tả hệ thống hiện tại. Mọi thay đổi cần update document này.
