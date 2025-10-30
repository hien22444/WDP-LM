# 📋 HỆ THỐNG QUẢN LÝ HỢP ĐỒNG CHO ADMIN

## 🎯 TỔNG QUAN

Hệ thống quản lý hợp đồng cho phép Admin xem, quản lý và theo dõi tất cả các hợp đồng giữa học viên và gia sư trên nền tảng.

---

## ✨ TÍNH NĂNG CHÍNH

### **1. Dashboard Hợp Đồng**
- ✅ Xem danh sách tất cả hợp đồng
- ✅ Thống kê tổng quan:
  - Tổng số hợp đồng
  - Hợp đồng đã ký
  - Hợp đồng chờ xác nhận
  - Hợp đồng đang hoạt động
  - Hợp đồng hoàn thành
  - Hợp đồng tranh chấp
  - Tổng doanh thu
  - Doanh thu platform
  
### **2. Tìm Kiếm & Lọc**
- 🔍 Tìm kiếm theo:
  - Số hợp đồng
  - Tên học viên
  - Email học viên
- 🎯 Lọc theo:
  - Trạng thái hợp đồng (pending, accepted, completed, etc.)
  - Đã ký / Chưa ký
  - Sắp xếp theo ngày tạo, ngày bắt đầu, giá

### **3. Xem Chi Tiết Hợp Đồng**
- 📄 Thông tin đầy đủ:
  - Thông tin hợp đồng (số HĐ, trạng thái, ngày ký)
  - Thông tin học viên (tên, email, phone, địa chỉ, chữ ký)
  - Thông tin gia sư (tên, email, phone, chữ ký)
  - Thông tin khóa học (môn học, số buổi, lịch học)
  - Thông tin thanh toán (giá, escrow, phí platform)
  - Thông tin bổ sung (session ID, room ID, lý do hủy, tranh chấp)

### **4. Quản Lý Hợp Đồng**
- ✏️ Cập nhật trạng thái hợp đồng
- 🗑️ Xóa hợp đồng (soft delete)
- 📥 Xuất danh sách hợp đồng ra file CSV

---

## 🗂️ CẤU TRÚC DỮ LIỆU

### **Booking Model (Updated)**

```javascript
{
  // Existing fields
  tutorProfile: ObjectId,
  student: ObjectId,
  start: Date,
  end: Date,
  mode: String ("online" | "offline"),
  price: Number,
  status: String,
  paymentStatus: String,
  
  // NEW CONTRACT FIELDS
  contractSigned: Boolean,           // Hợp đồng đã được ký hay chưa
  contractNumber: String,            // Số hợp đồng
  studentSignature: String,          // Chữ ký học viên
  studentSignedAt: Date,             // Thời gian học viên ký
  tutorSignature: String,            // Chữ ký gia sư
  tutorSignedAt: Date,              // Thời gian gia sư ký
  
  contractData: {
    studentName: String,             // Tên học viên
    studentPhone: String,            // SĐT học viên
    studentEmail: String,            // Email học viên
    studentAddress: String,          // Địa chỉ học viên
    subject: String,                 // Môn học
    totalSessions: Number,           // Tổng số buổi học
    sessionDuration: Number,         // Thời lượng mỗi buổi (phút)
    weeklySchedule: [Number],        // Lịch học hàng tuần
    startDate: Date,                 // Ngày bắt đầu
    endDate: Date                    // Ngày kết thúc
  }
}
```

---

## 🔌 API ENDPOINTS

### **GET /api/v1/admin/contracts**
Lấy danh sách tất cả hợp đồng

**Query Parameters:**
- `status` - Lọc theo trạng thái
- `contractSigned` - Lọc theo đã ký hay chưa
- `search` - Tìm kiếm theo tên, email, số hợp đồng
- `page` - Số trang
- `limit` - Số lượng mỗi trang
- `sortBy` - Sắp xếp theo field
- `sortOrder` - Thứ tự sắp xếp (asc/desc)

**Response:**
```json
{
  "contracts": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```

---

### **GET /api/v1/admin/contracts/:id**
Lấy chi tiết một hợp đồng

**Response:**
```json
{
  "contract": {
    "_id": "...",
    "contractNumber": "HD-123456",
    "student": {...},
    "tutorProfile": {...},
    "contractData": {...},
    ...
  }
}
```

---

### **GET /api/v1/admin/contracts/stats/overview**
Lấy thống kê tổng quan

**Response:**
```json
{
  "stats": {
    "totalContracts": 100,
    "signedContracts": 80,
    "pendingContracts": 10,
    "activeContracts": 30,
    "completedContracts": 50,
    "disputedContracts": 2,
    "totalRevenue": 50000000,
    "platformRevenue": 7500000
  }
}
```

---

### **PATCH /api/v1/admin/contracts/:id/status**
Cập nhật trạng thái hợp đồng

**Body:**
```json
{
  "status": "completed",
  "adminNote": "Ghi chú của admin"
}
```

**Response:**
```json
{
  "message": "Contract status updated successfully",
  "contract": {...}
}
```

---

### **DELETE /api/v1/admin/contracts/:id**
Xóa hợp đồng (soft delete)

**Body:**
```json
{
  "reason": "Lý do xóa"
}
```

**Response:**
```json
{
  "message": "Contract deleted successfully",
  "contract": {...}
}
```

---

### **GET /api/v1/admin/contracts/export/csv**
Xuất danh sách hợp đồng ra file CSV

**Response:**
File CSV với các cột:
- Contract Number
- Student Name
- Student Email
- Tutor Name
- Tutor Email
- Status
- Price
- Payment Status
- Start Date
- End Date
- Signed
- Created At

---

## 📁 CẤU TRÚC FILE

### **Backend**
```
WDP-LM/backend/
├── src/
│   ├── models/
│   │   └── Booking.js                 [UPDATED] ✅
│   ├── routes/
│   │   └── admin-contracts.js         [NEW] ✅
│   └── server.js                      [UPDATED] ✅
```

### **Frontend**
```
WDP-LM/frontend/src/
├── components/
│   └── Admin/
│       ├── AdminLayout.js             [UPDATED] ✅
│       └── AdminLayout.modern.css     [UPDATED] ✅
├── pages/
│   └── Admin/
│       ├── AdminContracts.js          [NEW] ✅
│       ├── AdminContracts.css         [NEW] ✅
│       ├── AdminContractDetail.js     [NEW] ✅
│       └── AdminContractDetail.css    [NEW] ✅
├── services/
│   └── AdminContractService.js        [NEW] ✅
└── App.js                             [UPDATED] ✅
```

---

## 🚀 HƯỚNG DẪN SỬ DỤNG

### **1. Truy cập trang quản lý hợp đồng**
- Đăng nhập với tài khoản admin
- Vào menu bên trái → Click vào **"Contracts"**
- URL: `http://localhost:3000/admin/contracts`

### **2. Xem danh sách hợp đồng**
- Xem thống kê tổng quan ở đầu trang
- Sử dụng thanh tìm kiếm để tìm hợp đồng
- Sử dụng các bộ lọc để lọc theo trạng thái, đã ký, sắp xếp

### **3. Xem chi tiết hợp đồng**
- Click vào icon 👁️ (View) ở cột "Hành động"
- Xem đầy đủ thông tin hợp đồng
- Click "Quay lại" để quay về danh sách

### **4. Cập nhật trạng thái**
- Click vào icon ✏️ (Edit) ở cột "Hành động"
- Chọn trạng thái mới trong modal
- Hệ thống sẽ cập nhật và refresh danh sách

### **5. Xóa hợp đồng**
- Click vào icon 🗑️ (Delete) ở cột "Hành động"
- Xác nhận xóa trong modal
- Hợp đồng sẽ được đánh dấu là "cancelled"

### **6. Xuất file CSV**
- Click vào nút **"Xuất CSV"** ở góc trên bên phải
- File CSV sẽ được tải về tự động

---

## 🎨 GIAO DIỆN

### **Trang danh sách**
- 📊 **8 thẻ thống kê** với icon và màu sắc khác nhau
- 🔍 **Thanh tìm kiếm** và **4 bộ lọc**
- 📋 **Bảng danh sách** với đầy đủ thông tin
- 🎯 **3 nút hành động** cho mỗi hợp đồng (View, Edit, Delete)
- 📄 **Phân trang** ở cuối trang

### **Trang chi tiết**
- 📌 **Header** với số hợp đồng và trạng thái
- 📱 **2 cột thông tin**:
  - Cột trái: Thông tin hợp đồng, học viên, gia sư
  - Cột phải: Thông tin khóa học, thanh toán, bổ sung
- 🎯 **Footer** với nút "Quay lại" và "Chỉnh sửa"

### **Màu sắc**
- 🔵 **Blue**: Dashboard
- 🟢 **Green**: Users
- 🟣 **Purple**: Tutors
- 🟠 **Orange**: Bookings
- 🟣 **Indigo**: Contracts ✨ (NEW)
- 🔴 **Red**: Reports

---

## 📊 TRẠNG THÁI HỢP ĐỒNG

| Trạng thái | Màu sắc | Ý nghĩa |
|-----------|---------|---------|
| `pending` | 🟡 Vàng | Chờ gia sư xác nhận |
| `accepted` | 🔵 Xanh dương | Gia sư đã chấp nhận |
| `rejected` | 🔴 Đỏ | Gia sư từ chối |
| `cancelled` | ⚪ Xám | Đã hủy |
| `completed` | 🟢 Xanh lá | Hoàn thành |
| `in_progress` | 🟣 Tím | Đang diễn ra |
| `disputed` | 🔴 Đỏ đậm | Tranh chấp |

---

## 💰 TRẠNG THÁI THANH TOÁN

| Trạng thái | Màu sắc | Ý nghĩa |
|-----------|---------|---------|
| `none` | ⚪ Xám | Chưa thanh toán |
| `prepaid` | 🔵 Xanh | Trả trước |
| `postpaid` | 🔵 Xanh | Trả sau |
| `escrow` | 🟡 Vàng | Đang giữ trong escrow |
| `held` | 🟡 Vàng | Đã khóa |
| `released` | 🟢 Xanh lá | Đã giải phóng |
| `refunded` | 🔴 Đỏ | Đã hoàn tiền |

---

## 🔒 BẢO MẬT

- ✅ Chỉ admin mới có thể truy cập
- ✅ Kiểm tra quyền bằng middleware `adminOnly`
- ✅ Token authentication bắt buộc
- ✅ Không thể truy cập trực tiếp qua URL nếu không phải admin

---

## 🧪 TESTING

### **Test Backend API**
```bash
# Get all contracts
curl -X GET http://localhost:5000/api/v1/admin/contracts \
  -H "Authorization: Bearer <admin_token>"

# Get contract by ID
curl -X GET http://localhost:5000/api/v1/admin/contracts/<contract_id> \
  -H "Authorization: Bearer <admin_token>"

# Get stats
curl -X GET http://localhost:5000/api/v1/admin/contracts/stats/overview \
  -H "Authorization: Bearer <admin_token>"

# Update status
curl -X PATCH http://localhost:5000/api/v1/admin/contracts/<contract_id>/status \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"status":"completed","adminNote":"Test note"}'

# Delete contract
curl -X DELETE http://localhost:5000/api/v1/admin/contracts/<contract_id> \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Test delete"}'
```

### **Test Frontend**
1. Đăng nhập với tài khoản admin
2. Vào `/admin/contracts`
3. Test các tính năng:
   - ✅ Xem danh sách
   - ✅ Tìm kiếm
   - ✅ Lọc
   - ✅ Sắp xếp
   - ✅ Phân trang
   - ✅ Xem chi tiết
   - ✅ Cập nhật trạng thái
   - ✅ Xóa hợp đồng
   - ✅ Xuất CSV

---

## 📝 NOTES

- Hợp đồng chỉ được tạo khi học viên đặt lịch và ký hợp đồng
- Gia sư ký hợp đồng khi chấp nhận booking
- Admin có thể override trạng thái hợp đồng khi cần thiết
- Xóa hợp đồng là soft delete (đánh dấu cancelled), không xóa hẳn khỏi database
- File CSV chứa tất cả hợp đồng, không có lọc

---

## 🎉 HOÀN THÀNH

Hệ thống quản lý hợp đồng cho Admin đã được thiết kế và triển khai hoàn chỉnh!

**Các tính năng đã hoàn thành:**
- ✅ Backend API routes đầy đủ
- ✅ Frontend admin pages đẹp mắt
- ✅ Service layer để gọi API
- ✅ Routing integration
- ✅ UI/UX responsive
- ✅ Export to CSV
- ✅ Statistics dashboard
- ✅ Search & filter
- ✅ Pagination
- ✅ Status management

**Ready to use! 🚀**

