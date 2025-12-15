import mongoose from "mongoose";

// Connection pool monitoring
let connectionAttempts = 0;
const MAX_RETRIES = 5;

export const connectDB = async () => {
  try {
    connectionAttempts++;

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Connection pool optimization for high concurrency
      maxPoolSize: process.env.NODE_ENV === "production" ? 50 : 20, // Reduced for stability
      minPoolSize: 5, // Reduced minimum connections

      // Timeout settings
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      serverSelectionTimeoutMS: 5000, // Timeout khi chọn server
      connectTimeoutMS: 10000, // Connection timeout

      // Reliability
      retryWrites: true, // Retry failed writes
    });

    conn.connection.on("connected", () => {});

    conn.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
    });

    conn.connection.on("disconnected", () => {
      if (connectionAttempts < MAX_RETRIES) {
        setTimeout(() => connectDB(), 5000);
      }
    });


    return conn;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);

    if (connectionAttempts < MAX_RETRIES) {
      setTimeout(() => connectDB(), 5000);
    } else {
      console.error("Max connection attempts reached. Exiting...");
      process.exit(1);
    }
  }
};
