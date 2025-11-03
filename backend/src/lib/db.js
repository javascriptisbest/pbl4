import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Connection pool optimization
      maxPoolSize: 50, // Tăng từ 10 (default) lên 50
      minPoolSize: 10, // Maintain minimum 10 connections

      // Timeout settings
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      serverSelectionTimeoutMS: 5000, // Timeout khi chọn server

      // Reliability
      retryWrites: true, // Retry failed writes
      w: "majority", // Write concern for data durability
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
    console.log(
      `Connection pool: ${conn.connection.client.options.maxPoolSize} max connections`
    );
  } catch (error) {
    console.log("MongoDB connection error:", error);
  }
};
