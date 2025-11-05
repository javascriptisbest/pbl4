import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

/**
 * Socket.IO Server Configuration
 * Xử lý real-time communication giữa clients
 */
const io = new Server(server, {
  cors: {
    // Cho phép connections từ các origins này (frontend URLs)
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://10.10.30.33:5173",
      "http://10.10.30.33:5174",
      "https://pbl4-one.vercel.app",
      "https://pbl4-git-master-minhs-projects-0e5f2d90.vercel.app",
      "https://pbl4-8oarlfzrf-minhs-projects-0e5f2d90.vercel.app",
      /^https:\/\/pbl4.*\.vercel\.app$/,
    ],
    credentials: true, // Cho phép gửi cookies
  },
});

/**
 * Lấy Socket ID của user dựa vào User ID
 * Dùng để gửi message/events đến đúng người nhận
 */
export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

/**
 * Map lưu trạng thái online của users
 * Key: userId (MongoDB ObjectId)
 * Value: socketId (Socket.IO connection ID)
 */
const userSocketMap = {}; // {userId: socketId}

/**
 * Socket.IO Connection Handler
 * Lắng nghe khi client kết nối/ngắt kết nối và xử lý các events
 */
io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  // Lấy userId từ query params khi client connect
  const userId = socket.handshake.query.userId;
  console.log("🔗 Socket connection:", {
    socketId: socket.id,
    userId: userId,
    query: socket.handshake.query,
    headers: socket.handshake.headers,
  });

  if (userId) {
    userSocketMap[userId] = socket.id;
    console.log("✅ User mapped:", userId, "->", socket.id);
  } else {
    console.log("⚠️ No userId in query params");
  }

  // Broadcast danh sách users online đến tất cả clients
  // io.emit() gửi đến ALL connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  /**
   * Event: disconnect
   * Xử lý khi user ngắt kết nối (đóng tab, mất mạng, etc.)
   */
  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    // Xóa user khỏi map online users
    delete userSocketMap[userId];
    // Cập nhật lại danh sách online cho tất cả clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });

  /**
   * WebRTC Voice Call Signaling Events
   * Socket.IO đóng vai trò signaling server để trao đổi thông tin kết nối
   * giữa 2 peers trước khi establish P2P connection
   */

  /**
   * Event: voice-call-initiate
   * User A gọi cho User B - Gửi SDP offer
   */
  socket.on("voice-call-initiate", ({ targetUserId, offer }) => {
    const targetSocketId = userSocketMap[targetUserId];
    if (targetSocketId) {
      // Forward offer đến người nhận qua socket ID
      io.to(targetSocketId).emit("voice-call-incoming", {
        callerId: userId,
        callerSocketId: socket.id,
        offer: offer, // SDP (Session Description Protocol)
      });
    }
  });

  /**
   * Event: voice-call-answer
   * User B chấp nhận cuộc gọi - Gửi SDP answer về cho User A
   */
  socket.on("voice-call-answer", ({ callerId, answer }) => {
    const callerSocketId = userSocketMap[callerId];
    if (callerSocketId) {
      // Forward answer về caller
      io.to(callerSocketId).emit("voice-call-answered", {
        answer: answer, // SDP answer
        answererId: userId,
      });
    }
  });

  /**
   * Event: voice-call-ice-candidate
   * Trao đổi ICE candidates để tìm đường kết nối tốt nhất (NAT traversal)
   * ICE = Interactive Connectivity Establishment
   */
  socket.on("voice-call-ice-candidate", ({ targetUserId, candidate }) => {
    const targetSocketId = userSocketMap[targetUserId];
    if (targetSocketId) {
      // Forward ICE candidate đến peer
      io.to(targetSocketId).emit("voice-call-ice-candidate", {
        candidate: candidate,
        senderId: userId,
      });
    }
  });

  /**
   * Event: voice-call-reject
   * User B từ chối cuộc gọi
   */
  socket.on("voice-call-reject", ({ callerId }) => {
    const callerSocketId = userSocketMap[callerId];
    if (callerSocketId) {
      io.to(callerSocketId).emit("voice-call-rejected", {
        rejecterId: userId,
      });
    }
  });

  /**
   * Event: voice-call-end
   * User A hoặc B kết thúc cuộc gọi
   */
  socket.on("voice-call-end", ({ targetUserId }) => {
    const targetSocketId = userSocketMap[targetUserId];
    if (targetSocketId) {
      io.to(targetSocketId).emit("voice-call-ended", {
        enderId: userId,
      });
    }
  });
});

export { io, app, server };
