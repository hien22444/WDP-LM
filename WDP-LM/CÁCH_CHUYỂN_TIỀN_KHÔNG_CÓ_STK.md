# 💰 5 CÁCH CHUYỂN TIỀN KHI KHÔNG CÓ STK

## 🎯 VẤN ĐỀ

Gia sư đăng ký nhưng **KHÔNG cung cấp số tài khoản ngân hàng**. Làm sao chuyển tiền?

---

## ✅ GIẢI PHÁP 1: CẬP NHẬT SAU (ĐƠN GIẢN NHẤT)

### **A. Thêm field vào TutorProfile**

```javascript
// backend/src/models/TutorProfile.js
const TutorProfileSchema = new mongoose.Schema({
  // ... existing fields
  
  // Payout information (có thể null)
  bankAccount: {
    accountNumber: String,
    accountName: String,
    bankName: String, // Vietcombank, Techcombank, etc.
    bankCode: String, // VCB, TCB, etc.
    branch: String
  },
  
  // Wallet balance (tiền đang giữ)
  earnings: {
    totalEarnings: { type: Number, default: 0 },
    availableBalance: { type: Number, default: 0 },
    pendingBalance: { type: Number, default: 0 }
  }
});
```

### **B. Tạo UI để gia sư cập nhật**

```javascript
// frontend/src/pages/Tutor/PayoutSettings.js
import React, { useState } from 'react';
import tutorService from '../../services/TutorService';

const PayoutSettings = () => {
  const [bankAccount, setBankAccount] = useState({
    accountNumber: '',
    accountName: '',
    bankName: '',
    bankCode: ''
  });
  
  const handleUpdate = async () => {
    await tutorService.updatePayoutSettings(bankAccount);
    alert('Đã cập nhật thông tin nhận tiền!');
  };
  
  return (
    <div>
      <h2>Thông tin nhận tiền</h2>
      
      <select onChange={e => setBankAccount({...bankAccount, bankName: e.target.value})}>
        <option value="">Chọn ngân hàng</option>
        <option value="Vietcombank">Vietcombank (VCB)</option>
        <option value="Techcombank">Techcombank (TCB)</option>
        <option value="BIDV">BIDV</option>
        <option value="Agribank">Agribank</option>
        <option value="Sacombank">Sacombank</option>
      </select>
      
      <input 
        placeholder="Số tài khoản"
        value={bankAccount.accountNumber}
        onChange={e => setBankAccount({...bankAccount, accountNumber: e.target.value})}
      />
      
      <input 
        placeholder="Tên chủ tài khoản"
        value={bankAccount.accountName}
        onChange={e => setBankAccount({...bankAccount, accountName: e.target.value})}
      />
      
      <button onClick={handleUpdate}>Cập nhật</button>
    </div>
  );
};
```

### **C. Lưu tiền vào ví (nếu chưa có STK)**

```javascript
// backend/src/services/EscrowService.js
static async releasePayment(bookingId) {
  const booking = await Booking.findById(bookingId)
    .populate("tutorProfile");
  
  booking.paymentStatus = "released";
  await booking.save();
  
  // Kiểm tra xem gia sư có STK chưa
  if (tutor.bankAccount?.accountNumber) {
    // Có STK → Chuyển tiền ngay
    await PayoutService.transferToBank(
      tutor.bankAccount,
      booking.tutorPayout
    );
  } else {
    // Chưa có STK → Vào ví
    await TutorProfile.updateOne(
      { _id: tutor._id },
      { $inc: { 'earnings.availableBalance': booking.tutorPayout } }
    );
    
    // Gửi email nhắc cập nhật STK
    await NotificationService.notifyTutorUpdateBankAccount(tutor, booking.tutorPayout);
  }
}
```

**Email gửi cho gia sư:**
```
Chúc mừng! Bạn đã nhận được 170,000 VNĐ

Hiện tại tiền đang được giữ trong ví của bạn.
Để rút tiền, vui lòng cập nhật thông tin tài khoản ngân hàng.

[Số dư hiện tại: 170,000 VNĐ]
[CẬP NHẬT TÀI KHOẢN NGAY]
```

---

## ✅ GIẢI PHÁP 2: VÍ ĐIỆN TỬ (MOMO, ZALOPAY)

### **Tích hợp Momo e-Wallet**

```javascript
// backend/src/services/EWalletService.js
class EWalletService {
  // Chuyển tiền qua Momo
  static async transferToMomo(phoneNumber, amount) {
    // Call Momo API
    const response = await momoAPI.transfer({
      phone: phoneNumber,
      amount: amount,
      description: "Thanh toán gia sư"
    });
    
    return response;
  }
  
  // Chuyển tiền qua ZaloPay
  static async transferToZaloPay(phoneNumber, amount) {
    // Call ZaloPay API
    const response = await zaloPayAPI.transfer({
      phone: phoneNumber,
      amount: amount
    });
    
    return response;
  }
}
```

### **Backend API**

```javascript
// backend/src/routes/tutor.js
router.post("/payout/momo", auth(), async (req, res) => {
  const { phoneNumber } = req.body;
  const tutor = req.user;
  
  // Check số dư
  const balance = tutor.earnings?.availableBalance || 0;
  if (balance < req.body.amount) {
    return res.status(400).json({ message: "Không đủ số dư" });
  }
  
  // Chuyển qua Momo
  const result = await EWalletService.transferToMomo(
    phoneNumber,
    req.body.amount
  );
  
  // Trừ số dư
  await TutorProfile.updateOne(
    { user: tutor._id },
    { $inc: { 'earnings.availableBalance': -req.body.amount } }
  );
  
  res.json({ message: "Đã chuyển tiền qua Momo", transaction: result });
});
```

**Ưu điểm:**
- ✅ Không cần STK
- ✅ Chuyển nhanh (vài phút)
- ✅ Tiện lợi

**Nhược điểm:**
- ❌ Phí ~5,000 VNĐ/lần
- ❌ Cần tích hợp API
- ❌ Gia sư cần có ví điện tử

---

## ✅ GIẢI PHÁP 3: INTERNAL WALLET (VÍ TRONG HỆ THỐNG)

### **Gia sư sử dụng ví trong app**

```javascript
// frontend/src/pages/Tutor/Wallet.js
const TutorWallet = () => {
  const [balance, setBalance] = useState(0);
  
  useEffect(() => {
    loadBalance();
  }, []);
  
  const loadBalance = async () => {
    const tutor = await tutorService.getMe();
    setBalance(tutor.earnings?.availableBalance || 0);
  };
  
  return (
    <div>
      <h2>Ví của tôi</h2>
      
      <div className="balance-card">
        <h3>Số dư khả dụng</h3>
        <h1>{balance.toLocaleString('vi-VN')} VNĐ</h1>
      </div>
      
      <div className="withdraw-options">
        <button onClick={showBankForm}>
          Chuyển qua ngân hàng
        </button>
        <button onClick={showMomoForm}>
          Chuyển qua Momo
        </button>
        <button onClick={showQRCode}>
          Nhận qua Mã QR
        </button>
      </div>
    </div>
  );
};
```

**Tiền tích lũy:**
```
Booking 1: +170,000 VNĐ (chưa có STK)
Booking 2: +170,000 VNĐ (chưa có STK)
Booking 3: +200,000 VNĐ (chưa có STK)
                      ↓
          Tổng: 540,000 VNĐ trong ví
                      ↓
          Gia sư có thể rút khi muốn
```

---

## ✅ GIẢI PHÁP 4: YÊU CẦU KHI NHẬN TIỀN ĐẦU TIÊN

### **Nhắc cập nhật khi có tiền**

```javascript
// backend/src/services/EscrowService.js
static async releasePayment(bookingId) {
  // ... release logic
  
  if (!tutor.bankAccount) {
    // Gửi email + SMS
    await NotificationService.urgentNotifyTutorUpdateBankAccount(tutor);
    
    // TODO: Chuyển tiền sau khi gia sư cập nhật
  }
}
```

**Email:**
```
🔥 URGENT: Bạn vừa nhận được 170,000 VNĐ!

NHƯNG: Bạn chưa cập nhật số tài khoản nhận tiền.

→ Vui lòng cập nhật NGAY để nhận tiền:
[CẬP NHẬT STK BÂY GIỜ]

Nếu không cập nhật trong 30 ngày, tiền sẽ bị hoàn trả.
```

---

## ✅ GIẢI PHÁP 5: HỖ TRỢ THỦ CÔNG

### **Admin liên hệ gia sư**

```javascript
// Admin dashboard
const PendingPayouts = () => {
  const [pending, setPending] = useState([]);
  
  useEffect(() => {
    loadPendingPayouts();
  }, []);
  
  return (
    <div>
      <h2>Chờ gia sư cập nhật STK</h2>
      
      {pending.map(p => (
        <div key={p._id}>
          <p>{p.tutorName}: {p.amount.toLocaleString()} VNĐ</p>
          <button onClick={() => contactTutor(p.tutorPhone)}>
            Gọi điện nhắc
          </button>
          <button onClick={() => skipPayment(p._id)}>
            Bỏ qua (hoàn tiền)
          </button>
        </div>
      ))}
    </div>
  );
};
```

---

## 📊 SO SÁNH CÁC GIẢI PHÁP

| Giải pháp | Dễ làm | Chi phí | Nhanh | Phù hợp |
|-----------|--------|---------|-------|---------|
| 1. Cập nhật sau | ✅✅ | Miễn phí | ⚠️ Chậm | MVP |
| 2. Ví điện tử | ⚠️ Khó | ~5k/lần | ✅ Nhanh | Scale |
| 3. Internal wallet | ⚠️ Trung bình | Miễn phí | ⚠️ Chậm | Tất cả |
| 4. Yêu cầu urgent | ✅ Dễ | Miễn phí | ⚠️ Chậm | Production |
| 5. Hỗ trợ thủ công | ✅ Dễ | Miễn phí | ❌ Rất chậm | Startup |

---

## 🎯 KHUYẾN NGHỊ

### **Kết hợp 3 giải pháp:**

1. **Internal Wallet** (ngay bây giờ)
   - Tiền vào ví khi chưa có STK
   - Hiển thị số dư trong app

2. **Nhắc cập nhật** (sau 1-2 tuần)
   - Email urgent
   - In-app notification
   - SMS nhắc

3. **Cập nhật khi rút**
   - Form cập nhật STK
   - Validate trước khi rút
   - Chuyển tiền ngay

---

## 🚀 IMPLEMENTATION

Tôi có thể implement ngay:

1. Thêm `bankAccount` và `earnings` vào TutorProfile
2. Tạo wallet page cho gia sư
3. Logic giữ tiền trong ví nếu chưa có STK
4. UI cập nhật STK
5. Email notification

Bạn muốn tôi làm ngay không? 🤔

