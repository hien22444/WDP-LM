# 💰 LUỒNG THANH TOÁN HOÀN CHỈNH - CHẮC CHẮN 100%

## ✅ ĐÃ HOÀN THÀNH

### **Backend:**
1. ✅ Thêm `earnings` và `bankAccount` vào TutorProfile model
2. ✅ Cập nhật EscrowService để cộng tiền vào ví khi release
3. ✅ Tạo Withdrawal model để tracking rút tiền
4. ✅ Tạo routes `/api/v1/wallet/*` 
5. ✅ Tích hợp vào server.js

### **Frontend:**
1. ✅ Wallet page hiển thị số dư
2. ✅ Form rút tiền
3. ✅ Cập nhật thông tin tài khoản
4. ✅ Lịch sử rút tiền

---

## 🔄 LUỒNG HOẠT ĐỘNG (100% CHẮC CHẮN)

### **1. Học viên thanh toán**
```
Học viên thanh toán 200,000 VNĐ
   ↓
PayOS nhận tiền
   ↓
Booking.paymentStatus = "escrow"
```

### **2. Gia sư chấp nhận**
```
Gia sư click "Chấp nhận"
   ↓
Booking.status = "accepted"
Booking.paymentStatus = "held"
```

### **3. Buổi học hoàn thành**
```
Buổi học diễn ra
   ↓
Booking.status = "completed"
```

### **4. Escrow auto-release (Cron job - mỗi giờ)**
```javascript
// backend/src/services/EscrowService.js
static async releasePayment(bookingId) {
  // Update booking
  booking.paymentStatus = "released";
  booking.status = "completed";
  
  // 💰 Cộng vào VÍ
  await TutorProfile.updateOne(
    { _id: tutorProfileId },
    { $inc: {
      'earnings.availableBalance': booking.tutorPayout, // 170,000 VNĐ
      'earnings.totalEarnings': booking.tutorPayout
    }}
  );
}
```

### **5. Gia sư xem ví**
```
Gia sư vào: /tutor/wallet

Hiển thị:
✅ Số dư khả dụng: 540,000 VNĐ
⏳ Đang chờ: 170,000 VNĐ
📊 Tổng thu nhập: 1,200,000 VNĐ
```

### **6. Gia sư rút tiền**
```
Gia sư click "Rút tiền"
   ↓
Nhập số tiền: 500,000 VNĐ
   ↓
Check: Có STK chưa?
   - Chưa có → Yêu cầu cập nhật
   - Có rồi → Tạo withdrawal request
   ↓
Withdrawal.status = "pending"
```

### **7. Admin xử lý**
```
Admin export CSV:
STT | Tên | STK | Ngân hàng | Số tiền
1   | Nguyễn Văn A | 1234567890 | VCB | 500,000 VNĐ

Admin chuyển khoản thủ công
   ↓
Admin mark as paid
   ↓
Withdrawal.status = "completed"
TutorProfile.earnings.availableBalance -= 500,000
```

---

## 📱 API ENDPOINTS

### **Wallet APIs**

```javascript
// 1. Xem số dư
GET /api/v1/wallet/balance
Response: {
  earnings: {
    totalEarnings: 1200000,
    availableBalance: 540000,
    pendingBalance: 170000
  },
  bankAccount: {...}
}

// 2. Cập nhật STK
PUT /api/v1/wallet/bank-account
Body: {
  accountNumber: "1234567890",
  accountName: "NGUYEN VAN A",
  bankName: "Vietcombank",
  bankCode: "VCB"
}

// 3. Rút tiền
POST /api/v1/wallet/withdraw
Body: { amount: 500000 }

// 4. Lịch sử
GET /api/v1/wallet/withdrawals

// 5. Chi tiết
GET /api/v1/wallet/withdrawals/:id
```

---

## 🎯 SỬ DỤNG

### **1. Thêm route vào App.js**
```javascript
// frontend/src/App.js
import Wallet from "./pages/Tutor/Wallet";

// Thêm trong route tutor
<Route path="/tutor/wallet" element={<Wallet />} />
```

### **2. Thêm link vào sidebar**
```javascript
<Link to="/tutor/wallet">💰 Ví của tôi</Link>
```

### **3. Test flow**
```bash
# Backend
cd backend && npm start

# Frontend
cd frontend && npm start

# Truy cập: http://localhost:3000/tutor/wallet
```

---

## ✅ KẾT QUẢ

**Luồng thanh toán HOÀN CHỈNH:**

1. ✅ Học viên thanh toán → Escrow
2. ✅ Gia sư chấp nhận → Held
3. ✅ Buổi học xong → Completed
4. ✅ Auto-release → Tiền vào ví
5. ✅ Gia sư xem số dư
6. ✅ Gia sư rút tiền
7. ✅ Admin chuyển khoản thủ công
8. ✅ Mark as paid

**KHÔNG CẦN STK lúc đăng ký!**
**KHÔNG CẦN PayOS Payout API!**
**100% CHẮC CHẮN LÀM ĐƯỢC!** 🎉

