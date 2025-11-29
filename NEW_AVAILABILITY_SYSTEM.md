# 🆕 HỆ THỐNG LỊCH RẢNH MỚI - ĐƠN GIẢN HÓA

> Cập nhật: 11/11/2025
> Thay đổi: Từ lưới phức tạp → Chọn theo buổi đơn giản

---

## 📋 THAY ĐỔI CHÍNH

### ❌ CŨ: Lưới 30 phút (Phức tạp)

```
┌─────────┬────┬────┬────┬────┬────┬────┬────┐
│         │ T2 │ T3 │ T4 │ T5 │ T6 │ T7 │ CN │
├─────────┼────┼────┼────┼────┼────┼────┼────┤
│ 06:00   │ □  │ □  │ □  │ □  │ □  │ □  │ □  │
│ 06:30   │ □  │ □  │ □  │ □  │ □  │ □  │ □  │
│ 07:00   │ □  │ □  │ □  │ □  │ □  │ □  │ □  │
│ ...     │    │    │    │    │    │    │    │
│ 18:00   │ ■  │ □  │ ■  │ □  │ ■  │ □  │ □  │ ← Chọn từng ô
│ ...     │    │    │    │    │    │    │    │
└─────────┴────┴────┴────┴────┴────┴────┴────┘
```

**Vấn đề:**
- Quá nhiều ô (7 ngày × 32 ô = 224 ô)
- Khó sử dụng trên mobile
- Learner không biết chọn giờ cụ thể nào

---

### ✅ MỚI: Chọn theo buổi (Đơn giản)

```
┌────────────┬─────────────────┬─────────────────┐
│    Ngày    │  Buổi sáng      │  Buổi chiều     │
│            │  (7:00-11:30)   │  (13:00-16:30)  │
├────────────┼─────────────────┼─────────────────┤
│ Thứ 2      │  [✓ Có thể dạy] │  [ Không rảnh ] │
│ Thứ 3      │  [ Không rảnh ] │  [✓ Có thể dạy] │
│ Thứ 4      │  [✓ Có thể dạy] │  [ Không rảnh ] │
│ ...        │                 │                 │
└────────────┴─────────────────┴─────────────────┘
```

**Ưu điểm:**
- Chỉ 7 ngày × 2 buổi = 14 ô (giảm 94%)
- Dễ sử dụng trên mọi thiết bị
- Rõ ràng: Gia sư chọn BUỔI, Learner chọn GIỜ CỤ THỂ

---

## 🎯 NGUYÊN TẮC MỚI

### 1. Gia sư chọn BUỔI rảnh

**Buổi sáng:** 7:00 - 11:30 (4.5 giờ)
**Buổi chiều:** 13:00 - 16:30 (3.5 giờ)

**Ví dụ:**
```
Gia sư A chọn:
- Thứ 2: Buổi sáng
- Thứ 4: Buổi sáng
- Thứ 6: Buổi chiều
```

### 2. Learner chọn GIỜ CỤ THỂ

Learner chọn giờ **TRONG KHUNG GIỜ** mà gia sư rảnh:

**Quy tắc:**
- Tối thiểu: **2 giờ**
- Phải nằm trong khung giờ buổi sáng/chiều

**Ví dụ learner book:**

✅ **Hợp lệ:**
- Thứ 2, 7:00-9:00 (2h, trong buổi sáng 7:00-11:30)
- Thứ 2, 8:00-10:30 (2.5h, trong buổi sáng)
- Thứ 6, 13:00-15:00 (2h, trong buổi chiều)
- Thứ 6, 14:00-16:30 (2.5h, trong buổi chiều)

❌ **Không hợp lệ:**
- Thứ 2, 7:00-8:30 (chỉ 1.5h, < 2h tối thiểu)
- Thứ 2, 6:00-8:00 (nằm ngoài khung 7:00-11:30)
- Thứ 6, 12:00-14:00 (nằm ngoài khung 13:00-16:30)

---

## 🔧 THAY ĐỔI KỸ THUẬT

### Frontend

**File mới:**
```
frontend/src/pages/Tutor/SimpleAvailabilitySelector.js
frontend/src/pages/Tutor/SimpleAvailabilitySelector.scss
```

**Component cũ (KHÔNG XÓA, giữ backup):**
```
frontend/src/pages/Tutor/AvailabilityGrid.js
frontend/src/pages/Tutor/DayTimeBlocks.js
```

**File cập nhật:**
```
frontend/src/pages/Tutor/TutorProfileUpdatePage.js
- Line 13: Import SimpleAvailabilitySelector
- Line 682-720: Thay thế UI cũ bằng SimpleAvailabilitySelector
```

### Backend

**KHÔNG CẦN THAY ĐỔI!**

Lý do: Backend đã hỗ trợ format availability linh hoạt:
```javascript
{
  dayOfWeek: 1,     // Thứ 2
  start: "07:00",   // Buổi sáng
  end: "11:30"
}
```

API validation (src/routes/tutor.js line 799-880) vẫn hoạt động bình thường.

---

## 📊 DATA STRUCTURE

### Availability Format (KHÔNG ĐỔI)

```javascript
[
  {
    dayOfWeek: 1,       // 0=CN, 1=T2, ..., 6=T7
    start: "07:00",     // HH:mm
    end: "11:30"        // HH:mm
  },
  {
    dayOfWeek: 1,
    start: "13:00",
    end: "16:30"
  },
  {
    dayOfWeek: 3,
    start: "07:00",
    end: "11:30"
  }
]
```

### Mapping Table

| Buổi | Start | End | Duration |
|------|-------|-----|----------|
| Sáng | 07:00 | 11:30 | 4.5h |
| Chiều | 13:00 | 16:30 | 3.5h |

---

## 🎨 GIAO DIỆN MỚI

### Desktop View

```
╔═══════════════════════════════════════════════════╗
║  🗓️ Lịch rảnh của bạn                            ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║  [Sáng 7:00-11:30] [Chiều 13:00-16:30]          ║
║  ⏱️ Học viên sẽ chọn giờ cụ thể (tối thiểu 2h)   ║
║                                                   ║
║  [Sáng T2-T6] [Chiều T2-T6] [Tất cả sáng]       ║
║  [Tất cả chiều] [❌ Xóa tất cả]                  ║
║                                                   ║
║  ┌────────────┬─────────────────┬────────────────┐ ║
║  │    Ngày    │  Sáng (7-11:30) │ Chiều (1-4:30) │ ║
║  ├────────────┼─────────────────┼────────────────┤ ║
║  │ Thứ 2      │  [✓ Có thể dạy] │  [ Không rảnh ]│ ║
║  │ Thứ 3      │  [ Không rảnh ] │  [✓ Có thể dạy]│ ║
║  │ Thứ 4      │  [✓ Có thể dạy] │  [ Không rảnh ]│ ║
║  │ ...        │                 │                │ ║
║  └────────────┴─────────────────┴────────────────┘ ║
║                                                   ║
║  📅 Tóm tắt lịch rảnh:                           ║
║  • Thứ 2: Sáng (7:00-11:30)                      ║
║  • Thứ 3: Chiều (13:00-16:30)                    ║
║  • Thứ 4: Sáng (7:00-11:30)                      ║
║                                                   ║
║  💡 Lưu ý: Học viên sẽ chọn giờ cụ thể           ║
║  📌 Ví dụ: Thứ 2 Sáng → 7:00-9:00, 8:00-10:00... ║
║                                                   ║
║            [💾 Lưu lịch rảnh]                     ║
╚═══════════════════════════════════════════════════╝
```

### Mobile View

```
┌───────────────────────────┐
│ 🗓️ Lịch rảnh của bạn     │
├───────────────────────────┤
│ [Sáng 7-11:30]           │
│ [Chiều 1-4:30]            │
│                           │
│ [Sáng T2-T6]             │
│ [Chiều T2-T6]             │
│ [❌ Xóa tất cả]          │
├───────────────────────────┤
│ Thứ 2                     │
│ [✓ Sáng] [ Chiều ]       │
│                           │
│ Thứ 3                     │
│ [ Sáng ] [✓ Chiều]       │
│                           │
│ Thứ 4                     │
│ [✓ Sáng] [ Chiều ]       │
├───────────────────────────┤
│ 📅 Tóm tắt:               │
│ • T2: Sáng                │
│ • T3: Chiều               │
│ • T4: Sáng                │
├───────────────────────────┤
│    [💾 Lưu lịch rảnh]     │
└───────────────────────────┘
```

---

## 🔄 LUỒNG SỬ DỤNG

### 1. Gia sư cập nhật lịch

```
1. Vào /tutor/profile-update
2. Cuộn đến "🗓️ Lịch rảnh của bạn"
3. Click vào các ô:
   - Thứ 2 → Buổi sáng ✓
   - Thứ 4 → Buổi sáng ✓
   - Thứ 6 → Buổi chiều ✓
4. Xem tóm tắt
5. Click "💾 Lưu lịch rảnh"
```

**API Call:**
```javascript
PUT /api/tutors/me/availability
{
  "availability": [
    { "dayOfWeek": 1, "start": "07:00", "end": "11:30" },
    { "dayOfWeek": 3, "start": "07:00", "end": "11:30" },
    { "dayOfWeek": 5, "start": "13:00", "end": "16:30" }
  ]
}
```

### 2. Learner xem lịch rảnh

**API:** `GET /api/tutors/:id/availability`

**Response:**
```json
{
  "availability": {
    "weekly": [
      { "dayOfWeek": 1, "start": "07:00", "end": "11:30" },
      { "dayOfWeek": 3, "start": "07:00", "end": "11:30" },
      { "dayOfWeek": 5, "start": "13:00", "end": "16:30" }
    ],
    "slots": [
      {
        "date": "2025-11-11T07:00:00.000Z",
        "start": "07:00",
        "end": "11:30",
        "available": true
      },
      {
        "date": "2025-11-13T07:00:00.000Z",
        "start": "07:00",
        "end": "11:30",
        "available": false
      }
    ]
  }
}
```

### 3. Learner book lịch

**Ví dụ:** Learner muốn book Thứ 2, 8:00-10:00

**Validation:**
```javascript
// Check 1: Thứ 2 có buổi sáng không?
const hasMorning = availability.some(
  slot => slot.dayOfWeek === 1 &&
          slot.start === "07:00" &&
          slot.end === "11:30"
);
// ✅ Có

// Check 2: 8:00-10:00 nằm trong 7:00-11:30?
const isWithinRange = 
  "08:00" >= "07:00" && "10:00" <= "11:30";
// ✅ Có

// Check 3: Đủ 2h?
const duration = (10 - 8) = 2h;
// ✅ Đủ

// Check 4: Trùng booking khác không?
const existingBooking = await Booking.findOne({
  start: { $lt: "10:00" },
  end: { $gt: "08:00" }
});
// ✅ Không trùng

→ BOOK THÀNH CÔNG
```

---

## ✅ CHECKLIST HOÀN THÀNH

### Frontend

- [x] Tạo SimpleAvailabilitySelector component
- [x] Tạo SimpleAvailabilitySelector.scss
- [x] Update TutorProfileUpdatePage import
- [x] Thay thế UI cũ bằng component mới
- [x] Test responsive (desktop + mobile)
- [ ] Test integration với API
- [ ] Test load default availability
- [ ] Test save availability

### Backend (Không cần thay đổi)

- [x] API PUT /api/tutors/me/availability - Sẵn sàng
- [x] API GET /api/tutors/:id/availability - Sẵn sàng
- [x] Validation availability - Sẵn sàng
- [x] Check booking conflict - Sẵn sàng

### Testing

- [ ] Gia sư tạo lịch rảnh mới
- [ ] Gia sư update lịch rảnh cũ
- [ ] Learner xem lịch rảnh
- [ ] Learner book trong khung giờ hợp lệ
- [ ] Learner book ngoài khung giờ → Reject
- [ ] Learner book < 2h → Reject
- [ ] Learner book trùng lịch → Reject

---

## 📌 LƯU Ý QUAN TRỌNG

### 1. Migration Data

**Lịch cũ vẫn hoạt động!**

Nếu gia sư đã có lịch từ hệ thống cũ (ví dụ: 18:00-20:00), component mới sẽ:
- Không hiển thị (vì không match buổi sáng/chiều)
- Cần gia sư cập nhật lại

**Giải pháp:** Thông báo cho gia sư:
```
⚠️ Lịch rảnh của bạn cần cập nhật theo hệ thống mới.
Vui lòng chọn lại các buổi sáng (7:00-11:30) hoặc 
buổi chiều (13:00-16:30) mà bạn có thể dạy.
```

### 2. Learner UI (TODO)

**Hiện tại:** Learner KHÔNG CÓ UI xem lịch rảnh

**Cần làm:**
1. Tạo component AvailabilityCalendar cho learner
2. Hiển thị:
   ```
   Thứ 2: 🟢 Sáng 7:00-11:30
   Thứ 4: 🟢 Sáng 7:00-11:30
   Thứ 6: 🟢 Chiều 13:00-16:30
   ```
3. Click vào → Show booking form với time picker
   ```
   Buổi sáng 7:00-11:30
   Chọn giờ: [08:00▼] đến [10:00▼]
   (Tối thiểu 2 giờ)
   ```

### 3. Flexibility

**Learner có thể chọn:**
- 7:00-9:00 (2h)
- 7:30-9:30 (2h)
- 8:00-10:30 (2.5h)
- 9:00-11:30 (2.5h)
- Bất kỳ khoảng nào ≥ 2h trong 7:00-11:30

**Validation backend sẽ check:**
```javascript
// Phải nằm trong khung giờ availability
start >= availability.start  // 08:00 >= 07:00 ✓
end <= availability.end       // 10:00 <= 11:30 ✓
duration >= 2h                // 10:00-08:00 = 2h ✓
```

---

## 🎯 KẾT LUẬN

### Ưu điểm hệ thống mới:

1. **Đơn giản hơn 94%** (224 ô → 14 ô)
2. **Rõ ràng hơn** (Gia sư chọn BUỔI, Learner chọn GIỜ)
3. **Mobile-friendly** (Không cần scroll ngang)
4. **Linh hoạt hơn** (Learner tự chọn giờ trong khung)
5. **Dễ maintain** (Code đơn giản, ít bug)

### Roadmap tiếp theo:

- [ ] Implement AvailabilityCalendar cho learner
- [ ] Add time picker cho booking form
- [ ] Add notification "Lịch rảnh cần update"
- [ ] Test end-to-end flow
- [ ] Deploy production

---

**📅 Ngày hoàn thành:** 11/11/2025
**🎯 Status:** Frontend DONE, Backend READY, Testing PENDING
