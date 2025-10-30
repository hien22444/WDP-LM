# 💳 CƠ CHẾ THANH TOÁN - HỌC VIÊN KHÔNG CẦN SỐ TÀI KHOẢN

## ❓ VẤN ĐỀ

**Câu hỏi:** "Nếu không có số tài khoản thì làm sao học viên chuyển tiền vào?"

**Trả lời:** Học viên **KHÔNG CHUYỂN** vào số tài khoản của bạn! Họ thanh toán qua **PayOS Payment Gateway** - một hệ thống trung gian an toàn.

---

## 🔄 LUỒNG THANH TOÁN THỰC TẾ

### **Cách 1: Thanh toán online qua PayOS (giống Momo/ZaloPay)**

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Học viên   │ ──♥──→  │    PayOS     │ ──♥──→  │   Hệ thống  │
│             │         │   Gateway    │         │  LearnMate  │
└─────────────┘         └──────────────┘         └─────────────┘
     ↑                         ↑
     │                         │
     └─────  Thanh toán  ──────┘
      (Card/Internet Banking/
       Momo/ZaloPay/VNPay)
```

**Chi tiết:**

1. **Học viên đặt lịch học** trên website
2. **Click "Thanh toán"** → Hệ thống redirect sang trang PayOS
3. **Học viên chọn phương thức thanh toán:**
   - 💳 Thẻ ATM/Visa/Mastercard
   - 🏦 Internet Banking (VCB, VPB, Techcombank...)
   - 📱 Momo
   - 💰 ZaloPay
   - 🔷 VNPay
4. **Thanh toán thành công** → PayOS nhận tiền
5. **Hệ thống nhận webhook** từ PayOS → Cập nhật booking status

---

## 💰 VÍ DỤ CỤ THỂ

### **Scenario: Học viên muốn đặt lịch học**

#### **Bước 1: Chọn gia sư và slot**
```
Học viên: "Tôi muốn học Toán với cô Lan vào thứ 2, 19:00"
→ Click "Đặt lịch học"
```

#### **Bước 2: Điền thông tin**
```
Form hiển thị:
├── Tên: Nguyễn Văn A
├── Số điện thoại: 0912345678
├── Ghi chú: "Học chương trình lớp 12"
└── Tổng tiền: 200,000 VNĐ
```

#### **Bước 3: Click "Thanh toán"**
```
Button "Thanh toán" → Redirect sang PayOS
```

#### **Bước 4: Trang PayOS hiển thị**
```
━━━━━━━━━━━━━━━━━━━━━━━━━
    PAYOS CHECKOUT
━━━━━━━━━━━━━━━━━━━━━━━━━

Số tiền: 200,000 VNĐ
Mã đơn hàng: #LM20250126001

Chọn phương thức thanh toán:
┌─────────────────────────────────┐
│ [💳] Thẻ ATM/Visa/Mastercard    │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ [🏦] Internet Banking           │
│     • Vietcombank               │
│     • Vietinbank                │
│     • Techcombank               │
│     • BIDV                      │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ [📱] MoMo                       │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ [💰] ZaloPay                    │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ [🔷] VNPay                      │
└─────────────────────────────────┘

[Đóng]  [Tiếp tục]
━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### **Bước 5: Học viên chọn Momo**
```
Click "MoMo" → Popup hiện QR code

Học viên mở app MoMo
→ Quét QR code
→ Xác nhận thanh toán
→ ✅ Thanh toán thành công!
```

#### **Bước 6: Chuyển hướng về website**
```
Redirect về: https://learnmate.vn/bookings/success?id=LM20250126001

Trang hiển thị:
━━━━━━━━━━━━━━━━━━━━━━━━━
     ✅ ĐẶT LỊCH THÀNH CÔNG
━━━━━━━━━━━━━━━━━━━━━━━━━

Mã đơn hàng: #LM20250126001
Số tiền đã thanh toán: 200,000 VNĐ
Trạng thái: Đã thanh toán ✓

Gia sư sẽ xác nhận trong vòng 24h.

[Về trang chủ]  [Xem lịch học của tôi]
━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🏦 TÀI KHOẢN CHUYỂN ĐẾN

### **Khi học viên thanh toán:**

**Họ KHÔNG chuyển vào số tài khoản của bạn!**

Thay vào đó:

```
Tiền của học viên
        ↓
PayOS Merchant Account
(Tài khoản PayOS Business của bạn)
        ↓
Giữ trong escrow
        ↓
Chia cho gia sư (85%) và platform (15%)
```

### **Số tài khoản nào nhận tiền?**

#### **1. PayOS Merchant Account:**
```
Tài khoản PayOS của bạn (đăng ký khi setup PayOS)
├── Số tài khoản: PayOS tự tạo
├── Chủ sở hữu: Tên business của bạn
└── Nơi giữ tiền: PayOS gateway
```

#### **2. Platform Account (nhận 15%):**
```
Tài khoản ngân hàng business của bạn
├── Ngân hàng: Vietcombank (ví dụ)
├── Số tài khoản: 1234567890
├── Chủ tài khoản: Công ty ABC
└── Nhận: 15% platform fee
```

#### **3. Gia sư Account (nhận 85%):**
```
Tài khoản ngân hàng từng gia sư
├── Gia sư 1: Ngân hàng VCB - Số TK: 1111111111
├── Gia sư 2: Ngân hàng VPB - Số TK: 2222222222
└── Mỗi gia sư có thể khác nhau
```

---

## 🔐 BẢO MẬT & AN TOÀN

### **Tại sao không dùng chuyển khoản trực tiếp?**

**❌ Cách cũ (không an toàn):**
```
Học viên → Chuyển khoản trực tiếp → Tài khoản bạn
→ Bạn phải tự chia cho gia sư
→ Dễ sai sót
→ Không có bảo vệ cho 2 bên
```

**✅ Cách mới (an toàn):**
```
Học viên → Thanh toán PayOS → PayOS giữ tiền
→ Tự động chia 85%/15%
→ Bảo vệ cả học viên và gia sư
→ Có thể hoàn tiền nếu tranh chấp
```

---

## 📱 GIAO DIỆN THANH TOÁN

### **Khi học viên click "Thanh toán":**

#### **1. Hệ thống tạo payment link:**
```javascript
const payment = await PayOS.createPayment({
  orderCode: "LM20250126001",
  amount: 200000,
  description: "Đặt lịch học Toán với cô Lan",
  returnUrl: "https://learnmate.vn/bookings/success",
  cancelUrl: "https://learnmate.vn/bookings/cancel"
});

// Redirect học viên sang PayOS
window.location.href = payment.checkoutUrl;
```

#### **2. PayOS checkout page:**
```
URL: checkout.payos.vn/payment/ABC123XYZ

(Trang thanh toán PayOS hiển thị các phương thức)
```

#### **3. Học viên chọn phương thức:**
```
Nếu chọn "MoMo":
- Hiển thị QR code
- Hoặc redirect sang app MoMo
- Học viên thanh toán
- Redirect về website
```

---

## 💡 TẠI SAO DÙNG PAYOS?

### **Lợi ích cho học viên:**
✅ Thanh toán nhanh chóng (QR code, app...)
✅ Không cần chuyển khoản thủ công
✅ An toàn, có bảo vệ
✅ Có thể hoàn tiền nếu có vấn đề

### **Lợi ích cho bạn:**
✅ Tự động nhận tiền vào PayOS account
✅ Tự động chia 85%/15%
✅ Không phải quản lý tài khoản phức tạp
✅ PayOS xử lý compliance & bảo mật

### **Lợi ích cho gia sư:**
✅ Được bảo vệ khỏi học viên không trả tiền
✅ Nhận tiền tự động vào tài khoản
✅ Có thể rút tiền bất cứ lúc nào
✅ Minh bạch, có transaction history

---

## 🎯 TÓM TẮT

### **Học viên KHÔNG cần số tài khoản của bạn vì:**

1. **Thanh toán qua PayOS** (giống thanh toán online shopping)
2. **PayOS là bên trung gian** nhận tiền
3. **PayOS tự động chia tiền** cho gia sư và platform
4. **Học viên chỉ cần:**
   - Chọn phương thức thanh toán (MoMo/ZaloPay/Card...)
   - Quét QR hoặc nhập thông tin
   - Xác nhận thanh toán

### **Bạn cần có:**
1. Tài khoản PayOS Business (đăng ký tại payos.vn)
2. API credentials (Client ID, API Key)
3. Tài khoản ngân hàng business (để nhận 15% phí)

---

## 📞 CÂU HỎI THƯỜNG GẶP

### **Q1: Học viên có cần tải app PayOS không?**
**A:** ❌ Không cần! Học viên chỉ cần app thanh toán họ đã có (MoMo, ZaloPay, Banking app...)

### **Q2: PayOS có mất phí không?**
**A:** ✅ Có, ~2-3% mỗi giao dịch. Bạn trả từ 15% commission của platform.

### **Q3: Bảo mật thẻ/banking info?**
**A:** ✅ PayOS tuân thủ PCI-DSS (chuẩn bảo mật thế giới). Thông tin không được lưu trên server của bạn.

### **Q4: Nếu PayOS lỗi thì sao?**
**A:** PayOS có SLA 99.9%. Nếu lỗi, có thể thử lại hoặc dùng phương thức khác (MoMo → ZaloPay).

### **Q5: Làm sao kiểm tra đã thanh toán?**
**A:** PayOS gửi webhook về website. Bạn có thể xem trong PayOS dashboard.

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-26  
**Author:** System Documentation
