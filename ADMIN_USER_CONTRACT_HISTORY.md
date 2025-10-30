# 📋 ADMIN - XEM LỊCH SỬ HỢP ĐỒNG CỦA USER

## ✅ HOÀN THÀNH

### **1. Xóa cột "Số HĐ" trong trang Contracts** ✅

**File đã sửa:**
- `WDP-LM/frontend/src/pages/Admin/AdminContracts.js`

**Thay đổi:**
- Xóa `<th>Số HĐ</th>` trong header
- Xóa `<td>` hiển thị số hợp đồng trong body

**Kết quả:**
- Bảng giờ chỉ còn 8 cột thay vì 9
- Gọn gàng hơn, tiết kiệm không gian

---

### **2. Thêm Lịch Sử Hợp Đồng vào Admin Users** ✅

## 🎯 CHỨC NĂNG MỚI

Khi admin click vào user (learner) trong trang Admin Users, modal chi tiết sẽ hiển thị:
1. ✅ Thông tin user (như cũ)
2. ✅ **Lịch sử hợp đồng của user** (MỚI!)

### **Backend - API Endpoint**

#### **GET /api/v1/admin/contracts/user/:userId**

Lấy tất cả hợp đồng của 1 user cụ thể.

**File:** `WDP-LM/backend/src/routes/admin-contracts.js`

**Response:**
```json
{
  "contracts": [
    {
      "_id": "...",
      "tutorProfile": {
        "user": {
          "email": "tutor@email.com",
          "profile": {
            "full_name": "Nguyễn Văn A"
          }
        }
      },
      "price": 200000,
      "status": "completed",
      "paymentStatus": "released",
      "created_at": "2025-10-26T..."
    }
  ],
  "total": 5
}
```

---

### **Frontend**

#### **Files đã sửa:**

1. **`AdminContractService.js`**
   - Thêm method: `getContractsByUserId(userId)`

2. **`AdminUsers.js`**
   - Import `AdminContractService`
   - Thêm state: `userContracts`, `contractsLoading`
   - Fetch contracts khi mở modal detail
   - Hiển thị danh sách hợp đồng trong modal

3. **`AdminUsers.css`**
   - Thêm CSS cho contracts section
   - Style cho contract items
   - Responsive cho mobile

---

## 🎨 GIAO DIỆN

### **Modal User Detail - Trước**
```
┌─────────────────────────────┐
│ Thông tin User              │
├─────────────────────────────┤
│ Avatar | Thông tin cơ bản   │
└─────────────────────────────┘
```

### **Modal User Detail - Sau**
```
┌─────────────────────────────────────┐
│ Thông tin User                      │
├─────────────────────────────────────┤
│ Avatar | Thông tin cơ bản           │
├─────────────────────────────────────┤
│ 📋 Lịch sử hợp đồng (3)            │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ Gia sư: Nguyễn Văn A            │ │
│ │ Giá: 200,000đ | Status: compl.. │ │
│ │ Ngày tạo: 26/10/2025            │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Gia sư: Trần Thị B              │ │
│ │ Giá: 150,000đ | Status: pending │ │
│ │ Ngày tạo: 25/10/2025            │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## 📊 THÔNG TIN HIỂN THỊ

Mỗi contract item hiển thị:

### **1. Gia sư**
- Tên đầy đủ hoặc email của gia sư

### **2. Thông tin hợp đồng**
- **Giá:** Số tiền (VNĐ)
- **Trạng thái:** pending, accepted, completed, etc.
- **Thanh toán:** none, escrow, released, etc.

### **3. Ngày tạo**
- Định dạng: DD/MM/YYYY

---

## 🎨 STYLING

### **Contract Items**

**Màu sắc theo trạng thái:**

| Status | Background | Text Color |
|--------|------------|------------|
| `pending` | 🟡 Vàng (#fef3c7) | #d97706 |
| `accepted` | 🔵 Xanh (#dbeafe) | #2563eb |
| `completed` | 🟢 Xanh lá (#d1fae5) | #059669 |
| `rejected` | 🔴 Đỏ (#fee2e2) | #dc2626 |
| `cancelled` | 🔴 Đỏ (#fee2e2) | #dc2626 |
| `in_progress` | 🟣 Tím (#e0e7ff) | #6366f1 |

**Hiệu ứng:**
- Gradient background xanh nhạt
- Border xanh
- Hover: Nâng lên 2px + shadow

---

## 🔍 LUỒNG HOẠT ĐỘNG

### **Khi admin click vào user:**

```
1. Click vào user name hoặc button "Chi tiết"
   ↓
2. Modal mở ra
   ↓
3. Loading user info (spinner)
   ↓
4. Hiển thị thông tin user
   ↓
5. Đồng thời fetch contracts của user
   ↓
6. Hiển thị loading spinner cho contracts
   ↓
7. Render danh sách contracts
```

### **Nếu user chưa có hợp đồng:**

```
┌───────────────────────────┐
│ 📋 Lịch sử hợp đồng (0)  │
├───────────────────────────┤
│                           │
│   Chưa có hợp đồng nào    │
│                           │
└───────────────────────────┘
```

### **Nếu user có nhiều hợp đồng:**

- Danh sách có scroll (max-height: 400px)
- Sắp xếp theo ngày tạo (mới nhất trước)
- Mỗi item có hover effect

---

## 📱 RESPONSIVE

### **Desktop (>768px)**
- Modal width: 900px
- Contracts list: max-height 400px
- Info layout: flex row

### **Mobile (≤768px)**
- Modal width: 95vw
- Contracts list: max-height 300px
- Info layout: flex column (stack)

---

## 🚀 CÁCH SỬ DỤNG

### **Bước 1: Vào trang Admin Users**
```
http://localhost:3000/admin/users
```

### **Bước 2: Click vào user**
- Click vào tên user
- Hoặc click button "ℹ️ Chi tiết"

### **Bước 3: Xem lịch sử hợp đồng**
- Scroll xuống phần "📋 Lịch sử hợp đồng"
- Xem danh sách các hợp đồng đã đăng ký
- Biết được learner đã học với gia sư nào

---

## 🎯 LỢI ÍCH

### **Cho Admin:**
1. ✅ Nhanh chóng biết user đã đăng ký gia sư nào
2. ✅ Xem trạng thái hợp đồng của user
3. ✅ Theo dõi hoạt động học tập
4. ✅ Hỗ trợ customer service tốt hơn

### **Thông tin hữu ích:**
- Số lượng hợp đồng (kiểm tra user có hoạt động không)
- Gia sư nào user đã chọn
- Trạng thái thanh toán
- Lịch sử đặt lịch

---

## 📝 TECHNICAL DETAILS

### **State Management:**
```javascript
const [userContracts, setUserContracts] = useState([]);
const [contractsLoading, setContractsLoading] = useState(false);
```

### **Fetch Contracts:**
```javascript
const contractsData = await AdminContractService.getContractsByUserId(user._id);
setUserContracts(contractsData.contracts || []);
```

### **Display Logic:**
```javascript
{contractsLoading ? (
  <Spinner />
) : userContracts.length === 0 ? (
  <NoContracts />
) : (
  <ContractsList contracts={userContracts} />
)}
```

---

## 🔒 SECURITY

- ✅ Chỉ admin mới truy cập được
- ✅ API có middleware `auth()` + `requireAdmin`
- ✅ Không thể xem contracts của user khác nếu không phải admin

---

## 📊 FILES SUMMARY

### **Backend (2 files):**
1. ✅ `backend/src/routes/admin-contracts.js` - Thêm endpoint `/user/:userId`

### **Frontend (3 files):**
1. ✅ `frontend/src/services/AdminContractService.js` - Thêm method
2. ✅ `frontend/src/pages/Admin/AdminUsers.js` - UI & Logic
3. ✅ `frontend/src/pages/Admin/AdminUsers.css` - Styling

### **Contracts Page (1 file):**
1. ✅ `frontend/src/pages/Admin/AdminContracts.js` - Xóa cột "Số HĐ"

---

## 🎉 KẾT QUẢ

- ✅ Đã xóa cột "Số HĐ" trong trang Contracts
- ✅ Đã thêm lịch sử hợp đồng vào trang Admin Users
- ✅ Admin có thể xem learner đã đăng ký gia sư nào
- ✅ Giao diện đẹp, responsive, dễ sử dụng

**Ready to use! 🚀**

Bây giờ admin có thể:
1. Click vào bất kỳ user nào
2. Xem thông tin user
3. **Xem lịch sử hợp đồng của user đó**
4. Biết được user đã học với gia sư nào, bao nhiêu hợp đồng, trạng thái ra sao!

✨ **Tính năng hoàn chỉnh!** ✨

