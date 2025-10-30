# 💸 TÓM TẮT: CHUYỂN TIỀN CHO GIA SƯ

## ⚠️ TÌNH HÌNH HIỆN TẠI

### **❌ CHƯA CHUYỂN TIỀN THỰC SỰ**

Hiện tại hệ thống chỉ:
1. ✅ Update database: `paymentStatus = "released"`
2. ✅ Tính toán: `tutorPayout = 170,000 VNĐ`
3. ✅ Gửi email cho gia sư
4. ❌ **NHƯNG TIỀN VẪN CHƯA vào tài khoản gia sư!**

---

## 🎯 LUỒNG HIỆN TẠI

```
1. Học viên thanh toán 200,000 VNĐ
   ↓
2. PayOS giữ tiền (escrow)
   ↓
3. Gia sư chấp nhận (held)
   ↓
4. Buổi học hoàn thành (completed)
   ↓
5. ❌ CHỈ UPDATE DATABASE
   ❌ CHƯA chuyển tiền vào tài khoản gia sư thực sự
   → Tiền vẫn trong PayOS Gateway
```

---

## ✅ CẦN LÀM GÌ?

### **Option 1: Tích hợp PayOS Payout API**

```javascript
// Cần thêm
await payOS.payouts.create({
  amount: 170000,
  recipient: {
    accountNumber: "1234567890",
    bankCode: "VCB"
  }
});
```

### **Option 2: Hệ thống withdrawal (rút tiền)**

- Gia sư yêu cầu rút tiền khi đủ số tiền tối thiểu
- Admin chuyển khoản thủ công hoặc tự động

### **Option 3: Chuyển khoản thủ công**

- Export report
- Admin chuyển khoản thủ công
- Đánh dấu hoàn thành

---

## 🚀 BƯỚC TIẾP THEO

1. **Thêm field thông tin ngân hàng** vào TutorProfile
2. **Tạo PayoutService.js** để chuyển tiền
3. **Tích hợp vào EscrowService** khi release payment
4. **Test với PayOS sandbox**
5. **Deploy production**

---

## 📊 SO SÁNH

| | Hiện tại | Sau khi tích hợp |
|---|---------|------------------|
| Update DB | ✅ | ✅ |
| Gửi email | ✅ | ✅ |
| **Chuyển tiền thực** | ❌ | ✅ |
| Gia sư nhận tiền | ❌ | ✅ |
| Platform nhận phí | ❌ | ✅ |

---

## 💡 KHUYẾN NGHỊ

**Bây giờ:**
- Dùng chuyển khoản thủ công (nhanh nhất)
- Admin export CSV → Chuyển khoản → Mark done

**Sau này:**
- Tích hợp PayOS Payout API (tự động 100%)

**Ưu tiên:**
1. Thêm thông tin ngân hàng cho gia sư
2. Tạo PayoutService
3. Test thử
4. Deploy

