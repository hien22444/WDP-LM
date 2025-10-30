# 🧪 HƯỚNG DẪN TEST TÍNH NĂNG LỊCH TRỐNG

## ✅ Đã triển khai

1. **Backend API**: `GET /api/v1/tutors/:id/availability`
2. **Frontend UI**: Tab "Lịch dạy" trên trang tutor profile
3. **Chức năng**: 
   - Hiển thị slots trống (màu xanh)
   - Hiển thị slots đã bận (màu đỏ)
   - Click để đặt lịch

---

## 🚀 CÁCH TEST

### Bước 1: Khởi động Backend

```bash
cd backend
npm start
```

Kiểm tra backend đang chạy: http://localhost:5000

### Bước 2: Khởi động Frontend

```bash
cd frontend
npm start
```

Mở trình duyệt: http://localhost:3000

### Bước 3: Test trên UI

1. Đăng nhập với tài khoản học viên
2. Tìm kiếm một gia sư
3. Click vào hồ sơ gia sư
4. Click tab **"Lịch dạy"**
5. Kiểm tra:
   - ✅ Loading spinner khi đang tải
   - ✅ Hiển thị các slots trống (nền xanh)
   - ✅ Hiển thị các slots đã bận (nền đỏ)
   - ✅ Click nút "Chọn slot này" → Mở form đặt lịch

### Bước 4: Test API trực tiếp

Chạy test script:

```bash
cd backend
node ../test-availability.js
```

Hoặc test bằng curl:

```bash
# Lấy danh sách tutors
curl http://localhost:5000/api/v1/tutors

# Lấy availability của một tutor (thay YOUR_TUTOR_ID)
curl http://localhost:5000/api/v1/tutors/YOUR_TUTOR_ID/availability
```

---

## 📋 KẾT QUẢ MONG ĐỢI

### API Response:

```json
{
  "availability": {
    "weekly": [
      { "dayOfWeek": 1, "start": "18:00", "end": "20:00" }
    ],
    "slots": [
      {
        "date": "2024-01-15T18:00:00.000Z",
        "start": "18:00",
        "end": "20:00",
        "available": true
      }
    ],
    "booked": []
  }
}
```

### UI Display:

- **Cards màu xanh**: Slots trống → Có nút "Chọn slot này"
- **Cards màu đỏ**: Slots đã bận → Không có nút

---

## ⚠️ LƯU Ý

1. **Database**: Đảm bảo database `test` trên MongoDB Atlas có data
2. **Tutor Availability**: Gia sư cần cập nhật `availability` trong profile
3. **Bookings**: Các booking đã accepted/completed sẽ hiển thị là "bận"

---

## 🐛 TROUBLESHOOTING

### Backend không chạy:
```bash
cd backend
npm install
npm start
```

### Frontend không hiển thị slots:
- Kiểm tra browser console (F12)
- Kiểm tra network tab xem API call thành công chưa
- Kiểm tra data tutor có `availability` không

### Không có slots trống:
- Gia sư chưa cập nhật `availability`
- Tất cả slots đã được booking

---

## 📞 SUPPORT

Nếu gặp lỗi, kiểm tra:
1. Backend logs
2. Browser console
3. Network tab
4. Database có data không
