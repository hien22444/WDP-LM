# 💰 HỆ THỐNG THANH TOÁN & ESCROW

## 📖 TỔNG QUAN

Hệ thống sử dụng **PayOS** để xử lý thanh toán và **escrow** để giữ tiền an toàn cho cả học viên và gia sư.

---

## 🔄 LUỒNG THANH TOÁN HOÀN CHỈNH

### **Bước 1: Học viên đặt lịch & thanh toán**

```
Học viên chọn slot trống
  ↓
Click "Đặt lịch học"
  ↓
Điền thông tin (thời gian, hình thức, notes)
  ↓
Hệ thống tạo Booking với status: "pending"
  ↓
Học viên thanh toán qua PayOS
  ↓
PayOS giữ tiền trong tài khoản PAYMENT GATEWAY (PayOS)
```

**Lưu ý quan trọng:**
- ❌ Tiền **KHÔNG** vào tài khoản của bạn ngay lập tức
- ❌ Tiền **KHÔNG** vào tài khoản của gia sư
- ✅ Tiền được giữ trong **PayOS payment gateway**
- ✅ Trạng thái: `paymentStatus = "escrow"` (tiền được giữ)

---

### **Bước 2: Gia sư xác nhận buổi học**

```
Hệ thống gửi thông báo cho gia sư
  ↓
Gia sư vào xem booking request
  ↓
Gia sư chấp nhận → Click "Chấp nhận"
  ↓
Trạng thái booking: "pending" → "accepted"
Trạng thái payment: "escrow" → "held"
```

**Sau khi gia sư chấp nhận:**
- Booking: `status = "accepted"`
- Payment: `paymentStatus = "held"` (đã được giữ chặt hơn)
- Tiền vẫn trong PayOS gateway

---

### **Bước 3: Diễn ra buổi học**

```
Gia sư và học viên gặp nhau (online/offline)
  ↓
Buổi học diễn ra
  ↓
Hệ thống tự động cập nhật: status = "in_progress"
```

---

### **Bước 4: Học viên xác nhận hoàn thành**

Sau khi buổi học kết thúc, có 3 cách để giải phóng tiền:

#### **Cách 1: Học viên tự xác nhận (24h auto-release)**
```
Học viên click "Hoàn thành buổi học"
  ↓
Xác nhận đã học xong
  ↓
Trạng thái: "completed"
Trạng thái payment: "held" → "released"
  ↓
Hệ thống tự động chuyển tiền cho gia sư
```

#### **Cách 2: Tự động sau 24h (nếu không tranh chấp)**
```
Sau 24h kể từ khi buổi học kết thúc
  ↓
Nếu không có tranh chấp
  ↓
Hệ thống TỰ ĐỘNG giải phóng tiền
  ↓
Payment status: "released"
  ↓
Tiền được chuyển cho gia sư
```

#### **Cách 3: Tranh chấp (nếu có vấn đề)**
```
Học viên hoặc gia sư mở tranh chấp
  ↓
Trạng thái: "disputed"
  ↓
Admin xem xét và quyết định:
  - Release tiền cho gia sư (nếu học viên sai)
  - Refund tiền cho học viên (nếu gia sư sai)
```

---

## 💵 PHÂN CHIA TIỀN

### **Ví dụ: Buổi học 200,000 VNĐ**

```
Tổng tiền học viên trả: 200,000 VNĐ
                        ↓
        ┌───────────────┴───────────────┐
        ↓                               ↓
   Phí platform (15%)         Gia sư nhận (85%)
    30,000 VNĐ                  170,000 VNĐ
        ↓                               ↓
   → Platform Account        → Gia sư nhận vào TK
```

**Công thức tính:**
```javascript
platformFee = 200,000 × 0.15 = 30,000 VNĐ
tutorPayout = 200,000 - 30,000 = 170,000 VNĐ
```

---

## 🏦 TÀI KHOẢN NHẬN TIỀN

### **1. Tài khoản PayOS (Payment Gateway)**
- **Chức năng:** Giữ tiền từ học viên ban đầu
- **Chủ sở hữu:** Tài khoản PayOS của bạn (có thể là business account)
- **Khi nào nhận tiền:** Khi học viên thanh toán

### **2. Tài khoản Platform (Hệ thống)**
- **Chức năng:** Nhận phí platform (15%)
- **Chủ sở hữu:** Tài khoản ngân hàng/business của platform
- **Khi nào nhận tiền:** Khi giải phóng escrow (tự động chuyển 15%)

### **3. Tài khoản Gia sư**
- **Chức năng:** Nhận tiền dạy học (85%)
- **Chủ sở hữu:** Tài khoản ngân hàng của gia sư
- **Khi nào nhận tiền:** Khi buổi học hoàn thành và được xác nhận

---

## 📊 TRẠNG THÁI THANH TOÁN

| Payment Status | Ý nghĩa | Tiền ở đâu |
|----------------|---------|------------|
| `none` | Chưa thanh toán | - |
| `escrow` | Đã thanh toán, đang giữ | PayOS Gateway |
| `held` | Gia sư đã chấp nhận, giữ chặt hơn | PayOS Gateway |
| `released` | Đã giải phóng, tiền về gia sư | 85% → Gia sư, 15% → Platform |
| `refunded` | Đã hoàn tiền | Về học viên |

---

## ⚙️ CẤU HÌNH PAYOS

### **Bạn cần có:**
1. **Tài khoản PayOS Business** (đăng ký tại payos.vn)
2. **Client ID, API Key, Checksum Key** (từ PayOS dashboard)
3. **Webhook URL** (để PayOS gửi thông báo thanh toán)
4. **Banking integration** (để nhận tiền từ PayOS về tài khoản)

### **File cấu hình:**
```env
# .env
PAYOS_CLIENT_ID=your_client_id
PAYOS_API_KEY=your_api_key
PAYOS_CHECKSUM_KEY=your_checksum_key
```

---

## 🔐 BẢO MẬT & MINH BẠCH

### **Đối với học viên:**
- ✅ Tiền được giữ an toàn trong PayOS
- ✅ Được hoàn tiền nếu buổi học có vấn đề
- ✅ Có thể tranh chấp nếu không hài lòng

### **Đối với gia sư:**
- ✅ Nhận tiền 100% đúng hạn (trừ phí platform)
- ✅ Không lo học viên không trả tiền
- ✅ Được bảo vệ khỏi chargeback

### **Đối với platform:**
- ✅ Thu phí platform minh bạch
- ✅ Có thể theo dõi tất cả giao dịch
- ✅ Xử lý tranh chấp một cách công bằng

---

## 🚀 KÍCH HOẠT HỆ THỐNG

### **Để hệ thống chạy tự động:**

1. **Setup PayOS:**
   - Đăng ký tài khoản PayOS
   - Lấy Client ID, API Key, Checksum Key
   - Cấu hình webhook URL

2. **Cấu hình auto-release:**
   - Tạo cron job chạy mỗi giờ
   - Kiểm tra các booking đã hoàn thành 24h
   - Tự động giải phóng escrow

3. **Setup banking:**
   - Kết nối PayOS với tài khoản ngân hàng
   - Cấu hình tự động rút tiền về tài khoản
   - Setup phân chia 15%/85% tự động

---

## ⚠️ LƯU Ý QUAN TRỌNG

1. **PayOS có phí giao dịch:** Khoảng 1-3% mỗi giao dịch
2. **Thời gian xử lý:** 1-3 ngày làm việc để tiền về tài khoản
3. **Minimum withdrawal:** Gia sư cần đạt số tiền tối thiểu mới rút được
4. **Tax:** Phải khai báo thuế cho phí platform

---

## 📞 SUPPORT

Nếu cần hỗ trợ:
1. Xem logs trong `paymentController.js`
2. Kiểm tra webhook từ PayOS
3. Xem database Booking collection
4. Liên hệ PayOS support
