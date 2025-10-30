# ✅ Frontend Update - Admin Tutors Page với Tabs

## 📋 TÓM TẮT THAY ĐỔI

Đã update trang **Admin → Tutors** với:
1. ✅ **Tabs phân loại**: "Đơn Chờ Duyệt" / "Đơn Đã Duyệt" / "Tất Cả"
2. ✅ **Filter theo role**: Gọi API với query param `role=learner|tutor|all`
3. ✅ **Nút Từ chối** với modal nhập lý do
4. ✅ **Tự động refresh** khi đổi tab
5. ✅ **Email notification** tự động khi approve/reject

---

## 🎨 GIAO DIỆN MỚI

### **Tabs Header**
```
┌─────────────────────────────────────────────────┐
│   🎓 Quản lý Gia sư                            │
│   Duyệt và quản lý các đơn đăng ký làm gia sư  │
│                                                 │
│ ⏳ Đơn Chờ Duyệt (10) | ✅ Đơn Đã Duyệt (25) | 📋 Tất Cả (35) │
└─────────────────────────────────────────────────┘
```

### **Table Actions**
- **Tab "Đơn Chờ Duyệt"**: Hiển thị nút ✅ Duyệt + ❌ Từ chối
- **Tab "Đơn Đã Duyệt"**: Chỉ hiển thị badge "✅ Đã duyệt" (không có action buttons)

---

## 🔧 FILES ĐÃ SỬA

### 1. **`AdminTutors.js`** (Frontend Component)

#### **State mới:**
```javascript
const [roleFilter, setRoleFilter] = useState('learner');  // Tab hiện tại
const [rejectModal, setRejectModal] = useState({ open: false, tutor: null });
const [rejectionReason, setRejectionReason] = useState('');
```

#### **useEffect update:**
```javascript
useEffect(() => {
  fetchTutors();
}, [roleFilter]); // Re-fetch khi đổi tab
```

#### **fetchTutors với query params:**
```javascript
const fetchTutors = async () => {
  const res = await AdminService.getTutors({ role: roleFilter });
  setTutors(res.data.tutors || []);
};
```

#### **Handler Reject:**
```javascript
const handleReject = (tutor) => {
  setRejectModal({ open: true, tutor });
  setRejectionReason('');
};

const confirmReject = async () => {
  if (!rejectionReason.trim()) {
    setError('Vui lòng nhập lý do từ chối');
    return;
  }
  
  await AdminService.updateTutorStatus(
    rejectModal.tutor._id, 
    'rejected', 
    rejectionReason
  );
  
  setSuccessMsg('❌ Đã từ chối đơn gia sư. Email thông báo đã được gửi.');
  await fetchTutors();
};
```

#### **UI Tabs:**
```jsx
<div className="admin-tabs">
  <button 
    className={`admin-tab ${roleFilter === 'learner' ? 'active' : ''}`}
    onClick={() => setRoleFilter('learner')}
  >
    <span className="admin-tab-icon">⏳</span>
    <span className="admin-tab-label">Đơn Chờ Duyệt</span>
    {roleFilter === 'learner' && <span className="admin-tab-count">{tutors.length}</span>}
  </button>
  
  <button 
    className={`admin-tab ${roleFilter === 'tutor' ? 'active' : ''}`}
    onClick={() => setRoleFilter('tutor')}
  >
    <span className="admin-tab-icon">✅</span>
    <span className="admin-tab-label">Đơn Đã Duyệt</span>
    {roleFilter === 'tutor' && <span className="admin-tab-count">{tutors.length}</span>}
  </button>
  
  <button 
    className={`admin-tab ${roleFilter === 'all' ? 'active' : ''}`}
    onClick={() => setRoleFilter('all')}
  >
    <span className="admin-tab-icon">📋</span>
    <span className="admin-tab-label">Tất Cả</span>
    {roleFilter === 'all' && <span className="admin-tab-count">{tutors.length}</span>}
  </button>
</div>
```

#### **Modal Reject:**
```jsx
{rejectModal.open && (
  <div className="modal-overlay">
    <div className="modal-content">
      <h3>❌ Từ Chối Đơn Gia Sư</h3>
      <p>Bạn có chắc muốn từ chối đơn của {rejectModal.tutor.user?.full_name}?</p>
      
      <label>Lý do từ chối *</label>
      <textarea
        rows="4"
        value={rejectionReason}
        onChange={(e) => setRejectionReason(e.target.value)}
        placeholder="Nhập lý do từ chối (bắt buộc)..."
      />
      <small>ℹ️ User sẽ nhận email với lý do từ chối này.</small>
      
      <button 
        onClick={confirmReject}
        disabled={!rejectionReason.trim()}
      >
        Xác nhận từ chối
      </button>
    </div>
  </div>
)}
```

---

### 2. **`AdminService.js`** (API Service)

#### **getTutors update:**
```javascript
getTutors(params = {}) {
  return ApiService.get('/admin/tutors', { params });
}
```
→ Đã support query params (role, status, search, etc.)

#### **updateTutorStatus update:**
```javascript
updateTutorStatus(id, status, rejectionReason = null) {
  const data = { status };
  if (rejectionReason) {
    data.rejectionReason = rejectionReason;
  }
  return ApiService.put(`/admin/tutors/${id}/status`, data);
}
```
→ Support optional rejectionReason parameter

---

### 3. **`AdminTutors.modern.css`** (Styles)

#### **Tabs CSS:**
```css
.admin-tabs {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  margin-top: 24px;
  display: flex;
  gap: 12px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.2);
}

.admin-tab {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  padding: 12px 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 500;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
}

.admin-tab:hover {
  color: white;
  background: rgba(255, 255, 255, 0.1);
}

.admin-tab.active {
  color: white;
  border-bottom-color: white;
  background: rgba(255, 255, 255, 0.15);
}

.admin-tab-count {
  background: rgba(255, 255, 255, 0.3);
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
}

.admin-tab.active .admin-tab-count {
  background: white;
  color: #667eea;
}
```

---

## 🔄 LUỒNG HOẠT ĐỘNG

### **1. Xem Đơn Chờ Duyệt (Mặc định)**
```
User vào /admin/tutors
  ↓
roleFilter = 'learner'
  ↓
API: GET /api/admin/tutors?role=learner
  ↓
Backend filter: chỉ trả về user có role=learner
  ↓
Hiển thị table với nút ✅ Duyệt + ❌ Từ chối
```

### **2. Approve Đơn**
```
Admin click ✅ Duyệt
  ↓
Modal xác nhận
  ↓
API: PUT /api/admin/tutors/{id}/status { status: 'approved' }
  ↓
Backend:
  - TutorProfile.status = 'approved'
  - User.role: 'learner' → 'tutor' ✨
  - Gửi email thông báo được duyệt 📧
  ↓
Frontend: 
  - Success message
  - Refresh danh sách
  - Đơn biến mất khỏi "Chờ duyệt"
```

### **3. Reject Đơn**
```
Admin click ❌ Từ chối
  ↓
Modal nhập lý do từ chối
  ↓
API: PUT /api/admin/tutors/{id}/status { 
  status: 'rejected',
  rejectionReason: 'Hồ sơ chưa đầy đủ'
}
  ↓
Backend:
  - TutorProfile.status = 'rejected'
  - User.role vẫn là 'learner'
  - Gửi email với lý do từ chối 📧
  ↓
Frontend:
  - Success message
  - Refresh danh sách
  - Đơn vẫn hiển thị nhưng status='rejected'
```

### **4. Xem Đơn Đã Duyệt**
```
Admin click tab "Đơn Đã Duyệt"
  ↓
roleFilter = 'tutor'
  ↓
API: GET /api/admin/tutors?role=tutor
  ↓
Backend filter: chỉ trả về user có role=tutor
  ↓
Hiển thị table với badge "✅ Đã duyệt" (không có action buttons)
```

---

## 🧪 TEST CASES

### **Test 1: Xem tab Chờ Duyệt**
```
1. Vào /admin/tutors
2. Kiểm tra:
   - Tab "Đơn Chờ Duyệt" active
   - Chỉ hiển thị đơn của learner
   - Có nút ✅ Duyệt + ❌ Từ chối
```

### **Test 2: Approve Đơn**
```
1. Click ✅ Duyệt một đơn
2. Xác nhận trong modal
3. Kiểm tra:
   - Success message xuất hiện
   - Console log: "User role changed from learner to tutor"
   - Email được gửi (check inbox hoặc console)
   - Đơn biến mất khỏi tab "Chờ duyệt"
4. Chuyển sang tab "Đã duyệt"
5. Kiểm tra: Thấy đơn vừa approve
```

### **Test 3: Reject Đơn**
```
1. Click ❌ Từ chối một đơn
2. Nhập lý do: "Hồ sơ chưa đầy đủ"
3. Xác nhận
4. Kiểm tra:
   - Success message xuất hiện
   - Email reject được gửi với lý do
   - Đơn vẫn trong tab "Chờ duyệt" nhưng status=rejected
```

### **Test 4: Chuyển Tab**
```
1. Click từng tab
2. Kiểm tra:
   - API được gọi với đúng query param
   - Danh sách thay đổi theo tab
   - Count hiển thị đúng
   - Tab active có style highlight
```

---

## 📊 API CALLS

### **GET /api/admin/tutors**
```javascript
// Đơn chờ duyệt
GET /api/admin/tutors?role=learner

// Đơn đã duyệt
GET /api/admin/tutors?role=tutor

// Tất cả
GET /api/admin/tutors?role=all
```

**Response:**
```json
{
  "tutors": [
    {
      "_id": "tutor123",
      "status": "pending",
      "user": {
        "full_name": "Nguyễn Văn A",
        "email": "vana@example.com",
        "role": "learner"
      }
    }
  ],
  "pagination": {
    "current": 1,
    "pages": 5,
    "total": 50
  },
  "filter": {
    "role": "learner"
  }
}
```

### **PUT /api/admin/tutors/:id/status**
```javascript
// Approve
PUT /api/admin/tutors/tutor123/status
{
  "status": "approved"
}

// Reject
PUT /api/admin/tutors/tutor123/status
{
  "status": "rejected",
  "rejectionReason": "Hồ sơ chưa đầy đủ"
}
```

---

## ✅ CHECKLIST

- [x] Thêm state roleFilter
- [x] Thêm state rejectModal, rejectionReason
- [x] Update useEffect để re-fetch khi đổi tab
- [x] Update fetchTutors để gọi API với query params
- [x] Thêm UI tabs
- [x] Xóa filter cũ ở frontend
- [x] Enable nút "Từ chối"
- [x] Thêm modal reject với textarea
- [x] Handler confirmReject
- [x] Update AdminService.updateTutorStatus
- [x] Thêm CSS cho tabs
- [x] Update success messages
- [x] Clean up debug buttons
- [x] Không có lỗi linter

---

## 🚀 CÁCH TEST

1. **Start backend:**
```bash
cd WDP-LM/backend
npm start
```

2. **Start frontend:**
```bash
cd WDP-LM/frontend
npm start
```

3. **Vào trang Admin Tutors:**
```
http://localhost:3000/admin/tutors
```

4. **Thử các tính năng:**
   - Click tabs để chuyển đổi
   - Approve một đơn → Check email
   - Reject một đơn với lý do → Check email
   - Xem danh sách thay đổi real-time

---

## 💡 NOTES

1. **Mặc định**: Tab "Đơn Chờ Duyệt" được active
2. **Auto-refresh**: Sau approve/reject, danh sách tự động reload
3. **Email**: Cả approve và reject đều gửi email tự động
4. **Validation**: Reject phải có lý do, nếu không button disabled
5. **Role change**: Approve tự động chuyển user từ learner → tutor (ở backend)

---

**Status:** ✅ Complete  
**Files Changed:** 3 files  
**Lines Changed:** ~200 lines  
**Ready for:** Production 🚀


