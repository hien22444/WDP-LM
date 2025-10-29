# 📋 TÓM TẮT: Trang Admin Tutors - Filter theo Role

## ✅ NHỮNG GÌ ĐÃ SỬA

### 1. **Filter Đơn Theo Role**
- **Mặc định:** Chỉ hiển thị đơn của người có role = **"learner"** (đơn chờ duyệt CV)
- **Tab "Đã duyệt":** Hiển thị người có role = **"tutor"** (đã được duyệt)
- **Tùy chọn:** Xem tất cả với `?role=all`

### 2. **Tự Động Chuyển Role khi Approve**
- Admin approve đơn → User.role tự động: **"learner" → "tutor"**
- ✅ User nhận email thông báo đơn được duyệt
- ✅ User biến mất khỏi tab "Chờ duyệt"
- ✅ User xuất hiện trong tab "Đã duyệt"

### 3. **Email Thông Báo**
- **Approve:** Email màu xanh 🎉 "Chúc mừng! Đơn đã được duyệt"
- **Reject:** Email màu đỏ ❌ "Đơn chưa được duyệt" + lý do

---

## 🎯 API CHANGES

### **GET /api/admin/tutors**
```javascript
// Đơn CHỜ DUYỆT (mặc định)
?role=learner

// Đơn ĐÃ DUYỆT
?role=tutor

// TẤT CẢ
?role=all
```

### **PUT /api/admin/tutors/:id/status**
```json
// Approve
{ "status": "approved" }

// Reject với lý do
{ 
  "status": "rejected",
  "rejectionReason": "Hồ sơ chưa đầy đủ"
}
```

---

## 🎨 FRONTEND CẦN UPDATE

### **Thêm Tabs:**
```jsx
<Tabs>
  <Tab label="Đơn Chờ Duyệt (10)" />   {/* ?role=learner */}
  <Tab label="Đơn Đã Duyệt (25)" />    {/* ?role=tutor */}
  <Tab label="Tất Cả (35)" />          {/* ?role=all */}
</Tabs>
```

### **Reject Dialog:**
```jsx
<Dialog>
  <TextField 
    label="Lý do từ chối"
    name="rejectionReason"
    multiline
    required
  />
  <Button onClick={handleReject}>Từ chối</Button>
</Dialog>
```

---

## 🧪 TEST NHANH

```bash
# 1. Xem đơn chờ duyệt (chỉ learner)
GET /api/admin/tutors

# 2. Approve một đơn
PUT /api/admin/tutors/{id}/status
Body: { "status": "approved" }

# 3. Check lại → đơn đó không còn nữa
GET /api/admin/tutors

# 4. Xem đơn đã duyệt → thấy đơn vừa approve
GET /api/admin/tutors?role=tutor
```

---

## 📧 MAIL CONFIG

Đảm bảo `.env` có:
```env
MAIL_USERNAME=learnmate99@gmail.com
MAIL_PASSWORD=your_app_password
FRONTEND_URL=http://localhost:3000
```

---

## ✅ DONE!

Backend đã sẵn sàng. Frontend chỉ cần:
1. Thêm tabs cho role filter
2. Thêm rejection reason input
3. Handle API response mới

**Chi tiết đầy đủ:** Xem file `ADMIN_TUTOR_APPROVAL_SYSTEM.md`


