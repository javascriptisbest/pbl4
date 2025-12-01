/**
 * Server Performance Monitor
 * Theo dõi CPU, Memory, Socket connections real-time
 */

import os from "os";
import { io } from "socket.io-client";

// Server URL with fallback
const SERVER_URL = process.env.SERVER_URL || "http://localhost:5002";
const MONITOR_INTERVAL = 1000; // 1 giây

class PerformanceMonitor {
  constructor() {
    this.startCPU = process.cpuUsage();
    this.startTime = Date.now();
    this.socket = null;
  }

  getMemoryUsage() {
    const used = process.memoryUsage();
    return {
      rss: (used.rss / 1024 / 1024).toFixed(2), // Resident Set Size
      heapTotal: (used.heapTotal / 1024 / 1024).toFixed(2),
      heapUsed: (used.heapUsed / 1024 / 1024).toFixed(2),
      external: (used.external / 1024 / 1024).toFixed(2),
    };
  }

  getCPUUsage() {
    const cpuUsage = process.cpuUsage(this.startCPU);
    const elapsed = (Date.now() - this.startTime) * 1000; // microseconds

    return {
      user: ((cpuUsage.user / elapsed) * 100).toFixed(2),
      system: ((cpuUsage.system / elapsed) * 100).toFixed(2),
    };
  }

  getSystemInfo() {
    return {
      platform: os.platform(),
      cpus: os.cpus().length,
      totalMem: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2) + " GB",
      freeMem: (os.freemem() / 1024 / 1024 / 1024).toFixed(2) + " GB",
      uptime: (os.uptime() / 60 / 60).toFixed(2) + " hours",
    };
  }

  printStats() {
    console.clear();
    console.log("🔍 Server Performance Monitor");
    console.log("=".repeat(60));
    console.log(`⏰ Time: ${new Date().toLocaleTimeString()}\n`);

    // System Info
    const sysInfo = this.getSystemInfo();
    console.log("💻 System:");
    console.log(`   Platform:    ${sysInfo.platform}`);
    console.log(`   CPUs:        ${sysInfo.cpus} cores`);
    console.log(`   Total RAM:   ${sysInfo.totalMem}`);
    console.log(`   Free RAM:    ${sysInfo.freeMem}`);
    console.log(`   Uptime:      ${sysInfo.uptime}\n`);

    // Memory
    const mem = this.getMemoryUsage();
    console.log("🧠 Memory Usage:");
    console.log(`   RSS:         ${mem.rss} MB`);
    console.log(`   Heap Total:  ${mem.heapTotal} MB`);
    console.log(`   Heap Used:   ${mem.heapUsed} MB`);
    console.log(`   External:    ${mem.external} MB\n`);

    // CPU
    const cpu = this.getCPUUsage();
    console.log("⚡ CPU Usage:");
    console.log(`   User:        ${cpu.user}%`);
    console.log(`   System:      ${cpu.system}%\n`);

    // Socket
    if (this.socket && this.socket.connected) {
      console.log("🔌 Socket: Connected ✅");
    } else {
      console.log("🔌 Socket: Disconnected ❌");
    }

    console.log("=".repeat(60));
    console.log("Press Ctrl+C to stop monitoring\n");
  }

  async connectSocket() {
    this.socket = io(SERVER_URL, {
      transports: ["websocket"],
      reconnection: true,
    });

    this.socket.on("connect", () => {
      console.log("✅ Connected to server");
    });

    this.socket.on("disconnect", () => {
      console.log("❌ Disconnected from server");
    });

    this.socket.on("serverStats", (stats) => {
      console.log("📊 Server Stats:", stats);
    });
  }

  start() {
    console.log("🚀 Starting performance monitor...\n");

    // Connect to server
    this.connectSocket();

    // Print stats every second
    setInterval(() => {
      this.printStats();
    }, MONITOR_INTERVAL);

    // Initial print
    this.printStats();
  }
}

// Start monitoring
const monitor = new PerformanceMonitor();
monitor.start();

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n\n👋 Stopping monitor...");
  if (monitor.socket) {
    monitor.socket.disconnect();
  }
  process.exit(0);
});
