# Hướng Dẫn Cấu Hình Google OAuth

## Vấn Đề Hiện Tại

Bạn đang gặp lỗi **"deleted_client"** khi đăng nhập bằng Google. Điều này có nghĩa là:
- Google OAuth Client ID không được cấu hình
- Hoặc Client ID đã bị xóa trong Google Cloud Console
- Hoặc Client ID không hợp lệ

## Giải Pháp Tạm Thời

**Code đã được cập nhật:** Nút "Đăng nhập với Google" sẽ tự động ẩn nếu Google OAuth chưa được cấu hình. Bạn vẫn có thể đăng nhập bằng **email/mật khẩu** hoặc **Facebook**.

## Cách Cấu Hình Google OAuth (Nếu Muốn Sử Dụng)

### Bước 1: Tạo Google Cloud Project

1. Truy cập: https://console.cloud.google.com/
2. Tạo một project mới hoặc chọn project có sẵn
3. Kích hoạt **Google+ API** và **Identity Toolkit API**

### Bước 2: Tạo OAuth 2.0 Client ID

1. Vào **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Nếu chưa có OAuth consent screen, bạn sẽ được yêu cầu cấu hình:
   - Chọn **External** (cho development) hoặc **Internal** (cho G Suite)
   - Điền thông tin: App name, User support email, Developer contact
   - Lưu và tiếp tục

4. Tạo OAuth Client ID:
   - **Application type**: Web application
   - **Name**: WDP-LM (hoặc tên bạn muốn)
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000`
     - `http://localhost:5000`
   - **Authorized redirect URIs**:
     - `http://localhost:5000/google/redirect`
     - `http://localhost:5000/api/v1/auth/google/callback` (nếu có)

5. Click **Create** và lưu lại:
   - **Client ID** (sẽ có dạng: `xxxxx.apps.googleusercontent.com`)
   - **Client Secret** (sẽ có dạng: `GOCSPX-xxxxx`)

### Bước 3: Cấu Hình Backend

1. Tạo hoặc chỉnh sửa file `.env` trong thư mục `backend/`:

```env
# Google OAuth Configuration
GOOGLE_APP_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_APP_CLIENT_SECRET=GOCSPX-your-client-secret

# Optional: Custom redirect URI (default: http://localhost:5000/google/redirect)
GOOGLE_APP_CLIENT_REDIRECT_LOGIN=http://localhost:5000/google/redirect

# Backend URL (optional, default: http://localhost:5000)
BACKEND_PUBLIC_URL=http://localhost:5000
```

2. **Lưu ý quan trọng**: Thay thế `your-client-id` và `your-client-secret` bằng giá trị thực từ Google Cloud Console.

### Bước 4: Khởi Động Lại Backend

```bash
cd backend
npm start
# hoặc
npm run dev
```

### Bước 5: Kiểm Tra

1. Truy cập: http://localhost:5000/api/v1/auth/google-config
2. Nếu thấy response có `clientId`, nghĩa là cấu hình thành công
3. Nút "Đăng nhập với Google" sẽ tự động xuất hiện trên trang Sign In

## Troubleshooting

### Lỗi: "redirect_uri_mismatch"
- Kiểm tra lại **Authorized redirect URIs** trong Google Cloud Console
- Đảm bảo URI khớp chính xác với `GOOGLE_APP_CLIENT_REDIRECT_LOGIN` trong file `.env`

### Lỗi: "invalid_client"
- Kiểm tra lại `GOOGLE_APP_CLIENT_ID` và `GOOGLE_APP_CLIENT_SECRET` trong file `.env`
- Đảm bảo không có khoảng trắng thừa

### Lỗi: "deleted_client"
- Client ID đã bị xóa trong Google Cloud Console
- Tạo Client ID mới và cập nhật file `.env`

## Không Muốn Sử Dụng Google OAuth?

**Không sao cả!** Code đã được cập nhật để tự động ẩn nút Google Login nếu chưa được cấu hình. Bạn vẫn có thể:
- ✅ Đăng nhập bằng email/mật khẩu
- ✅ Đăng ký tài khoản mới
- ✅ Sử dụng Facebook Login (nếu đã cấu hình)

---

**Lưu ý**: File `.env` nằm trong thư mục `backend/` và **KHÔNG được commit** lên Git (đã có trong `.gitignore`).

