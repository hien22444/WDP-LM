# 🚫 Hệ Thống Ban User - Cấm Vĩnh Viễn

## ✅ ĐÃ TRIỂN KHAI

### 1. **Ban User Function** (`adminController.js`)

**Route:** `PUT /api/admin/users/:id/ban`

**Features:**
- ✅ Set status = "banned" (vĩnh viễn)
- ✅ Lưu lý do ban (`ban_reason`)
- ✅ Lưu thời gian ban (`banned_at`)
- ✅ Gửi email thông báo cho user
- ✅ Email template đẹp với nội dung rõ ràng
- ✅ Log console để tracking

**Request Body:**
```json
{
  "reason": "Vi phạm nghiêm trọng chính sách sử dụng"
}
```

**Response:**
```json
{
  "message": "User banned successfully",
  "user": {
    "status": "banned",
    "ban_reason": "Vi phạm nghiêm trọng chính sách sử dụng",
    "banned_at": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 2. **Ngăn chặn Login** (`authController.js`)

#### A. **Login thường** (Email/Password)
```javascript
if (user.status === "banned") {
  return res.status(403).json({ 
    message: "Tài khoản của bạn đã bị cấm vĩnh viễn. Vui lòng liên hệ admin để biết thêm chi tiết.",
    reason: user.ban_reason,
    status: "banned"
  });
}
```

#### B. **Google OAuth Login**
- ✅ Kiểm tra status trước khi cho login
- ✅ Không tự động activate banned user
- ✅ Return lỗi 403 với lý do cụ thể

---

### 3. **Ngăn chặn Unban** (`adminController.js`)

**Route bị bảo vệ:** `PUT /api/admin/users/:id/status`

```javascript
// Kiểm tra trước khi update status
if (currentUser.status === "banned") {
  return res.status(403).json({ 
    message: "Cannot change status of banned user. Banned status is permanent.",
    currentStatus: "banned"
  });
}
```

**Các status được phép:** `pending`, `active`, `blocked` (KHÔNG bao gồm `banned`)

---

## 🔒 BẢO MẬT

### **Banned User KHÔNG THỂ:**
1. ❌ Login qua email/password
2. ❌ Login qua Google OAuth
3. ❌ Được unban qua route `updateUserStatus`
4. ❌ Sử dụng bất kỳ API nào (middleware check status)

### **Admin CÓ THỂ:**
1. ✅ Ban user với lý do cụ thể
2. ✅ Xem thông tin user bị ban
3. ✅ Xem lý do và thời gian ban

### **Admin KHÔNG THỂ:**
1. ❌ Unban user qua route thông thường
2. ❌ Thay đổi status của banned user

---

## 📧 EMAIL THÔNG BÁO

### **Nội dung email gửi cho user bị ban:**
- 🚫 Tiêu đề: "Tài khoản EduMatch của bạn đã bị cấm vĩnh viễn"
- 📋 Thông tin:
  - Tên user
  - Lý do ban (từ admin)
  - Cảnh báo: Quyết định vĩnh viễn
  - Hướng dẫn: Liên hệ admin trong 7 ngày nếu có sai sót
- 🎨 Template đẹp với gradient màu xám đậm

---

## 🔄 SO SÁNH: BLOCK vs BAN

| Feature | **Block** (Tạm thời) | **Ban** (Vĩnh viễn) |
|---------|---------------------|---------------------|
| Status | `blocked` | `banned` |
| Có thể unblock? | ✅ Yes | ❌ No |
| Login được không? | ❌ No | ❌ No |
| Google OAuth? | ❌ No | ❌ No |
| Email thông báo | ✅ Yes | ✅ Yes |
| Màu email | 🔴 Red | ⚫ Dark Gray |
| Lưu lý do | `block_reason` | `ban_reason` |
| Lưu thời gian | `blocked_at` | `banned_at` |

---

## 🧪 CÁCH TEST

### **1. Test Ban User**
```bash
# Ban user (cần admin token)
curl -X PUT http://localhost:5000/api/admin/users/{userId}/ban \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Spam và gian lận"}'
```

### **2. Test Login Bị Chặn**
```bash
# Thử login với banned user
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "banned@example.com", "password": "password123"}'

# Expected response:
{
  "message": "Tài khoản của bạn đã bị cấm vĩnh viễn...",
  "reason": "Spam và gian lận",
  "status": "banned"
}
```

### **3. Test Ngăn Unban**
```bash
# Thử unban qua updateUserStatus (sẽ bị từ chối)
curl -X PUT http://localhost:5000/api/admin/users/{userId}/status \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{"status": "active"}'

# Expected response:
{
  "message": "Cannot change status of banned user. Banned status is permanent.",
  "currentStatus": "banned"
}
```

### **4. Test Google OAuth với Banned User**
```bash
# Thử login bằng Google với banned account
# Expected: 403 với message về tài khoản bị cấm
```

---

## 📝 LOGS

### **Khi ban user:**
```
✅ User banned@example.com banned by admin. Reason: Spam và gian lận
📧 Attempting to send email...
   To: banned@example.com
   Subject: 🚫 Tài khoản EduMatch của bạn đã bị cấm vĩnh viễn
✅ Email sent successfully!
```

### **Khi banned user cố login:**
```
❌ Login attempt by banned user: banned@example.com
   Reason: Spam và gian lận
   Banned at: 2024-01-15T10:30:00.000Z
```

---

## 🔧 CÀI ĐẶT ENVIRONMENT

Đảm bảo `.env` có:
```env
# Email config
MAIL_USERNAME=learnmate99@gmail.com
MAIL_PASSWORD=your_app_password_here
MAIL_FROM=noreply@edumatch.com

# Frontend URL (cho email links)
FRONTEND_URL=http://localhost:3000

# Admin email (để nhận thông báo)
ADMIN_EMAIL=admin@edumatch.com
```

---

## ✅ CHECKLIST HOÀN THÀNH

- [x] Fix nodemailer `createTransport` (không phải `createTransporter`)
- [x] Ban user function với email notification
- [x] Ngăn banned user login (email/password)
- [x] Ngăn banned user login (Google OAuth)
- [x] Ngăn unban qua updateUserStatus
- [x] Email template đẹp và rõ ràng
- [x] Logging đầy đủ
- [x] Error handling

---

## 🚀 CÁCH SỬ DỤNG

### **Ban một user:**
1. Vào Admin Panel
2. Tìm user cần ban
3. Click "Ban User"
4. Nhập lý do rõ ràng
5. Xác nhận → User bị ban vĩnh viễn + nhận email

### **User bị ban:**
- Không thể login bất kỳ cách nào
- Nhận email với lý do cụ thể
- Có thể liên hệ admin để appeal

---

**Created:** 2024-01-15
**Status:** ✅ Production Ready


