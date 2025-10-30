# 🏦 SETUP TÀI KHOẢN NGÂN HÀNG CHO HỆ THỐNG

## 📋 TỔNG QUAN

Để hệ thống có thể nhận tiền và chuyển cho gia sư, bạn cần:

1. **Tài khoản ngân hàng của BẠN** (để nhận tiền từ PayOS)
2. **Kết nối PayOS** với tài khoản ngân hàng
3. **Tài khoản của gia sư** (để chuyển tiền cho họ)

---

## 🎯 BƯỚC 1: MỞ TÀI KHOẢN NGÂN HÀNG

### **A. Tài khoản CÁ NHÂN (Nếu bạn là cá nhân)**

**Ngân hàng phù hợp:**
- Vietcombank (VCB)
- Techcombank (TCB)
- VIB
- ACB

**Giấy tờ cần:**
- CMND/CCCD
- Số điện thoại
- Email

**Phí:**
- Miễn phí mở tài khoản
- Phí quản lý: 12,000 VNĐ/năm

### **B. Tài khoản DOANH NGHIỆP (Khuyến nghị)**

**Giấy tờ cần:**
1. Giấy phép đăng ký kinh doanh
2. CMND người đại diện pháp luật
3. Con dấu công ty
4. Mẫu chữ ký
5. Giấy đề nghị mở tài khoản

**Phí:**
- Phí mở tài khoản: 200,000 - 500,000 VNĐ
- Phí quản lý: 50,000 - 200,000 VNĐ/tháng

**Lưu ý:**
- Cần có mặt trực tiếp tại ngân hàng
- Thời gian: 3-7 ngày làm việc

---

## 🎯 BƯỚC 2: ĐĂNG KÝ PAYOS

### **1. Đăng ký tài khoản**

```
Truy cập: https://payos.vn
Click: "Đăng ký ngay"
Chọn: "Tài khoản Business"
```

### **2. Xác thực doanh nghiệp**

**Thông tin cần điền:**
```
- Tên doanh nghiệp
- Mã số thuế
- Địa chỉ
- Số điện thoại
- Email
- Website
```

**Upload giấy tờ:**
```
✅ Giấy phép kinh doanh
✅ CMND/CCCD người đại diện
✅ Con dấu (nếu có)
```

### **3. Kết nối tài khoản ngân hàng**

**Trên PayOS Dashboard:**
1. Vào "Cài đặt tài khoản"
2. Chọn "Kết nối ngân hàng"
3. Điền thông tin:
   ```
   Số tài khoản: 1234567890123
   Chủ tài khoản: NGUYEN VAN A
   Tên ngân hàng: Vietcombank
   Chi nhánh: Hà Nội
   ```
4. Xác thực (có thể cần chuyển khoản test 10,000 VNĐ)

### **4. Nhận API keys**

Sau khi xác thực, PayOS sẽ cung cấp:
```
PAYOS_CLIENT_ID=abc123...
PAYOS_API_KEY=xyz789...
PAYOS_CHECKSUM_KEY=def456...
```

---

## 🎯 BƯỚC 3: CẤU HÌNH TRONG HỆ THỐNG

### **File: `.env`**

```env
# PayOS Configuration
PAYOS_CLIENT_ID=your_client_id
PAYOS_API_KEY=your_api_key
PAYOS_CHECKSUM_KEY=your_checksum_key

# Tài khoản ngân hàng của bạn (Platform)
PLATFORM_BANK_ACCOUNT=1234567890123
PLATFORM_BANK_NAME=Vietcombank
PLATFORM_ACCOUNT_NAME=NGUYEN VAN A

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Email
ADMIN_EMAIL=admin@yourdomain.com
```

### **File: `backend/src/config/payos.js`**

```javascript
const PayOSModule = require("@payos/node");
const PayOS = PayOSModule.PayOS || PayOSModule;

const payOS = new PayOS(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY
);

// Thêm cấu hình payout (nếu PayOS hỗ trợ)
const payoutConfig = {
  defaultBankAccount: {
    accountNumber: process.env.PLATFORM_BANK_ACCOUNT,
    bankName: process.env.PLATFORM_BANK_NAME
  }
};

module.exports = payOS;
```

---

## 💰 LUỒNG TIỀN THỰC TẾ

### **Scenario 1: Nhận tiền từ học viên**

```
1. Học viên thanh toán 200,000 VNĐ
   ↓
2. PayOS nhận tiền
   ↓
3. PayOS chuyển vào tài khoản ngân hàng CỦA BẠN
   💰 Số dư: +200,000 VNĐ
   ↓
4. Bạn có tiền trong tài khoản
```

### **Scenario 2: Chia tiền sau khi buổi học hoàn thành**

```
Tiền trong tài khoản BẠN: 200,000 VNĐ
        ↓
Chia tiền:
- 15% (30,000 VNĐ) → GIỮ LẠI (phí platform)
- 85% (170,000 VNĐ) → CHUYỂN cho gia sư
        ↓
Bạn chuyển khoản thủ công cho gia sư:
💰 Từ tài khoản BẠN → Tài khoản GIA SƯ
```

---

## 🔧 SETUP CHUYỂN TIỀN CHO GIA SƯ

### **Cách 1: Chuyển khoản thủ công (Hiện tại)**

```javascript
// backend/src/routes/admin.js
router.post("/payouts/manual", auth(["admin"]), async (req, res) => {
  const { bookingId, tutorBankAccount } = req.body;
  
  const booking = await Booking.findById(bookingId);
  
  // 1. Lưu thông tin chuyển khoản
  await PayoutTransaction.create({
    bookingId,
    tutorId: booking.tutorProfile,
    amount: booking.tutorPayout, // 170,000 VNĐ
    bankAccount: tutorBankAccount,
    status: "pending",
    method: "manual_transfer"
  });
  
  // 2. Admin chuyển khoản thủ công
  // - Đăng nhập internet banking
  // - Chuyển khoản cho gia sư
  // - Cập nhật status = "completed"
  
  res.json({ 
    message: "Đã ghi nhận yêu cầu chuyển khoản",
    instructions: `
      Chuyển ${booking.tutorPayout} VNĐ đến:
      STK: ${tutorBankAccount.accountNumber}
      Chủ TK: ${tutorBankAccount.accountName}
      Nội dung: Booking ${bookingId}
    `
  });
});
```

### **Cách 2: Export CSV để chuyển khoản**

```javascript
// backend/src/routes/admin.js
router.get("/payouts/export", auth(["admin"]), async (req, res) => {
  const payouts = await Booking.find({
    paymentStatus: "released",
    payoutStatus: "pending"
  }).populate("tutorProfile");
  
  // Export CSV
  const csv = [
    ["STT", "Tên gia sư", "Số tài khoản", "Ngân hàng", "Số tiền"],
    ...payouts.map((b, i) => [
      i + 1,
      b.tutorProfile.user.full_name,
      b.tutorProfile.bankAccount?.accountNumber || "",
      b.tutorProfile.bankAccount?.bankName || "",
      b.tutorPayout
    ])
  ];
  
  res.csv(csv, "payouts.csv");
});
```

---

## 📊 VÍ DỤ CỤ THỂ

### **Tài khoản của BẠN:**
```
STK: 1234567890
Ngân hàng: Vietcombank
Chủ TK: NGUYEN VAN A
```

### **Gia sư cần cập nhật:**
```
STK: 9876543210
Ngân hàng: Techcombank
Chủ TK: TRAN THI B
```

### **Quy trình:**
```
1. Học viên đặt lịch 200,000 VNĐ
   → PayOS nhận tiền
   → Vào STK 1234567890 (TÀI KHOẢN CỦA BẠN)

2. Buổi học hoàn thành
   → Escrow released
   
3. Bạn chuyển từ STK 1234567890:
   - 170,000 VNĐ → STK 9876543210 (gia sư)
   - 30,000 VNĐ → GIỮ LẠI (phí platform)
```

---

## ✅ CHECKLIST

### **1. Tài khoản ngân hàng cá nhân/doanh nghiệp**
- [ ] Đã mở tài khoản
- [ ] Đã kích hoạt internet banking
- [ ] Đã có tên tài khoản đầy đủ

### **2. PayOS**
- [ ] Đã đăng ký tài khoản PayOS
- [ ] Đã xác thực doanh nghiệp
- [ ] Đã kết nối tài khoản ngân hàng với PayOS
- [ ] Đã nhận API keys

### **3. Hệ thống**
- [ ] Đã thêm API keys vào `.env`
- [ ] Đã test kết nối PayOS
- [ ] Đã tạo form để gia sư cập nhật thông tin ngân hàng

---

## 🚨 LƯU Ý

### **1. Thuế**
- Phí platform (15%) cần khai báo thuế
- Có thể cần phát hành hóa đơn

### **2. Bảo mật**
- Không lộ thông tin tài khoản trong code
- Dùng environment variables
- Mã hóa thông tin nhạy cảm

### **3. Backup**
- Sao lưu thông tin giao dịch
- Log mọi chuyển khoản
- Có audit trail

---

## 📞 HỖ TRỢ

Nếu cần hỗ trợ:
1. **PayOS**: https://payos.vn/support
2. **Ngân hàng**: Gọi tổng đài 24/7
3. **Developer**: Liên hệ team tech

