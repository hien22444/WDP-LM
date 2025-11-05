# Hướng Dẫn Chạy Dự Án WDP-LM

## Yêu Cầu Hệ Thống

- **Node.js** (phiên bản 14 trở lên)
- **npm** hoặc **yarn**
- **MongoDB** (hoặc MongoDB Atlas - đã có sẵn connection string)
- **Git** (để clone repository)

## Cấu Trúc Dự Án

```
wdpA/
├── backend/          # Backend Node.js/Express
├── frontend/         # Frontend React
└── ...
```

## Bước 1: Cài Đặt Dependencies

Dependencies đã được cài đặt. Nếu cần cài lại:

### Backend:
```bash
cd backend
npm install
```

### Frontend:
```bash
cd frontend
npm install
```

## Bước 2: Cấu Hình Môi Trường (Tùy Chọn)

Backend có sẵn fallback configuration, nhưng bạn có thể tạo file `.env` trong thư mục `backend/` nếu muốn tùy chỉnh:

```env
# MongoDB Connection
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
# hoặc
URI_DB=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority

# Server Port
PORT=5000

# JWT Secret
JWT_SECRET=your-secret-key

# Frontend URL (cho CORS)
FRONTEND_URL=http://localhost:3000

# PayOS Configuration (cho thanh toán)
PAYOS_CLIENT_ID=your-client-id
PAYOS_API_KEY=your-api-key
PAYOS_CHECKSUM_KEY=your-checksum-key

# Cloudinary (cho upload ảnh)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# AI Configuration (OpenAI hoặc Google Gemini)
CHATAI_PROVIDER=openai
OPENAI_API_KEY=your-openai-key
# hoặc
CHATAI_PROVIDER=google
GEMINI_API_KEY=your-gemini-key
```

**Lưu ý:** Backend đã có fallback connection string đến MongoDB Atlas, nên có thể chạy ngay mà không cần file `.env`.

## Bước 3: Chạy Backend

Mở terminal đầu tiên:

```bash
cd backend

# Chạy ở chế độ production
npm start

# Hoặc chạy ở chế độ development (với nodemon - tự động restart)
npm run dev
```

Backend sẽ chạy tại: **http://localhost:5000**

API endpoints:
- Health check: `http://localhost:5000/api/health`
- API base: `http://localhost:5000/api/v1/`

## Bước 4: Chạy Frontend

Mở terminal thứ hai:

```bash
cd frontend
npm start
```

Frontend sẽ tự động mở trình duyệt tại: **http://localhost:3000**

## Chạy Cùng Lúc (Windows PowerShell)

Nếu muốn chạy cả 2 cùng lúc, bạn có thể:

### Cách 1: Mở 2 terminal riêng
- Terminal 1: `cd backend; npm start`
- Terminal 2: `cd frontend; npm start`

### Cách 2: Sử dụng npm-run-all (nếu đã cài)
```bash
npm install -g npm-run-all
npm-run-all --parallel backend frontend
```

### Cách 3: Tạo script tùy chỉnh
Tạo file `start.bat` ở thư mục gốc:
```batch
@echo off
start cmd /k "cd backend && npm start"
timeout /t 3
start cmd /k "cd frontend && npm start"
```

## Kiểm Tra Kết Nối

1. **Backend:**
   - Mở: http://localhost:5000/api/health
   - Kết quả mong đợi: `{"status":"ok","time":"..."}`

2. **Frontend:**
   - Mở: http://localhost:3000
   - Giao diện ứng dụng sẽ hiển thị

3. **MongoDB:**
   - Backend sẽ tự động kết nối đến MongoDB Atlas
   - Kiểm tra console log: `✅ Kết nối DB thành công - Database: test`

## Các Scripts Có Sẵn

### Backend:
- `npm start` - Chạy server (production mode)
- `npm run dev` - Chạy server với nodemon (development mode)
- `npm test` - Chạy tests (hiện tại chưa có tests)

### Frontend:
- `npm start` - Chạy development server
- `npm run build` - Build cho production
- `npm test` - Chạy tests

## Các Port Mặc Định

- **Backend:** 5000
- **Frontend:** 3000

Nếu các port này đã được sử dụng:
- Backend: Đặt biến môi trường `PORT` trong file `.env`
- Frontend: Sẽ tự động hỏi bạn có muốn dùng port khác không

## Troubleshooting

### Lỗi kết nối MongoDB:
- Kiểm tra internet connection
- Kiểm tra MongoDB Atlas connection string
- Xem log console để biết chi tiết lỗi

### Lỗi port đã được sử dụng:
```bash
# Windows: Tìm process đang dùng port
netstat -ano | findstr :5000
netstat -ano | findstr :3000

# Kill process (thay PID bằng process ID)
taskkill /PID <PID> /F
```

### Lỗi dependencies:
```bash
# Xóa node_modules và cài lại
rm -rf node_modules package-lock.json
npm install
```

### Frontend không kết nối được với Backend:
- Kiểm tra backend đã chạy chưa
- Kiểm tra CORS configuration trong `backend/server.js`
- Kiểm tra `FRONTEND_URL` trong file `.env`

## Tính Năng Chính

Dự án này bao gồm:
- ✅ Hệ thống xác thực (Auth) - Đăng nhập/Đăng ký
- ✅ Quản lý gia sư (Tutor Management)
- ✅ Đặt lịch học (Booking System)
- ✅ Thanh toán (Payment) - Tích hợp PayOS
- ✅ Ví điện tử (Wallet)
- ✅ Chat & Video call (WebRTC)
- ✅ AI Chat Assistant
- ✅ Quản trị viên (Admin Panel)
- ✅ Đánh giá & Review

## Liên Kết Hữu Ích

- Backend API Documentation: Kiểm tra các file `.md` trong thư mục gốc
- MongoDB Atlas: https://cloud.mongodb.com/
- PayOS: https://pay.payos.vn/

---

**Chúc bạn code vui vẻ! 🚀**

