# 🎓 Hệ Thống Duyệt Đơn Gia Sư - Admin Panel

## ✅ ĐÃ HOÀN THIỆN

### 📋 TỔNG QUAN

Trang **Admin → Tutors** giờ đây chỉ hiển thị **đơn đăng ký làm gia sư** của những người đang có role **learner** (chờ duyệt CV), KHÔNG hiển thị những người đã là tutor rồi.

---

## 🔄 QUY TRÌNH DUYỆT ĐƠN

### **Trước khi sửa:**
1. User đăng ký làm gia sư → TutorProfile status = "pending"
2. Admin approve → TutorProfile status = "approved"
3. ❌ **LỖI:** User.role vẫn là "learner" (không tự động chuyển)
4. ❌ User không nhận email thông báo

### **Sau khi sửa:**
1. User đăng ký làm gia sư → TutorProfile status = "pending"
2. Admin approve → TutorProfile status = "approved"
3. ✅ **TỰ ĐỘNG:** User.role thay đổi từ "learner" → "tutor"
4. ✅ **GỬI EMAIL:** User nhận email thông báo đơn được duyệt
5. ✅ User biến mất khỏi trang Admin Tutors (vì đã là tutor)

---

## 🎯 TÍNH NĂNG MỚI

### 1. **Filter theo Role** ✅

**API Endpoint:** `GET /api/admin/tutors`

**Query Parameters:**
```javascript
{
  role: "learner" | "tutor" | "all",  // Mặc định: "learner"
  status: "pending" | "approved" | "rejected",
  search: "tìm kiếm...",
  page: 1,
  limit: 10
}
```

**Ví dụ:**
```bash
# Xem đơn CHỜ DUYỆT (mặc định) - chỉ learner
GET /api/admin/tutors
# hoặc
GET /api/admin/tutors?role=learner

# Xem đơn ĐÃ DUYỆT - chỉ tutor
GET /api/admin/tutors?role=tutor

# Xem TẤT CẢ
GET /api/admin/tutors?role=all
```

---

### 2. **Tự động Chuyển Role khi Approve** ✅

**API Endpoint:** `PUT /api/admin/tutors/:id/status`

**Request Body:**
```json
{
  "status": "approved"
}
```

**Điều gì xảy ra:**
1. ✅ TutorProfile.status = "approved"
2. ✅ User.role: "learner" → "tutor"
3. ✅ Gửi email thông báo đến user:
   - 🎉 Tiêu đề: "Đơn đăng ký gia sư đã được duyệt"
   - Nội dung: Chúc mừng, hướng dẫn bước tiếp theo
   - Button: Link đến profile
4. ✅ Log console để tracking
5. ✅ User biến mất khỏi danh sách "Đơn chờ duyệt"

---

### 3. **Email Thông Báo khi Reject** ✅

**Request Body:**
```json
{
  "status": "rejected",
  "rejectionReason": "Hồ sơ chưa đầy đủ, vui lòng bổ sung bằng cấp"
}
```

**Điều gì xảy ra:**
1. ✅ TutorProfile.status = "rejected"
2. ✅ User.role vẫn là "learner" (không thay đổi)
3. ✅ Gửi email thông báo đến user:
   - ❌ Tiêu đề: "Đơn đăng ký gia sư chưa được duyệt"
   - Nội dung: Lý do reject, hướng dẫn cập nhật lại
   - Button: Link đến profile để cập nhật

---

## 📧 EMAIL TEMPLATES

### **Email Approve (Màu xanh lá)**
```
🎉 Chúc mừng! Đơn đăng ký gia sư đã được duyệt

Xin chào [Tên User],

Đơn đăng ký làm gia sư của bạn trên EduMatch đã được phê duyệt!

✅ Trạng thái:
Đã duyệt - Bạn giờ là gia sư chính thức của EduMatch

🚀 Bước tiếp theo:
- Hoàn thiện hồ sơ gia sư của bạn
- Cập nhật lịch rảnh để học viên có thể đặt lịch
- Bắt đầu nhận đơn đặt lịch từ học viên

[Button: Xem hồ sơ gia sư của tôi]
```

### **Email Reject (Màu đỏ)**
```
❌ Đơn đăng ký gia sư chưa được duyệt

Xin chào [Tên User],

Rất tiếc, đơn đăng ký làm gia sư của bạn chưa được phê duyệt.

Lý do: [Rejection Reason từ admin]

💡 Bạn có thể:
- Cập nhật lại thông tin hồ sơ
- Gửi lại đơn đăng ký với đầy đủ thông tin hơn
- Liên hệ với đội ngũ hỗ trợ để được tư vấn

[Button: Cập nhật hồ sơ]
```

---

## 🔍 CÁCH SỬ DỤNG TRÊN FRONTEND

### **Tab "Đơn Chờ Duyệt" (Mặc định)**
```javascript
// API call
fetch('/api/admin/tutors?role=learner&status=pending')
  .then(res => res.json())
  .then(data => {
    // data.tutors = chỉ những người role=learner
    // data.filter.role = "learner"
  });
```

### **Tab "Đơn Đã Duyệt"**
```javascript
// API call
fetch('/api/admin/tutors?role=tutor&status=approved')
  .then(res => res.json())
  .then(data => {
    // data.tutors = chỉ những người role=tutor
    // data.filter.role = "tutor"
  });
```

### **Approve một đơn**
```javascript
// API call
fetch(`/api/admin/tutors/${tutorId}/status`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({ status: 'approved' })
})
.then(res => res.json())
.then(data => {
  // User role đã tự động chuyển sang "tutor"
  // Email đã được gửi
  // Refresh danh sách → đơn này biến mất khỏi "Chờ duyệt"
});
```

### **Reject một đơn**
```javascript
// API call
fetch(`/api/admin/tutors/${tutorId}/status`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({ 
    status: 'rejected',
    rejectionReason: 'Hồ sơ chưa đầy đủ'
  })
})
.then(res => res.json())
.then(data => {
  // User vẫn là "learner"
  // Email reject đã được gửi
  // Đơn vẫn hiển thị nhưng status = "rejected"
});
```

---

## 🎨 GỢI Ý UI/UX CHO FRONTEND

### **Thêm Tabs trên trang Admin Tutors:**

```jsx
<Tabs>
  <Tab label="Đơn Chờ Duyệt" value="learner">
    {/* Default - chỉ hiển thị learner */}
    {/* Số lượng: badge với count */}
  </Tab>
  
  <Tab label="Đơn Đã Duyệt" value="tutor">
    {/* Chỉ hiển thị người đã là tutor */}
    {/* Để xem lại lịch sử */}
  </Tab>
  
  <Tab label="Tất Cả" value="all">
    {/* Hiển thị cả learner và tutor */}
  </Tab>
</Tabs>
```

### **Nút Actions cho mỗi đơn:**

```jsx
{tutor.user.role === 'learner' && tutor.status === 'pending' && (
  <>
    <Button onClick={() => approveTutor(tutor._id)} color="success">
      ✅ Duyệt
    </Button>
    <Button onClick={() => openRejectDialog(tutor._id)} color="error">
      ❌ Từ chối
    </Button>
  </>
)}

{tutor.user.role === 'tutor' && (
  <Badge color="success">Đã duyệt</Badge>
)}
```

---

## 📊 RESPONSE FORMAT

### **GET /api/admin/tutors**
```json
{
  "tutors": [
    {
      "_id": "tutor123",
      "status": "pending",
      "bio": "...",
      "user": {
        "_id": "user123",
        "full_name": "Nguyễn Văn A",
        "email": "vana@example.com",
        "role": "learner",     // ← Quan trọng!
        "status": "active"
      }
    }
  ],
  "pagination": {
    "current": 1,
    "pages": 5,
    "total": 50
  },
  "filter": {
    "role": "learner"    // ← Biết đang filter gì
  }
}
```

---

## 🧪 CÁCH TEST

### **Test 1: Xem Đơn Chờ Duyệt**
```bash
GET /api/admin/tutors
# hoặc
GET /api/admin/tutors?role=learner

# Expected: Chỉ thấy người có role=learner
```

### **Test 2: Approve Đơn**
```bash
PUT /api/admin/tutors/{tutorId}/status
Body: { "status": "approved" }

# Kiểm tra:
# 1. TutorProfile.status = "approved" ✅
# 2. User.role = "tutor" ✅
# 3. User nhận email ✅
# 4. Console log hiển thị ✅
# 5. GET /api/admin/tutors → đơn này không còn nữa ✅
```

### **Test 3: Xem Đơn Đã Duyệt**
```bash
GET /api/admin/tutors?role=tutor

# Expected: Thấy người vừa approve ở test 2
```

### **Test 4: Reject Đơn**
```bash
PUT /api/admin/tutors/{tutorId}/status
Body: { 
  "status": "rejected",
  "rejectionReason": "Hồ sơ chưa đủ"
}

# Kiểm tra:
# 1. TutorProfile.status = "rejected" ✅
# 2. User.role vẫn là "learner" ✅
# 3. User nhận email với lý do ✅
# 4. GET /api/admin/tutors → đơn vẫn hiển thị nhưng status=rejected ✅
```

---

## 📝 LOGS

### **Khi approve:**
```
✅ User vana@example.com role changed from learner to tutor
📧 Attempting to send email...
   To: vana@example.com
   Subject: 🎉 Đơn đăng ký gia sư đã được duyệt - EduMatch
✅ Email sent successfully!
```

### **Khi reject:**
```
📧 Attempting to send email...
   To: vana@example.com
   Subject: ❌ Đơn đăng ký gia sư chưa được duyệt - EduMatch
✅ Email sent successfully!
```

---

## 🔐 PERMISSIONS

- **Chỉ Admin** mới có thể:
  - Xem danh sách đơn đăng ký
  - Approve/Reject đơn
  - Filter theo role

- **Middleware:** `authenticateToken` + `requireAdmin`

---

## 📋 CHECKLIST

- [x] Filter getTutors theo role
- [x] Mặc định chỉ hiển thị learner
- [x] Thêm query parameter `role`
- [x] Tự động chuyển role khi approve
- [x] Gửi email khi approve (template xanh)
- [x] Gửi email khi reject (template đỏ)
- [x] Populate user.role trong getTutors
- [x] Populate user.role trong getTutorById
- [x] Log console đầy đủ
- [x] Không có lỗi linter

---

## 🚀 TRIỂN KHAI

1. **Backend đã sẵn sàng** - Restart server:
```bash
cd WDP-LM/backend
npm start
```

2. **Test với Postman** hoặc cURL

3. **Update Frontend:**
   - Thêm tabs "Chờ Duyệt" / "Đã Duyệt"
   - Thêm rejection reason input
   - Xử lý response mới với `filter.role`
   - Refresh danh sách sau approve/reject

---

## 💡 LỢI ÍCH

### **Cho Admin:**
- ✅ Dễ quản lý đơn chờ duyệt (chỉ thấy learner)
- ✅ Xem lại lịch sử đơn đã duyệt (tab riêng)
- ✅ Tự động hóa process approve
- ✅ Không cần manually thay đổi role

### **Cho User:**
- ✅ Nhận email ngay khi đơn được duyệt/reject
- ✅ Biết rõ lý do reject
- ✅ Hướng dẫn bước tiếp theo
- ✅ Link trực tiếp đến profile

### **Cho Hệ thống:**
- ✅ Data consistency (role và status luôn đồng bộ)
- ✅ Clear separation (learner vs tutor)
- ✅ Audit trail (logs đầy đủ)
- ✅ Email notification tự động

---

**Created:** 2024-01-15  
**Status:** ✅ Production Ready  
**Backend:** ✅ Complete  
**Frontend:** 🔧 Cần update UI


