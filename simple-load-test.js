/**
 * Simple Load Test - Test nhanh với ít users
 * Dùng để test trong development
 */

import { io } from "socket.io-client";

// Auto-detect server URL
const SERVER_URL = process.argv[2] || "http://localhost:5002";
const NUM_USERS = 10; // Chỉ 10 users
const MESSAGES_PER_USER = 50; // 5 messages/user = 50 messages total

console.log("🧪 Simple Load Test");
console.log(`Testing: ${NUM_USERS} users x ${MESSAGES_PER_USER} messages`);
console.log(`Server: ${SERVER_URL}\n`);

const sockets = [];
let messagesSent = 0;
let messagesReceived = 0;

// Tạo connections
for (let i = 0; i < NUM_USERS; i++) {
  const socket = io(SERVER_URL, {
    transports: ["websocket"],
    reconnection: false,
  });

  socket.on("connect", () => {
    console.log(`✅ User ${i + 1} connected`);

    // Gửi messages
    for (let j = 0; j < MESSAGES_PER_USER; j++) {
      setTimeout(() => {
        socket.emit("sendMessage", {
          text: `Test message ${j + 1} from user ${i + 1}`,
          receiverId: "test-user-id",
        });
        messagesSent++;
        console.log(`📤 User ${i + 1} sent message ${j + 1}`);
      }, j * 100); // Delay 100ms giữa các messages
    }
  });

  socket.on("newMessage", (message) => {
    messagesReceived++;
    console.log(`📥 Received message (${messagesReceived} total)`);
  });

  socket.on("connect_error", (error) => {
    console.error(`❌ User ${i + 1} connection error:`, error.message);
  });

  sockets.push(socket);
}

// Hiển thị kết quả sau 10 giây
setTimeout(() => {
  console.log("\n" + "=".repeat(50));
  console.log("📊 RESULTS");
  console.log("=".repeat(50));
  console.log(
    `Connected:  ${sockets.filter((s) => s.connected).length}/${NUM_USERS}`
  );
  console.log(`Sent:       ${messagesSent}`);
  console.log(`Received:   ${messagesReceived}`);
  console.log("=".repeat(50));

  // Cleanup
  sockets.forEach((s) => s.disconnect());
  process.exit(0);
}, 10000);
