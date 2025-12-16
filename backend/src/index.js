import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import rateLimit from "express-rate-limit";
import compression from "compression";
import cluster from "cluster";
import os from "os";

import { connectDB } from "./lib/db.js";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import imageRoutes from "./routes/image.route.js";
import groupRoutes from "./routes/group.route.js";
import friendRoutes from "./routes/friend.route.js";
import { app, server } from "./lib/websocketServer.js";

dotenv.config();

const PORT = process.env.PORT;
const __dirname = path.resolve();
const numCPUs = os.cpus().length;

// ===== CLUSTERING FOR PRODUCTION =====
if (
  process.env.NODE_ENV === "production" &&
  cluster.isPrimary &&
  process.env.ENABLE_CLUSTERING !== "false"
) {
  const workers = Math.min(4, numCPUs);
  for (let i = 0; i < workers; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    cluster.fork();
  });
} else {
  // ===== ASYNC MIDDLEWARE =====

  // 1. Compression - Giảm response size 70-90%
  app.use(
    compression({
      level: 6, // Balanced compression
      threshold: 1024, // Only compress files > 1KB
      filter: (req, res) => {
        if (req.headers["x-no-compression"]) return false;
        return compression.filter(req, res);
      },
    })
  );

  // 2. Async error handler
  const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

  // 3. Request timeout middleware
  const requestTimeout =
    (timeout = 30000) =>
    (req, res, next) => {
      req.setTimeout(timeout, () => {
        const err = new Error("Request timeout");
        err.status = 408;
        next(err);
      });
      next();
    };

  app.use(requestTimeout());

  // 4. Rate limiting - Chống spam/DDoS với Redis cache
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
  // Note: express.json() và express.urlencoded() chỉ parse JSON và URL-encoded data
  // Multer sẽ handle multipart/form-data, nhưng cần đặt sau CORS
  app.use(express.json({ limit: "150mb" })); // Tăng lên 150MB cho file 100MB (base64 + overhead)
  app.use(express.urlencoded({ limit: "150mb", extended: true }));
  app.use(cookieParser());
  
  // ===== CORS - Must be before routes =====
  app.use(
    cors({
      origin: function (origin, callback) {
        // Lấy localhost URLs từ .env
        const localhostUrls = process.env.LOCALHOST_URL
          ? process.env.LOCALHOST_URL.split(",")
          : [];

        const allowedOrigins = [
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
          ...localhostUrls,
        ];

        if (
          !origin ||
          allowedOrigins.some((allowed) =>
            typeof allowed === "string"
              ? allowed === origin
              : allowed.test(origin)
          )
        ) {
          callback(null, true);
        } else {
          console.log("CORS blocked origin:", origin);
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "Origin",
        "X-Requested-With",
        "Accept",
        "Content-Length",
      ],
      maxAge: 86400, // 24 hours
      exposedHeaders: ["Content-Length", "Content-Type"],
    })
  );

  // ===== ROOT ENDPOINT =====
  app.get("/", (req, res) => {
    res.status(200).json({
      message: "🚀 TalkSpace Backend API is running!",
      status: "active",
      version: "1.0.0",
      endpoints: {
        health: "/api/health",
        auth: "/api/auth/*",
        messages: "/api/messages/*", 
        groups: "/api/groups/*",
        images: "/api/images/*"
      },
      documentation: "https://github.com/javascriptisbest/pbl4",
      timestamp: new Date().toISOString()
    });
  });

  // ===== HEALTH CHECK ENDPOINT =====
  app.get("/api/health", (req, res) => {
    const healthcheck = {
      uptime: process.uptime(),
      message: "OK",
      timestamp: Date.now(),
      memory: {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(
          process.memoryUsage().heapUsed / 1024 / 1024
        )}MB`,
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
  app.use("/api/friends", friendRoutes);

  app.use("/api/*", (req, res) => {
    res.status(404).json({
      error: "API route not found",
      method: req.method,
      path: req.originalUrl,
      availableRoutes: [
        "GET /api/health",
        "POST /api/auth/login",
        "POST /api/auth/signup",
        "GET /api/auth/check",
        "POST /api/auth/logout",
        "GET /api/groups",
        "POST /api/groups",
        "GET /api/messages",
        "POST /api/messages",
      ],
    });
  });

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
} // Close the else block for clustering
