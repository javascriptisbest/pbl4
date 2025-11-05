import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import imageCompression from "browser-image-compression";
import cloudinary from "../src/lib/cloudinary.js";
import path from "path";
import rateLimit from "express-rate-limit";
import compression from "compression";

import { connectDB } from "./lib/db.js";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import imageRoutes from "./routes/image.route.js";
import groupRoutes from "./routes/group.route.js";
import { app, server } from "./lib/socket.js";

dotenv.config();

const PORT = process.env.PORT;
const __dirname = path.resolve();

// ===== PERFORMANCE MIDDLEWARES =====

// 1. Compression - Giảm response size 70-90%
app.use(compression());

// 2. Rate limiting - Chống spam/DDoS
// Skip rate limiting cho localhost/development
const skipRateLimit = (req) => {
  return (
    req.ip === "127.0.0.1" ||
    req.ip === "::1" ||
    req.ip === "::ffff:127.0.0.1" ||
    process.env.NODE_ENV === "development"
  );
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Tăng lên 500 cho load testing
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimit,
});

const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // Tăng lên 1000 messages/minute
  message: "Too many messages, please slow down.",
  skip: skipRateLimit,
});

const uploadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 200, // Tăng lên 200 uploads
  message: "Too many uploads, please try again later.",
  skip: skipRateLimit,
});

// ===== BODY PARSER =====
app.use(express.json({ limit: "150mb" })); // Tăng lên 150MB cho file 100MB (base64 + overhead)
app.use(express.urlencoded({ limit: "150mb", extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: function (origin, callback) {
    // Production CORS with specific domains
    const allowedOrigins = [
      'https://pbl4-one.vercel.app',
      'https://pbl4-git-master-minhs-projects-0e5f2d90.vercel.app',
      'https://pbl4-8oarlfzrf-minhs-projects-0e5f2d90.vercel.app',
      /^https:\/\/pbl4.*\.vercel\.app$/,
      'http://localhost:5173',
      'http://localhost:3000'
    ];
    
    if (!origin || allowedOrigins.some(allowed => 
      typeof allowed === 'string' ? allowed === origin : allowed.test(origin)
    )) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept']
}));

// ===== HEALTH CHECK ENDPOINT =====
app.get("/api/health", (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    message: "OK",
    timestamp: Date.now(),
    memory: {
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
    },
  };
  res.status(200).json(healthcheck);
});

// ===== ROUTES WITH RATE LIMITING =====
// Temporarily disable rate limiting for load testing
app.use("/api/auth", authRoutes); // No limiter
app.use("/api/messages", messageRoutes); // No limiter
app.use("/api/images", uploadLimiter, imageRoutes);
app.use("/api/groups", groupRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

server.listen(PORT, "0.0.0.0", () => {
  console.log("server is running on PORT:" + PORT);
  console.log(`Backend accessible at: http://10.10.30.33:${PORT}`);
  connectDB();
});
