# KIỂM TRA LUỒNG CHÍNH CỦA HỆ THỐNG

## 📋 TỔNG QUAN HỆ THỐNG

Hệ thống **EduMatch/LearnMate** là một nền tảng kết nối gia sư và học viên với các tính năng:
- Đăng ký và xác thực người dùng
- Quản lý hồ sơ gia sư
- Đặt lịch học (booking)
- Thanh toán qua PayOS với cơ chế Escrow
- Video call (WebRTC)
- Quản lý admin

---

## 🔐 1. LUỒNG XÁC THỰC (AUTHENTICATION)

### 1.1 Đăng ký tài khoản
**Route:** `POST /api/v1/auth/register`
**Controller:** `authController.register`

**Luồng:**
1. User nhập thông tin: email, password, full_name, phone_number
2. Hệ thống kiểm tra email đã tồn tại chưa
3. Hash password với bcrypt
4. Tạo OTP và gửi email xác thực
5. Lưu user với status = "pending"
6. Trả về thông báo cần verify email

### 1.2 Xác thực email
**Route:** `GET /api/v1/auth/verify?token=xxx`
**Controller:** `authController.verifyAccount`

**Luồng:**
1. Kiểm tra token xác thực
2. Cập nhật user.status = "active"
3. Đánh dấu email đã được verify

### 1.3 Đăng nhập
**Route:** `POST /api/v1/auth/login`
**Controller:** `authController.login`

**Luồng:**
1. Kiểm tra email và password
2. Kiểm tra user.status = "active"
3. Tạo JWT access token (1d) và refresh token (7d)
4. Trả về token và thông tin user

### 1.4 Google OAuth
**Routes:**
- `GET /google/start` - Khởi tạo OAuth flow
- `GET /google/redirect` - Xử lý callback từ Google

**Luồng:**
1. User click "Đăng nhập với Google"
2. Redirect đến Google OAuth
3. User xác nhận quyền truy cập
4. Google redirect về `/google/redirect`
5. Server lấy thông tin từ Google
6. Tìm hoặc tạo user mới
7. Tạo JWT token và trả về

### 1.5 Quên mật khẩu
**Route:** `POST /api/v1/auth/forgot-password`
**Controller:** `authController.forgotPassword`

**Luồng:**
1. User nhập email
2. Tạo reset token và lưu vào DB
3. Gửi email chứa link reset password
4. User click link và nhập password mới
5. `POST /api/v1/auth/reset-password` - Reset password

---

## 👨‍🏫 2. LUỒNG QUẢN LÝ GIA SƯ

### 2.1 Đăng ký làm gia sư
**Route:** `POST /api/v1/tutors`
**Controller:** `tutorController.create`

**Luồng:**
1. User đã đăng nhập (authenticated)
2. Điền thông tin:
   - Subjects (môn học)
   - Grades (lớp học)
   - Experience (kinh nghiệm)
   - Education (học vấn)
   - Session rate (giá buổi học)
   - Availability (khung giờ rảnh)
   - Teach modes (online/offline)
3. Upload CV và giấy tờ xác thực
4. Tạo TutorProfile với status = "pending"
5. Chờ admin duyệt

### 2.2 Admin duyệt gia sư
**Route:** `POST /api/v1/admin/verification/tutors/:id/approve`
**Controller:** `adminVerificationController.approveTutor`

**Luồng:**
1. Admin xem danh sách gia sư chờ duyệt
2. Xem chi tiết CV và giấy tờ
3. Approve → status = "approved"
4. Reject → status = "rejected" (có thể kèm lý do)
5. Gửi email thông báo cho gia sư

### 2.3 Tìm kiếm gia sư
**Route:** `GET /api/v1/tutors/search`
**Controller:** `tutorController.search`

**Filters:**
- Tìm kiếm theo tên
- Môn học (subject)
- Lớp học (grade)
- Địa điểm (location/city)
- Hình thức (online/offline)
- Giá (minPrice, maxPrice)
- Đánh giá (minRating, maxRating)
- Kinh nghiệm (experience)

**Sorting:**
- Rating (mặc định)
- Price
- Experience
- Created date

---

## 📅 3. LUỒNG ĐẶT LỊCH (BOOKING)

### 3.1 Học viên tạo booking request
**Route:** `POST /api/v1/bookings`
**Controller:** `bookingController.create`

**Luồng:**
1. Học viên chọn gia sư và thời gian
2. Validation:
   - Gia sư phải approved
   - Thời gian phải trong tương lai (không quá 3 tháng)
   - Thời gian không trùng với booking khác
   - Thời gian nằm trong availability của gia sư
   - Mỗi buổi học ít nhất 1 giờ, tối đa 8 giờ
   - Học viên không quá 5 booking pending
3. Tạo Booking với:
   - status = "pending"
   - paymentStatus = "escrow"
   - escrowAmount = price
   - Tính platformFee (15%) và tutorPayout (85%)
4. Gửi email thông báo cho gia sư

### 3.2 Gia sư chấp nhận/từ chối
**Route:** `POST /api/v1/bookings/:id/decision`
**Controller:** `bookingController.decision`

**Luồng:**
- **Accept:**
  1. Kiểm tra booking.status = "pending"
  2. Kiểm tra không quá gần giờ học (tối thiểu 2 giờ)
  3. Kiểm tra gia sư không quá 20 booking/tuần
  4. Cập nhật status = "accepted"
  5. Chuyển paymentStatus = "held" (giữ tiền trong escrow)
  6. Tạo TeachingSession với status = "scheduled"
  7. Tạo roomId cho WebRTC
  8. Gửi email thông báo cho học viên

- **Reject:**
  1. Cập nhật status = "rejected"
  2. Gửi email thông báo cho học viên

### 3.3 Đặt lịch từ Teaching Slot
**Route:** `POST /api/v1/bookings/slots/:slotId/book`
**Controller:** `bookingController.bookFromSlot`

**Luồng:**
1. Gia sư tạo TeachingSlot (slot mở)
2. Học viên xem danh sách slot và chọn slot
3. Tạo Booking từ slot
4. Cập nhật slot.status = "booked"
5. Gửi email thông báo cho gia sư

### 3.4 Gia sư tạo Teaching Slot
**Route:** `POST /api/v1/bookings/slots`
**Controller:** `bookingController.createSlot`

**Luồng:**
1. Gia sư điền thông tin:
   - start, end (thời gian)
   - mode (online/offline)
   - price
   - courseName
   - location (nếu offline)
   - capacity (số học viên tối đa)
   - recurring (có thể tạo lặp lại theo tuần)
2. Kiểm tra không trùng với booking/slot khác
3. Tạo TeachingSlot với status = "open"
4. Học viên có thể đặt từ slot này

---

## 💰 4. LUỒNG THANH TOÁN (PAYMENT)

### 4.1 Tạo link thanh toán
**Route:** `POST /api/v1/payment/create-payment-link`
**Controller:** `paymentController.createPaymentLink`

**Luồng:**
1. Frontend gửi thông tin:
   - slotId (nếu đặt từ slot)
   - product.unitPrice (số tiền)
   - product.name (tên sản phẩm)
2. Server tạo orderCode = Date.now()
3. Tạo Payment record với status = "PENDING"
4. Gọi PayOS API tạo payment link
5. Trả về paymentLink cho frontend
6. Frontend redirect user đến PayOS

### 4.2 Xử lý webhook từ PayOS
**Route:** `POST /api/v1/payment/payos-webhook`
**Controller:** `paymentController.receiveWebhook`

**Luồng:**
1. PayOS gửi webhook khi thanh toán thành công
2. Verify checksum từ PayOS
3. Cập nhật Payment.status = "PAID"
4. Nếu có booking liên quan:
   - Cập nhật booking.paymentStatus
   - Tạo roomId nếu chưa có
   - Gửi email thông báo cho học viên và gia sư

### 4.3 Cơ chế Escrow (Ký gửi)

**EscrowService** quản lý việc giữ tiền:

1. **createEscrowBooking:**
   - Tạo booking với paymentStatus = "escrow"
   - Tính platformFee (15%) và tutorPayout (85%)

2. **holdPayment:**
   - Khi gia sư accept booking
   - Chuyển paymentStatus = "held"
   - Tiền được giữ trong escrow

3. **releasePayment:**
   - Khi buổi học hoàn thành
   - Chuyển paymentStatus = "released"
   - Cộng tutorPayout vào ví của gia sư
   - Cập nhật booking.status = "completed"

4. **refundPayment:**
   - Khi hủy booking
   - Hoàn tiền cho học viên
   - Nếu hủy < 12h trước giờ học: hoàn 50%
   - Nếu hủy >= 12h: hoàn 100%

5. **openDispute:**
   - Mở tranh chấp (tutor hoặc student)
   - Chờ admin giải quyết

---

## 🎥 5. LUỒNG VIDEO CALL (WebRTC)

### 5.1 Tạo phòng học
**Route:** `POST /api/v1/bookings/:id/join-token`
**Controller:** `bookingController.generateRoomToken`

**Luồng:**
1. Khi booking được accept, tạo roomId
2. Khi đến giờ học, user request token
3. Server tạo JWT token với:
   - roomId
   - userId
   - role (student/tutor)
   - duration (thời gian còn lại)
4. Frontend dùng token để join room

### 5.2 WebRTC Socket
**Namespace:** `/webrtc`
**Service:** `WebRTCService`

**Events:**
- `join-room`: Join vào phòng
- `offer`: Gửi SDP offer
- `answer`: Gửi SDP answer
- `ice-candidate`: Trao đổi ICE candidate
- `leave-room`: Rời phòng

---

## 📧 6. LUỒNG THÔNG BÁO (NOTIFICATION)

**Service:** `NotificationService`

**Các loại thông báo:**

1. **notifyTutorBookingCreated:**
   - Khi học viên tạo booking
   - Gửi email cho gia sư

2. **notifyStudentBookingDecision:**
   - Khi gia sư accept/reject
   - Gửi email cho học viên

3. **notifyStudentPaymentSuccess:**
   - Khi thanh toán thành công
   - Gửi email cho học viên kèm roomId

4. **notifyTutorPaymentSuccess:**
   - Khi thanh toán thành công
   - Gửi email cho gia sư kèm roomId

5. **notifyTutorPaymentReleased:**
   - Khi tiền được giải phóng
   - Gửi email cho gia sư

6. **notifyStudentRefund:**
   - Khi hoàn tiền
   - Gửi email cho học viên

---

## 👨‍💼 7. LUỒNG ADMIN

### 7.1 Quản lý người dùng
**Route:** `GET /api/v1/admin/users`
**Controller:** `adminController.getUsers`

- Xem danh sách users
- Ban/unban user
- Xem chi tiết user

### 7.2 Quản lý gia sư
**Route:** `GET /api/v1/admin/tutors`
**Controller:** `adminController.getTutors`

- Xem danh sách gia sư
- Duyệt/reject gia sư
- Xem CV và giấy tờ

### 7.3 Quản lý booking
**Route:** `GET /api/v1/admin/bookings`
**Controller:** `adminController.getBookings`

- Xem tất cả bookings
- Xử lý tranh chấp (dispute)
- Thống kê bookings

### 7.4 Quản lý hợp đồng
**Route:** `GET /api/v1/admin/contracts`
**Controller:** `adminContractController.getContracts`

- Xem danh sách contracts
- Xem chi tiết contract
- Xử lý dispute

---

## 🔄 8. LUỒNG HOÀN CHỈNH: TỪ ĐẶT LỊCH ĐẾN HOÀN THÀNH

### Bước 1: Học viên tạo booking
```
POST /api/v1/bookings
→ Booking tạo với status="pending", paymentStatus="escrow"
→ Email thông báo cho gia sư
```

### Bước 2: Học viên thanh toán
```
POST /api/v1/payment/create-payment-link
→ Redirect đến PayOS
→ Thanh toán thành công
→ Webhook cập nhật Payment.status="PAID"
```

### Bước 3: Gia sư chấp nhận
```
POST /api/v1/bookings/:id/decision (decision="accept")
→ Booking.status="accepted"
→ PaymentStatus="held" (giữ tiền)
→ Tạo TeachingSession
→ Tạo roomId
→ Email thông báo cho học viên
```

### Bước 4: Đến giờ học
```
POST /api/v1/bookings/:id/join-token
→ Nhận token để join room
→ Vào /room/:roomId
→ WebRTC kết nối
```

### Bước 5: Hoàn thành buổi học
```
POST /api/v1/bookings/:id/complete
→ EscrowService.releasePayment()
→ paymentStatus="released"
→ booking.status="completed"
→ Cộng tiền vào ví gia sư (tutorPayout)
→ Email thông báo
```

### Bước 6: Đánh giá (optional)
```
POST /api/v1/reviews
→ Tạo Review
→ Cập nhật rating của gia sư
```

---

## ⚠️ 9. CÁC VẤN ĐỀ CẦN KIỂM TRA

### 9.1 Authentication
- ✅ JWT token được tạo và verify đúng
- ✅ Refresh token hoạt động
- ✅ Google OAuth hoạt động
- ⚠️ Cần kiểm tra: token expiration handling

### 9.2 Booking
- ✅ Validation đầy đủ
- ✅ Kiểm tra conflict thời gian
- ✅ Escrow được tạo đúng
- ⚠️ Cần kiểm tra: Xử lý khi webhook PayOS fail

### 9.3 Payment
- ✅ PayOS integration
- ✅ Webhook handling
- ✅ Escrow flow
- ⚠️ Cần kiểm tra: 
  - Xử lý khi payment link expire
  - Retry mechanism cho webhook

### 9.4 WebRTC
- ✅ Room creation
- ✅ Token generation
- ⚠️ Cần kiểm tra: 
  - Connection stability
  - Error handling khi join room fail

### 9.5 Notification
- ✅ Email notifications
- ⚠️ Cần kiểm tra:
  - Email delivery rate
  - Error handling khi email fail

---

## 📊 10. STATISTICS & MONITORING

### Endpoints quan trọng:
- `GET /api/health` - Health check
- `GET /api/v1/bookings/stats` - Booking statistics
- `GET /api/v1/bookings/escrow/stats` - Escrow statistics (admin only)

### Cron Jobs:
- Auto-release payment sau 24h (nếu không dispute)
- Cleanup expired bookings
- Update tutor ratings

---

## 🔧 11. CONFIGURATION

### Environment Variables cần thiết:
- `MONGO_URI` / `URI_DB` - MongoDB connection
- `JWT_SECRET` - JWT signing secret
- `REFRESH_TOKEN_SECRET` - Refresh token secret
- `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY` - PayOS config
- `GOOGLE_APP_CLIENT_ID`, `GOOGLE_APP_CLIENT_SECRET` - Google OAuth
- `FRONTEND_URL` - Frontend URL
- `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS` - Email config

---

## ✅ KẾT LUẬN

Hệ thống có cấu trúc tốt với:
- ✅ Luồng authentication hoàn chỉnh
- ✅ Booking system với validation đầy đủ
- ✅ Payment integration với PayOS
- ✅ Escrow mechanism bảo vệ cả học viên và gia sư
- ✅ WebRTC cho video call
- ✅ Admin panel quản lý

**Cần cải thiện:**
- ⚠️ Error handling và retry mechanism
- ⚠️ Logging và monitoring
- ⚠️ Testing coverage
- ⚠️ Performance optimization

