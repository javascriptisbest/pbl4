import { Server } from "socket.io";
import http from "http";
import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const server = http.createServer(app);

/**
 * Socket.IO Server Configuration
 * Xử lý real-time communication giữa clients
 */

// Lấy localhost URLs từ .env
const localhostUrls = process.env.LOCALHOST_URL
  ? process.env.LOCALHOST_URL.split(",")
  : [];

const io = new Server(server, {
  cors: {
    // Cho phép connections từ các origins này (frontend URLs)
    origin: [
      process.env.FRONTEND_URL,
      `https://${process.env.VERCEL_DOMAIN}`,
      `https://${process.env.VERCEL_GIT_DOMAIN}`,
      `https://${process.env.VERCEL_PREVIEW_DOMAIN}`,
      "https://pbl4-one.vercel.app",
      "https://pbl4-git-master-minhs-projects-0e5f2d90.vercel.app",
      "https://pbl4-jecm.onrender.com",
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174",
      "http://127.0.0.1:5175",
      /^https:\/\/pbl4.*\.vercel\.app$/,
      /^https:\/\/pbl4.*\.onrender\.com$/,
      /^http:\/\/localhost:\d+$/,
      /^http:\/\/127\.0\.0\.1:\d+$/,
      /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
      /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,
      ...localhostUrls,
    ],
    credentials: true, // Cho phép gửi cookies
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  },
  // Enable polling for better cloud compatibility
  transports: ["polling", "websocket"],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
});

/**
 * Lấy Socket ID của user dựa vào User ID
 * Trả về socket ID đầu tiên hoặc tất cả sessions
 */
export function getReceiverSocketId(userId) {
  const userInfo = userSocketMap[userId];
  return userInfo?.socketId || null;
}

/**
 * Lấy tất cả socket IDs của user (cho multiple sessions)
 */
export function getAllUserSockets(userId) {
  const userInfo = userSocketMap[userId];
  if (!userInfo) return [];
  return userInfo.sessions
    ? userInfo.sessions.map((session) => session.socketId)
    : [userInfo.socketId];
}

/**
 * Map lưu trạng thái online của users và sessions
 * Key: userId (MongoDB ObjectId)
 * Value: Object with { socketId, sessions: [sessionInfo] }
 * Cho phép một user có nhiều sessions (multiple frontend instances)
 */
const userSocketMap = {}; // {userId: {socketId: string, sessions: [{sessionId, socketId}]}}

/**
 * Map từ socketId đến userId để cleanup
 */
const socketUserMap = {}; // {socketId: userId}

/**
 * Socket.IO Connection Handler
 * Lắng nghe khi client kết nối/ngắt kết nối và xử lý các events
 */
io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  // Lấy userId và sessionId từ query params khi client connect
  const userId = socket.handshake.query.userId;
  const sessionId = socket.handshake.query.sessionId;
  console.log("🔗 Socket connection:", {
    socketId: socket.id,
    userId: userId,
    sessionId: sessionId,
    query: socket.handshake.query,
  });

  if (userId) {
    // Lưu mapping socketId -> userId
    socketUserMap[socket.id] = userId;

    // Xử lý multiple sessions cho same user
    if (!userSocketMap[userId]) {
      userSocketMap[userId] = {
        socketId: socket.id, // Primary socket (for backward compatibility)
        sessions: [],
      };
    }

    // Thêm session mới
    userSocketMap[userId].sessions.push({
      sessionId: sessionId || socket.id,
      socketId: socket.id,
      connectedAt: new Date(),
    });

    // Update primary socket to latest connection
    userSocketMap[userId].socketId = socket.id;

    console.log(
      "✅ User mapped:",
      userId,
      "->",
      socket.id,
      `(${userSocketMap[userId].sessions.length} sessions)`
    );
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

    const userId = socketUserMap[socket.id];
    if (userId && userSocketMap[userId]) {
      // Remove specific session
      userSocketMap[userId].sessions = userSocketMap[userId].sessions.filter(
        (session) => session.socketId !== socket.id
      );

      // If no sessions left, remove user completely
      if (userSocketMap[userId].sessions.length === 0) {
        delete userSocketMap[userId];
        console.log(`🚪 User ${userId} fully disconnected`);
      } else {
        // Update primary socket to remaining session
        userSocketMap[userId].socketId =
          userSocketMap[userId].sessions[0].socketId;
        console.log(
          `📱 User ${userId} has ${userSocketMap[userId].sessions.length} remaining sessions`
        );
      }
    }

    // Clean up socket mapping
    delete socketUserMap[socket.id];

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
    console.log(`📞 Voice call initiate from ${userId} to ${targetUserId}`);
    const targetUserInfo = userSocketMap[targetUserId];
    console.log(`🎯 Target user ${targetUserId}:`, targetUserInfo);

    if (targetUserInfo) {
      // Gửi đến tất cả sessions của target user (multiple frontend instances)
      const targetSockets = getAllUserSockets(targetUserId);
      console.log(
        `📤 Sending voice-call-incoming to ${targetSockets.length} sessions:`,
        targetSockets
      );

      targetSockets.forEach((targetSocketId) => {
        io.to(targetSocketId).emit("voice-call-incoming", {
          callerId: userId,
          callerSocketId: socket.id,
          offer: offer, // SDP (Session Description Protocol)
        });
      });
    } else {
      console.log(`❌ Target user ${targetUserId} not online or not found`);
      // Emit back to caller that target is not available
      socket.emit("voice-call-failed", {
        error: "Target user is not online",
      });
    }
  });

  /**
   * Event: voice-call-answer
   * User B chấp nhận cuộc gọi - Gửi SDP answer về cho User A
   */
  socket.on("voice-call-answer", ({ callerId, answer }) => {
    const callerUserInfo = userSocketMap[callerId];
    if (callerUserInfo) {
      // Forward answer về caller (tất cả sessions)
      const callerSockets = getAllUserSockets(callerId);
      callerSockets.forEach((callerSocketId) => {
        io.to(callerSocketId).emit("voice-call-answered", {
          answer: answer, // SDP answer
          answererId: userId,
        });
      });
    }
  });

  /**
   * Event: voice-call-ice-candidate
   * Trao đổi ICE candidates để tìm đường kết nối tốt nhất (NAT traversal)
   * ICE = Interactive Connectivity Establishment
   */
  socket.on("voice-call-ice-candidate", ({ targetUserId, candidate }) => {
    const targetUserInfo = userSocketMap[targetUserId];
    if (targetUserInfo) {
      // Forward ICE candidate đến peer (tất cả sessions)
      const targetSockets = getAllUserSockets(targetUserId);
      targetSockets.forEach((targetSocketId) => {
        io.to(targetSocketId).emit("voice-call-ice-candidate", {
          candidate: candidate,
          senderId: userId,
        });
      });
    }
  });

  /**
   * Event: voice-call-reject
   * User B từ chối cuộc gọi
   */
  socket.on("voice-call-reject", ({ callerId }) => {
    const callerUserInfo = userSocketMap[callerId];
    if (callerUserInfo) {
      const callerSockets = getAllUserSockets(callerId);
      callerSockets.forEach((callerSocketId) => {
        io.to(callerSocketId).emit("voice-call-rejected", {
          rejecterId: userId,
        });
      });
    }
  });

  /**
   * Event: voice-call-end
   * User A hoặc B kết thúc cuộc gọi
   */
  socket.on("voice-call-end", ({ targetUserId }) => {
    const targetUserInfo = userSocketMap[targetUserId];
    if (targetUserInfo) {
      const targetSockets = getAllUserSockets(targetUserId);
      targetSockets.forEach((targetSocketId) => {
        io.to(targetSocketId).emit("voice-call-ended", {
          enderId: userId,
        });
      });
    }
  });
});

export { io, app, server };
