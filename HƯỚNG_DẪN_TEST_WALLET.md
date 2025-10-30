# 🧪 HƯỚNG DẪN TEST WALLET SYSTEM

## ✅ ĐÃ THÊM

1. ✅ Route `/tutor/wallet` trong App.js
2. ✅ Link "💰 Ví của tôi" trong Dashboard
3. ✅ Backend API sẵn sàng
4. ✅ Frontend Wallet page đã hoàn thành

---

## 🚀 CÁCH TEST

### **Bước 1: Khởi động hệ thống**

```bash
# Terminal 1: Backend
cd WDP-LM/backend
npm start

# Terminal 2: Frontend
cd WDP-LM/frontend
npm start
```

### **Bước 2: Đăng nhập với tài khoản gia sư**

1. Mở: `http://localhost:3000`
2. Đăng nhập với tài khoản có role = "tutor"

### **Bước 3: Truy cập Wallet**

**Cách 1:** Trực tiếp
```
http://localhost:3000/tutor/wallet
```

**Cách 2:** Từ Dashboard
```
Dashboard → Click "💰 Ví của tôi"
```

### **Bước 4: Xem Wallet UI**

Bạn sẽ thấy:
```
┌─────────────────────────────┐
│    💰 Ví của tôi           │
├─────────────────────────────┤
│ Số dư khả dụng:            │
│ 🔥 0 VNĐ                    │
│ [Rút tiền ngay]             │
├─────────────────────────────┤
│ ⏳ Đang chờ: 0 VNĐ         │
│ 📊 Tổng thu nhập: 0 VNĐ    │
└─────────────────────────────┘
```

---

## 🧪 TEST SCENARIOS

### **Test 1: Xem số dư (không có booking)**

```
1. Vào /tutor/wallet
2. Kiểm tra:
   ✅ Hiển thị 0 VNĐ
   ✅ Nút "Rút tiền ngay" disabled hoặc có message
3. ✅ PASS nếu hiển thị đúng
```

---

### **Test 2: Cập nhật STK**

```
1. Vào /tutor/wallet
2. Nếu chưa có STK:
   → Hiển thị alert "⚠️ Bạn chưa cập nhật STK"
   → Click "Cập nhật ngay"
3. Điền form:
   - Ngân hàng: Vietcombank
   - Số TK: 1234567890
   - Chủ TK: NGUYEN VAN A
4. Click "Cập nhật"
5. ✅ PASS nếu cập nhật thành công
```

---

### **Test 3: Mock data để có số dư**

```javascript
// Vào MongoDB hoặc dùng script:

// Option 1: Mongoose script
const TutorProfile = require('./backend/src/models/TutorProfile');
await TutorProfile.updateOne(
  { user: 'YOUR_TUTOR_ID' },
  { $set: {
    'earnings.availableBalance': 500000,
    'earnings.totalEarnings': 1200000
  }}
);

// Option 2: Direct database
// db.tutor_profiles.updateOne(
//   { user: ObjectId("...") },
//   { $set: { "earnings.availableBalance": 500000 } }
// )
```

Sau đó refresh `/tutor/wallet` → Hiển thị 500,000 VNĐ

---

### **Test 4: Rút tiền**

```
1. Vào /tutor/wallet
2. Đảm bảo: availableBalance > 0
3. Đảm bảo: Đã có STK
4. Click "Rút tiền ngay"
5. Nhập số tiền (VD: 300,000 VNĐ)
6. Click "Xác nhận rút tiền"
7. ✅ PASS nếu:
   - Tạo withdrawal request
   - status = "pending"
   - Hiển thị message "Đã gửi yêu cầu"
```

---

### **Test 5: Lịch sử rút tiền**

```
1. Sau khi rút tiền
2. Scroll xuống phần "Lịch sử"
3. Kiểm tra:
   ✅ Hiển thị yêu cầu vừa tạo
   ✅ Status: "Chờ xử lý" (pending)
   ✅ Ngày: Hôm nay
   ✅ Số tiền: 300,000 VNĐ
4. ✅ PASS nếu hiển thị đúng
```

---

## 📊 BACKEND API TEST

### **Test API trực tiếp:**

```bash
# 1. Xem số dư
curl http://localhost:5000/api/v1/wallet/balance \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Cập nhật STK
curl -X PUT http://localhost:5000/api/v1/wallet/bank-account \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "accountNumber": "1234567890",
    "accountName": "NGUYEN VAN A",
    "bankName": "Vietcombank",
    "bankCode": "VCB"
  }'

# 3. Rút tiền
curl -X POST http://localhost:5000/api/v1/wallet/withdraw \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 300000}'

# 4. Lịch sử
curl http://localhost:5000/api/v1/wallet/withdrawals \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ✅ CHECKLIST

### **Frontend:**
- [ ] Route `/tutor/wallet` thêm vào App.js
- [ ] Link "Ví của tôi" trong Dashboard
- [ ] Wallet page hiển thị số dư
- [ ] Form rút tiền hoạt động
- [ ] Lịch sử hiển thị đúng

### **Backend:**
- [ ] Route `/api/v1/wallet/*` hoạt động
- [ ] Get balance trả về đúng
- [ ] Update bank account thành công
- [ ] Create withdrawal tạo request
- [ ] Get withdrawals lấy đúng

### **Database:**
- [ ] TutorProfile có earnings
- [ ] Withdrawal documents được tạo
- [ ] EscrowService cộng vào ví đúng

---

## 🎉 KẾT QUẢ MONG ĐỢI

**Sau khi test thành công:**
- ✅ Wallet page hiển thị đúng
- ✅ Rút tiền tạo withdrawal request
- ✅ Admin có thể export CSV
- ✅ Chuyển khoản thủ công
- ✅ Hoàn thành luồng thanh toán

**System WORKING 100%!** 🚀

