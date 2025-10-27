# 💸 CHUYỂN TIỀN CHO GIA SƯ - GIẢI THÍCH CHI TIẾT

## ⚠️ TÌNH HÌNH HIỆN TẠI

### **Hiện tại HỆ THỐNG CHƯA chuyển tiền thực sự!**

❌ **Chưa có:**
- Chưa tích hợp PayOS Payout API
- Chưa có hệ thống withdrawal (rút tiền)
- Chưa có banking integration

✅ **Có gì:**
- Update database: `paymentStatus = "released"`
- Tính toán: `tutorPayout = 170,000 VNĐ`
- Gửi email thông báo cho gia sư
- Cron job tự động "giải phóng" escrow

**Nhưng tiền vẫn chưa vào tài khoản gia sư thực sự!**

---

## 🎯 LUỒNG HIỆN TẠI

### **Bước 1: Học viên thanh toán**
```
Học viên trả 200,000 VNĐ → PayOS giữ
```

### **Bước 2: Escrow được "released"**
```javascript
// backend/src/services/EscrowService.js
static async releasePayment(bookingId) {
  // ✅ Cập nhật database
  booking.paymentStatus = "released";
  booking.status = "completed";
  booking.completedAt = new Date();
  await booking.save();

  // ✅ Gửi email cho gia sư
  await NotificationService.notifyTutorPaymentReleased(booking);
  
  // ❌ NHƯNG: Chưa chuyển tiền thực sự!
  // Tiền vẫn trong PayOS Gateway
  // Gia sư chưa nhận được tiền trong tài khoản ngân hàng
}
```

### **Bước 3: Tiền vẫn ở đâu?**
```
Tiền vẫn trong PayOS Gateway
        ↓
   Chưa được chuyển về
   tài khoản ngân hàng gia sư
```

---

## 🚀 CÁCH CHUYỂN TIỀN THỰC SỰ

### **Option 1: PayOS Payout API (Khuyến nghị)**

PayOS cung cấp API để chuyển tiền trực tiếp vào tài khoản ngân hàng.

#### **A. Tích hợp PayOS Payout**

```javascript
// backend/src/services/PayoutService.js
const payOS = require("../config/payos");

class PayoutService {
  // Chuyển tiền cho gia sư
  static async payoutToTutor(tutorId, amount, bankAccount) {
    try {
      // 1. Validate thông tin
      if (!bankAccount || !bankAccount.accountNumber) {
        throw new Error("Gia sư chưa cập nhật thông tin ngân hàng");
      }

      // 2. Gọi PayOS Payout API
      const payout = await payOS.payouts.create({
        amount: amount, // Số tiền (VNĐ)
        recipient: {
          accountNumber: bankAccount.accountNumber,
          accountName: bankAccount.accountName,
          bankCode: bankAccount.bankCode // VCB, TCB, etc.
        },
        description: `Thanh toán gia sư - Booking ${bookingId}`,
      });

      // 3. Lưu lại transaction
      await PayoutTransaction.create({
        tutorId,
        bookingId,
        amount,
        transactionId: payout.transactionId,
        status: 'pending'
      });

      return payout;

    } catch (error) {
      console.error("Payout error:", error);
      throw error;
    }
  }
}

module.exports = PayoutService;
```

#### **B. Cập nhật EscrowService**

```javascript
// backend/src/services/EscrowService.js
const PayoutService = require("./PayoutService");

static async releasePayment(bookingId) {
  const booking = await Booking.findById(bookingId)
    .populate("tutorProfile.user");
  
  // 1. Update database
  booking.paymentStatus = "released";
  booking.status = "completed";
  booking.completedAt = new Date();
  await booking.save();

  // 2. ⭐ CHUYỂN TIỀN THỰC SỰ
  try {
    const tutor = booking.tutorProfile;
    const bankAccount = tutor.bankAccount; // Cần thêm field này

    await PayoutService.payoutToTutor(
      tutor._id,
      booking.tutorPayout, // 170,000 VNĐ
      bankAccount
    );

    console.log(`✅ Paid ${booking.tutorPayout} VNĐ to tutor ${tutor._id}`);
  } catch (error) {
    console.error("Payout failed:", error);
    // Có thể retry sau
  }

  // 3. Gửi thông báo
  await NotificationService.notifyTutorPaymentReleased(booking);
}
```

---

### **Option 2: Hệ thống Withdrawal (Rút tiền)**

Cho phép gia sư yêu cầu rút tiền khi đạt số tiền tối thiểu.

#### **A. Thêm Payout Model**

```javascript
// backend/src/models/TutorPayout.js
const mongoose = require("mongoose");

const TutorPayoutSchema = new mongoose.Schema({
  tutor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ["pending", "processing", "completed", "failed"], 
    default: "pending" 
  },
  bankAccount: {
    accountNumber: String,
    accountName: String,
    bankCode: String
  },
  transactionId: String,
  processedAt: Date,
  metadata: {}
}, {
  timestamps: true
});

module.exports = mongoose.model("TutorPayout", TutorPayoutSchema);
```

#### **B. Withdrawal Endpoint**

```javascript
// backend/src/routes/payout.js
router.post("/withdraw", auth(), async (req, res) => {
  try {
    const { amount, bankAccount } = req.body;
    const tutorId = req.user.id;

    // 1. Kiểm tra số dư tối thiểu
    const earnings = await calculateTutorEarnings(tutorId);
    if (earnings.available < amount) {
      return res.status(400).json({ 
        message: "Không đủ số dư. Số dư khả dụng: " + earnings.available 
      });
    }

    // 2. Tạo yêu cầu rút tiền
    const payout = await TutorPayout.create({
      tutor: tutorId,
      amount,
      bankAccount,
      status: "pending"
    });

    // 3. Xử lý rút tiền (có thể dùng PayOS hoặc chuyển khoản thủ công)
    await processPayoutRequest(payout);

    res.json({ message: "Yêu cầu rút tiền đã được gửi", payout });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
```

---

### **Option 3: Chuyển khoản thủ công (Tạm thời)**

Nếu chưa có PayOS Payout API:

```javascript
// 1. Tạo report cho admin
const getTutorPayoutReport = async () => {
  const payouts = await Booking.find({
    paymentStatus: "released",
    // Chưa rút tiền
  }).populate("tutorProfile");

  return payouts.map(booking => ({
    tutorId: booking.tutorProfile._id,
    tutorName: booking.tutorProfile.user.full_name,
    bankAccount: booking.tutorProfile.bankAccount,
    amount: booking.tutorPayout,
    bookingId: booking._id
  }));
};

// 2. Admin chuyển khoản thủ công dựa trên report
// Export CSV → Chuyển khoản → Mark as completed
```

---

## 📋 THÊM THÔNG TIN NGÂN HÀNG CHO GIA SƯ

### **A. Cập nhật TutorProfile Model**

```javascript
// backend/src/models/TutorProfile.js
const TutorProfileSchema = new mongoose.Schema({
  // ... existing fields
  bankAccount: {
    accountNumber: String,
    accountName: String,
    bankName: String, // Vietcombank, Techcombank, etc.
    bankCode: String, // VCB, TCB, etc.
    branch: String
  },
  earnings: {
    totalEarnings: { type: Number, default: 0 },
    availableBalance: { type: Number, default: 0 },
    pendingBalance: { type: Number, default: 0 }
  }
});
```

### **B. UI để gia sư cập nhật**

```javascript
// frontend/src/pages/Tutor/PayoutSettings.js
const PayoutSettings = () => {
  const [bankAccount, setBankAccount] = useState({
    accountNumber: "",
    accountName: "",
    bankName: "",
  });

  const handleUpdate = async () => {
    await tutorService.updateBankAccount(bankAccount);
  };

  return (
    <div>
      <h2>Thông tin ngân hàng nhận tiền</h2>
      <input 
        placeholder="Số tài khoản"
        value={bankAccount.accountNumber}
        onChange={e => setBankAccount({...bankAccount, accountNumber: e.target.value})}
      />
      {/* ... other fields */}
    </div>
  );
};
```

---

## 🎯 LUỒNG HOÀN CHỈNH SAU KHI TÍCH HỢP

### **1. Học viên thanh toán**
```
200,000 VNĐ → PayOS Gateway
```

### **2. Gia sư chấp nhận**
```
Payment: "held"
```

### **3. Buổi học hoàn thành**
```
Status: "completed"
```

### **4. Auto-release sau 24h**
```javascript
await EscrowService.releasePayment(bookingId);
// → Tự động chuyển 170,000 VNĐ vào tài khoản gia sư
```

### **5. Gia sư nhận tiền**
```
✅ 170,000 VNĐ vào tài khoản ngân hàng
✅ 30,000 VNĐ vào tài khoản platform
```

---

## ⚙️ CẤU HÌNH CẦN THIẾT

### **1. PayOS Dashboard**
```env
# Thêm vào .env
PAYOS_PAYOUT_API_KEY=xxx
PAYOS_BANKING_ACCOUNT=xxx
```

### **2. Database Migration**
```javascript
// Thêm field bankAccount vào TutorProfile
db.tutor_profiles.updateMany(
  {},
  { $set: { 
    "bankAccount": null,
    "earnings.totalEarnings": 0,
    "earnings.availableBalance": 0
  }}
);
```

---

## 🚨 LƯU Ý QUAN TRỌNG

### **1. Thời gian xử lý**
- PayOS Payout: 1-3 ngày làm việc
- Phí giao dịch: ~3,000 VNĐ/chuyển khoản

### **2. Số tiền tối thiểu**
- Nên set: Tối thiểu 500,000 VNĐ mới cho phép rút
- Tránh rút tiền lẻ nhiều lần

### **3. Phí platform**
- 15% được thu trước khi chuyển cho gia sư
- Hoặc thu sau khi gia sư nhận được 85%

---

## 💡 KHUYẾN NGHỊ

### **Giai đoạn 1: MVP**
- Dùng chuyển khoản thủ công
- Admin export report → Chuyển khoản

### **Giai đoạn 2: Tự động**
- Tích hợp PayOS Payout API
- Auto transfer khi release escrow

### **Giai đoạn 3: Nâng cao**
- Hệ thống withdrawal tự động
- Nhiều phương thức thanh toán
- Instant payout

---

## 📊 TÓM TẮT

**Hiện tại:** Chỉ update database, chưa chuyển tiền thực
**Cần làm:** Tích hợp PayOS Payout API hoặc hệ thống withdrawal
**Ưu tiên:** Bổ sung thông tin ngân hàng, tạo PayoutService

**Kế hoạch:**
1. Thêm bankAccount field vào TutorProfile
2. Tạo PayoutService.js
3. Tích hợp vào EscrowService.releasePayment()
4. Test với PayOS sandbox
5. Deploy production

