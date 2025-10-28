# 🚀 Chat App - Localhost & Network Setup Guide

## 📋 Tóm tắt nhanh

### Localhost Mode (cùng máy):

```powershell
# Khởi động
.\start-app.ps1 localhost

# Hoặc thủ công:
# Terminal 1: cd backend && npm run dev
# Terminal 2: cd frontend && npm run dev
# Truy cập: http://localhost:5174
```

### Network Mode (2 máy khác nhau):

```powershell
# Khởi động
.\start-app.ps1 network

# Truy cập từ máy khác: http://192.168.1.218:5174
```

## 🔧 Chi tiết Setup

### 1. Cài đặt dependencies:

```powershell
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 2. Chạy ứng dụng:

#### Option A: Localhost (test trên cùng máy)

```powershell
# Chạy script tự động
.\start-app.ps1 localhost

# Hoặc thủ công:
# Terminal 1 - Backend:
cd backend
npm run dev    # Chạy trên http://localhost:5002

# Terminal 2 - Frontend:
cd frontend
npm run dev    # Chạy trên http://localhost:5174
```

#### Option B: Network (test trên 2 máy)

```powershell
# Chạy script tự động
.\start-app.ps1 network

# Hoặc thủ công:
cd frontend
.\switch-env.ps1 network    # Chuyển sang network mode
npm run dev                 # Restart frontend

# Backend tự động listen trên tất cả IP
```

### 3. Truy cập:

#### Localhost mode:

- Frontend: http://localhost:5174
- Backend API: http://localhost:5002

#### Network mode:

- **Từ máy chạy app:** http://localhost:5174 hoặc http://192.168.1.218:5174
- **Từ máy khác trong mạng:** http://192.168.1.218:5174
- Backend API: http://192.168.1.218:5002

## 🔥 Test Users

Để test login, sử dụng các account có sẵn:

```
Email: emma.thompson@example.com
Password: 123456

Email: james.anderson@example.com
Password: 123456
```

## 🛠️ Scripts tiện ích:

### Chuyển đổi nhanh frontend:

```powershell
cd frontend

# Chuyển sang localhost
.\switch-env.ps1 localhost

# Chuyển sang network
.\switch-env.ps1 network
```

### Kiểm tra IP máy:

```powershell
ipconfig | findstr "IPv4"
```

## 🚨 Troubleshooting:

### Lỗi kết nối từ máy khác:

1. Kiểm tra Windows Firewall:

   ```powershell
   # Cho phép port 5174 (frontend) và 5002 (backend)
   netsh advfirewall firewall add rule name="Chat App Frontend" dir=in action=allow protocol=TCP localport=5174
   netsh advfirewall firewall add rule name="Chat App Backend" dir=in action=allow protocol=TCP localport=5002
   ```

2. Kiểm tra IP có đúng không:

   ```powershell
   ipconfig | findstr "IPv4"
   ```

3. Test kết nối từ máy khác:

   ```powershell
   # Ping IP
   ping 192.168.1.218

   # Test port
   telnet 192.168.1.218 5002
   ```

### Lỗi CORS:

Backend đã được cấu hình để accept từ mọi origin, nhưng nếu vẫn gặp lỗi:

- Restart cả backend và frontend
- Xóa cache browser (Ctrl+Shift+R)

### Database issues:

```powershell
# Tạo test users
cd backend
node src/seeds/user.seed.js
```

## 📱 Sử dụng:

1. **Đăng ký tài khoản mới** hoặc dùng test accounts
2. **Login** với email/password
3. **Chat realtime** giữa các users
4. **Upload ảnh/video/files**
5. **Thay đổi theme** trong Settings

---

Happy coding! 🎉
