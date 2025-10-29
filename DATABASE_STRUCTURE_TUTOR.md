# 📊 Database Structure - Đơn Nộp CV Gia Sư

## 🗄️ COLLECTIONS LIÊN QUAN

### **1. Collection: `tutor_profiles`**
**Model:** `TutorProfile` (TutorProfile.js)
**Mục đích:** Lưu HỒ SƠ và ĐƠN ĐĂNG KÝ gia sư

```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: 'User'),  // Tham chiếu đến users collection
  
  // Thông tin cá nhân
  avatarUrl: String,
  gender: 'male' | 'female' | 'other',
  dateOfBirth: Date,
  city: String,
  district: String,
  bio: String (max 2000 chars),
  
  // Documents nộp
  idDocumentUrls: [String],       // CMND/CCCD
  degreeDocumentUrls: [String],   // Bằng cấp
  
  // Thông tin chuyên môn
  subjects: [
    {
      name: String,    // e.g., "Toán", "Tiếng Anh"
      level: String    // e.g., "Cấp 2", "IELTS"
    }
  ],
  experienceYears: Number,
  experiencePlaces: String,
  
  // Phương thức dạy
  teachModes: ['online', 'offline'],
  languages: [String],
  paymentType: 'per_session' | 'per_month',
  sessionRate: Number,
  
  // Lịch rảnh
  availability: [
    {
      dayOfWeek: Number (0-6),  // 0=Sunday
      start: String,            // "18:00"
      end: String               // "20:00"
    }
  ],
  hasAvailability: Boolean,
  
  // Xác thực documents
  verification: {
    idStatus: 'none' | 'pending' | 'approved' | 'rejected',
    degreeStatus: 'none' | 'pending' | 'approved' | 'rejected',
    adminNotes: String
  },
  
  // ⭐ TRẠNG THÁI ĐƠN - QUAN TRỌNG!
  status: 'draft' | 'pending' | 'approved' | 'rejected',
  
  // Rating (sau khi đã là tutor)
  rating: Number (0-5),
  totalReviews: Number,
  
  // Wallet
  earnings: {
    total: Number,
    pending: Number,
    withdrawn: Number
  },
  bankAccount: {
    accountNumber: String,
    accountName: String,
    bankName: String,
    bankCode: String,
    branch: String
  },
  
  // Timestamps
  created_at: Date,
  updated_at: Date
}
```

---

### **2. Collection: `users`**
**Model:** `User` (User.js)
**Mục đích:** Lưu thông tin tài khoản người dùng

```javascript
{
  _id: ObjectId,
  
  // Thông tin cơ bản
  full_name: String,
  email: String (unique),
  phone_number: String (unique, sparse),
  
  // Authentication
  password_hash: String,
  refresh_tokens: [String],
  
  // ⭐ ROLE - QUAN TRỌNG!
  role: 'learner' | 'tutor' | 'admin',
  
  // ⭐ STATUS - QUAN TRỌNG!
  status: 'pending' | 'active' | 'blocked' | 'banned',
  
  // Ban/Block info
  block_reason: String,
  blocked_at: Date,
  ban_reason: String,
  banned_at: Date,
  
  // Email verification
  email_verified_at: Date,
  verify_token: String,
  verify_token_expires: Date,
  
  // Profile completion
  profile_completed: Boolean,
  profile_completion_step: String,
  first_login: Boolean,
  
  // Timestamps
  created_at: Date,
  updated_at: Date
}
```

---

## 🔗 RELATIONSHIP (MỐI QUAN HỆ)

```
users (1) ←──── (1) tutor_profiles
  ↓                      ↓
  _id                   user
```

**Giải thích:**
- 1 User có thể có 1 TutorProfile (quan hệ 1-1)
- TutorProfile.user tham chiếu đến User._id
- Khi populate: `TutorProfile.populate('user')` → lấy full thông tin user

---

## 📝 LUỒNG DỮ LIỆU KHI ĐĂNG KÝ GIA SƯ

### **Bước 1: User đăng ký tài khoản**
```javascript
// Tạo trong collection: users
{
  full_name: "Nguyễn Văn A",
  email: "vana@example.com",
  role: "learner",           // ← Mặc định là learner
  status: "active"
}
```

### **Bước 2: User nộp đơn làm gia sư**
```javascript
// Tạo trong collection: tutor_profiles
{
  user: ObjectId("user123"),  // ← Link đến user
  bio: "Tôi có 5 năm kinh nghiệm...",
  subjects: [{ name: "Toán", level: "Cấp 2" }],
  idDocumentUrls: ["uploads/cmnd1.jpg"],
  degreeDocumentUrls: ["uploads/bang-cap.jpg"],
  status: "pending"           // ← Chờ admin duyệt
}
```

⚠️ **Lưu ý:** User.role vẫn là `"learner"` tại bước này!

### **Bước 3: Admin duyệt đơn**
```javascript
// ✅ APPROVE:

// 1. Update tutor_profiles
{
  status: "approved"  // ← Từ "pending" → "approved"
}

// 2. Update users
{
  role: "tutor"       // ← ⭐ TỰ ĐỘNG CHUYỂN từ "learner" → "tutor"
}

// 3. Send email approve ✉️
```

### **Bước 4: Admin từ chối đơn**
```javascript
// ❌ REJECT:

// 1. Update tutor_profiles
{
  status: "rejected"  // ← Từ "pending" → "rejected"
}

// 2. User.role VẪN LÀ "learner" (không đổi)

// 3. Send email reject với lý do ✉️
```

---

## 🔍 QUERY EXAMPLES

### **Lấy tất cả đơn CHỜ DUYỆT (learner chưa thành tutor)**
```javascript
const pendingApplications = await TutorProfile.find({
  status: 'pending'
})
.populate({
  path: 'user',
  match: { role: 'learner' }  // ← Chỉ lấy user có role=learner
})
.exec();

// Filter ra những đơn có user null (đã là tutor rồi)
const filtered = pendingApplications.filter(app => app.user !== null);
```

### **Lấy tất cả đơn ĐÃ DUYỆT (đã thành tutor)**
```javascript
const approvedTutors = await TutorProfile.find({
  status: 'approved'
})
.populate({
  path: 'user',
  match: { role: 'tutor' }  // ← Chỉ lấy user có role=tutor
})
.exec();
```

### **Kiểm tra user đã nộp đơn chưa**
```javascript
const existingProfile = await TutorProfile.findOne({
  user: userId
});

if (existingProfile) {
  console.log('User đã nộp đơn:', existingProfile.status);
} else {
  console.log('User chưa nộp đơn');
}
```

---

## 📊 TRẠNG THÁI (STATUS) CHI TIẾT

### **TutorProfile.status**
| Status | Ý nghĩa | Role của User |
|--------|---------|---------------|
| `draft` | Đơn nháp, chưa submit | learner |
| `pending` | Đã nộp, chờ admin duyệt | learner |
| `approved` | Đã được duyệt | **tutor** ⭐ |
| `rejected` | Bị từ chối | learner |

### **User.role**
| Role | Ý nghĩa |
|------|---------|
| `learner` | Học viên / Người chờ duyệt |
| `tutor` | Gia sư đã được duyệt |
| `admin` | Quản trị viên |

### **User.status**
| Status | Ý nghĩa |
|--------|---------|
| `pending` | Chưa verify email |
| `active` | Đang hoạt động |
| `blocked` | Bị khóa tạm thời (có thể unblock) |
| `banned` | Bị cấm vĩnh viễn (không thể unban) |

---

## 🧪 MONGODB QUERIES

### **Check collection trong MongoDB**
```javascript
// Vào MongoDB shell hoặc Compass
use your_database_name;

// Xem tất cả collections
show collections;
// Output: users, tutor_profiles, bookings, ...

// Đếm số đơn chờ duyệt
db.tutor_profiles.countDocuments({ status: 'pending' });

// Xem 1 đơn mẫu
db.tutor_profiles.findOne({ status: 'pending' });

// Xem user tương ứng
db.users.findOne({ _id: ObjectId("...") });
```

### **Aggregate để lấy đơn kèm user info**
```javascript
db.tutor_profiles.aggregate([
  {
    $match: { status: 'pending' }
  },
  {
    $lookup: {
      from: 'users',
      localField: 'user',
      foreignField: '_id',
      as: 'userInfo'
    }
  },
  {
    $unwind: '$userInfo'
  },
  {
    $match: { 'userInfo.role': 'learner' }
  },
  {
    $project: {
      'userInfo.full_name': 1,
      'userInfo.email': 1,
      'userInfo.role': 1,
      'status': 1,
      'created_at': 1
    }
  }
]);
```

---

## 🔧 BACKEND API ENDPOINTS

### **GET /api/admin/tutors**
**Query:** `?role=learner|tutor|all`

**Filter logic:**
```javascript
// Step 1: Get all TutorProfiles
const tutors = await TutorProfile.find(query)
  .populate('user', 'full_name email role status')
  .lean();

// Step 2: Filter by user.role
if (role === 'learner') {
  // Chỉ lấy đơn của người chưa thành tutor
  tutors = tutors.filter(t => t.user?.role === 'learner');
}
else if (role === 'tutor') {
  // Chỉ lấy đơn của người đã thành tutor
  tutors = tutors.filter(t => t.user?.role === 'tutor');
}
// role === 'all' → không filter
```

### **PUT /api/admin/tutors/:id/status**
**Body:** `{ status: 'approved', rejectionReason?: 'string' }`

**Logic:**
```javascript
// 1. Update TutorProfile
await TutorProfile.findByIdAndUpdate(id, { status });

// 2. Nếu approve → Update User role
if (status === 'approved') {
  await User.findByIdAndUpdate(userId, { role: 'tutor' });
  // Send email approve
}

// 3. Nếu reject → Keep User role = 'learner'
if (status === 'rejected') {
  // Send email reject với lý do
}
```

---

## 📋 SUMMARY

### **Đơn nộp CV gia sư lưu ở đâu?**
✅ **Collection:** `tutor_profiles`  
✅ **Model:** `TutorProfile`

### **Thông tin user lưu ở đâu?**
✅ **Collection:** `users`  
✅ **Model:** `User`

### **Làm sao biết đơn chờ duyệt hay đã duyệt?**
✅ **TutorProfile.status**: `pending` / `approved` / `rejected`  
✅ **User.role**: `learner` (chờ) / `tutor` (đã duyệt)

### **Khi admin approve, điều gì xảy ra?**
✅ TutorProfile.status → `approved`  
✅ User.role → `tutor` (⭐ tự động)  
✅ Gửi email thông báo

### **Database connection string?**
✅ Check file: `.env` → `MONGODB_URI`

---

**Tóm lại:** Đơn CV gia sư = **`tutor_profiles` collection** 🎯


