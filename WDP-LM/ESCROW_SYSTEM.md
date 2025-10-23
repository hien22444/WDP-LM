# Hệ Thống Escrow - EduMatch

## Tổng Quan

Hệ thống Escrow của EduMatch đảm bảo an toàn thanh toán cho cả học viên và gia sư bằng cách giữ tiền trong tài khoản trung gian cho đến khi buổi học hoàn thành.

## Luồng Hoạt Động

### 1. Đặt Lịch và Thanh Toán
- Học viên chọn gia sư và đặt lịch
- Hệ thống tạo booking với trạng thái `pending`
- Thanh toán được giữ trong escrow (trạng thái `escrow`)
- Gia sư nhận thông báo yêu cầu đặt lịch

### 2. Gia Sư Chấp Nhận
- Gia sư chấp nhận yêu cầu đặt lịch
- Thanh toán chuyển sang trạng thái `held`
- Học viên nhận thông báo thanh toán đã được giữ
- Mã phòng học được tạo và gửi cho cả hai bên

### 3. Hoàn Thành Buổi Học
- Cả học viên và gia sư có thể xác nhận hoàn thành buổi học
- Thanh toán được giải phóng (trạng thái `released`)
- Gia sư nhận tiền (trừ phí platform 15%)
- Học viên nhận thông báo thanh toán đã được chuyển

### 4. Hủy Lịch và Hoàn Tiền
- Học viên hoặc gia sư có thể hủy lịch
- Hệ thống tính toán hoàn tiền dựa trên thời gian hủy:
  - Hủy trước 12h: Hoàn 100%
  - Hủy trong 12h: Hoàn 50%
- Thanh toán chuyển sang trạng thái `refunded`

### 5. Tranh Chấp
- Cả hai bên có thể mở tranh chấp trong vòng 48h
- Admin xử lý tranh chấp và quyết định:
  - Giải phóng tiền cho gia sư
  - Hoàn tiền cho học viên

## Trạng Thái Thanh Toán

| Trạng Thái | Mô Tả |
|------------|-------|
| `escrow` | Tiền được giữ trong escrow, chờ gia sư chấp nhận |
| `held` | Tiền được giữ, chờ buổi học hoàn thành |
| `released` | Tiền đã được chuyển cho gia sư |
| `refunded` | Tiền đã được hoàn cho học viên |

## Trạng Thái Booking

| Trạng Thái | Mô Tả |
|------------|-------|
| `pending` | Chờ gia sư chấp nhận |
| `accepted` | Đã được chấp nhận, chờ buổi học |
| `rejected` | Bị từ chối |
| `cancelled` | Đã bị hủy |
| `completed` | Đã hoàn thành |
| `in_progress` | Đang diễn ra |
| `disputed` | Có tranh chấp |

## API Endpoints

### Booking Management
- `POST /bookings` - Tạo booking mới với escrow
- `POST /bookings/:id/decision` - Gia sư chấp nhận/từ chối
- `POST /bookings/:id/complete` - Hoàn thành buổi học
- `POST /bookings/:id/cancel` - Hủy booking
- `POST /bookings/:id/dispute` - Mở tranh chấp

### Escrow Management
- `GET /bookings/escrow/stats` - Thống kê escrow (admin)

## Cấu Hình

### Phí Platform
- Tỷ lệ phí: 15% của giá buổi học
- Gia sư nhận: 85% của giá buổi học

### Thời Gian Hủy
- Hủy trước 12 giờ: Hoàn 100%
- Hủy trong 12 giờ: Hoàn 50%

### Thời Gian Tranh Chấp
- Có thể mở tranh chấp trong vòng 48 giờ sau buổi học
- Admin xử lý trong vòng 24 giờ

## Thông Báo Email

### Học Viên
- `payment_held` - Thanh toán đã được giữ
- `refund_processed` - Hoàn tiền đã được xử lý

### Gia Sư
- `payment_released` - Thanh toán đã được chuyển

### Admin
- `dispute_opened` - Tranh chấp mới cần xử lý

## Bảo Mật

- Tất cả giao dịch được ghi log
- Chỉ admin mới có thể xử lý tranh chấp
- Xác thực JWT cho tất cả API calls
- Kiểm tra quyền truy cập cho mỗi endpoint

## Monitoring

- Thống kê escrow theo trạng thái
- Log tất cả thay đổi trạng thái
- Thông báo real-time cho admin

## Cài Đặt

1. Cấu hình biến môi trường:
   ```
   ADMIN_EMAIL=admin@edumatch.com
   MAIL_USERNAME=your-email@gmail.com
   MAIL_PASSWORD=your-app-password
   ```

2. Khởi động server:
   ```bash
   cd backend
   npm start
   ```

3. Khởi động frontend:
   ```bash
   cd frontend
   npm start
   ```

## Testing

Sử dụng các test scripts để kiểm tra hệ thống:
- `test-booking-flow.js` - Test luồng đặt lịch
- `test-escrow-system.js` - Test hệ thống escrow
- `test-notification-system.js` - Test hệ thống thông báo
