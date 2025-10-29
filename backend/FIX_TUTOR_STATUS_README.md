# 🔧 Scripts Sửa Dữ Liệu Tutor Status

## ❗ VẤN ĐỀ

Khi test, có người đã:
1. Nộp đơn làm gia sư → `tutor_profile.status = "pending"`
2. Vào MongoDB Compass chỉnh tay: `user.role = "tutor"`
3. **Quên không update** `tutor_profile.status = "approved"`

→ Dẫn đến **mất đồng bộ** giữa `users.role` và `tutor_profiles.status`

---

## ✅ GIẢI PHÁP: 2 SCRIPTS

### **Script 1: `fix-tutor-status.js`** (Khuyên dùng)
**Mục đích:** Đồng bộ lại status dựa trên role hiện tại

**Logic:**
- Nếu `user.role = "learner"` → `tutor_profile.status = "pending"` (chờ duyệt)
- Nếu `user.role = "tutor"` → `tutor_profile.status = "approved"` (đã duyệt)
- Giữ nguyên những cái đã đúng

**Khi nào dùng:**
- ✅ Khi muốn giữ nguyên users đã là tutor
- ✅ Chỉ fix những cái sai
- ✅ An toàn, không làm mất dữ liệu

---

### **Script 2: `reset-all-to-pending.js`** (Cẩn thận!)
**Mục đích:** Reset TẤT CẢ về trạng thái chờ duyệt

**Logic:**
- TẤT CẢ `user.role` (trừ admin) → `"learner"`
- TẤT CẢ `tutor_profile.status` → `"pending"`

**Khi nào dùng:**
- ⚠️  Muốn test lại từ đầu
- ⚠️  Reset toàn bộ dữ liệu về ban đầu
- ⚠️  **CHỈ DÙNG TRÊN DEV/TEST**, không dùng trên PRODUCTION!

---

## 🚀 CÁCH CHẠY

### **Bước 1: Backup Database (Quan trọng!)**

```bash
# Backup toàn bộ database
mongodump --uri="mongodb://localhost:27017/edumatch" --out=./backup_$(date +%Y%m%d_%H%M%S)

# Hoặc chỉ backup 2 collections
mongodump --uri="mongodb://localhost:27017/edumatch" --collection=users --out=./backup
mongodump --uri="mongodb://localhost:27017/edumatch" --collection=tutor_profiles --out=./backup
```

---

### **Bước 2: Chạy Script**

#### **Option A: Fix Tutor Status (Khuyên dùng)**

```bash
cd WDP-LM/backend

# Chạy script
node fix-tutor-status.js
```

**Output mẫu:**
```
🔧 Bắt đầu fix tutor status...

✅ Đã kết nối MongoDB: mongodb://localhost:27017/edumatch
---

📊 Tổng số tutor profiles: 5

🔄 Fixing Profile: 822fa234...
   User: mate Learn (learnmate99@gmail.com)
   Role: learner
   Current Status: approved → Expected: pending
   ✅ Updated!

📊 KẾT QUẢ:
   ✅ Đã fix: 1 profiles
   ✔️  Đã đúng từ trước: 4 profiles
   ⚠️  Không có user: 0 profiles
   📊 Tổng: 5 profiles

📈 THỐNG KÊ SAU KHI FIX:
   ⏳ Pending (Chờ duyệt): 1
   ✅ Approved (Đã duyệt): 4
   ❌ Rejected (Từ chối): 0
   📝 Draft (Nháp): 0

👥 DANH SÁCH ĐƠN CHỜ DUYỆT (role=learner):
   1. mate Learn (learnmate99@gmail.com) - Role: learner

✅ Hoàn thành!
```

---

#### **Option B: Reset All (Cẩn thận!)**

```bash
cd WDP-LM/backend

# Chạy script
node reset-all-to-pending.js
```

**Sẽ hỏi xác nhận:**
```
⚠️  CẢNH BÁO: Script này sẽ reset TẤT CẢ dữ liệu về trạng thái chờ duyệt!

Thay đổi:
  - TẤT CẢ users có TutorProfile → role = "learner"
  - TẤT CẢ tutor_profiles → status = "pending"

Bạn có chắc chắn muốn tiếp tục? (yes/no): 
```

Gõ `yes` để confirm, hoặc `no` để hủy.

---

## 📊 KIỂM TRA KẾT QUẢ

### **Cách 1: Qua Frontend**
```
Vào: http://localhost:3000/admin/tutors
→ Tab "Đơn Chờ Duyệt"
→ Xem danh sách
```

### **Cách 2: Qua MongoDB**
```javascript
// MongoDB Shell hoặc Compass
use edumatch;

// Xem tất cả đơn chờ duyệt
db.tutor_profiles.find({ status: 'pending' });

// Xem users có role learner và có TutorProfile
db.users.aggregate([
  { $match: { role: 'learner' } },
  {
    $lookup: {
      from: 'tutor_profiles',
      localField: '_id',
      foreignField: 'user',
      as: 'profile'
    }
  },
  { $match: { 'profile': { $ne: [] } } },
  {
    $project: {
      full_name: 1,
      email: 1,
      role: 1,
      'profile.status': 1
    }
  }
]);
```

### **Cách 3: Qua Backend API**
```bash
# Get pending tutors
curl http://localhost:5000/api/admin/tutors?role=learner

# Get approved tutors
curl http://localhost:5000/api/admin/tutors?role=tutor
```

---

## 🧪 TEST CASE

### **Scenario 1: User đã bị chỉnh tay thành tutor**

**Before:**
```javascript
// users collection
{ _id: "user123", email: "test@mail.com", role: "tutor" }

// tutor_profiles collection
{ user: "user123", status: "pending" }  // ← SAI: pending nhưng role đã là tutor
```

**After running `fix-tutor-status.js`:**
```javascript
// users collection (không đổi)
{ _id: "user123", email: "test@mail.com", role: "tutor" }

// tutor_profiles collection
{ user: "user123", status: "approved" }  // ← FIX: đã đồng bộ với role
```

---

### **Scenario 2: User vẫn là learner (chờ duyệt)**

**Before:**
```javascript
// users collection
{ _id: "user456", email: "learner@mail.com", role: "learner" }

// tutor_profiles collection
{ user: "user456", status: "approved" }  // ← SAI: approved nhưng role vẫn learner
```

**After running `fix-tutor-status.js`:**
```javascript
// users collection (không đổi)
{ _id: "user456", email: "learner@mail.com", role: "learner" }

// tutor_profiles collection
{ user: "user456", status: "pending" }  // ← FIX: đã đồng bộ với role
```

---

## ⚠️ LƯU Ý

### **Trước khi chạy:**
1. ✅ **BACKUP DATABASE** trước!
2. ✅ Chạy trên môi trường **DEV/TEST** trước
3. ✅ Check `.env` có đúng database URI không
4. ✅ Đảm bảo backend server **KHÔNG đang chạy**

### **Sau khi chạy:**
1. ✅ Kiểm tra log xem có lỗi không
2. ✅ Test trên frontend xem đúng chưa
3. ✅ Test approve/reject vẫn hoạt động bình thường
4. ✅ Check email notification vẫn gửi được

### **Nếu có vấn đề:**
```bash
# Restore từ backup
mongorestore --uri="mongodb://localhost:27017/edumatch" ./backup_YYYYMMDD_HHMMSS
```

---

## 🔐 ENVIRONMENT

Đảm bảo `.env` có:
```env
MONGODB_URI=mongodb://localhost:27017/edumatch
# Hoặc
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/edumatch
```

---

## 📝 LOGS MẪU

### **Khi chạy thành công:**
```
✅ Đã kết nối MongoDB
🔄 Fixing Profile: 822fa234...
✅ Updated!
📊 KẾT QUẢ: Đã fix: 2 profiles
✅ Hoàn thành!
```

### **Khi có lỗi:**
```
❌ Lỗi: MongoServerError: Authentication failed
→ Check lại MONGODB_URI trong .env

❌ Lỗi: Cannot find module './src/models/User'
→ Đảm bảo đang ở thư mục backend/

❌ Lỗi: User not found
→ TutorProfile có user đã bị xóa, cần cleanup
```

---

## ✅ CHECKLIST

- [ ] Đã backup database
- [ ] Đã stop backend server
- [ ] Đã check `.env` đúng database
- [ ] Đã chạy script
- [ ] Đã kiểm tra log không có lỗi
- [ ] Đã test trên frontend
- [ ] Đã test approve/reject hoạt động
- [ ] Đã test email notification

---

## 🆘 SUPPORT

Nếu gặp vấn đề:
1. Check logs trong console
2. Check MongoDB connection
3. Check `.env` config
4. Restore từ backup nếu cần

---

**Created:** 2024-10-29  
**Purpose:** Fix data inconsistency between users.role and tutor_profiles.status


