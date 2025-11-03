/**
 * REALISTIC LOAD TEST
 * Mô phỏng tình huống thực tế: nhiều users, gửi messages từ từ
 *
 * Scenario: 200 users online, mỗi người gửi 50 messages trong 5 phút
 * = 10,000 messages total
 */

import { io } from "socket.io-client";
import axios from "axios";

const SERVER_URL = "http://localhost:5002";
const NUM_USERS = 200;
const MESSAGES_PER_USER = 50;
const TEST_DURATION = 5 * 60 * 1000; // 5 minutes

class RealisticLoadTest {
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
   * 1. Tạo users với BATCHING
   */
  async createUsers() {
    console.log(`\n📝 Creating ${NUM_USERS} users (batched)...`);
    const BATCH_SIZE = 20;

    for (let i = 0; i < NUM_USERS; i += BATCH_SIZE) {
      const batchPromises = [];
      const batchEnd = Math.min(i + BATCH_SIZE, NUM_USERS);

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

      // Delay between batches
      if (i + BATCH_SIZE < NUM_USERS) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    console.log(`✅ Created ${this.stats.usersCreated} users`);
  }

  async createSingleUser(index) {
    try {
      const response = await axios.post(
        `${SERVER_URL}/api/auth/signup`,
        {
          fullName: `Realistic User ${index}`,
          email: `realistic${index}@test.com`,
          password: "test123456",
        },
        {
          timeout: 30000,
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
        email: `realistic${index}@test.com`,
        token: jwtToken,
        userId: response.data._id,
      };
    } catch (error) {
      if (error.response?.status === 400) {
        const loginResponse = await axios.post(
          `${SERVER_URL}/api/auth/login`,
          {
            email: `realistic${index}@test.com`,
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
          email: `realistic${index}@test.com`,
          token: jwtToken,
          userId: loginResponse.data._id,
        };
      }
      throw error;
    }
  }

  /**
   * 2. Kết nối sockets
   */
  async connectSockets() {
    console.log(`\n🔌 Connecting ${this.users.length} sockets...`);

    const BATCH_SIZE = 50;
    for (let i = 0; i < this.users.length; i += BATCH_SIZE) {
      const batch = this.users.slice(
        i,
        Math.min(i + BATCH_SIZE, this.users.length)
      );
      const promises = batch.map((user) => this.connectSingleSocket(user));
      const results = await Promise.allSettled(promises);

      results.forEach((result) => {
        if (result.status === "fulfilled") {
          this.sockets.push(result.value);
          this.stats.socketsConnected++;
        }
      });

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

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

      socket.on("connect_error", reject);

      socket.on("newMessage", () => {
        this.stats.messagesReceived++;
      });

      setTimeout(() => reject(new Error("Connection timeout")), 30000);
    });
  }

  /**
   * 3. Gửi messages GRADUALLY (realistic)
   */
  async sendMessagesGradually() {
    console.log(
      `\n📨 Sending ${MESSAGES_PER_USER} messages per user over time...`
    );
    console.log(`⏱️  Test duration: ${TEST_DURATION / 1000}s`);

    this.stats.startTime = Date.now();
    const messageInterval = TEST_DURATION / MESSAGES_PER_USER;

    console.log(
      `📊 Sending 1 message per user every ${(messageInterval / 1000).toFixed(
        1
      )}s`
    );

    // Send messages gradually
    for (let msgNum = 0; msgNum < MESSAGES_PER_USER; msgNum++) {
      const promises = this.sockets.map((socket) =>
        this.sendSingleMessage(socket, msgNum)
      );

      const results = await Promise.allSettled(promises);

      results.forEach((result) => {
        if (result.status === "fulfilled") {
          this.stats.messagesSent++;
        } else {
          this.stats.errors++;
        }
      });

      const progress = (((msgNum + 1) / MESSAGES_PER_USER) * 100).toFixed(1);
      const elapsed = ((Date.now() - this.stats.startTime) / 1000).toFixed(1);
      const rate = (this.stats.messagesSent / elapsed).toFixed(2);

      console.log(
        `📊 Round ${msgNum + 1}/${MESSAGES_PER_USER} (${progress}%) - ${
          this.stats.messagesSent
        } sent - ${rate} msg/s`
      );

      // Wait before next round
      if (msgNum < MESSAGES_PER_USER - 1) {
        await new Promise((resolve) => setTimeout(resolve, messageInterval));
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
        text: `Realistic message ${messageIndex} from user ${socket.userIndex}`,
      },
      {
        headers: {
          Cookie: `jwt=${sender.token}`,
        },
        timeout: 10000,
      }
    );
  }

  showResults() {
    const duration = (this.stats.endTime - this.stats.startTime) / 1000;
    const messagesPerSecond = this.stats.messagesSent / duration;
    const successRate =
      (this.stats.messagesSent / (NUM_USERS * MESSAGES_PER_USER)) * 100;

    console.log("\n" + "=".repeat(60));
    console.log("📊 REALISTIC LOAD TEST RESULTS");
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
    console.log("🌍 REALISTIC LOAD TEST 🌍");
    console.log(`Scenario: ${NUM_USERS} users chatting naturally`);
    console.log(
      `Total messages: ${NUM_USERS * MESSAGES_PER_USER} over ${
        TEST_DURATION / 1000
      }s\n`
    );

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

      await this.sendMessagesGradually();

      this.showResults();
      await this.cleanup();
    } catch (error) {
      console.error("❌ Test failed:", error);
      await this.cleanup();
    }
  }
}

const test = new RealisticLoadTest();
test.run();
