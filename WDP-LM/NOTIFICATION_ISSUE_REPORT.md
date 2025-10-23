# Báo cáo vấn đề thông báo - Tutor không nhận được thông báo khi book khóa học

## 🐛 **Vấn đề**

Khi học viên book 1 khóa học, tutor không nhận được thông báo.

## 🔍 **Nguyên nhân phân tích**

### **1. Hệ thống thông báo đã được implement**
- ✅ Function `notifyTutorBookingCreated` đã có
- ✅ Email template `booking_created` đã có
- ✅ API endpoint đã gọi notification service
- ✅ Backend logs sẽ hiển thị thông báo

### **2. Vấn đề chính: Email Configuration**
```javascript
const createTransporter = () => {
  const user = process.env.MAIL_USERNAME || process.env.MAIL_LEARNMATE_USERNAME;
  const pass = process.env.MAIL_PASSWORD || process.env.MAIL_LEARNMATE_PASSWORD;
  
  if (!user || !pass) {
    console.warn("⚠️ Email credentials not configured - notifications will be logged only");
    return null; // ← Vấn đề ở đây!
  }
}
```

**Kết quả**: Hệ thống chạy ở **MOCK MODE** thay vì gửi email thật.

## 🔧 **Cách khắc phục**

### **Phương án 1: Cấu hình Email thật (Khuyến nghị)**

#### **Bước 1: Tạo Gmail App Password**
1. Vào Google Account Settings
2. Security → 2-Step Verification (bật nếu chưa có)
3. App passwords → Generate password cho "EduMatch"
4. Copy password được tạo

#### **Bước 2: Cấu hình Environment Variables**
Tạo file `.env` trong `WDP-LM/backend/`:
```env
MAIL_USERNAME=your-gmail@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=no-reply@edumatch.com
FRONTEND_URL=http://localhost:3000
```

#### **Bước 3: Restart Backend**
```bash
cd WDP-LM/backend
node server.js
```

### **Phương án 2: Cải thiện Mock Mode (Tạm thời)**

#### **Thêm console.log chi tiết hơn:**
```javascript
const sendNotificationEmail = async (to, type, data) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log(`\n📧 [EMAIL MOCK] ${type.toUpperCase()}`);
      console.log(`   To: ${to}`);
      console.log(`   Subject: ${createEmailTemplate(type, data).subject}`);
      console.log(`   Data:`, JSON.stringify(data, null, 2));
      console.log(`   ──────────────────────────────────────\n`);
      return { success: true, mode: "mock" };
    }
    // ... rest of function
  }
}
```

### **Phương án 3: Thêm In-App Notifications**

#### **Tạo Notification Model:**
```javascript
// backend/src/models/Notification.js
const notificationSchema = new mongoose.Schema({
  userId: { type: ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: Object, default: {} },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
```

#### **Cập nhật NotificationService:**
```javascript
const notifyTutorBookingCreated = async (booking) => {
  try {
    // ... existing code ...
    
    // Save to database
    await Notification.create({
      userId: tutorProfile.user._id,
      type: 'booking_created',
      title: 'Yêu cầu đặt lịch mới',
      message: `${data.studentName} muốn đặt lịch học`,
      data: data
    });
    
    // Send email
    return await sendNotificationEmail(tutorProfile.user.email, 'booking_created', data);
  } catch (error) {
    console.error("Error notifying tutor:", error);
    return { success: false, error: error.message };
  }
};
```

## 🧪 **Cách test**

### **Test với Mock Mode:**
```bash
cd WDP-LM
node test-notification-system.js
```

**Kết quả mong đợi:**
```
📧 [EMAIL MOCK] BOOKING_CREATED
   To: tutor@example.com
   Subject: 🎓 Có yêu cầu đặt lịch mới - EduMatch
   Data: { tutorName: "...", studentName: "...", ... }
```

### **Test với Email thật:**
1. Cấu hình email credentials
2. Restart backend
3. Chạy test script
4. Kiểm tra email của tutor

## 📊 **Tình trạng hiện tại**

| Component | Status | Notes |
|-----------|--------|-------|
| Backend API | ✅ Hoạt động | Gọi notification service |
| Notification Service | ✅ Hoạt động | Function đã implement |
| Email Templates | ✅ Hoạt động | Template đẹp và đầy đủ |
| Email Configuration | ❌ Chưa cấu hình | Chạy ở mock mode |
| In-App Notifications | ❌ Chưa có | Cần implement |

## 🎯 **Khuyến nghị**

### **Ưu tiên cao:**
1. **Cấu hình email thật** để gửi thông báo thực tế
2. **Test với email thật** để đảm bảo hoạt động

### **Ưu tiên trung bình:**
3. **Thêm in-app notifications** cho trải nghiệm tốt hơn
4. **Cải thiện mock mode** để debug dễ hơn

### **Ưu tiên thấp:**
5. **Thêm SMS notifications** (nếu cần)
6. **Thêm push notifications** (nếu cần)

## 🚀 **Kết luận**

**Vấn đề**: Tutor không nhận được thông báo khi book khóa học

**Nguyên nhân**: Email credentials chưa được cấu hình, hệ thống chạy ở mock mode

**Giải pháp**: Cấu hình MAIL_USERNAME và MAIL_PASSWORD trong .env file

**Tình trạng**: ✅ **Dễ khắc phục** - chỉ cần cấu hình email credentials!
