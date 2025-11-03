/**
 * GROUP CHAT LOAD TEST
 * Test hiệu năng khi gửi messages vào group với nhiều members
 *
 * Scenario:
 * - Tạo 1 group với 100 members
 * - 50 users gửi messages vào group
 * - Mỗi user gửi 20 messages
 * = 1000 messages total, nhưng mỗi message broadcast đến 100 người!
 */

import { io } from "socket.io-client";
import axios from "axios";

const SERVER_URL = "http://localhost:5002";
const NUM_USERS = 10; // Giảm xuống 10 để test nhanh
const ACTIVE_SENDERS = 5; // 5 người gửi, 5 người chỉ nhận
const MESSAGES_PER_SENDER = 10;

class GroupChatLoadTest {
  constructor() {
    this.users = [];
    this.sockets = [];
    this.groupId = null;
    this.stats = {
      usersCreated: 0,
      socketsConnected: 0,
      groupCreated: false,
      messagesSent: 0,
      messagesReceived: 0,
      errors: 0,
      startTime: null,
      endTime: null,
    };
  }

  /**
   * 1. Tạo users mới cho group test
   */
  async createUsers() {
    console.log(`\n📝 Creating ${NUM_USERS} users for group test...`);

    for (let i = 0; i < NUM_USERS; i++) {
      try {
        const user = await this.createSingleUser(i);
        this.users.push(user);
        this.stats.usersCreated++;
        console.log(`  ✓ User ${i + 1}/${NUM_USERS} created`);
      } catch (error) {
        this.stats.errors++;
        console.error(`  ✗ User ${i + 1}/${NUM_USERS} failed:`, error);
      }

      // Delay giữa mỗi user để tránh rate limit
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(`✅ Created ${this.stats.usersCreated} users`);
  }

  async createSingleUser(index) {
    const email = `groupchat${index}_${Date.now()}@test.com`;

    try {
      const response = await axios.post(
        `${SERVER_URL}/api/auth/signup`,
        {
          fullName: `GroupChat User ${index}`,
          email: email,
          password: "test123456",
        },
        {
          timeout: 10000,
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
        email: email,
        token: jwtToken,
        userId: response.data._id,
      };
    } catch (error) {
      // If fails, try login
      try {
        const loginResponse = await axios.post(
          `${SERVER_URL}/api/auth/login`,
          { email, password: "test123456" },
          { withCredentials: true, timeout: 10000 }
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
          email: email,
          token: jwtToken,
          userId: loginResponse.data._id,
        };
      } catch (loginError) {
        throw error;
      }
    }
  }

  /**
   * 2. Tạo group với tất cả users
   */
  async createGroup() {
    console.log(`\n👥 Creating group with ${this.users.length} members...`);

    const creator = this.users[0];
    const memberIds = this.users.map((u) => u.userId);

    try {
      const response = await axios.post(
        `${SERVER_URL}/api/groups/create`,
        {
          name: `Load Test Group (${this.users.length} members)`,
          memberIds: memberIds,
        },
        {
          headers: {
            Cookie: `jwt=${creator.token}`,
          },
          timeout: 30000,
        }
      );

      this.groupId = response.data._id;
      this.stats.groupCreated = true;
      console.log(`✅ Group created: ${this.groupId}`);
      console.log(`   Members: ${memberIds.length}`);
    } catch (error) {
      console.error(
        `❌ Failed to create group:`,
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * 3. Kết nối sockets
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

      // Listen for group messages
      socket.on("newGroupMessage", () => {
        this.stats.messagesReceived++;
      });

      setTimeout(() => reject(new Error("Connection timeout")), 30000);
    });
  }

  /**
   * 4. Gửi messages vào group (batched)
   */
  async sendGroupMessages() {
    console.log(`\n📨 Sending messages to group...`);
    console.log(`   Senders: ${ACTIVE_SENDERS} users`);
    console.log(`   Messages per sender: ${MESSAGES_PER_SENDER}`);
    console.log(`   Total messages: ${ACTIVE_SENDERS * MESSAGES_PER_SENDER}`);
    console.log(
      `   Expected broadcasts: ${
        ACTIVE_SENDERS * MESSAGES_PER_SENDER * this.users.length
      } (1 msg → ${this.users.length} people)\n`
    );

    this.stats.startTime = Date.now();

    const BATCH_SIZE = 50; // Send 50 messages at a time
    const allMessages = [];

    // Chỉ lấy ACTIVE_SENDERS users đầu tiên để gửi
    const senders = this.sockets.slice(0, ACTIVE_SENDERS);

    for (const socket of senders) {
      for (let i = 0; i < MESSAGES_PER_SENDER; i++) {
        allMessages.push({ socket, messageIndex: i });
      }
    }

    console.log(
      `📊 Sending ${allMessages.length} messages in batches of ${BATCH_SIZE}...`
    );

    for (let i = 0; i < allMessages.length; i += BATCH_SIZE) {
      const batch = allMessages.slice(
        i,
        Math.min(i + BATCH_SIZE, allMessages.length)
      );
      const promises = batch.map(({ socket, messageIndex }) =>
        this.sendSingleGroupMessage(socket, messageIndex)
      );

      const results = await Promise.allSettled(promises);

      results.forEach((result) => {
        if (result.status === "fulfilled") {
          this.stats.messagesSent++;
        } else {
          this.stats.errors++;
        }
      });

      // Progress update
      if ((i + BATCH_SIZE) % 200 === 0 || i === 0) {
        const progress = Math.min(i + BATCH_SIZE, allMessages.length);
        const percentage = ((progress / allMessages.length) * 100).toFixed(1);
        const elapsed = ((Date.now() - this.stats.startTime) / 1000).toFixed(1);
        const rate = (this.stats.messagesSent / elapsed).toFixed(2);
        console.log(
          `   ${progress}/${allMessages.length} (${percentage}%) - ${rate} msg/s`
        );
      }
    }

    this.stats.endTime = Date.now();
  }

  async sendSingleGroupMessage(socket, messageIndex) {
    const sender = this.users.find((u) => u.userId === socket.userId);

    await axios.post(
      `${SERVER_URL}/api/groups/${this.groupId}/messages`,
      {
        text: `Group message ${messageIndex} from user ${socket.userIndex}`,
      },
      {
        headers: {
          Cookie: `jwt=${sender.token}`,
        },
        timeout: 10000,
      }
    );
  }

  /**
   * 5. Hiển thị kết quả
   */
  showResults() {
    const duration = (this.stats.endTime - this.stats.startTime) / 1000;
    const messagesPerSecond = this.stats.messagesSent / duration;
    const successRate =
      (this.stats.messagesSent / (ACTIVE_SENDERS * MESSAGES_PER_SENDER)) * 100;
    // Server doesn't broadcast to sender, so each message reaches (users.length - 1) members
    const expectedBroadcasts = this.stats.messagesSent * (this.users.length - 1);
    const actualReceiveRate =
      (this.stats.messagesReceived / expectedBroadcasts) * 100;

    console.log("\n" + "=".repeat(70));
    console.log("📊 GROUP CHAT LOAD TEST RESULTS");
    console.log("=".repeat(70));
    console.log(`👥 Total Users:          ${this.stats.usersCreated}`);
    console.log(`🔌 Sockets Connected:    ${this.stats.socketsConnected}`);
    console.log(`👥 Group Members:        ${this.users.length}`);
    console.log(`✍️  Active Senders:       ${ACTIVE_SENDERS}`);
    console.log(
      `📤 Messages Sent:        ${this.stats.messagesSent} / ${
        ACTIVE_SENDERS * MESSAGES_PER_SENDER
      }`
    );
    console.log(
      `📥 Messages Received:    ${
        this.stats.messagesReceived
      } / ${expectedBroadcasts} expected (${actualReceiveRate.toFixed(2)}%)`
    );
    console.log(`❌ Errors:               ${this.stats.errors}`);
    console.log(`⏱️  Duration:             ${duration.toFixed(2)}s`);
    console.log(
      `🚀 Throughput:           ${messagesPerSecond.toFixed(2)} messages/second`
    );
    console.log(`✅ Success Rate:         ${successRate.toFixed(2)}%`);
    console.log("=".repeat(70));

    console.log("\n💡 Notes:");
    console.log(
      `   - Each message broadcast to ${this.users.length - 1} members (sender excluded)`
    );
    console.log(
      `   - Total broadcast operations: ${this.stats.messagesSent} × ${this.users.length - 1} = ${expectedBroadcasts}`
    );
    console.log(
      `   - Server load: ${(messagesPerSecond * (this.users.length - 1)).toFixed(
        2
      )} broadcasts/second`
    );
  }

  async cleanup() {
    console.log("\n🧹 Cleaning up...");
    this.sockets.forEach((socket) => socket.disconnect());
    console.log("✅ Done!");
  }

  async run() {
    console.log("👥 GROUP CHAT LOAD TEST 👥");
    console.log(
      `Scenario: ${NUM_USERS} users in 1 group, ${ACTIVE_SENDERS} active senders`
    );
    console.log(
      `Total: ${
        ACTIVE_SENDERS * MESSAGES_PER_SENDER
      } messages × ${NUM_USERS - 1} broadcasts (sender excluded)\n`
    );

    try {
      await this.createUsers();

      if (this.users.length === 0) {
        console.error("❌ No users created. Aborting.");
        return;
      }

      await this.createGroup();

      if (!this.stats.groupCreated) {
        console.error("❌ Group creation failed. Aborting.");
        return;
      }

      await this.connectSockets();

      if (this.sockets.length === 0) {
        console.error("❌ No sockets connected. Aborting.");
        return;
      }

      console.log("\n⏳ Waiting 3s for stabilization...");
      await new Promise((resolve) => setTimeout(resolve, 3000));

      await this.sendGroupMessages();

      console.log("\n⏳ Waiting 5s for final broadcasts...");
      await new Promise((resolve) => setTimeout(resolve, 5000));

      this.showResults();
      await this.cleanup();
    } catch (error) {
      console.error("❌ Test failed:", error);
      await this.cleanup();
    }
  }
}

const test = new GroupChatLoadTest();
test.run();
