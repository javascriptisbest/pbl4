/**
 * Load Testing Script for Chat Server
 * Test với 1000 users gửi messages đồng thời
 *
 * Cách chạy:
 * node load-test.js
 */

import { io } from "socket.io-client";
import axios from "axios";

// Auto-detect server URL
const getServerURL = () => {
  // Check for command line argument
  const urlArg = process.argv.find((arg) => arg.startsWith("--url="));
  if (urlArg) {
    return urlArg.split("=")[1];
  }

  // Default to localhost for load testing
  return "http://localhost:5002";
};

const SERVER_URL = getServerURL();
const NUM_USERS = 100; // Test với 100 users
const MESSAGES_PER_USER = 10;
const GROUP_ID = "test-group-id"; // Thay bằng group ID thật

class LoadTester {
  constructor() {
    this.users = [];
    this.sockets = [];
    this.stats = {
      usersCreated: 0,
      socketsConnected: 0,
      messagesSent: 0,
      messagesReceived: 0,
      errors: 0,
      startTime: null,
      endTime: null,
    };
  }

  /**
   * 1. Tạo fake users
   */
  async createUsers(count) {
    console.log(`\n📝 Creating ${count} fake users...`);

    // Create users in batches to avoid overwhelming the server
    const BATCH_SIZE = 10; // Create 10 users at a time

    for (let i = 0; i < count; i += BATCH_SIZE) {
      const batchPromises = [];
      const batchEnd = Math.min(i + BATCH_SIZE, count);

      for (let j = i; j < batchEnd; j++) {
        batchPromises.push(this.createSingleUser(j));
      }

      const results = await Promise.allSettled(batchPromises);

      results.forEach((result) => {
        if (result.status === "fulfilled") {
          this.users.push(result.value);
          this.stats.usersCreated++;
        } else {
          this.stats.errors++;
        }
      });

      // Small delay between batches
      if (i + BATCH_SIZE < count) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    console.log(`✅ Created ${this.stats.usersCreated} users`);
    console.log(`❌ Failed: ${this.stats.errors}`);
  }

  async createSingleUser(index) {
    try {
      const response = await axios.post(
        `${SERVER_URL}/api/auth/signup`,
        {
          fullName: `LoadTest User ${index}`,
          email: `loadtest${index}@test.com`,
          password: "test123456",
        },
        {
          timeout: 10000,
          withCredentials: true, // Important: to receive cookies
        }
      );

      // Extract JWT token from Set-Cookie header
      const cookies = response.headers["set-cookie"];
      let jwtToken = null;
      if (cookies) {
        const jwtCookie = cookies.find((cookie) => cookie.startsWith("jwt="));
        if (jwtCookie) {
          jwtToken = jwtCookie.split(";")[0].split("=")[1];
        }
      }

      return {
        id: index,
        email: `loadtest${index}@test.com`,
        token: jwtToken,
        userId: response.data._id,
      };
    } catch (error) {
      // Nếu user đã tồn tại, login
      if (error.response?.status === 400) {
        try {
          const loginResponse = await axios.post(
            `${SERVER_URL}/api/auth/login`,
            {
              email: `loadtest${index}@test.com`,
              password: "test123456",
            },
            {
              withCredentials: true,
            }
          );

          const cookies = loginResponse.headers["set-cookie"];
          let jwtToken = null;
          if (cookies) {
            const jwtCookie = cookies.find((cookie) =>
              cookie.startsWith("jwt=")
            );
            if (jwtCookie) {
              jwtToken = jwtCookie.split(";")[0].split("=")[1];
            }
          }

          return {
            id: index,
            email: `loadtest${index}@test.com`,
            token: jwtToken,
            userId: loginResponse.data._id,
          };
        } catch (loginError) {
          console.error(
            `❌ Login failed for user ${index}:`,
            loginError.response?.data || loginError.message
          );
          throw loginError;
        }
      }
      console.error(
        `❌ Signup failed for user ${index}:`,
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * 2. Kết nối WebSocket cho tất cả users
   */
  async connectSockets() {
    console.log(`\n🔌 Connecting ${this.users.length} WebSocket clients...`);

    const promises = this.users.map((user) => this.connectSingleSocket(user));
    const results = await Promise.allSettled(promises);

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        this.sockets.push(result.value);
        this.stats.socketsConnected++;
      } else {
        this.stats.errors++;
        console.error(`Failed to connect socket ${index}:`, result.reason);
      }
    });

    console.log(`✅ Connected ${this.stats.socketsConnected} sockets`);
  }

  connectSingleSocket(user) {
    return new Promise((resolve, reject) => {
      const socket = io(SERVER_URL, {
        auth: { token: user.token },
        transports: ["websocket"],
        reconnection: false,
      });

      socket.on("connect", () => {
        socket.userId = user.userId;
        socket.userIndex = user.id;
        resolve(socket);
      });

      socket.on("connect_error", (error) => {
        reject(error);
      });

      // Listen for messages
      socket.on("newMessage", () => {
        this.stats.messagesReceived++;
      });

      socket.on("newGroupMessage", () => {
        this.stats.messagesReceived++;
      });

      setTimeout(() => reject(new Error("Connection timeout")), 10000);
    });
  }

  /**
   * 3. Gửi messages từ tất cả users
   */
  async sendMessages() {
    console.log(`\n📨 Sending ${MESSAGES_PER_USER} messages from each user...`);
    this.stats.startTime = Date.now();

    // Send messages in batches to avoid overwhelming the server
    const BATCH_SIZE = 50; // Send 50 messages at a time
    const allMessages = [];

    // Prepare all message tasks
    for (const socket of this.sockets) {
      for (let i = 0; i < MESSAGES_PER_USER; i++) {
        allMessages.push({ socket, messageIndex: i });
      }
    }

    console.log(`Total messages to send: ${allMessages.length}`);

    // Send in batches
    for (let i = 0; i < allMessages.length; i += BATCH_SIZE) {
      const batch = allMessages.slice(
        i,
        Math.min(i + BATCH_SIZE, allMessages.length)
      );
      const promises = batch.map(({ socket, messageIndex }) =>
        this.sendSingleMessage(socket, messageIndex)
      );

      const results = await Promise.allSettled(promises);

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          this.stats.messagesSent++;
        } else {
          this.stats.errors++;
          if (i + index < 5) {
            // Only log first 5 errors to avoid spam
            console.error(
              `❌ Message ${i + index} failed:`,
              result.reason?.message || result.reason
            );
          }
        }
      });

      // Progress update every 100 messages
      if (i % 100 === 0 && i > 0) {
        console.log(
          `📊 Progress: ${this.stats.messagesSent}/${allMessages.length} sent`
        );
      }
    }

    this.stats.endTime = Date.now();
  }

  async sendSingleMessage(socket, messageIndex) {
    // Get a random user to send to (not yourself)
    const sender = this.users.find((u) => u.userId === socket.userId);
    const otherUsers = this.users.filter((u) => u.userId !== socket.userId);

    if (otherUsers.length === 0) {
      throw new Error("No other users to send to");
    }

    const randomReceiver =
      otherUsers[Math.floor(Math.random() * otherUsers.length)];

    try {
      // Send via HTTP API, not socket
      await axios.post(
        `${SERVER_URL}/api/messages/send/${randomReceiver.userId}`,
        {
          text: `Load test message ${messageIndex} from user ${socket.userIndex}`,
        },
        {
          headers: {
            Cookie: `jwt=${sender.token}`,
          },
          timeout: 5000,
        }
      );
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message);
    }
  }

  /**
   * 4. Hiển thị kết quả
   */
  showResults() {
    const duration = (this.stats.endTime - this.stats.startTime) / 1000;
    const messagesPerSecond = this.stats.messagesSent / duration;
    const totalMessages = this.stats.usersCreated * MESSAGES_PER_USER;

    console.log("\n" + "=".repeat(60));
    console.log("📊 LOAD TEST RESULTS");
    console.log("=".repeat(60));
    console.log(`👥 Users Created:        ${this.stats.usersCreated}`);
    console.log(`🔌 Sockets Connected:    ${this.stats.socketsConnected}`);
    console.log(
      `📤 Messages Sent:        ${this.stats.messagesSent} / ${totalMessages}`
    );
    console.log(`📥 Messages Received:    ${this.stats.messagesReceived}`);
    console.log(`❌ Errors:               ${this.stats.errors}`);
    console.log(`⏱️  Duration:             ${duration.toFixed(2)}s`);
    console.log(`🚀 Messages/Second:      ${messagesPerSecond.toFixed(2)}`);
    console.log(
      `✅ Success Rate:         ${(
        (this.stats.messagesSent / totalMessages) *
        100
      ).toFixed(2)}%`
    );
    console.log("=".repeat(60));
  }

  /**
   * 5. Cleanup
   */
  async cleanup() {
    console.log("\n🧹 Cleaning up...");
    this.sockets.forEach((socket) => socket.disconnect());
    console.log("✅ Done!");
  }

  /**
   * Chạy full test
   */
  async run() {
    try {
      console.log("🚀 Starting Load Test...");
      console.log(
        `Target: ${NUM_USERS} users x ${MESSAGES_PER_USER} messages = ${
          NUM_USERS * MESSAGES_PER_USER
        } total messages`
      );

      await this.createUsers(NUM_USERS);
      await this.connectSockets();

      // Đợi 2 giây cho sockets ổn định
      console.log("\n⏳ Waiting 2s for connections to stabilize...");
      await new Promise((resolve) => setTimeout(resolve, 2000));

      await this.sendMessages();

      // Đợi 5 giây để nhận messages
      console.log("\n⏳ Waiting 5s to receive messages...");
      await new Promise((resolve) => setTimeout(resolve, 5000));

      this.showResults();
      await this.cleanup();
    } catch (error) {
      console.error("❌ Test failed:", error);
      await this.cleanup();
      process.exit(1);
    }
  }
}

// Chạy test
const tester = new LoadTester();
tester.run();
