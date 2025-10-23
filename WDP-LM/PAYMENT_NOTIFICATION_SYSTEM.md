# Hệ thống thông báo mã code phòng học sau thanh toán

## Tổng quan

Hệ thống này tự động gửi mã code phòng học cho cả học viên và gia sư sau khi thanh toán thành công. Mã code chỉ được tạo và gửi khi học viên đã thanh toán, đảm bảo tính bảo mật và tránh lãng phí tài nguyên.

## Luồng hoạt động

### 1. Đặt lịch học
- Học viên đặt lịch học với gia sư
- Gia sư nhận thông báo email về yêu cầu đặt lịch
- Gia sư chấp nhận/từ chối yêu cầu
- Nếu chấp nhận: tạo `roomId` và `TeachingSession`

### 2. Thanh toán
- Học viên thanh toán học phí
- Gọi API `POST /api/v1/bookings/:id/payment-success`
- Hệ thống tạo mã code phòng học (nếu chưa có)
- Gửi email thông báo cho cả học viên và gia sư

### 3. Tham gia phòng học
- Học viên và gia sư nhận email với mã code phòng học
- Sử dụng nút "Phòng Học" trên header để nhập mã code
- Hoặc truy cập trực tiếp qua link trong email

## API Endpoints

### POST /api/v1/bookings/:id/payment-success
Xử lý thanh toán thành công và gửi thông báo mã code phòng học.

**Request:**
```json
{
  "bookingId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment processed successfully and notifications sent",
  "roomCode": "ABC123XYZ",
  "roomUrl": "http://localhost:3000/room/ABC123XYZ"
}
```

## Email Templates

### 1. Thông báo cho học viên (payment_success)
- **Subject:** "🎉 Thanh toán thành công - Mã phòng học đã sẵn sàng! - EduMatch"
- **Nội dung:** Mã code phòng học, hướng dẫn tham gia, thông tin khóa học
- **CTA:** Nút "Tham gia phòng học ngay"

### 2. Thông báo cho gia sư (tutor_payment_success)
- **Subject:** "💰 Học viên đã thanh toán - Mã phòng học sẵn sàng - EduMatch"
- **Nội dung:** Mã code phòng học, thông tin học viên, hướng dẫn truy cập
- **CTA:** Nút "Truy cập phòng dạy học"

## Frontend Components

### 1. PaymentSuccessModal
Modal hiển thị khi thanh toán thành công:
- Xử lý thanh toán và nhận mã code
- Hiển thị mã code phòng học
- Nút tham gia phòng học trực tiếp
- Hướng dẫn sử dụng

### 2. RoomCodeNotification
Component hiển thị trong trang bookings:
- Thông báo thanh toán chưa hoàn tất
- Hiển thị mã code phòng học
- Nút tham gia phòng học
- Chi tiết buổi học

## Cấu hình Email

### Biến môi trường
```env
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=no-reply@edumatch.com
FRONTEND_URL=http://localhost:3000
```

### Gmail SMTP
- Sử dụng Gmail SMTP với App Password
- Hỗ trợ fallback mode (chỉ log) nếu không cấu hình email

## Bảo mật

### 1. Xác thực
- Chỉ học viên đặt lịch mới có thể xử lý thanh toán
- Kiểm tra quyền truy cập phòng học qua JWT token

### 2. Mã code phòng học
- Tạo ngẫu nhiên, duy nhất
- Chỉ có hiệu lực trong thời gian buổi học
- Không thể đoán trước

### 3. Thời gian hiệu lực
- Mã code chỉ hoạt động trong khung giờ buổi học
- Tự động hết hạn sau khi buổi học kết thúc

## Sử dụng

### 1. Backend
```javascript
// Import notification functions
const { 
  notifyStudentPaymentSuccess, 
  notifyTutorPaymentSuccess 
} = require('../services/NotificationService');

// Gọi sau khi thanh toán thành công
await notifyStudentPaymentSuccess(booking);
await notifyTutorPaymentSuccess(booking);
```

### 2. Frontend
```javascript
// Import service
import { processPaymentSuccess } from '../services/BookingService';

// Xử lý thanh toán thành công
const result = await processPaymentSuccess(bookingId);
console.log('Room code:', result.roomCode);
```

### 3. Component sử dụng
```jsx
import PaymentSuccessModal from '../components/PaymentSuccessModal';
import RoomCodeNotification from '../components/RoomCodeNotification';

// Modal thanh toán thành công
<PaymentSuccessModal 
  isOpen={showPaymentModal}
  onClose={() => setShowPaymentModal(false)}
  bookingId={booking._id}
  bookingData={booking}
/>

// Thông báo mã code trong trang bookings
<RoomCodeNotification 
  booking={booking}
  onRoomCodeReceived={(code, url) => {
    console.log('Room code received:', code);
  }}
/>
```

## Troubleshooting

### 1. Email không được gửi
- Kiểm tra cấu hình SMTP
- Xem log console để debug
- Hệ thống sẽ fallback về mode log nếu không cấu hình email

### 2. Mã code không hoạt động
- Kiểm tra thời gian buổi học
- Xác nhận booking đã được accept
- Kiểm tra JWT token có hợp lệ không

### 3. Lỗi quyền truy cập
- Đảm bảo user đã đăng nhập
- Kiểm tra booking thuộc về user hiện tại
- Xác nhận booking status là "accepted"

## Monitoring

### 1. Logs
- Tất cả email gửi đều được log
- Lỗi notification không làm fail booking
- Tracking room code generation

### 2. Metrics
- Số lượng email gửi thành công/thất bại
- Thời gian xử lý thanh toán
- Tỷ lệ tham gia phòng học

## Tương lai

### 1. Tính năng mở rộng
- SMS notification
- Push notification
- Calendar integration
- Reminder emails

### 2. Cải thiện
- Retry mechanism cho email
- Queue system cho notification
- Analytics dashboard
- A/B testing cho email templates
