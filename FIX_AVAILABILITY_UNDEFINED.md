# 🔧 FIX: Availability Undefined Issue

## 🐛 VẤN ĐỀ

Khi load tutor profile, `availability` trả về `undefined` trong console:

```javascript
📊 Tutor Data: Object
📅 Availability: undefined
```

## 🔍 NGUYÊN NHÂN

### 1. **TutorProfilePage.js - Sai kiểu dữ liệu**
```javascript
// ❌ SAI - Gán string thay vì array
availability: t.availability || "Chưa cập nhật",

// ✅ ĐÚNG - Giữ nguyên array
availability: Array.isArray(t.availability) ? t.availability : [],
```

### 2. **BookingPage.js - Sai cấu trúc response**
Backend API trả về:
```javascript
{
  message: "Tutor profile retrieved successfully",
  tutor: {
    id: "xxx",
    name: "...",
    availability: [...]  // ← availability nằm TRONG tutor object
  }
}
```

Nhưng code đang truy cập:
```javascript
// ❌ SAI
const data = await getTutorProfile(tutorId);
console.log(data.availability); // undefined vì availability nằm trong data.tutor

// ✅ ĐÚNG
const response = await getTutorProfile(tutorId);
const data = response.tutor || response; // Extract tutor object
console.log(data.availability); // [...]
```

---

## ✅ GIẢI PHÁP ĐÃ ÁP DỤNG

### **File 1: TutorProfilePage.js** (dòng ~272)

**Trước:**
```javascript
availability: t.availability || "Chưa cập nhật",
```

**Sau:**
```javascript
availability: Array.isArray(t.availability) ? t.availability : [],
```

### **File 2: BookingPage.js** (dòng ~43-47)

**Trước:**
```javascript
const fetchTutorData = async () => {
  try {
    setLoading(true);
    const data = await getTutorProfile(tutorId);
    console.log('📊 Tutor Data:', data);
    console.log('📅 Availability:', data.availability); // undefined
```

**Sau:**
```javascript
const fetchTutorData = async () => {
  try {
    setLoading(true);
    const response = await getTutorProfile(tutorId);
    
    // Extract tutor from response (API returns { tutor: {...}, message: "..." })
    const data = response.tutor || response;
    
    console.log('📊 Tutor Data:', data);
    console.log('📅 Availability:', data.availability); // [...]
```

---

## 🎯 CẤU TRÚC AVAILABILITY

### **Backend Response (GET /api/tutors/:id):**
```javascript
{
  message: "Tutor profile retrieved successfully",
  tutor: {
    id: "6912ea95632743326fda0082",
    userId: "6912e923415acc00ae1ead25",
    name: "juanre 123",
    avatar: "https://...",
    subjects: [...],
    price: 200000,
    teachModes: ["online", "offline"],
    availability: [
      { dayOfWeek: 1, start: "08:00", end: "11:30" },  // Thứ 2 sáng
      { dayOfWeek: 1, start: "14:00", end: "17:00" },  // Thứ 2 chiều
      { dayOfWeek: 3, start: "08:00", end: "11:30" },  // Thứ 4 sáng
      { dayOfWeek: 3, start: "14:00", end: "17:00" },  // Thứ 4 chiều
      { dayOfWeek: 5, start: "08:00", end: "11:30" },  // Thứ 6 sáng
      { dayOfWeek: 6, start: "14:00", end: "17:00" }   // Thứ 7 chiều
    ],
    verified: true,
    isDraft: false
  }
}
```

### **dayOfWeek Mapping:**
```javascript
0 = Chủ nhật (Sunday)
1 = Thứ 2 (Monday)
2 = Thứ 3 (Tuesday)
3 = Thứ 4 (Wednesday)
4 = Thứ 5 (Thursday)
5 = Thứ 6 (Friday)
6 = Thứ 7 (Saturday)
```

---

## 📋 CHECKLIST

- [x] ✅ Sửa `TutorProfilePage.js` - đổi `"Chưa cập nhật"` thành `[]`
- [x] ✅ Sửa `BookingPage.js` - extract `response.tutor`
- [x] ✅ Test lại console log để xác nhận availability hiển thị
- [ ] 🔄 Kiểm tra các component khác sử dụng `availability`
- [ ] 🔄 Test booking flow với availability data

---

## 🧪 TESTING

### **1. Kiểm tra Console Log**
Mở DevTools Console và refresh trang tutor profile:

```javascript
// Bạn nên thấy:
📊 Tutor Data: {id: "xxx", name: "...", availability: Array(6), ...}
📅 Availability: [
  {dayOfWeek: 1, start: "08:00", end: "11:30"},
  {dayOfWeek: 1, start: "14:00", end: "17:00"},
  ...
]
```

### **2. Kiểm tra Booking Form**
- Click "Đặt lịch học"
- Calendar component nên hiển thị các slot available
- Không còn lỗi `undefined` khi chọn ngày

---

## 🔗 LUỒNG DỮ LIỆU

```
Backend (tutor.js route)
  ↓
  availability: tutor.availability || []
  ↓
  Response: { tutor: { ..., availability: [...] } }
  ↓
BookingService.getTutorProfile()
  ↓
  return res.data
  ↓
TutorProfilePage / BookingPage
  ✅ Extract: const data = response.tutor || response
  ✅ Access: data.availability  // [...]
```

---

## 📝 GHI CHÚ

- Nếu tutor chưa set availability, backend trả về `[]` (empty array)
- Frontend có fallback mock data trong `BookingPage.js` (dòng 52-59)
- `TutorProfilePage.js` cũng nên thêm fallback tương tự nếu cần

---

## 🚀 NEXT STEPS

1. Kiểm tra các file khác có sử dụng `getTutorProfile()`:
   ```bash
   grep -r "getTutorProfile" frontend/src/
   ```

2. Đảm bảo tất cả đều extract `response.tutor` đúng cách

3. Test end-to-end booking flow với availability

---

**Ngày fix:** November 12, 2025  
**Branch:** Tung-fixpayment-data  
**Files changed:**
- `frontend/src/pages/Tutor/TutorProfilePage.js`
- `frontend/src/pages/Booking/BookingPage.js`
