# 💰 ESCROW - GIẢI THÍCH CHI TIẾT

## 🔍 ESCROW LÀ GÌ?

**Escrow** là một cơ chế bảo vệ tiền của cả học viên và gia sư:
- **Học viên**: Tiền được giữ an toàn, chỉ trả khi hài lòng
- **Gia sư**: Đảm bảo nhận tiền đúng hạn (không bị lừa)
- **Platform**: Quản lý giao dịch minh bạch và công bằng

---

## 📊 TRẠNG THÁI ESCROW

### 1. **`escrow`** - Tiền được giữ ban đầu
```javascript
// Khi học viên thanh toán xong
{
  paymentStatus: "escrow",
  escrowAmount: 200000,
  platformFee: 30000,
  tutorPayout: 170000
}
```
**Ý nghĩa:**
- Tiền đã được học viên trả
- Đang giữ trong PayOS Gateway
- Chưa ai nhận được tiền
- Chờ gia sư chấp nhận

**Dòng tiền:**
```
Học viên trả 200,000 VNĐ
        ↓
    PayOS Gateway (đang giữ)
        ↓
   Chờ gia sư chấp nhận
```

---

### 2. **`held`** - Tiền được khóa chặt
```javascript
// Sau khi gia sư chấp nhận
{
  paymentStatus: "held",
  status: "accepted"
}
```
**Ý nghĩa:**
- Gia sư đã chấp nhận
- Tiền vẫn giữ trong PayOS
- Đã lên lịch buổi học
- Không thể hủy dễ dàng

**Dòng tiền:**
```
Tiền vẫn trong PayOS Gateway
        ↓
   Đã khóa chặt hơn
        ↓
   Chờ buổi học diễn ra
```

---

### 3. **`released`** - Tiền đã được giải phóng
```javascript
// Sau khi buổi học hoàn thành + auto-release sau 24h
{
  paymentStatus: "released",
  status: "completed"
}
```
**Ý nghĩa:**
- Buổi học đã hoàn thành
- Tiền đã được chia
- Gia sư nhận 85%
- Platform nhận 15%

**Dòng tiền:**
```
200,000 VNĐ
        ↓
    ┌───┴───┐
    ↓       ↓
85%        15%
(170,000)  (30,000)
    ↓       ↓
  Gia sư  Platform
```

---

### 4. **`refunded`** - Đã hoàn tiền
```javascript
// Khi hủy hoặc tranh chấp
{
  paymentStatus: "refunded",
  status: "cancelled",
  refundAmount: 200000
}
```
**Ý nghĩa:**
- Tiền đã hoàn về học viên
- Gia sư không nhận được tiền
- Platform không thu phí

---

## 💻 CODE ESCROW SERVICE

### **1. Tính toán phí platform**
```javascript
// EscrowService.calculatePayouts(price)
static calculatePayouts(price) {
  const platformFeeRate = 0.15; // 15%
  const platformFee = Math.round(price * platformFeeRate);
  const tutorPayout = price - platformFee;
  
  return {
    escrowAmount: price,      // Tổng tiền giữ
    platformFee,              // 15% cho platform
    tutorPayout               // 85% cho gia sư
  };
}

// Ví dụ: Buổi học 200,000 VNĐ
// → escrowAmount: 200,000
// → platformFee: 30,000
// → tutorPayout: 170,000
```

---

### **2. Giải phóng escrow tự động**
```javascript
// Chạy mỗi giờ (cron job)
static async autoReleaseEscrow() {
  // Tìm bookings đã completed hơn 24h
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const bookingsToRelease = await Booking.find({
    status: "completed",
    paymentStatus: "held",
    completedAt: { $lte: twentyFourHoursAgo }
  });

  // Giải phóng tiền cho từng booking
  for (const booking of bookingsToRelease) {
    await EscrowService.releasePayment(booking._id);
    
    // Gửi thông báo cho gia sư
    await NotificationService.notifyTutorPaymentReleased(booking);
  }
}
```

---

## 🎯 VÍ DỤ THỰC TẾ

### **Case 1: Buổi học thành công**

```
1. Học viên đặt lịch: 200,000 VNĐ
   → Payment: "escrow"
   
2. Gia sư chấp nhận
   → Payment: "held"
   
3. Buổi học diễn ra
   → Status: "completed"
   
4. Sau 24h tự động giải phóng
   → Payment: "released"
   → Gia sư nhận: 170,000 VNĐ
   → Platform nhận: 30,000 VNĐ
```

---

### **Case 2: Học viên hủy booking**

```
1. Học viên đặt lịch: 200,000 VNĐ
   → Payment: "escrow"
   
2. Học viên hủy (trước 24h)
   → EscrowService.refundPayment(bookingId)
   → Payment: "refunded"
   → Học viên nhận lại: 200,000 VNĐ
   → Gia sư: 0 VNĐ
   → Platform: 0 VNĐ
```

---

### **Case 3: Tranh chấp**

```
1. Buổi học diễn ra nhưng có vấn đề
   → Status: "completed"
   → Payment: "held"
   
2. Học viên mở tranh chấp
   → Status: "disputed"
   → Payment: vẫn "held"
   
3. Admin xem xét
   → Quyết định: Refund (gia sư sai)
   → Payment: "refunded"
   → Học viên: hoàn 200,000 VNĐ
   → Gia sư: 0 VNĐ
   → Platform: -30,000 VNĐ (mất phí)
```

---

## 🔐 BẢO MẬT

### **1. Validation**
```javascript
// Chỉ release khi đúng trạng thái
if (booking.paymentStatus !== "held") {
  throw new Error("Payment must be held before release");
}
```

### **2. Không thể double release**
```javascript
// Sau khi release, status = "released"
// Không thể release lần nữa
if (booking.paymentStatus === "released") {
  return; // Đã release rồi
}
```

### **3. Audit trail**
```javascript
// Lưu lại lịch sử
{
  paymentStatus: "released",
  completedAt: new Date(),
  releasedBy: "system" // hoặc "student" hoặc "admin"
}
```

---

## 📈 THỐNG KÊ ESCROW

```javascript
// Get escrow stats for admin
const stats = await Booking.aggregate([
  {
    $group: {
      _id: "$paymentStatus",
      count: { $sum: 1 },
      totalAmount: { $sum: "$escrowAmount" }
    }
  }
]);

// Kết quả:
// [
//   { _id: "escrow", count: 10, totalAmount: 2000000 },
//   { _id: "held", count: 25, totalAmount: 5000000 },
//   { _id: "released", count: 100, totalAmount: 20000000 }
// ]
```

---

## ⚡ CRON JOB - AUTO RELEASE

```javascript
// backend/src/services/CronService.js
static async autoReleaseEscrow() {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const bookingsToRelease = await Booking.find({
    status: "completed",
    paymentStatus: "held",
    completedAt: { $lte: twentyFourHoursAgo }
  });

  for (const booking of bookingsToRelease) {
    await EscrowService.releasePayment(booking._id);
  }
  
  console.log(`Released ${bookingsToRelease.length} escrows`);
}
```

**Chạy tự động mỗi giờ** trong production!

---

## 🎉 KẾT LUẬN

**Escrow đảm bảo:**
- ✅ Học viên an tâm thanh toán trước
- ✅ Gia sư nhận tiền đúng hạn
- ✅ Platform minh bạch
- ✅ Tự động hóa hoàn toàn

**Không cần can thiệp thủ công!** 🚀

