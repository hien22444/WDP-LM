# 🔍 KIỂM TRA LOGIC CHAT VÀ THÔNG BÁO

## ✅ **ĐÃ HOẠT ĐỘNG:**
- ✅ Nhận được thông báo
- ✅ Hiển thị trong dropdown
- ✅ Socket connection thành công

## 🚨 **CÁC VẤN ĐỀ LOGIC CẦN SỬA:**

### **1. "Unknown User" - Tên người gửi**
**Vấn đề:** Thông báo hiển thị "Tin nhắn từ Unknown User"
**Nguyên nhân:** Frontend gửi `userName` không đúng trong authentication

**Debug logs mong đợi:**
```
🔍 ChatContext: userData for userName extraction: {
  "profile.full_name": "Nguyễn Văn A",
  "name": undefined,
  "account.email": "user@example.com",
  "account.role": "student"
}
🔍 ChatContext: Authenticating with: { userId: "...", userName: "Nguyễn Văn A", userRole: "student" }
```

### **2. Notification Badge - Không có số đỏ**
**Vấn đề:** Biểu tượng chuông không có badge số
**Nguyên nhân:** `totalUnreadCount` không được tính đúng

**Debug logs mong đợi:**
```
🔔 NotificationCenter Debug: {
  apiNotifications: 0,
  chatNotifications: 1,
  totalNotifications: 1,
  totalUnreadCount: 1,
  chatUnreadCount: 1,
  apiUnreadCount: 0,
  allNotificationsUnread: 1
}
```

### **3. Timestamp Format**
**Vấn đề:** "2 phút trước" - cần kiểm tra format
**Nguyên nhân:** Có thể là timezone hoặc format không đúng

## 🔧 **CÁC BƯỚC KIỂM TRA:**

### **Step 1: Hard Refresh**
```
Ctrl + Shift + R
```

### **Step 2: Kiểm tra Console Logs**

#### **Mong đợi thấy:**
```
🔍 ChatContext: userData for userName extraction: {
  "profile.full_name": "Tên thật của user",
  "name": undefined,
  "account.email": "email@example.com",
  "account.role": "student"
}
🔍 ChatContext: Authenticating with: { userId: "...", userName: "Tên thật của user", userRole: "student" }
```

#### **Backend logs mong đợi:**
```
User authenticated: Tên thật của user (userId)
Broadcasting message to room chat_...: {
  senderId: "...",
  senderName: "Tên thật của user",
  message: "...",
  timestamp: "..."
}
```

### **Step 3: Test Complete Flow**

#### **Tab 1 (Sender):**
1. **Login vào tài khoản**
2. **Mở trang gia sư**
3. **Click "Liên hệ"**
4. **Gửi tin nhắn: "Xin chào thầy"**

#### **Tab 2 (Receiver):**
1. **Login vào tài khoản khác**
2. **Kiểm tra notification badge** (số đỏ trên chuông)
3. **Click vào notification**
4. **Kiểm tra tên người gửi**

### **Step 4: Expected Results**

#### **Notification Badge:**
- ✅ Số đỏ hiển thị trên biểu tượng chuông
- ✅ Số đúng với số thông báo chưa đọc

#### **Notification Content:**
- ✅ "Tin nhắn từ [Tên thật]" thay vì "Unknown User"
- ✅ Timestamp hiển thị đúng format
- ✅ Click notification mở chat

#### **Chat Flow:**
- ✅ Chat mở với đúng người gửi
- ✅ Có thể trả lời tin nhắn
- ✅ Tin nhắn được lưu và hiển thị

## 🎯 **READY TO TEST!**

**Hãy làm theo các bước trên và cho tôi biết kết quả!**
