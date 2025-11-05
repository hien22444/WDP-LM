# DEBUG LỖI 500 KHI TẠO PAYMENT LINK

## 🔍 VẤN ĐỀ

Khi click "Xác nhận thanh toán" trên trang Order Summary, gặp lỗi:
```
Request failed with status code 500
POST /api/v1/payment/create-payment-link
```

## ✅ ĐÃ THÊM LOGGING

Đã thêm logging chi tiết vào `createPaymentLink` để debug:
- ✅ Log request body và user ID
- ✅ Log từng bước xử lý
- ✅ Log lỗi chi tiết với stack trace
- ✅ Kiểm tra PayOS config và credentials
- ✅ Log PayOS API errors

## 🔧 CÁCH DEBUG

### Bước 1: Kiểm tra Server Logs

Khi bạn click "Xác nhận thanh toán", kiểm tra console của backend server. Bạn sẽ thấy các log:

```
📝 [Payment] Creating payment link - Request body: {...}
📝 [Payment] User ID: ...
📝 [Payment] Parsed - product: {...} metadata: {...}
📝 [Payment] Resolved slotId: ...
...
```

**Nếu có lỗi, sẽ thấy:**
```
❌ [Payment] Error creating payment link: {...}
```

### Bước 2: Các Nguyên Nhân Có Thể

#### 1. **Thiếu PayOS Credentials**
**Dấu hiệu:**
```
❌ [Payment] Missing PayOS credentials
```

**Giải pháp:**
- Kiểm tra file `.env` trong `backend/` có các biến:
  - `PAYOS_CLIENT_ID`
  - `PAYOS_API_KEY`
  - `PAYOS_CHECKSUM_KEY`
- Hoặc kiểm tra trong `backend/.env.local`

#### 2. **PayOS SDK Không Được Khởi Tạo**
**Dấu hiệu:**
```
❌ [Payment] PayOS is not initialized
❌ [Payment] PayOS.paymentRequests.create is not a function
```

**Giải pháp:**
- Kiểm tra `backend/src/config/payos.js`
- Đảm bảo `@payos/node` package đã được cài đặt:
  ```bash
  cd backend
  npm install @payos/node
  ```

#### 3. **Database Error**
**Dấu hiệu:**
```
❌ [Payment] Database error: ...
```

**Giải pháp:**
- Kiểm tra MongoDB connection
- Kiểm tra Payment model có đúng schema không
- Kiểm tra các required fields

#### 4. **PayOS API Error**
**Dấu hiệu:**
```
❌ [Payment] PayOS API error: ...
```

**Giải pháp:**
- Kiểm tra PayOS credentials có đúng không
- Kiểm tra PayOS account có active không
- Kiểm tra network connection đến PayOS API

#### 5. **Invalid Amount**
**Dấu hiệu:**
```
❌ [Payment] Invalid amount: ...
```

**Giải pháp:**
- Kiểm tra slot có price không
- Kiểm tra product.unitPrice có được gửi từ frontend không

### Bước 3: Kiểm Tra Environment Variables

Chạy lệnh sau để kiểm tra (trong PowerShell):

```powershell
cd backend
node -e "require('dotenv').config(); console.log('PAYOS_CLIENT_ID:', process.env.PAYOS_CLIENT_ID ? 'SET' : 'NOT SET'); console.log('PAYOS_API_KEY:', process.env.PAYOS_API_KEY ? 'SET' : 'NOT SET'); console.log('PAYOS_CHECKSUM_KEY:', process.env.PAYOS_CHECKSUM_KEY ? 'SET' : 'NOT SET');"
```

Hoặc kiểm tra file `.env` trực tiếp:
```bash
# Trong backend/.env hoặc backend/.env.local
PAYOS_CLIENT_ID=your_client_id
PAYOS_API_KEY=your_api_key
PAYOS_CHECKSUM_KEY=your_checksum_key
```

### Bước 4: Test PayOS Connection

Tạo file test: `backend/test-payos.js`

```javascript
require('dotenv').config();
const PayOSModule = require("@payos/node");
const PayOS = PayOSModule.PayOS || PayOSModule;

const payOS = new PayOS(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY
);

console.log('PayOS initialized:', !!payOS);
console.log('Has paymentRequests:', !!payOS.paymentRequests);
console.log('Has create method:', typeof payOS.paymentRequests?.create === 'function');

// Test với order code đơn giản
const testOrder = {
  orderCode: Date.now(),
  amount: 100000,
  description: "Test payment",
  returnUrl: "http://localhost:3000/payment-success",
  cancelUrl: "http://localhost:3000/payment-cancel",
};

payOS.paymentRequests.create(testOrder)
  .then(result => {
    console.log('✅ PayOS test successful:', result.checkoutUrl ? 'Has checkoutUrl' : 'No checkoutUrl');
  })
  .catch(error => {
    console.error('❌ PayOS test failed:', error.message);
    console.error('Error details:', error.response?.data || error);
  });
```

Chạy test:
```bash
cd backend
node test-payos.js
```

## 📋 CHECKLIST DEBUG

- [ ] Backend server đang chạy
- [ ] Kiểm tra console logs của backend khi click thanh toán
- [ ] Kiểm tra PayOS credentials trong .env
- [ ] Kiểm tra MongoDB connection
- [ ] Kiểm tra @payos/node package đã cài
- [ ] Test PayOS connection với test script
- [ ] Kiểm tra network connection
- [ ] Kiểm tra slot có price không
- [ ] Kiểm tra authentication token có được gửi không

## 🎯 KẾT QUẢ MONG ĐỢI

Sau khi fix, logs sẽ hiển thị:
```
📝 [Payment] Creating payment link - Request body: {...}
📝 [Payment] User ID: 507f1f77bcf86cd799439011
📝 [Payment] Parsed - product: {...} metadata: {...}
📝 [Payment] Resolved slotId: 507f1f77bcf86cd799439012
📝 [Payment] Found slot: yes
📝 [Payment] Using slot price: 100000
📝 [Payment] Order object: {...}
📝 [Payment] Creating Payment record...
✅ [Payment] Payment record created: 507f1f77bcf86cd799439013
📝 [Payment] Calling PayOS API...
✅ [Payment] PayOS response received: has checkoutUrl
✅ [Payment] Payment link created successfully for orderCode: 1234567890
```

## ⚠️ LƯU Ý

1. **Development Mode**: 
   - Error message sẽ hiển thị chi tiết trong development
   - Production sẽ ẩn error details

2. **PayOS Sandbox**:
   - Nếu dùng sandbox, đảm bảo credentials là sandbox credentials
   - Test với số tiền nhỏ (100,000 VNĐ)

3. **Order Code**:
   - Order code phải là số nguyên (không phải string)
   - Dùng `Date.now()` để tạo unique order code

4. **Amount**:
   - Amount phải là số nguyên (VNĐ)
   - Tối thiểu thường là 1,000 VNĐ

## 📞 CẦN HỖ TRỢ

Nếu vẫn gặp lỗi sau khi kiểm tra tất cả:
1. Copy toàn bộ logs từ backend console
2. Copy error message từ frontend console
3. Kiểm tra PayOS dashboard xem có error logs không

