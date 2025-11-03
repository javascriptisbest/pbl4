/**
 * THROUGHPUT TEST
 * Đo throughput tối đa (messages/giây) server có thể xử lý
 * trong thời gian dài mà không crash
 *
 * Strategy: Tăng dần số messages/giây cho đến khi server bắt đầu có errors
 */

import { io } from "socket.io-client";
import axios from "axios";

const SERVER_URL = "http://localhost:5002";
const NUM_USERS = 100; // 100 users cố định
const TEST_DURATION = 60 * 1000; // 1 phút test

class ThroughputTest {
  constructor() {
    this.users = [];
    this.sockets = [];
    this.stats = {
      usersCreated: 0,
      socketsConnected: 0,
      messagesSent: 0,
      messagesReceived: 0,
      errors: 0,
      errorsBySecond: {},
      messagesBySecond: {},
    };
  }

  async createUsers() {
    console.log(`\n📝 Creating ${NUM_USERS} users...`);
    const BATCH_SIZE = 10;

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
        }
      });

      if (i + BATCH_SIZE < NUM_USERS) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    console.log(`✅ Created ${this.stats.usersCreated} users`);
  }

  async createSingleUser(index) {
    try {
      const response = await axios.post(
        `${SERVER_URL}/api/auth/signup`,
        {
          fullName: `Throughput User ${index}`,
          email: `throughput${index}@test.com`,
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
        email: `throughput${index}@test.com`,
        token: jwtToken,
        userId: response.data._id,
      };
    } catch (error) {
      if (error.response?.status === 400) {
        const loginResponse = await axios.post(
          `${SERVER_URL}/api/auth/login`,
          {
            email: `throughput${index}@test.com`,
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
          email: `throughput${index}@test.com`,
          token: jwtToken,
          userId: loginResponse.data._id,
        };
      }
      throw error;
    }
  }

  async connectSockets() {
    console.log(`\n🔌 Connecting ${this.users.length} sockets...`);

    const promises = this.users.map((user) => this.connectSingleSocket(user));
    const results = await Promise.allSettled(promises);

    results.forEach((result) => {
      if (result.status === "fulfilled") {
        this.sockets.push(result.value);
        this.stats.socketsConnected++;
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

      socket.on("connect_error", reject);

      socket.on("newMessage", () => {
        this.stats.messagesReceived++;
      });

      setTimeout(() => reject(new Error("Connection timeout")), 30000);
    });
  }

  /**
   * Test throughput với tốc độ cố định (CONCURRENT)
   */
  async testThroughput(targetMsgPerSecond) {
    console.log(
      `\n🔥 Testing ${targetMsgPerSecond} msg/s for ${TEST_DURATION / 1000}s...`
    );

    const startTime = Date.now();
    let messageCount = 0;
    let errorCount = 0;

    // Track stats per second
    const statsBySecond = {};

    // Send messages concurrently in batches
    const messagesPerBatch = Math.max(1, Math.floor(targetMsgPerSecond / 10)); // 10 batches per second
    const batchInterval = 100; // 100ms between batches

    const sendInterval = setInterval(async () => {
      const currentSecond = Math.floor((Date.now() - startTime) / 1000);

      if (!statsBySecond[currentSecond]) {
        statsBySecond[currentSecond] = { sent: 0, errors: 0 };
      }

      // Send batch of messages concurrently
      const promises = [];
      for (let i = 0; i < messagesPerBatch; i++) {
        const randomSocket =
          this.sockets[Math.floor(Math.random() * this.sockets.length)];
        promises.push(
          this.sendSingleMessage(randomSocket, messageCount + i)
            .then(() => {
              messageCount++;
              statsBySecond[currentSecond].sent++;
            })
            .catch(() => {
              errorCount++;
              statsBySecond[currentSecond].errors++;
            })
        );
      }

      await Promise.allSettled(promises);

      // Progress update every 10 seconds
      if (
        currentSecond > 0 &&
        currentSecond % 10 === 0 &&
        Date.now() % 10000 < 200
      ) {
        const avgMsgPerSec = messageCount / currentSecond;
        const errorRate =
          errorCount > 0
            ? ((errorCount / (messageCount + errorCount)) * 100).toFixed(2)
            : "0.00";
        console.log(
          `  ⏱️  ${currentSecond}s: ${messageCount} sent, ${errorCount} errors (${errorRate}%) - ${avgMsgPerSec.toFixed(
            1
          )} msg/s avg`
        );
      }
    }, batchInterval);

    // Wait for test duration
    await new Promise((resolve) => setTimeout(resolve, TEST_DURATION));
    clearInterval(sendInterval);

    // Wait for pending requests
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const duration = (Date.now() - startTime) / 1000;
    const actualMsgPerSecond = messageCount / duration;
    const errorRate =
      errorCount > 0 ? (errorCount / (messageCount + errorCount)) * 100 : 0;

    return {
      target: targetMsgPerSecond,
      actual: actualMsgPerSecond,
      messagesSent: messageCount,
      errors: errorCount,
      errorRate: errorRate,
      duration: duration,
      statsBySecond: statsBySecond,
    };
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
        text: `Throughput test ${messageIndex}`,
      },
      {
        headers: {
          Cookie: `jwt=${sender.token}`,
        },
        timeout: 5000,
      }
    );
  }

  /**
   * Tìm throughput tối đa bằng binary search
   */
  async findMaxThroughput() {
    console.log("\n🎯 Finding maximum sustainable throughput...\n");

    const results = [];

    // Test với các mức throughput khác nhau
    const testLevels = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

    for (const target of testLevels) {
      const result = await this.testThroughput(target);
      results.push(result);

      console.log(`\n  📊 ${target} msg/s target:`);
      console.log(`     ✅ Achieved: ${result.actual.toFixed(2)} msg/s`);
      console.log(`     📤 Sent: ${result.messagesSent}`);
      console.log(
        `     ❌ Errors: ${result.errors} (${result.errorRate.toFixed(2)}%)`
      );

      // If error rate > 5%, stop testing higher rates
      if (result.errorRate > 5) {
        console.log(`\n  ⚠️  Error rate too high! Stopping at ${target} msg/s`);
        break;
      }

      // Wait 2s between tests
      console.log(`\n  ⏳ Cooling down 2s...`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    return results;
  }

  showFinalResults(results) {
    console.log("\n" + "=".repeat(70));
    console.log("🏆 THROUGHPUT TEST RESULTS");
    console.log("=".repeat(70));
    console.log(`👥 Users: ${this.stats.usersCreated}`);
    console.log(`🔌 Sockets: ${this.stats.socketsConnected}`);
    console.log(`⏱️  Test duration per level: ${TEST_DURATION / 1000}s`);
    console.log("");
    console.log("Throughput Results:");
    console.log("-".repeat(70));

    results.forEach((r) => {
      const status = r.errorRate < 1 ? "✅" : r.errorRate < 5 ? "⚠️" : "❌";
      console.log(
        `${status} ${r.target} msg/s → ${r.actual.toFixed(2)} actual | ${
          r.messagesSent
        } sent | ${r.errors} errors (${r.errorRate.toFixed(2)}%)`
      );
    });

    console.log("-".repeat(70));

    // Find best throughput (< 1% error rate)
    const goodResults = results.filter((r) => r.errorRate < 1);
    if (goodResults.length > 0) {
      const best = goodResults[goodResults.length - 1];
      console.log(
        `\n🎯 MAXIMUM SUSTAINABLE THROUGHPUT: ${best.actual.toFixed(2)} msg/s`
      );
      console.log(`   (with < 1% error rate)`);
    }

    // Find absolute max (< 5% error rate)
    const okResults = results.filter((r) => r.errorRate < 5);
    if (okResults.length > 0) {
      const max = okResults[okResults.length - 1];
      console.log(
        `\n⚡ ABSOLUTE MAX THROUGHPUT: ${max.actual.toFixed(2)} msg/s`
      );
      console.log(`   (with < 5% error rate)`);
    }

    console.log("=".repeat(70));
  }

  async cleanup() {
    console.log("\n🧹 Cleaning up...");
    this.sockets.forEach((socket) => socket.disconnect());
    console.log("✅ Done!");
  }

  async run() {
    console.log("⚡ THROUGHPUT TEST - FIND MAX MESSAGES/SECOND ⚡");
    console.log(
      `Setup: ${NUM_USERS} users, ${TEST_DURATION / 1000}s per test level\n`
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

      const results = await this.findMaxThroughput();

      this.showFinalResults(results);

      await this.cleanup();
    } catch (error) {
      console.error("❌ Test failed:", error);
      await this.cleanup();
    }
  }
}

const test = new ThroughputTest();
test.run();
