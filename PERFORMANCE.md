# Cải thiện Performance cho Production

## Hiện tại:

- ✅ Simple test: Nhanh nhưng không thực tế (no DB, no auth)
- ✅ Load test: Tốt với batching (41 msg/s, 100% success)
- ❌ Stress test: Fail khi không batch (0.57% success)

## Bottlenecks hiện tại:

### 1. MongoDB Connection Pool

**Vấn đề**: Default pool size = 10 connections
**Giải pháp**: Tăng pool size

```javascript
// backend/src/lib/db.js
mongoose.connect(process.env.MONGO_URI, {
  maxPoolSize: 50, // Thêm dòng này
  minPoolSize: 10,
  socketTimeoutMS: 45000,
});
```

### 2. Express.js Concurrency

**Vấn đề**: Node.js single-threaded, xử lý I/O chậm
**Giải pháp**:

- Dùng clustering (PM2)
- Redis cache cho queries thường dùng
- Message queue (Bull/RabbitMQ)

### 3. Cloudinary Upload

**Vấn đề**: Mỗi image/video upload = 1-5s
**Giải pháp**:

- Upload async (background job)
- Response ngay, upload sau
- CDN caching

### 4. Database Indexes

**Vấn đề**: Query chậm khi có nhiều users/messages
**Giải pháp**:

```javascript
// backend/src/models/message.model.js
messageSchema.index({ senderId: 1, receiverId: 1 });
messageSchema.index({ createdAt: -1 });
```

## Khuyến nghị:

### Development (hiện tại):

- ✅ Dùng **simple test** cho quick checks
- ✅ Dùng **load test** (batched) cho realistic testing
- ❌ KHÔNG dùng stress test trên local

### Production:

1. **Scale horizontally**: Multiple server instances + load balancer
2. **Redis caching**: Cache user sessions, online users
3. **Message queue**: Background jobs cho upload/notifications
4. **CDN**: Cloudinary + CloudFlare cho static assets
5. **Database**: MongoDB replica set + sharding

### Realistic Targets:

**Current (without optimizations):**

- 100 concurrent users ✅
- 41 messages/second ✅
- 100% success rate ✅

**With optimizations:**

- 1,000+ concurrent users
- 500+ messages/second
- 99.9% uptime

### Command nên dùng:

```bash
# Development - quick test
npm run load-test:simple

# Pre-deployment - realistic test
npm run load-test

# Production monitoring
npm run monitor

# Stress test (chỉ để biết giới hạn)
npm run stress-test  # Expect failures!
```

## Kết luận:

- **Batching KHÔNG phải yếu** - đó là best practice
- Server hiện tại **ổn cho development/small scale**
- Muốn scale lớn cần: clustering, caching, queue, CDN
