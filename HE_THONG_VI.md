# 💰 HỆ THỐNG VÍ CHO GIA SƯ

## ✅ ĐÚNG RỒI!

**Bạn hiểu đúng: Tạo thêm phần VÍ cho gia sư**

---

## 🎯 VÍ LÀ GÌ?

**Ví (Wallet) = Nơi giữ tiền tạm thời trong hệ thống**

```
Gia sư có tiền trong ví
   ↓
Gia sư xem số dư
   ↓
Gia sư rút tiền khi muốn
   ↓
Chuyển vào tài khoản ngân hàng
```

---

## 📊 CẤU TRÚC VÍ

### **Database: TutorProfile**

```javascript
{
  user: "userId123",
  
  // 💰 Phần VÍ
  earnings: {
    totalEarnings: 2,000,000,      // Tổng đã nhận
    availableBalance: 540,000,      // Số dư khả dụng (có thể rút)
    pendingBalance: 170,000,        // Đang chờ (chưa release)
    withdrawableBalance: 540,000    // Có thể rút ngay
  },
  
  // 🏦 Thông tin nhận tiền (có thể null)
  bankAccount: {
    accountNumber: "1234567890",
    bankName: "Vietcombank",
    accountName: "NGUYEN VAN A"
  }
}
```

---

## 🎮 LUỒNG HOẠT ĐỘNG

### **1. Booking hoàn thành**

```javascript
// Backend tự động
booking.status = "completed"
   ↓
Cron job release escrow sau 24h
   ↓
Tiền vào VÍ của gia sư
   ↓
earnings.availableBalance += 170,000 VNĐ
earnings.totalEarnings += 170,000 VNĐ
```

### **2. Gia sư xem ví**

```
Gia sư vào: /tutor/wallet

Hiển thị:
┌────────────────────────────┐
│      VÍ CỦA TÔI            │
├────────────────────────────┤
│ Số dư khả dụng:           │
│ 🔥 540,000 VNĐ             │
│                            │
│ Đang chờ:                   │
│ ⏳ 170,000 VNĐ              │
│                            │
│ [RÚT TIỀN]                 │
└────────────────────────────┘
```

### **3. Gia sư rút tiền**

```
Gia sư click "Rút tiền"
   ↓
Nếu CHƯA có STK:
   → Yêu cầu nhập STK
   
Nếu CÓ STK:
   → Hiển thị form:
     - Số tiền: 540,000 VNĐ
     - Tài khoản: ****890
     - Phí: 0 VNĐ (hoặc 3,000 VNĐ)
   → [XÁC NHẬN RÚT]
   ↓
Chuyển khoản vào STK
   ↓
Cập nhật: availableBalance = 0
```

---

## 🎨 UI VÍ

### **Wallet Page**

```javascript
// frontend/src/pages/Tutor/Wallet.js
import React, { useState, useEffect } from 'react';
import tutorService from '../../services/TutorService';

const TutorWallet = () => {
  const [earnings, setEarnings] = useState({
    availableBalance: 0,
    pendingBalance: 0,
    totalEarnings: 0
  });
  
  useEffect(() => {
    loadEarnings();
  }, []);
  
  const loadEarnings = async () => {
    const tutor = await tutorService.getMe();
    setEarnings({
      availableBalance: tutor.earnings?.availableBalance || 0,
      pendingBalance: tutor.earnings?.pendingBalance || 0,
      totalEarnings: tutor.earnings?.totalEarnings || 0
    });
  };
  
  return (
    <div className="wallet-page">
      <h1>💰 Ví của tôi</h1>
      
      {/* Balance Card */}
      <div className="balance-card">
        <div className="label">Số dư khả dụng</div>
        <div className="amount">
          {earnings.availableBalance.toLocaleString('vi-VN')} VNĐ
        </div>
        <button className="btn-withdraw">
          Rút tiền ngay
        </button>
      </div>
      
      {/* Pending */}
      {earnings.pendingBalance > 0 && (
        <div className="pending-card">
          <div className="label">⏳ Đang chờ</div>
          <div className="amount">
            {earnings.pendingBalance.toLocaleString('vi-VN')} VNĐ
          </div>
          <small>Tiền đang giữ trong escrow</small>
        </div>
      )}
      
      {/* Withdrawal History */}
      <div className="history-section">
        <h2>Lịch sử rút tiền</h2>
        {/* ... */}
      </div>
    </div>
  );
};

export default TutorWallet;
```

---

## 🔧 BACKEND IMPLEMENTATION

### **1. Update EscrowService**

```javascript
// backend/src/services/EscrowService.js
const TutorProfile = require("../models/TutorProfile");

static async releasePayment(bookingId) {
  const booking = await Booking.findById(bookingId)
    .populate("tutorProfile");
  
  // 1. Update booking
  booking.paymentStatus = "released";
  booking.status = "completed";
  booking.completedAt = new Date();
  await booking.save();
  
  // 2. 💰 Vào VÍ của gia sư
  await TutorProfile.updateOne(
    { _id: booking.tutorProfile._id },
    {
      $inc: {
        'earnings.availableBalance': booking.tutorPayout,
        'earnings.totalEarnings': booking.tutorPayout
      }
    }
  );
  
  // 3. Gửi notification
  await NotificationService.notifyTutorPaymentReleased(booking);
  
  // 4. Nếu có STK → Tự động chuyển
  const tutor = await TutorProfile.findById(booking.tutorProfile._id);
  if (tutor.bankAccount?.accountNumber) {
    // Auto transfer to bank
    await PayoutService.autoTransfer(tutor, booking.tutorPayout);
  }
}
```

### **2. Withdrawal Endpoint**

```javascript
// backend/src/routes/tutor.js
router.post("/wallet/withdraw", auth(), async (req, res) => {
  try {
    const { amount } = req.body;
    const tutorId = req.user.id;
    
    // 1. Lấy tutor profile
    const tutor = await TutorProfile.findOne({ user: tutorId });
    
    // 2. Check số dư
    const availableBalance = tutor.earnings?.availableBalance || 0;
    if (availableBalance < amount) {
      return res.status(400).json({
        message: `Không đủ số dư. Số dư: ${availableBalance}`
      });
    }
    
    // 3. Check có STK chưa
    if (!tutor.bankAccount?.accountNumber) {
      return res.status(400).json({
        message: "Vui lòng cập nhật số tài khoản ngân hàng",
        requiredAction: "update_bank_account"
      });
    }
    
    // 4. Tạo withdrawal request
    const withdrawal = await Withdrawal.create({
      tutor: tutorId,
      amount,
      bankAccount: tutor.bankAccount,
      status: "pending"
    });
    
    // 5. Trừ số dư (hoặc giữ lại đến khi hoàn thành)
    // await TutorProfile.updateOne(
    //   { _id: tutor._id },
    //   { $inc: { 'earnings.availableBalance': -amount } }
    // );
    
    // 6. Process withdrawal
    await PayoutService.processWithdrawal(withdrawal);
    
    res.json({
      message: "Yêu cầu rút tiền đã được gửi",
      withdrawal
    });
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
```

---

## 📱 NAVIGATION

```javascript
// Thêm vào menu sidebar
const TutorSidebar = () => (
  <nav>
    <Link to="/tutor/dashboard">Dashboard</Link>
    <Link to="/tutor/profile">Hồ sơ</Link>
    <Link to="/tutor/bookings">Lịch dạy</Link>
    <Link to="/tutor/wallet">💰 Ví của tôi</Link>
    <Link to="/tutor/settings">Cài đặt</Link>
  </nav>
);
```

---

## ✅ LỢI ÍCH

### **1. Không cần STK ngay**
```
✅ Gia sư đăng ký không cần STK
✅ Tiền vào ví an toàn
✅ Cập nhật STK sau
```

### **2. Tích lũy tiền**
```
Booking 1: +170k
Booking 2: +200k  
Booking 3: +150k
          --------
Tổng: 520k trong ví
→ Rút 1 lần, tiết kiệm phí
```

### **3. Linh hoạt**
```
✅ Xem số dư bất cứ lúc nào
✅ Rút khi nào muốn
✅ Nhiều phương thức rút (bank, Momo, etc.)
✅ Lịch sử giao dịch
```

---

## 🎯 TÓM TẮT

**Đúng vậy! Tạo thêm hệ thống VÍ cho gia sư:**

1. ✅ Tiền vào VÍ thay vì phải có STK ngay
2. ✅ Gia sư xem số dư trong app
3. ✅ Gia sư rút tiền khi muốn
4. ✅ Cập nhật STK khi rút lần đầu
5. ✅ Linh hoạt, tích lũy, tiết kiệm phí

**Đây là giải pháp CHUẨN cho marketplace!** 🎉

