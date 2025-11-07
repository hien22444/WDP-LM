# LUỒNG TIỀN SAU KHI THANH TOÁN

## 💰 TỔNG QUAN

Khi học viên thanh toán thành công, tiền sẽ được xử lý theo cơ chế **Escrow (Ký gửi)** để bảo vệ cả học viên và gia sư.

---

## 📊 PHÂN BỔ TIỀN

### Ví dụ: Thanh toán 100,000 VNĐ

```
Tổng tiền thanh toán: 100,000 VNĐ
├─ Phí platform (15%): 15,000 VNĐ → Vào tài khoản platform
└─ Gia sư nhận (85%): 85,000 VNĐ → Vào ví gia sư (sau khi hoàn thành buổi học)
```

**Công thức:**
- `platformFee = price × 15%`
- `tutorPayout = price - platformFee`

---

## 🔄 LUỒNG TIỀN CHI TIẾT

### BƯỚC 1: Học viên thanh toán (Payment = PAID)

**Khi:** PayOS webhook xác nhận thanh toán thành công

**Điều gì xảy ra:**
1. ✅ Payment status = `PAID`
2. ✅ Tạo Booking từ slot (nếu có)
3. ✅ Booking status = `accepted` (tự động chấp nhận vì đã thanh toán)
4. ⚠️ **Tiền CHƯA vào ví gia sư ngay**

**Trạng thái tiền:**
- Tiền đang được **giữ (held)** trong hệ thống
- Chờ buổi học hoàn thành

---

### BƯỚC 2: Buổi học hoàn thành

**Khi:** Gia sư hoặc học viên xác nhận hoàn thành buổi học

**API:** `POST /api/v1/bookings/:id/complete`

**Điều gì xảy ra:**
1. ✅ Gọi `EscrowService.releasePayment()`
2. ✅ Booking status = `completed`
3. ✅ Payment status = `released`
4. 💰 **Cộng tiền vào ví gia sư:**
   ```javascript
   TutorProfile.updateOne(
     { _id: tutorProfileId },
     {
       $inc: {
         'earnings.availableBalance': tutorPayout,  // 85,000 VNĐ
         'earnings.totalEarnings': tutorPayout      // Tổng thu nhập
       }
     }
   );
   ```

**Kết quả:**
- Gia sư có thể rút tiền từ ví (`availableBalance`)
- Platform fee (15,000 VNĐ) được tính vào doanh thu platform

---

## 📍 TIỀN ĐI ĐÂU?

### 1. **Tiền vào ví gia sư (85%)**
- **Khi:** Sau khi buổi học hoàn thành
- **Vị trí:** `TutorProfile.earnings.availableBalance`
- **Gia sư có thể:**
  - Xem số dư trong trang `/tutor/wallet`
  - Rút tiền về tài khoản ngân hàng (nếu có tính năng withdrawal)

### 2. **Phí platform (15%)**
- **Khi:** Ngay khi thanh toán thành công
- **Vị trí:** Tính vào doanh thu platform (chưa có model riêng)
- **Mục đích:** Chi phí vận hành platform

---

## ⚠️ CÁC TRƯỜNG HỢP ĐẶC BIỆT

### 1. **Hủy booking trước giờ học**

**Nếu hủy >= 12 giờ trước:**
- Hoàn 100% cho học viên
- Không có tiền vào ví gia sư

**Nếu hủy < 12 giờ trước:**
- Hoàn 50% cho học viên
- 50% còn lại → Platform fee (15%) + Gia sư (35%)

### 2. **Tranh chấp (Dispute)**

**Khi:** Học viên hoặc gia sư mở tranh chấp

**Điều gì xảy ra:**
- Booking status = `disputed`
- Tiền vẫn được giữ trong escrow
- Chờ admin giải quyết:
  - Nếu giải quyết cho gia sư → `releasePayment()`
  - Nếu giải quyết cho học viên → `refundPayment()`

### 3. **Tự động giải phóng sau 24h**

**Nếu:** Buổi học hoàn thành nhưng chưa có ai xác nhận

**Sau 24h:**
- Tự động gọi `autoReleasePayment()`
- Tiền vào ví gia sư tự động

---

## 🔍 KIỂM TRA TRONG CODE

### File: `backend/src/services/EscrowService.js`

```javascript
// Tính toán phân bổ tiền
calculatePayouts(price) {
  platformFee = price × 15%
  tutorPayout = price - platformFee
}

// Giải phóng tiền cho gia sư
releasePayment(bookingId) {
  // Cộng vào ví gia sư
  TutorProfile.updateOne({
    $inc: {
      'earnings.availableBalance': tutorPayout,
      'earnings.totalEarnings': tutorPayout
    }
  })
}
```

### File: `backend/src/models/TutorProfile.js`

```javascript
earnings: {
  totalEarnings: Number,      // Tổng thu nhập
  availableBalance: Number,   // Số tiền có thể rút
  pendingBalance: Number,     // Tiền đang chờ (held)
  withdrawnAmount: Number     // Tổng đã rút
}
```

---

## 📋 VÍ DỤ THỰC TẾ

### Scenario: Thanh toán 100,000 VNĐ

**Bước 1: Thanh toán thành công**
```
Payment: status = "PAID"
Booking: status = "accepted", paymentStatus = "held"
Tiền: 100,000 VNĐ đang được giữ
```

**Bước 2: Hoàn thành buổi học**
```
Gia sư click "Hoàn thành"
→ EscrowService.releasePayment()
→ Booking: status = "completed", paymentStatus = "released"
→ TutorProfile.earnings.availableBalance += 85,000
→ TutorProfile.earnings.totalEarnings += 85,000
```

**Kết quả:**
- Gia sư nhận: **85,000 VNĐ** (vào ví)
- Platform fee: **15,000 VNĐ** (doanh thu platform)

---

## ⚠️ LƯU Ý QUAN TRỌNG

### 1. **Payment từ Slot không dùng Escrow**

**Hiện tại:**
- Khi thanh toán từ slot (webhook từ PayOS)
- Booking được tạo với status = "accepted" ngay
- **NHƯNG:** Không có `escrowAmount`, `platformFee`, `tutorPayout`
- **VẤN ĐỀ:** Tiền không được tính vào ví gia sư khi hoàn thành

**Cần sửa:**
- Khi tạo booking từ slot, cần tính escrow:
  ```javascript
  const payouts = EscrowService.calculatePayouts(slot.price);
  booking.escrowAmount = payouts.escrowAmount;
  booking.platformFee = payouts.platformFee;
  booking.tutorPayout = payouts.tutorPayout;
  booking.paymentStatus = "held";
  ```

### 2. **Platform fee chưa được lưu**

**Hiện tại:**
- Platform fee chỉ được tính nhưng chưa lưu vào model riêng
- Nên tạo model `PlatformRevenue` để theo dõi

### 3. **Rút tiền (Withdrawal)**

**Chưa có:**
- Chưa có API để gia sư rút tiền từ ví
- Cần implement:
  - `POST /api/v1/wallet/withdraw` - Yêu cầu rút tiền
  - Admin approve withdrawal
  - Chuyển tiền vào tài khoản ngân hàng

---

## ✅ TÓM TẮT

1. **Học viên thanh toán** → Tiền vào escrow (giữ)
2. **Buổi học hoàn thành** → Tiền được giải phóng:
   - 85% → Vào ví gia sư (`earnings.availableBalance`)
   - 15% → Phí platform
3. **Gia sư có thể rút** → Từ ví về tài khoản ngân hàng (nếu có tính năng)

---

## 🔧 CẦN SỬA

1. ✅ **Payment từ slot cần tính escrow** - Đang thiếu
2. ⚠️ **Platform revenue tracking** - Chưa có model
3. ⚠️ **Withdrawal system** - Chưa có tính năng rút tiền

