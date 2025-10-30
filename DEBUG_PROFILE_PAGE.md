# 🔍 DEBUG PROFILE PAGE

## 🚨 **VẤN ĐỀ:**
- Trang profile không hiển thị được (mờ/blur)
- Không thấy nội dung

## 🔧 **CÁC BƯỚC DEBUG:**

### **Step 1: Hard Refresh**
```
Ctrl + Shift + R
```

### **Step 2: Mở Developer Tools**
- Nhấn F12 hoặc Ctrl + Shift + I
- Check Console tab

### **Step 3: Kiểm tra Console Logs**

#### **Có thể có các lỗi:**
```
❌ Failed to fetch user profile
❌ Cannot read property '...' of undefined
❌ Network Error
❌ CORS Error
```

### **Step 4: Kiểm tra Network**
- DevTools → Network tab
- Reload trang (F5)
- Tìm request `/api/v1/users/me`
- Kiểm tra status code:
  - 200 = OK
  - 401 = Chưa login
  - 500 = Server error

### **Step 5: Kiểm tra Browser Console Errors**
- Nếu có JavaScript errors, copy và gửi cho tôi
- Thường sẽ có lỗi như:
  ```
  Uncaught Error: ...
  TypeError: ...
  ```

## 🎯 **NGUYÊN NHÂN THƯỜNG GẶP:**

1. **Chưa login** → Redirect về `/signin`
2. **API error** → Backend không chạy hoặc database không kết nối
3. **JavaScript error** → Component render fail
4. **CORS error** → Backend không cho phép frontend
5. **Network error** → Backend không chạy

## 🔧 **TEST:**

### **Test 1: Backend Health Check**
```bash
curl http://localhost:5000/api/health
```
**Expected:** `{"status":"ok"}`

### **Test 2: Frontend Health Check**
```bash
curl http://localhost:3000
```
**Expected:** HTML response

### **Test 3: API Test**
```bash
curl http://localhost:5000/api/v1/tutors/search?page=1
```
**Expected:** JSON response with tutors

## 🚀 **NEXT STEPS:**

Hãy cho tôi biết:
1. Console có lỗi gì không?
2. Network tab cho request `/api/v1/users/me` có status code gì?
3. Backend có đang chạy không?

**Hãy check và cho tôi biết kết quả!** 🚀
