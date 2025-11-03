# 🧪 Load Testing Guide

## 📋 Mục đích

Test hiệu năng server chat với nhiều users và messages đồng thời để:

- Kiểm tra khả năng xử lý tải cao
- Phát hiện bottlenecks
- Đo throughput (messages/second)
- Theo dõi CPU, Memory usage

---

## 🚀 Các Scripts Test

### 1. **Simple Load Test** (Nhẹ - Development)

Test nhanh với **10 users x 5 messages = 50 messages**

```bash
npm run load-test:simple
```

**Output mẫu:**

```
✅ User 1 connected
📤 User 1 sent message 1
📥 Received message (1 total)
...
📊 RESULTS
Connected:  10/10
Sent:       50
Received:   50
```

---

### 2. **Full Load Test** (Nặng - Production)

Test với **1000 users x 10 messages = 10,000 messages**

```bash
npm run load-test
```

**Output mẫu:**

```
📝 Creating 1000 fake users...
✅ Created 1000 users
🔌 Connecting 1000 WebSocket clients...
✅ Connected 1000 sockets
📨 Sending 10 messages from each user...

📊 LOAD TEST RESULTS
👥 Users Created:        1000
🔌 Sockets Connected:    1000
📤 Messages Sent:        10000 / 10000
📥 Messages Received:    10000
❌ Errors:               0
⏱️  Duration:             45.23s
🚀 Messages/Second:      221.08
✅ Success Rate:         100.00%
```

---

### 3. **Performance Monitor**

Theo dõi server real-time (CPU, Memory, Sockets)

```bash
npm run monitor
```

**Output mẫu:**

```
🔍 Server Performance Monitor
⏰ Time: 09:45:30

💻 System:
   Platform:    win32
   CPUs:        8 cores
   Total RAM:   16.00 GB
   Free RAM:    8.50 GB

🧠 Memory Usage:
   RSS:         152.45 MB
   Heap Total:  120.30 MB
   Heap Used:   95.67 MB

⚡ CPU Usage:
   User:        15.20%
   System:      5.30%

🔌 Socket: Connected ✅
```

---

## 📊 Metrics Quan Trọng

### 1. **Throughput**

- Messages/second server xử lý được
- **Tốt**: > 200 msg/s
- **Chấp nhận**: 100-200 msg/s
- **Chậm**: < 100 msg/s

### 2. **Success Rate**

- % messages gửi thành công
- **Tốt**: 100%
- **Chấp nhận**: > 95%
- **Có vấn đề**: < 95%

### 3. **Memory Usage**

- RAM server sử dụng
- **Tốt**: < 500 MB với 1000 users
- **Chấp nhận**: 500-1000 MB
- **Leak**: Tăng liên tục không dừng

### 4. **CPU Usage**

- % CPU server dùng
- **Tốt**: < 30%
- **Chấp nhận**: 30-70%
- **Quá tải**: > 70%

---

## 🔧 Cấu hình Test

### Thay đổi số lượng users/messages:

**load-test.js:**

```javascript
const NUM_USERS = 1000; // Số users
const MESSAGES_PER_USER = 10; // Messages/user
```

**simple-load-test.js:**

```javascript
const NUM_USERS = 10;
const MESSAGES_PER_USER = 5;
```

### Thay đổi server URL:

```javascript
const SERVER_URL = "http://localhost:5001";
```

---

## 🎯 Kịch bản Test

### Test 1: Baseline (10 users)

```bash
# Sửa NUM_USERS = 10 trong load-test.js
npm run load-test
```

**Mục đích**: Đo hiệu năng cơ bản

### Test 2: Medium Load (100 users)

```bash
# Sửa NUM_USERS = 100
npm run load-test
```

**Mục đích**: Test tải trung bình

### Test 3: High Load (1000 users)

```bash
# Sửa NUM_USERS = 1000
npm run load-test
```

**Mục đích**: Test giới hạn server

### Test 4: Stress Test (10000 users)

```bash
# Sửa NUM_USERS = 10000
npm run load-test
```

**Mục đích**: Tìm breaking point

---

## ⚠️ Lưu ý

1. **Database**: MongoDB phải chạy và có đủ disk space
2. **Server**: Backend phải running (`npm run dev` trong /backend)
3. **Memory**: Test với 10000 users cần ~2GB RAM
4. **Network**: Test trên localhost để tránh network latency
5. **Cleanup**: Test tạo fake users trong DB, nên xóa sau khi test:
   ```bash
   # Trong MongoDB
   db.users.deleteMany({ email: /^loadtest/ })
   ```

---

## 📈 Benchmark Mẫu

**Môi trường**: Intel i5, 16GB RAM, SSD, localhost

| Users | Messages | Duration | Throughput | Success Rate |
| ----- | -------- | -------- | ---------- | ------------ |
| 10    | 100      | 0.45s    | 222 msg/s  | 100%         |
| 100   | 1000     | 4.5s     | 222 msg/s  | 100%         |
| 1000  | 10000    | 45s      | 222 msg/s  | 98%          |
| 5000  | 50000    | 240s     | 208 msg/s  | 92%          |

**Kết luận**: Server handle tốt đến 1000 concurrent users

---

## 🐛 Troubleshooting

### Lỗi: "connect ECONNREFUSED"

- Backend chưa chạy
- **Fix**: `cd backend && npm run dev`

### Lỗi: "Too many connections"

- Server không handle được nhiều sockets
- **Fix**: Tăng `maxHttpBufferSize` trong socket.io config

### Memory leak

- Heap tăng liên tục không giảm
- **Fix**: Check event listeners, clear intervals

### Timeout errors

- Server quá tải
- **Fix**: Giảm NUM_USERS hoặc tối ưu code

---

## 🎓 Best Practices

1. **Chạy test từ nhỏ đến lớn**: 10 → 100 → 1000 users
2. **Monitor trước khi test**: Chạy `npm run monitor` ở terminal khác
3. **Test nhiều lần**: Lấy trung bình 3-5 lần
4. **Clean database**: Xóa test users sau mỗi test
5. **Document results**: Lưu metrics để so sánh

---

## 📝 Ví dụ Test Report

```markdown
## Load Test Results - 30/10/2024

### Configuration

- Users: 1000
- Messages/User: 10
- Total Messages: 10,000
- Server: localhost:5001
- Environment: Development

### Results

- Duration: 45.23s
- Throughput: 221.08 msg/s
- Success Rate: 100%
- Errors: 0

### Performance

- Max Memory: 456 MB
- Avg CPU: 25%
- Latency p50: 12ms
- Latency p95: 45ms

### Conclusion

✅ Server handles 1000 concurrent users well
✅ No memory leaks detected
⚠️ Consider load balancing for >5000 users
```

---

Xong! Giờ có thể test server với 1000 users! 🚀
