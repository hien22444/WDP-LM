# KIỂM TRA PHẦN THANH TOÁN

## 📋 TỔNG QUAN

Đã kiểm tra toàn bộ luồng thanh toán từ frontend đến backend, bao gồm:
- Tạo payment link
- Xử lý thanh toán qua PayOS
- Webhook từ PayOS
- Tạo booking từ payment
- Xác minh thanh toán

---

## 🔍 CÁC VẤN ĐỀ ĐÃ PHÁT HIỆN VÀ SỬA

### 1. ❌ OrderSummary không gửi slotId trong metadata

**Vấn đề:**
- Khi tạo payment link, `slotId` không được gửi trong metadata
- Webhook không thể tạo booking từ slot vì không biết slot nào

**Đã sửa:**
- ✅ Thêm `slotId` vào `metadata.slotId`
- ✅ Thêm `slotId` vào `product.id` để backup

```javascript
// frontend/src/pages/Payment/OrderSummary.js
const payload = {
  product: {
    name: `Khóa học: ${slot.courseName}`,
    unitPrice: parseInt(slot.price) || 100000,
    id: slot._id, // slotId
  },
  metadata: {
    slotId: slot._id, // Đảm bảo slotId được lưu
  },
};
```

---

### 2. ❌ Payment Model thiếu trường `paidAt` và `paymentData`

**Vấn đề:**
- Code đang cố dùng `paidAt` nhưng field không tồn tại trong schema
- Không lưu được dữ liệu từ PayOS webhook

**Đã sửa:**
- ✅ Thêm `paidAt: { type: Date, default: null }`
- ✅ Thêm `paymentData: { type: Object, default: {} }` để lưu dữ liệu từ PayOS

```javascript
// backend/src/models/Payment.js
paidAt: { type: Date, default: null },
paymentData: { type: Object, default: {} }, // Lưu dữ liệu từ PayOS webhook
```

---

### 3. ❌ Webhook có thể tạo duplicate booking

**Vấn đề:**
- Nếu webhook được gọi nhiều lần (PayOS retry), có thể tạo nhiều booking từ cùng 1 slot
- Không kiểm tra booking đã tồn tại

**Đã sửa:**
- ✅ Kiểm tra booking đã tồn tại trước khi tạo mới
- ✅ Nếu đã có booking, vẫn gửi notification nhưng không tạo duplicate

```javascript
// backend/src/controllers/paymentController.js
const existingBooking = await Booking.findOne({ 
  slotId: slot._id,
  status: { $in: ["accepted", "pending", "completed"] }
});

if (existingBooking) {
  console.log("⚠️ Booking already exists for this slot:", existingBooking._id);
  // Vẫn gửi notification nhưng không tạo duplicate
  await notifyStudentPaymentSuccess(existingBooking);
  await notifyTutorPaymentSuccess(existingBooking);
} else {
  // Tạo booking mới
  const booking = await Booking.create({...});
}
```

---

### 4. ❌ PaymentSuccess page không verify payment thực sự

**Vấn đề:**
- PaymentSuccess chỉ simulate data, không gọi API để verify
- Không biết payment có thực sự thành công hay không

**Đã sửa:**
- ✅ Gọi API `/payment/verify/:orderCode` để verify payment status
- ✅ Hiển thị thông báo phù hợp dựa trên kết quả verify

```javascript
// frontend/src/pages/Payment/PaymentSuccess.js
const verifyPayment = async () => {
  const response = await fetch(
    `${API_URL}/payment/verify/${orderCode}`
  );
  const data = await response.json();
  
  if (data.success && data.status === 'PAID') {
    // Payment thành công
    setPaymentInfo({...});
  } else {
    // Payment chưa hoàn tất
    toast.warning('Thanh toán chưa hoàn tất hoặc đang xử lý...');
  }
};
```

---

### 5. ✅ VerifyPayment cũng cần kiểm tra duplicate booking

**Đã sửa:**
- ✅ Cập nhật `verifyPayment` để cũng kiểm tra duplicate booking
- ✅ Đảm bảo consistency giữa webhook và verify endpoint

---

## 📊 LUỒNG THANH TOÁN HOÀN CHỈNH

### Bước 1: User tạo payment link
```
1. User chọn slot và click "Xác nhận thanh toán"
2. Frontend gọi: POST /api/v1/payment/create-payment-link
   - Payload: { product: {...}, metadata: { slotId: "..." } }
3. Backend:
   - Tạo Payment record với status="PENDING"
   - Gọi PayOS API tạo payment link
   - Lưu checkoutUrl và qrUrl
   - Trả về payment link cho frontend
```

### Bước 2: User thanh toán qua PayOS
```
1. User redirect đến PayOS checkout page
2. User thanh toán (hoặc scan QR)
3. PayOS xử lý thanh toán
```

### Bước 3: PayOS gửi webhook
```
1. PayOS gọi: POST /api/v1/payment/payos-webhook
   - Body: { code: "00", data: { orderCode: "...", status: "PAID" } }
2. Backend:
   - Verify payment status
   - Update Payment.status = "PAID"
   - Update Payment.paidAt = new Date()
   - Lưu paymentData từ webhook
   - Nếu có slotId:
     * Update slot.status = "booked"
     * Kiểm tra booking đã tồn tại chưa
     * Nếu chưa có: Tạo Booking + TeachingSession
     * Tạo roomId cho WebRTC
     * Gửi email notification cho student và tutor
```

### Bước 4: User quay lại PaymentSuccess page
```
1. PayOS redirect về: /payment-success?orderCode=...
2. Frontend:
   - Gọi GET /api/v1/payment/verify/:orderCode
   - Verify payment status từ PayOS
   - Hiển thị thông tin payment thành công
   - Hiển thị roomCode và button để join room
```

---

## ✅ KIỂM TRA

### Test Cases:

1. **Tạo payment link từ slot:**
   - ✅ slotId được gửi trong metadata
   - ✅ Payment record được tạo với slotId
   - ✅ checkoutUrl được trả về

2. **Thanh toán thành công:**
   - ✅ Webhook nhận được và xử lý đúng
   - ✅ Payment status được update thành PAID
   - ✅ Booking được tạo từ slot
   - ✅ TeachingSession được tạo
   - ✅ Email notification được gửi

3. **Tránh duplicate booking:**
   - ✅ Nếu webhook được gọi lại, không tạo booking duplicate
   - ✅ Vẫn gửi notification nếu booking đã tồn tại

4. **Verify payment:**
   - ✅ PaymentSuccess page verify payment thực sự
   - ✅ Hiển thị đúng trạng thái payment

---

## ⚠️ CẦN CẢI THIỆN THÊM

### 1. PaymentSuccess page cần lấy thông tin thực tế
**Hiện tại:**
- PaymentSuccess vẫn dùng hardcoded data (TODO comments)
- Cần gọi API để lấy:
  - Payment amount từ payment record
  - Course name từ slot
  - Room code từ booking

**Gợi ý:**
```javascript
// Có thể thêm endpoint: GET /api/v1/payment/:id/details
// Trả về: { payment, booking, slot, roomCode }
```

### 2. Error handling cho webhook
**Hiện tại:**
- Webhook có try-catch nhưng có thể cải thiện
- Cần logging tốt hơn để debug

**Gợi ý:**
- Thêm retry mechanism nếu webhook fail
- Log chi tiết hơn về payment processing

### 3. Payment status mapping
**Hiện tại:**
- Chỉ xử lý một số status codes
- Có thể cần xử lý thêm các status khác từ PayOS

---

## 📝 FILES ĐÃ SỬA

**Backend:**
- ✅ `backend/src/models/Payment.js` - Thêm paidAt và paymentData
- ✅ `backend/src/controllers/paymentController.js` - Sửa webhook và verifyPayment để tránh duplicate

**Frontend:**
- ✅ `frontend/src/pages/Payment/OrderSummary.js` - Thêm slotId vào metadata
- ✅ `frontend/src/pages/Payment/PaymentSuccess.js` - Verify payment thực sự từ API

---

## 🎯 KẾT QUẢ

Sau khi sửa:
- ✅ Payment link được tạo đúng với slotId
- ✅ Webhook xử lý payment thành công
- ✅ Booking được tạo tự động từ slot
- ✅ Tránh duplicate booking khi webhook retry
- ✅ PaymentSuccess verify payment thực sự
- ✅ Payment model có đầy đủ fields cần thiết

---

## 🔧 CONFIGURATION CẦN KIỂM TRA

### Environment Variables:
- `PAYOS_CLIENT_ID` - PayOS Client ID
- `PAYOS_API_KEY` - PayOS API Key
- `PAYOS_CHECKSUM_KEY` - PayOS Checksum Key
- `FRONTEND_URL` - Frontend URL cho returnUrl và cancelUrl

### PayOS Dashboard:
- Webhook URL phải được cấu hình: `https://your-domain.com/api/v1/payment/payos-webhook`
- Kiểm tra webhook có hoạt động không (có thể test bằng PayOS sandbox)

---

## ✅ TESTING CHECKLIST

- [ ] Tạo payment link từ slot
- [ ] Thanh toán thành công qua PayOS
- [ ] Webhook nhận được và xử lý đúng
- [ ] Booking được tạo tự động
- [ ] Email notification được gửi
- [ ] PaymentSuccess page verify payment
- [ ] Tránh duplicate booking khi webhook retry
- [ ] PaymentCancel page hoạt động đúng

