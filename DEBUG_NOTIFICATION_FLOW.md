# 🔍 DEBUG NOTIFICATION FLOW

## 🚨 **VẤN ĐỀ HIỆN TẠI:**
- ✅ Backend đang chạy (port 5000)
- ✅ Frontend đang chạy (port 3000)  
- ❌ Notification counts = 0
- ❌ Console có JavaScript runtime errors

## 🔧 **DEBUG STEPS:**

### **Step 1: Hard Refresh Frontend**
```
Ctrl + Shift + R
```

### **Step 2: Kiểm tra Console Logs**

#### **Mong đợi trong Console:**
```
🔍 ChatContext useEffect triggered with currentUser: {...}
🔍 ChatContext: Extracted userId: [userId]
🔍 ChatContext: Connecting to socket: http://localhost:5000/chat
✅ ChatContext: Connected to notification server
🔍 ChatContext: Authenticating with: {userId: "...", userName: "...", userRole: "..."}
✅ ChatContext: Notification authentication successful
```

#### **Nếu có lỗi:**
```
❌ ChatContext: No currentUser, skipping socket initialization
❌ ChatContext: Socket connection error: [error details]
⚠️ ChatContext: Socket disconnected: [reason]
```

### **Step 3: Test Chat Flow**

#### **Tab 1 (Sender):**
1. **Login vào tài khoản**
2. **Mở trang gia sư**
3. **Click "Liên hệ"**
4. **Gửi tin nhắn**

#### **Tab 2 (Receiver):**
1. **Login vào tài khoản khác**
2. **Kiểm tra notification badge**
3. **Kiểm tra console logs**

### **Step 4: Backend Logs**

#### **Mong đợi trong Backend Console:**
```
ChatSocket: User authenticated: [userName] ([userId])
🔍 Looking for receiver [receiverId] in connected sockets:
✅ Notified receiver [receiverId] (socket [socketId]) for notification
```

## 🐛 **CÁC VẤN ĐỀ CÓ THỂ:**

### **1. currentUser undefined**
- Redux store không có user data
- Login không thành công
- Token expired

### **2. Socket Connection Failed**
- CORS issues
- Network issues
- Backend socket not initialized

### **3. Authentication Failed**
- userId format không đúng
- Backend không nhận được authenticate event
- User not found in database

### **4. Event Mismatch**
- Frontend listen sai event name
- Backend emit sai event name
- Data format không match

## 🎯 **NEXT STEPS:**

1. **Hard refresh frontend**
2. **Kiểm tra console logs**
3. **Test chat flow**
4. **Debug từng bước**

**Ready to debug!** 🚀
