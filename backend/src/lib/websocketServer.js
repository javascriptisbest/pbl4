/**
 * WebSocket Server (TCP-based)
 * Thay thế Socket.IO với WebSocket thuần
 * Sử dụng thư viện 'ws' cho Node.js
 */

import { WebSocketServer } from "ws";
import http from "http";
import express from "express";
import dotenv from "dotenv";
import url from "url";

dotenv.config();

const app = express();
const server = http.createServer(app);

/**
 * WebSocket Server Configuration
 * Xử lý real-time communication giữa clients qua TCP WebSocket
 */

// Lấy allowed origins từ .env
const getAllowedOrigins = () => {
  const localhostUrls = process.env.LOCALHOST_URL
    ? process.env.LOCALHOST_URL.split(",")
    : [];

  return [
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
    ...localhostUrls,
  ].filter(Boolean);
};

const wss = new WebSocketServer({
  server,
  verifyClient: (info) => {
    // CORS verification
    const origin = info.origin;
    const allowedOrigins = getAllowedOrigins();
    
    // Allow if origin matches or is in allowed list
    if (!origin) return true; // Same-origin requests
    
    const isAllowed = allowedOrigins.some((allowed) => {
      if (typeof allowed === "string") {
        return allowed === origin;
      } else if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });
    
    return isAllowed;
  },
});

/**
 * Map lưu trạng thái online của users và sessions
 * Key: userId (MongoDB ObjectId)
 * Value: Object with { socketId, sessions: [sessionInfo] }
 */
const userSocketMap = {}; // {userId: {socketId: string, sessions: [{sessionId, socketId, ws}]}}

/**
 * Map từ socketId đến userId để cleanup
 */
const socketUserMap = {}; // {socketId: userId}

/**
 * Map từ WebSocket connection đến socket info
 */
const wsSocketMap = new Map(); // {ws: {socketId, userId, sessionId}}

/**
 * Generate unique socket ID
 */
function generateSocketId() {
  return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Lấy Socket ID của user dựa vào User ID
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
 * Gửi message đến một socket cụ thể
 */
function sendToSocket(socketId, event, payload) {
  // Tìm WebSocket connection từ socketId
  for (const [ws, socketInfo] of wsSocketMap.entries()) {
    if (socketInfo.socketId === socketId && ws.readyState === 1) {
      // WebSocket.OPEN = 1
      ws.send(
        JSON.stringify({
          type: "event",
          event,
          payload,
        })
      );
      return true;
    }
  }
  return false;
}

/**
 * Broadcast message đến tất cả connected clients
 */
function broadcast(event, payload) {
  const message = JSON.stringify({
    type: "event",
    event,
    payload,
  });

  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      // WebSocket.OPEN = 1
      client.send(message);
    }
  });
}

/**
 * WebSocket Connection Handler
 */
wss.on("connection", (ws, req) => {
  // Parse query params từ URL
  const parsedUrl = url.parse(req.url, true);
  const query = parsedUrl.query;
  const userId = query.userId;
  const sessionId = query.sessionId;

  const socketId = generateSocketId();

  // Store socket info
  const socketInfo = {
    socketId,
    userId,
    sessionId: sessionId || socketId,
    ws,
    connectedAt: new Date(),
  };
  wsSocketMap.set(ws, socketInfo);

  // Send socket ID to client
  ws.send(
    JSON.stringify({
      type: "socketId",
      payload: socketId,
    })
  );

  if (userId) {
    // Lưu mapping socketId -> userId
    socketUserMap[socketId] = userId;

    // Xử lý multiple sessions cho same user
    if (!userSocketMap[userId]) {
      userSocketMap[userId] = {
        socketId: socketId, // Primary socket
        sessions: [],
      };
    }

    // Thêm session mới
    userSocketMap[userId].sessions.push({
      sessionId: sessionId || socketId,
      socketId: socketId,
      connectedAt: new Date(),
    });

    userSocketMap[userId].socketId = socketId;
  }

  // Broadcast danh sách users online đến tất cả clients
  broadcast("getOnlineUsers", Object.keys(userSocketMap));

  // Handle messages from client
  ws.on("message", (data) => {
    try {
      const message = JSON.parse(data.toString());

      if (message.type === "ping") {
        // Respond to ping with pong
        ws.send(
          JSON.stringify({
            type: "pong",
          })
        );
        return;
      }

      if (message.type === "event" && message.event) {
        handleEvent(ws, socketInfo, message.event, message.payload);
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  });

  ws.on("close", () => {
    const userId = socketUserMap[socketId];
    if (userId && userSocketMap[userId]) {
      userSocketMap[userId].sessions = userSocketMap[userId].sessions.filter(
        (session) => session.socketId !== socketId
      );

      if (userSocketMap[userId].sessions.length === 0) {
        delete userSocketMap[userId];
      } else {
        userSocketMap[userId].socketId = userSocketMap[userId].sessions[0].socketId;
      }
    }

    // Clean up mappings
    delete socketUserMap[socketId];
    wsSocketMap.delete(ws);

    // Cập nhật lại danh sách online cho tất cả clients
    broadcast("getOnlineUsers", Object.keys(userSocketMap));
  });

  // Handle errors
  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

/**
 * Handle events from clients
 */
function handleEvent(ws, socketInfo, event, payload) {
  const { socketId, userId } = socketInfo;

  switch (event) {
    case "voice-call-initiate": {
      const { targetUserId, offer } = payload;
      console.log(`📞 Voice call initiate from ${userId} to ${targetUserId}`);

      const targetUserInfo = userSocketMap[targetUserId];
      if (targetUserInfo) {
        const targetSockets = getAllUserSockets(targetUserId);
        console.log(
          `📤 Sending voice-call-incoming to ${targetSockets.length} sessions:`,
          targetSockets
        );

        targetSockets.forEach((targetSocketId) => {
          sendToSocket(targetSocketId, "voice-call-incoming", {
            callerId: userId,
            callerSocketId: socketId,
            offer: offer,
          });
        });
      } else {
        console.log(`❌ Target user ${targetUserId} not online or not found`);
        sendToSocket(socketId, "voice-call-failed", {
          error: "Target user is not online",
        });
      }
      break;
    }

    case "voice-call-answer": {
      const { callerId, answer } = payload;
      const callerUserInfo = userSocketMap[callerId];
      if (callerUserInfo) {
        const callerSockets = getAllUserSockets(callerId);
        callerSockets.forEach((callerSocketId) => {
          sendToSocket(callerSocketId, "voice-call-answered", {
            answer: answer,
            answererId: userId,
          });
        });
      }
      break;
    }

    case "voice-call-ice-candidate": {
      const { targetUserId, candidate } = payload;
      const targetUserInfo = userSocketMap[targetUserId];
      if (targetUserInfo) {
        const targetSockets = getAllUserSockets(targetUserId);
        targetSockets.forEach((targetSocketId) => {
          sendToSocket(targetSocketId, "voice-call-ice-candidate", {
            candidate: candidate,
            senderId: userId,
          });
        });
      }
      break;
    }

    case "voice-call-reject": {
      const { callerId } = payload;
      const callerUserInfo = userSocketMap[callerId];
      if (callerUserInfo) {
        const callerSockets = getAllUserSockets(callerId);
        callerSockets.forEach((callerSocketId) => {
          sendToSocket(callerSocketId, "voice-call-rejected", {
            rejecterId: userId,
          });
        });
      }
      break;
    }

    case "voice-call-end": {
      const { targetUserId } = payload;
      const targetUserInfo = userSocketMap[targetUserId];
      if (targetUserInfo) {
        const targetSockets = getAllUserSockets(targetUserId);
        targetSockets.forEach((targetSocketId) => {
          sendToSocket(targetSocketId, "voice-call-ended", {
            enderId: userId,
          });
        });
      }
      break;
    }

    default:
      console.log(`Unknown event: ${event}`);
  }
}

/**
 * Emit event to specific socket (for use in controllers)
 */
export function emitToSocket(socketId, event, payload) {
  return sendToSocket(socketId, event, payload);
}

/**
 * Emit event to all sockets of a user
 */
export function emitToUser(userId, event, payload) {
  const sockets = getAllUserSockets(userId);
  sockets.forEach((socketId) => {
    sendToSocket(socketId, event, payload);
  });
}

/**
 * Broadcast to all clients
 */
export function broadcastEvent(event, payload) {
  broadcast(event, payload);
}

export { app, server, wss };



