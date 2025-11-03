/**
 * STRESS TEST - Test giới hạn thực sự của server
 * KHÔNG có batching, KHÔNG có delay - full throttle!
 *
 * Cách chạy: node stress-test.js
 */

import { io } from "socket.io-client";
import axios from "axios";

const SERVER_URL = "http://localhost:5002";
const NUM_USERS = 500; // 500 users cùng lúc
const MESSAGES_PER_USER = 20; // 20 messages/user = 10,000 messages total

class StressTest {
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
   * 1. Tạo users ĐỒNG THỜI - không batch, không delay
   */
  async createUsers() {
    console.log(`\n🔥 Creating ${NUM_USERS} users SIMULTANEOUSLY...`);
    const startTime = Date.now();

    // Fire all requests at once!
    const promises = Array.from({ length: NUM_USERS }, (_, i) =>
      this.createSingleUser(i)
    );

    const results = await Promise.allSettled(promises);

    results.forEach((result) => {
      if (result.status === "fulfilled") {
        this.users.push(result.value);
        this.stats.usersCreated++;
      } else {
        this.stats.errors++;
      }
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Created ${this.stats.usersCreated} users in ${duration}s`);
    console.log(`❌ Failed: ${this.stats.errors}`);
    console.log(
      `⚡ Rate: ${(this.stats.usersCreated / duration).toFixed(2)} users/second`
    );
  }

  async createSingleUser(index) {
    try {
      const response = await axios.post(
        `${SERVER_URL}/api/auth/signup`,
        {
          fullName: `StressTest User ${index}`,
          email: `stress${index}@test.com`,
          password: "test123456",
        },
        {
          timeout: 30000, // Longer timeout for stress
          withCredentials: true,
        }
      );

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
        email: `stress${index}@test.com`,
        token: jwtToken,
        userId: response.data._id,
      };
    } catch (error) {
      // Try login if user exists
      if (error.response?.status === 400) {
        const loginResponse = await axios.post(
          `${SERVER_URL}/api/auth/login`,
          {
            email: `stress${index}@test.com`,
            password: "test123456",
          },
          { withCredentials: true, timeout: 30000 }
        );

        const cookies = loginResponse.headers["set-cookie"];
        let jwtToken = null;
        if (cookies) {
          const jwtCookie = cookies.find((cookie) => cookie.startsWith("jwt="));
          if (jwtCookie) {
            jwtToken = jwtCookie.split(";")[0].split("=")[1];
          }
        }

        return {
          id: index,
          email: `stress${index}@test.com`,
          token: jwtToken,
          userId: loginResponse.data._id,
        };
      }
      throw error;
    }
  }

  /**
   * 2. Kết nối sockets ĐỒNG THỜI
   */
  async connectSockets() {
    console.log(
      `\n🔌 Connecting ${this.users.length} sockets SIMULTANEOUSLY...`
    );
    const startTime = Date.now();

    // Fire all at once!
    const promises = this.users.map((user) => this.connectSingleSocket(user));
    const results = await Promise.allSettled(promises);

    results.forEach((result) => {
      if (result.status === "fulfilled") {
        this.sockets.push(result.value);
        this.stats.socketsConnected++;
      } else {
        this.stats.errors++;
      }
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(
      `✅ Connected ${this.stats.socketsConnected} sockets in ${duration}s`
    );
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

      socket.on("newMessage", () => {
        this.stats.messagesReceived++;
      });

      setTimeout(() => reject(new Error("Connection timeout")), 30000);
    });
  }

  /**
   * 3. Gửi TẤT CẢ messages ĐỒNG THỜI - no limits!
   */
  /**
   * 3. Gửi messages với BATCHING (realistic mode)
   */
  async sendMessages() {
    console.log(
      `\n📨 Sending ${MESSAGES_PER_USER} messages from ${this.sockets.length} users...`
    );
    console.log(`� Total: ${this.sockets.length * MESSAGES_PER_USER} messages`);

    this.stats.startTime = Date.now();

    // BATCHING: Send in groups of 100 messages at a time
    const BATCH_SIZE = 100;
    const allMessages = [];

    // Prepare all message tasks
    for (const socket of this.sockets) {
      for (let i = 0; i < MESSAGES_PER_USER; i++) {
        allMessages.push({ socket, messageIndex: i });
      }
    }

    console.log(
      `⚡ Sending ${allMessages.length} messages in batches of ${BATCH_SIZE}...`
    );

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

      results.forEach((result) => {
        if (result.status === "fulfilled") {
          this.stats.messagesSent++;
        } else {
          this.stats.errors++;
        }
      });

      // Progress update every 1000 messages
      if ((i + BATCH_SIZE) % 1000 === 0 || i === 0) {
        const progress = Math.min(i + BATCH_SIZE, allMessages.length);
        const percentage = ((progress / allMessages.length) * 100).toFixed(1);
        console.log(
          `📊 Progress: ${progress}/${allMessages.length} (${percentage}%)`
        );
      }
    }

    this.stats.endTime = Date.now();
  }

  async sendSingleMessage(socket, messageIndex) {
    const otherUsers = this.users.filter((u) => u.userId !== socket.userId);
    if (otherUsers.length === 0) {
      throw new Error("No other users");
    }

    const randomReceiver =
      otherUsers[Math.floor(Math.random() * otherUsers.length)];
    const sender = this.users.find((u) => u.userId === socket.userId);

    await axios.post(
      `${SERVER_URL}/api/messages/send/${randomReceiver.userId}`,
      {
        text: `Stress test message ${messageIndex} from user ${socket.userIndex}`,
      },
      {
        headers: {
          Cookie: `jwt=${sender.token}`,
        },
        timeout: 30000, // 30s timeout
      }
    );
  }

  /**
   * 4. Hiển thị kết quả
   */
  showResults() {
    const duration = (this.stats.endTime - this.stats.startTime) / 1000;
    const messagesPerSecond = this.stats.messagesSent / duration;
    const successRate =
      (this.stats.messagesSent /
        (this.stats.messagesSent + this.stats.errors)) *
      100;

    console.log("\n" + "=".repeat(60));
    console.log("🔥 STRESS TEST RESULTS");
    console.log("=".repeat(60));
    console.log(`👥 Users Created:        ${this.stats.usersCreated}`);
    console.log(`🔌 Sockets Connected:    ${this.stats.socketsConnected}`);
    console.log(
      `📤 Messages Sent:        ${this.stats.messagesSent} / ${
        NUM_USERS * MESSAGES_PER_USER
      }`
    );
    console.log(`📥 Messages Received:    ${this.stats.messagesReceived}`);
    console.log(`❌ Errors:               ${this.stats.errors}`);
    console.log(`⏱️  Duration:             ${duration.toFixed(2)}s`);
    console.log(
      `🚀 Throughput:           ${messagesPerSecond.toFixed(2)} messages/second`
    );
    console.log(`✅ Success Rate:         ${successRate.toFixed(2)}%`);
    console.log("=".repeat(60));
  }

  async cleanup() {
    console.log("\n🧹 Cleaning up...");
    this.sockets.forEach((socket) => socket.disconnect());
    console.log("✅ Done!");
  }

  async run() {
    console.log("🔥🔥🔥 STRESS TEST - NO LIMITS! 🔥🔥🔥");
    console.log(
      `Target: ${NUM_USERS} users x ${MESSAGES_PER_USER} messages = ${
        NUM_USERS * MESSAGES_PER_USER
      } total`
    );
    console.log(`Mode: BATCHED (100 messages at a time - realistic)\n`);

    try {
      await this.createUsers();

      if (this.users.length === 0) {
        console.error("❌ No users created. Aborting.");
        return;
      }

      await this.connectSockets();

      if (this.sockets.length === 0) {
        console.error("❌ No sockets connected. Aborting.");
        return;
      }

      console.log("\n⏳ Waiting 2s for stabilization...");
      await new Promise((resolve) => setTimeout(resolve, 2000));

      await this.sendMessages();

      console.log("\n⏳ Waiting 5s for final messages...");
      await new Promise((resolve) => setTimeout(resolve, 5000));

      this.showResults();
      await this.cleanup();
    } catch (error) {
      console.error("❌ Test failed:", error);
      await this.cleanup();
    }
  }
}

// Run the stress test
const test = new StressTest();
test.run();
