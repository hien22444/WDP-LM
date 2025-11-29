# Backend Scripts

Thư mục chứa các scripts tiện ích để quản lý database và testing.

## 📋 Danh sách Scripts

### 1. `resetDatabase.js`
**Mục đích:** Reset database về trạng thái ban đầu, xóa tất cả data và tạo 1 admin mới.

**Cách dùng:**
```bash
node scripts/resetDatabase.js
```

**Kết quả:**
- Xóa hết data trong tất cả collections
- Tạo 1 admin với thông tin:
  - Email: `admin@edumatch.com`
  - Password: `Admin@123`
  - Role: `admin`

---

### 2. `seedTestData.js`
**Mục đích:** Seed data test vào database.

**Cách dùng:**
```bash
node scripts/seedTestData.js
```

**Kết quả:**
- Tạo users mẫu (learners, tutors)
- Tạo tutor profiles
- Tạo teaching slots
- Tạo bookings (nếu có)

---

### 3. `checkDataConsistency.js`
**Mục đích:** Kiểm tra tính nhất quán dữ liệu giữa các bảng.

**Cách dùng:**
```bash
node scripts/checkDataConsistency.js
```

**Kiểm tra:**
- Users ↔ TutorProfiles
- TutorProfiles ↔ TeachingSlots
- Payments ↔ Bookings
- TeachingSlots ↔ Bookings
- Users ↔ Bookings

**Kết quả:**
- Liệt kê các vấn đề về data (orphaned records, missing refs, inconsistent status)
- Đưa ra khuyến nghị fix

---

### 4. `testCleanupRejectedProfiles.js`
**Mục đích:** Test cron job tự động xóa tutor profiles bị reject sau 30 ngày.

**Cách dùng:**
```bash
node scripts/testCleanupRejectedProfiles.js
```

**Kết quả:**
- Hiển thị profiles sẽ bị xóa
- KHÔNG thực sự xóa (cần uncomment code để xóa)
- Dùng để test logic trước khi chạy cron job thực tế

---

## ⚙️ Lưu ý

### Kết nối Database
Tất cả scripts đều sử dụng `URI_DB` từ file `.env`:
```env
URI_DB=mongodb://localhost:27017/edumatch
```

### Cron Jobs
Các cron jobs tự động chạy được quản lý trong `src/services/CronService.js` và khởi động từ `server.js`.

Để enable cron jobs, set trong `.env`:
```env
CRON_ENABLED=true
```

**Các jobs hiện có:**
- **autoReleaseEscrow** - Mỗi giờ
- **updateBookingStatuses** - Mỗi 15 phút
- **sendBookingReminders** - Mỗi 15 phút
- **cleanupOldBookings** - Mỗi ngày
- **cleanupRejectedProfiles** - Mỗi ngày (xóa profiles rejected >30 ngày)

---

## 🔧 Workflow Khuyến Nghị

### Khi bắt đầu development:
```bash
# 1. Reset database
node scripts/resetDatabase.js

# 2. Seed test data
node scripts/seedTestData.js

# 3. Kiểm tra consistency
node scripts/checkDataConsistency.js
```

### Khi gặp lỗi data:
```bash
# Kiểm tra consistency trước
node scripts/checkDataConsistency.js

# Fix theo khuyến nghị
# Hoặc reset lại từ đầu
node scripts/resetDatabase.js
```

### Trước khi deploy production:
```bash
# Kiểm tra data consistency
node scripts/checkDataConsistency.js

# Nếu có vấn đề, fix trước khi deploy
```
