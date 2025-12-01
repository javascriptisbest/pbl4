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

    // Connection event listeners for monitoring
    conn.connection.on("connected", () => {
      console.log("✅ MongoDB connected successfully");
    });

    conn.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
    });

    conn.connection.on("disconnected", () => {
      console.log("⚠️ MongoDB disconnected");
      if (connectionAttempts < MAX_RETRIES) {
        console.log(
          `🔄 Retrying connection... (${connectionAttempts}/${MAX_RETRIES})`
        );
        setTimeout(() => connectDB(), 5000);
      }
    });

    // Connection pool monitoring
    setInterval(() => {
      const stats = conn.connection.db?.stats;
      if (stats) {
        console.log(
          `📊 DB Pool: ${stats.collections} collections, ${stats.objects} objects`
        );
      }
    }, 60000); // Log every minute in production

    console.log(`MongoDB connected: ${conn.connection.host}`);
    console.log(
      `Connection pool: ${conn.connection.client.options.maxPoolSize} max connections`
    );
    console.log(
      `Read preference: ${conn.connection.client.options.readPreference}`
    );

    return conn;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);

    if (connectionAttempts < MAX_RETRIES) {
      console.log(
        `🔄 Retrying connection in 5s... (${connectionAttempts}/${MAX_RETRIES})`
      );
      setTimeout(() => connectDB(), 5000);
    } else {
      console.error("💥 Max connection attempts reached. Exiting...");
      process.exit(1);
    }
  }
};
