/**
 * Auth Middleware - JWT Authentication
 *
 * Middleware để protect các routes cần authentication
 * Verify JWT token và attach user info vào request
 *
 * Flow:
 * 1. Lấy JWT token từ HTTP-only cookie
 * 2. Verify token với JWT_SECRET
 * 3. Tìm user trong database
 * 4. Attach user vào req.user
 * 5. Call next() để tiếp tục xử lý request
 */

import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    // Debug: Log all cookies and headers
    console.log("🍪 Request cookies:", req.cookies);
    console.log("🔗 Request origin:", req.get('origin'));
    console.log("📋 All headers:", Object.keys(req.headers));
    
    // Lấy JWT token từ cookie (HTTP-only cookie cho security)
    const token = req.cookies.jwt;

    if (!token) {
      console.log("❌ No JWT token found in cookies");
      return res
        .status(401)
        .json({ message: "Unauthorized - No Token Provided" });
    }

    // Verify token với secret key
    // Throws error nếu token invalid hoặc expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({ message: "Unauthorized - Invalid Token" });
    }

    // Tìm user trong database (không lấy password)
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Attach user vào request object
    // Các routes tiếp theo có thể access qua req.user
    req.user = user;

    // Continue to next middleware/controller
    next();
  } catch (error) {
    console.log("Error in protectRoute middleware: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
