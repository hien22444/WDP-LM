# KIỂM TRA VÀ SỬA TRANG LỊCH SỬ THANH TOÁN

## 📋 CÁC VẤN ĐỀ ĐÃ PHÁT HIỆN

### 1. ❌ Payment Model thiếu trường `userId`
**Vấn đề:** 
- Payment model không có trường `userId` để lưu người dùng tạo payment
- Controller đang cố dùng `payment.userId` nhưng field này không tồn tại
- Không thể filter payments theo user

**Đã sửa:**
- ✅ Thêm trường `userId` vào Payment schema
- ✅ Thêm index cho `userId` để tối ưu query

### 2. ❌ Payment Routes thiếu Authentication Middleware
**Vấn đề:**
- Route `/api/v1/payment` không có auth middleware
- Bất kỳ ai cũng có thể xem danh sách payments
- Không bảo mật

**Đã sửa:**
- ✅ Thêm `auth()` middleware vào các routes:
  - `POST /create-payment-link` - Cần auth
  - `GET /` - Cần auth (list payments)
  - `GET /:id` - Cần auth (get payment detail)
  - `POST /:id/cancel` - Cần auth (cancel payment)
  - `POST /payos-webhook` - Không cần auth (webhook từ PayOS)

### 3. ❌ Không lưu userId khi tạo Payment
**Vấn đề:**
- Khi tạo payment link, không lưu userId vào payment record
- Không thể biết payment thuộc về user nào

**Đã sửa:**
- ✅ Thêm `userId: req.user?.id` khi tạo payment trong `createPaymentLink`

### 4. ❌ Frontend không gửi Token
**Vấn đề:**
- PaymentService không có axios interceptor
- Không tự động thêm token vào request header
- API sẽ trả về 401 Unauthorized

**Đã sửa:**
- ✅ Tạo axios client với interceptor
- ✅ Tự động thêm `Authorization: Bearer <token>` vào mọi request
- ✅ Lấy token từ Cookies

### 5. ❌ Sử dụng sai field name (`req.user._id` vs `req.user.id`)
**Vấn đề:**
- Controller đang dùng `req.user._id` nhưng auth middleware set `req.user.id`
- Filter không hoạt động đúng

**Đã sửa:**
- ✅ Đổi tất cả `req.user._id` thành `req.user.id` trong:
  - `listPayments()`
  - `getPaymentById()`
  - `cancelPayment()`

---

## ✅ CÁC THAY ĐỔI ĐÃ THỰC HIỆN

### Backend Changes:

#### 1. `backend/src/models/Payment.js`
```javascript
// Thêm trường userId
userId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  required: false, // Optional for backward compatibility
  index: true,
},
```

#### 2. `backend/src/routes/payment.js`
```javascript
// Thêm auth middleware
const { auth } = require("../middlewares/auth");

router.post("/create-payment-link", auth(), createPaymentLink);
router.get("/", auth(), listPayments);
router.get("/:id", auth(), getPaymentById);
router.post("/:id/cancel", auth(), cancelPayment);
// Webhook không cần auth
router.post("/payos-webhook", receiveWebhook);
```

#### 3. `backend/src/controllers/paymentController.js`
```javascript
// Lưu userId khi tạo payment
paymentRecord = await Payment.create({
  // ...
  userId: req.user?.id || null,
  // ...
});

// Sửa filter để dùng req.user.id
if (req.user && req.user.id) {
  filter.userId = req.user.id;
}

// Sửa ownership check
if (req.user && req.user.id && payment.userId && 
    String(payment.userId) !== String(req.user.id)) {
  return res.status(403).json({ success: false, message: "Forbidden" });
}
```

### Frontend Changes:

#### 4. `frontend/src/services/PaymentService.js`
```javascript
// Tạo axios client với interceptor
const client = axios.create({ 
  baseURL: API_URL, 
  withCredentials: true 
});

// Request interceptor để thêm token
client.interceptors.request.use((config) => {
  const accessToken = Cookies.get("accessToken");
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Dùng client thay vì axios trực tiếp
const response = await client.post("/payment/create-payment-link", payload);
```

---

## 🧪 KIỂM TRA

### Test Cases:

1. **Đăng nhập và vào trang lịch sử thanh toán**
   - ✅ Token được gửi trong header
   - ✅ API trả về danh sách payments của user hiện tại
   - ✅ Chỉ hiển thị payments của user đã đăng nhập

2. **Tạo payment mới**
   - ✅ userId được lưu vào payment record
   - ✅ Payment hiển thị trong lịch sử sau khi tạo

3. **Xem chi tiết payment**
   - ✅ Chỉ user sở hữu payment mới xem được
   - ✅ User khác không thể xem (403 Forbidden)

4. **Hủy payment**
   - ✅ Chỉ user sở hữu payment mới hủy được
   - ✅ Payment status chuyển thành CANCELLED

---

## 📝 LƯU Ý

### Backward Compatibility:
- `userId` field là optional (required: false) để tương thích với payments cũ
- Payments cũ không có userId vẫn hoạt động bình thường
- Payments mới sẽ có userId

### Migration (nếu cần):
Nếu muốn cập nhật payments cũ, có thể chạy script:
```javascript
// Cập nhật payments cũ từ metadata hoặc booking
// (Cần implement logic cụ thể dựa trên business logic)
```

---

## 🎯 KẾT QUẢ

Sau khi sửa:
- ✅ Trang lịch sử thanh toán hoạt động đúng
- ✅ Chỉ hiển thị payments của user đã đăng nhập
- ✅ Bảo mật tốt hơn với authentication
- ✅ Frontend tự động gửi token
- ✅ Backend lưu và filter đúng userId

---

## ⚠️ CẦN KIỂM TRA THÊM

1. **Webhook từ PayOS:**
   - Webhook có thể không có userId trong request
   - Cần kiểm tra xem webhook có lưu userId đúng không
   - Nếu payment từ webhook không có userId, có thể cần update từ metadata

2. **Existing Payments:**
   - Payments cũ không có userId
   - Có thể cần migration script để cập nhật

3. **Error Handling:**
   - Kiểm tra xử lý lỗi khi token hết hạn
   - Kiểm tra xử lý khi user chưa đăng nhập

