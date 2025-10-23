# 🔔 Hệ Thống Thông Báo EduMatch

## 📋 Tổng Quan

Hệ thống thông báo được thiết kế để thông báo cho tutor và học viên khi có các sự kiện quan trọng xảy ra trong quá trình đặt lịch và học tập.

## 🎯 Các Loại Thông Báo

### 1. **Email Notifications** 📧

#### Khi Học Viên Book Khóa Học:
- **Người nhận**: Gia sư
- **Nội dung**: Thông tin chi tiết về yêu cầu đặt lịch
- **Template**: `booking_created`
- **Thời gian**: Ngay lập tức sau khi tạo booking

#### Khi Gia Sư Accept/Reject:
- **Người nhận**: Học viên
- **Nội dung**: Kết quả phản hồi từ gia sư
- **Template**: `booking_accepted` hoặc `booking_rejected`
- **Thời gian**: Ngay lập tức sau khi gia sư quyết định

### 2. **In-App Notifications** 🔔

#### Notification Center:
- **Vị trí**: Header (bên cạnh avatar)
- **Hiển thị**: Bell icon với badge số lượng thông báo chưa đọc
- **Tính năng**:
  - Dropdown danh sách thông báo
  - Đánh dấu đã đọc
  - Click để xem chi tiết
  - Real-time updates

#### Toast Notifications:
- **Vị trí**: Top-right corner
- **Hiển thị**: Khi thực hiện actions
- **Loại**: Success, Error, Info, Warning

## 🛠️ Cấu Trúc Kỹ Thuật

### Backend Services

#### `NotificationService.js`
```javascript
// Email templates
- booking_created: Thông báo gia sư có yêu cầu mới
- booking_accepted: Thông báo học viên được chấp nhận
- booking_rejected: Thông báo học viên bị từ chối

// Functions
- notifyTutorBookingCreated(booking)
- notifyStudentBookingDecision(booking, decision)
- sendNotificationEmail(to, type, data)
```

#### Email Configuration
```env
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=no-reply@edumatch.com
FRONTEND_URL=http://localhost:3000
```

### Frontend Components

#### `NotificationCenter.js`
- Bell icon với badge
- Dropdown danh sách thông báo
- Mark as read functionality
- Responsive design

#### `ToastContainer` (react-toastify)
- Global toast notifications
- Auto-close after 3 seconds
- Multiple positions support

## 📧 Email Templates

### 1. Booking Created (Gia Sư)
```
🎓 EduMatch - Yêu cầu đặt lịch mới

Xin chào [Tên Gia Sư],

Bạn có một yêu cầu đặt lịch mới từ học viên:

📚 Thông tin khóa học
- Học viên: [Tên Học Viên]
- Thời gian: [Ngày giờ]
- Hình thức: [Online/Offline]
- Học phí: [Giá tiền]
- Ghi chú: [Nếu có]

[Xem chi tiết và phản hồi]
```

### 2. Booking Accepted (Học Viên)
```
🎓 EduMatch - Đặt lịch thành công!

Xin chào [Tên Học Viên],

Chúc mừng! Yêu cầu đặt lịch của bạn đã được gia sư chấp nhận:

📚 Thông tin khóa học
- Gia sư: [Tên Gia Sư]
- Thời gian: [Ngày giờ]
- Hình thức: [Online/Offline]
- Học phí: [Giá tiền]
- Địa điểm: [Nếu offline]

📋 Bước tiếp theo:
- Gia sư sẽ liên hệ với bạn
- Thanh toán học phí
- Tham gia buổi học đúng giờ
```

### 3. Booking Rejected (Học Viên)
```
🎓 EduMatch - Yêu cầu không được chấp nhận

Xin chào [Tên Học Viên],

Rất tiếc, yêu cầu đặt lịch của bạn không được gia sư chấp nhận:

📚 Thông tin khóa học
- Gia sư: [Tên Gia Sư]
- Thời gian: [Ngày giờ]
- Lý do: Gia sư không thể sắp xếp thời gian

💡 Gợi ý:
- Tìm kiếm gia sư khác
- Thử đặt lịch với thời gian khác
- Liên hệ với gia sư để trao đổi
```

## 🚀 Cách Sử Dụng

### 1. Cấu Hình Email
```bash
# Backend .env
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=no-reply@edumatch.com
FRONTEND_URL=http://localhost:3000
```

### 2. Test Notifications
```javascript
// Test email sending
const { sendNotificationEmail } = require('./services/NotificationService');

await sendNotificationEmail(
  'test@example.com',
  'booking_created',
  {
    tutorName: 'Nguyễn Văn A',
    studentName: 'Trần Thị B',
    start: new Date(),
    mode: 'online',
    price: 200000
  }
);
```

### 3. Frontend Integration
```javascript
// Import toast notifications
import { toast } from 'react-toastify';

// Success notification
toast.success('🎉 Đặt lịch thành công!');

// Error notification
toast.error('❌ Không thể đặt lịch. Vui lòng thử lại.');
```

## 📊 Monitoring & Analytics

### Email Delivery
- ✅ Success: Log với messageId
- ❌ Error: Log với error message
- 🔄 Retry: Automatic retry for failed emails

### Notification Metrics
- Total notifications sent
- Delivery success rate
- User engagement (click rate)
- Response time

## 🔧 Troubleshooting

### Common Issues

#### 1. Email Not Sending
```bash
# Check email credentials
echo $MAIL_USERNAME
echo $MAIL_PASSWORD

# Check Gmail app password
# Enable 2FA and generate app password
```

#### 2. Toast Not Showing
```javascript
// Ensure ToastContainer is in App.js
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Add to render
<ToastContainer position="top-right" />
```

#### 3. Notification Center Not Working
```javascript
// Check if user is authenticated
const isAuthenticated = useSelector(state => state.user?.isAuthenticated);

// Check if component is imported
import NotificationCenter from '../Notifications/NotificationCenter';
```

## 🎨 Customization

### Email Templates
- Edit templates in `NotificationService.js`
- Modify HTML/CSS styling
- Add company branding

### Toast Styling
```scss
// Custom toast styles
.Toastify__toast {
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
}

.Toastify__toast--success {
  background: linear-gradient(135deg, #28a745, #20c997);
}
```

### Notification Center
```scss
// Custom notification styles
.notification-center {
  .notification-bell {
    // Custom bell styling
  }
  
  .notification-dropdown {
    // Custom dropdown styling
  }
}
```

## 📈 Future Enhancements

### Planned Features
1. **Push Notifications**: Browser push notifications
2. **SMS Notifications**: Twilio integration
3. **WebSocket**: Real-time notifications
4. **Notification Preferences**: User settings
5. **Email Scheduling**: Delayed notifications
6. **Rich Templates**: Advanced HTML templates
7. **Analytics Dashboard**: Notification metrics
8. **A/B Testing**: Template optimization

### Integration Opportunities
- **Slack**: Team notifications
- **Discord**: Community notifications
- **Telegram**: Bot notifications
- **WhatsApp**: Business API
- **Zapier**: Third-party integrations

## 🎯 Best Practices

### Email Design
- ✅ Mobile-responsive templates
- ✅ Clear call-to-action buttons
- ✅ Consistent branding
- ✅ Concise messaging
- ❌ Avoid spam triggers

### Notification UX
- ✅ Clear visual hierarchy
- ✅ Appropriate timing
- ✅ Easy dismissal
- ✅ Action-oriented
- ❌ Avoid notification fatigue

### Performance
- ✅ Async email sending
- ✅ Error handling
- ✅ Rate limiting
- ✅ Caching
- ❌ Blocking operations

---

## 📞 Support

Nếu có vấn đề với hệ thống thông báo, vui lòng:

1. **Check logs**: Backend console logs
2. **Test email**: Send test notification
3. **Verify config**: Environment variables
4. **Contact support**: Technical team

**Happy Notifying! 🎉**
