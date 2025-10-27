# 💰 CHI TIẾT LUỒNG TIỀN & THANH TOÁN

## 📖 TỔNG QUAN

Document này giải thích **chi tiết** toàn bộ luồng tiền trong hệ thống, từ khi học viên thanh toán đến khi gia sư nhận tiền.

---

## 🏦 CÁC TÀI KHOẢN LIÊN QUAN

### **1. PayOS Merchant Account**
- **Chủ sở hữu:** Bạn (chủ business/platform)
- **Loại tài khoản:** Business Account tại PayOS
- **Chức năng:**
  - Nhận tiền từ học viên
  - Giữ tiền trong escrow
  - Chuyển tiền cho gia sư và platform

### **2. Platform Business Account**
- **Chủ sở hữu:** Tài khoản ngân hàng của bạn
- **Loại:** Ngân hàng business/cá nhân
- **Chức năng:**
  - Nhận 15% phí platform
  - Payroll cho nhân viên
  - Chi phí vận hành

### **3. Gia sư Bank Account**
- **Chủ sở hữu:** Từng gia sư
- **Loại:** Ngân hàng cá nhân của gia sư
- **Chức năng:**
  - Nhận 85% tiền dạy học
  - Có thể là VCB, VPB, ACB, etc.

---

## 💸 VÍ DỤ CỤ THỂ

### **Scenario: Buổi học Toán 200,000 VNĐ**

#### **Step 1: Học viên thanh toán (T+0)**
```
Học viên: Nguyễn Văn A
Gia sư: Trần Thị B
Môn: Toán
Giá: 200,000 VNĐ
```

**Chuyển động tiền:**
```
Ngân hàng học viên: -200,000 VNĐ
                    ↓
       PayOS Payment Gateway: +200,000 VNĐ
       (Tài khoản PayOS của bạn)
```

**Trạng thái hệ thống:**
```javascript
Booking {
  price: 200,000,
  paymentStatus: "escrow",
  escrowAmount: 200,000,
  platformFee: 30,000,      // Tính sẵn
  tutorPayout: 170,000       // Tính sẵn
}
```

---

#### **Step 2: Gia sư chấp nhận (T+1 giờ)**
```
Gia sư click "Chấp nhận" booking
```

**Chuyển động tiền:**
```
PayOS: Vẫn giữ 200,000 VNĐ
(Không thay đổi)
```

**Trạng thái hệ thống:**
```javascript
Booking {
  paymentStatus: "escrow" → "held",  // Chuyển sang held
  status: "pending" → "accepted"
}
```

**⚠️ Lưu ý:** Tiền vẫn trong PayOS, chưa có ai nhận được!

---

#### **Step 3: Buổi học diễn ra (T+2 ngày)**
```
Ngày diễn ra buổi học
```

**Chuyển động tiền:**
```
PayOS: Vẫn giữ 200,000 VNĐ
```

**Trạng thái hệ thống:**
```javascript
Booking {
  paymentStatus: "held",
  status: "accepted" → "in_progress"
}
```

---

#### **Step 4: Học viên xác nhận hoàn thành (T+3 ngày)**
```
Học viên click "Hoàn thành buổi học"
```

**Chuyển động tiền:**
```
PayOS Gateway (200,000 VNĐ)
        ↓
    ┌────────────────────────┐
    ↓                        ↓
85% → Gia sư            15% → Platform
170,000 VNĐ            30,000 VNĐ
    ↓                        ↓
TK Ngân hàng             TK Ngân hàng
gia sư                   Platform
```

**Cơ chế chuyển:**
1. PayOS tự động chia tiền theo tỷ lệ 85%/15%
2. PayOS chuyển 170,000 VNĐ → Ngân hàng gia sư
3. PayOS chuyển 30,000 VNĐ → Ngân hàng platform

**Trạng thái hệ thống:**
```javascript
Booking {
  paymentStatus: "held" → "released",
  status: "completed",
  completedAt: "2025-01-29 19:00:00"
}
```

---

## ⏱️ THỜI GIAN XỬ LÝ TIỀN

### **Đối với học viên:**
```
Thanh toán → Trừ tiền ngay (T+0)
            ↓
        PayOS giữ tiền
```

### **Đối với gia sư:**
```
Hoàn thành buổi học
        ↓
Xác nhận (hoặc 24h auto)
        ↓
PayOS xử lý: 1-3 ngày làm việc
        ↓
Nhận tiền vào tài khoản: 170,000 VNĐ
```

### **Đối với platform:**
```
Cùng lúc với gia sư
        ↓
Nhận tiền vào tài khoản: 30,000 VNĐ
```

---

## 💡 3 TRƯỜNG HỢP XỬ LÝ ESCROW

### **Trường hợp 1: Mọi thứ suôn sẻ (90%)**

```
Buổi học diễn ra OK
        ↓
Học viên xác nhận
        ↓
Tiền tự động chia:
- Gia sư: 170,000 VNĐ
- Platform: 30,000 VNĐ
```

**Timeline:** 2-5 ngày

---

### **Trường hợp 2: Tự động sau 24h (nếu học viên quên xác nhận)**

```
Buổi học diễn ra OK
        ↓
Học viên KHÔNG xác nhận
        ↓
Sau 24h kể từ khi buổi học kết thúc
        ↓
Hệ thống tự động release escrow
        ↓
Tiền chia như bình thường:
- Gia sư: 170,000 VNĐ
- Platform: 30,000 VNĐ
```

**Timeline:** 3-6 ngày (tùy thời điểm buổi học)

---

### **Trường hợp 3: Tranh chấp (10%)**

#### **3.1 Học viên mở tranh chấp:**
```
Buổi học có vấn đề
        ↓
Học viên click "Báo cáo vấn đề"
        ↓
Lý do: "Gia sư không dạy đúng nội dung"
        ↓
Trạng thái: "disputed"
        ↓
Admin xem xét
        ↓
Admin quyết định:
├─ Release tiền cho gia sư (nếu học viên sai)
└─ Refund tiền cho học viên (nếu gia sư sai)
```

#### **3.2 Gia sư mở tranh chấp:**
```
Học viên đặt lịch nhưng không tham gia
        ↓
Gia sư click "Báo cáo vấn đề"
        ↓
Admin xem xét
        ↓
Admin quyết định refund hoặc release
```

---

## 📊 BẢNG TÓM TẮT LUỒNG TIỀN

| Giai đoạn | Tiền ở đâu | Người nhận | Số tiền | Thời gian |
|-----------|------------|------------|---------|-----------|
| **Thanh toán** | PayOS Gateway | - | 200,000 VNĐ | T+0 |
| **Chấp nhận** | PayOS Gateway | - | 200,000 VNĐ | T+1h |
| **Buổi học** | PayOS Gateway | - | 200,000 VNĐ | T+2 ngày |
| **Hoàn thành** | Đang chuyển | Gia sư + Platform | 170k + 30k | T+3 ngày |
| **Nhận tiền** | Ngân hàng | Gia sư | 170,000 VNĐ | T+3-5 ngày |
| **Nhận tiền** | Ngân hàng | Platform | 30,000 VNĐ | T+3-5 ngày |

---

## 🏛️ CẤU HÌNH PAYOS

### **Bước 1: Đăng ký tài khoản PayOS**
```
1. Vào payos.vn
2. Đăng ký Business Account
3. Cung cấp:
   - Giấy phép kinh doanh
   - CMND/CCCD
   - Thông tin ngân hàng
4. Xác minh tài khoản (1-3 ngày)
```

### **Bước 2: Lấy API Credentials**
```
Sau khi đăng ký thành công:

Dashboard PayOS → API Settings
├── Client ID: client_id_abc123
├── API Key: api_key_xyz789
└── Checksum Key: checksum_key_def456
```

### **Bước 3: Cấu hình Webhook**
```
Dashboard PayOS → Webhooks
└── URL: https://your-domain.com/api/v1/payments/payos-webhook
```

### **Bước 4: Kết nối ngân hàng**
```
Dashboard PayOS → Banking
├── Thông tin tài khoản nhận tiền (Platform account)
├── Thông tin routing
└── Confirm & Activate
```

---

## 💰 THỐNG KÊ TÀI CHÍNH

### **Example: 100 bookings/tháng**

```
Tổng doanh thu: 100 × 200,000 = 20,000,000 VNĐ

Phân chia:
├── Gia sư nhận: 100 × 170,000 = 17,000,000 VNĐ (85%)
├── Platform nhận: 100 × 30,000 = 3,000,000 VNĐ (15%)
└── PayOS phí: ~600,000 VNĐ (3% of 20M)
```

**Net revenue platform:** 3,000,000 - 600,000 = 2,400,000 VNĐ/tháng

### **Với 1,000 bookings/tháng:**
```
Doanh thu: 200,000,000 VNĐ
- Gia sư: 170,000,000 VNĐ
- Platform: 30,000,000 VNĐ
- PayOS phí: ~6,000,000 VNĐ

Net revenue: 24,000,000 VNĐ/tháng
```

---

## 🔒 BẢO MẬT & THANH TRA

### **Anti-Fraud:**
```
1. Validate payment trước khi confirm
2. Check duplicate payments
3. Monitor suspicious activities
4. Rate limiting cho transactions
```

### **Compliance:**
```
1. Tuân thủ PCI-DSS (PayOS đảm bảo)
2. Báo cáo thuế cho platform revenue
3. Invoice cho từng transaction (optional)
4. Audit logs cho tất cả transactions
```

---

## 📞 SUPPORT & TROUBLESHOOTING

### **Nếu gia sư không nhận được tiền:**
```
1. Kiểm tra PayOS dashboard
2. Kiểm tra banking information
3. Contact PayOS support
4. Check logs trong database
```

### **Nếu tiền bị stuck trong escrow:**
```
1. Check booking status
2. Check payment status
3. Manual trigger release (admin)
4. Contact technical support
```

---

## 🎯 TÍNH NĂNG NÂNG CAO

### **1. Payout Threshold (Ngưỡng rút tiền)**
```
Gia sư cần tích lũy tối thiểu 500,000 VNĐ
mới có thể rút tiền về ngân hàng
→ Giảm số lần chuyển tiền → Giảm phí
```

### **2. Scheduled Payouts (Rút tiền theo lịch)**
```
Tự động rút tiền mỗi tuần/tháng
├── Chu kỳ: Mỗi thứ 2
├── Minimum: 500,000 VNĐ
└── Fee: Phí PayOS (~3%)
```

### **3. Withdrawal History (Lịch sử rút tiền)**
```
Dashboard gia sư hiển thị:
├── Tổng tiền chưa rút
├── Lịch sử rút tiền
├── Expected payout date
└── Transaction history
```

---

## 🔄 CÂU HỎI THƯỜNG GẶP

### **Q1: Tiền có an toàn không?**
**A:** ✅ Có! Tiền giữ trong PayOS (công ty VN được cấp phép), không phụ thuộc vào tài khoản cá nhân.

### **Q2: Bao lâu gia sư nhận được tiền?**
**A:** 3-5 ngày làm việc sau khi buổi học hoàn thành.

### **Q3: Phí PayOS ai trả?**
**A:** Platform trả (từ 15% commission).

### **Q4: Nếu tranh chấp xảy ra?**
**A:** Admin xem xét và quyết định chia tiền/hoàn tiền công bằng.

### **Q5: Làm sao kiểm tra tiền đã về chưa?**
**A:** Gia sư có thể xem trong "My Earnings" dashboard.

---

**Document Version:** 1.0
**Last Updated:** 2025-01-26
**Author:** System Documentation
