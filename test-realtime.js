#!/usr/bin/env node

/**
 * Real-time Chat Test
 * Tests if messages are received in real-time between users
 */

import { io } from "socket.io-client";

const BACKEND_URL = "https://pbl4-jecm.onrender.com";

async function testRealTimeChat() {
  console.log("🔄 Testing Real-time Chat");
  console.log("========================");

  // Simulate 2 users
  const user1 = io(BACKEND_URL, {
    withCredentials: true,
    timeout: 10000,
  });

  const user2 = io(BACKEND_URL, {
    withCredentials: true,
    timeout: 10000,
  });

  let user1Connected = false;
  let user2Connected = false;
  let messageReceived = false;

  // User 1 connection
  user1.on("connect", () => {
    console.log("✅ User 1 connected to WebSocket");
    user1Connected = true;

    // Join a test room (simulate selecting a chat)
    user1.emit("join", { userId: "user1", receiverId: "user2" });
  });

  user1.on("connect_error", (error) => {
    console.log("❌ User 1 connection failed:", error.message);
  });

  // User 2 connection
  user2.on("connect", () => {
    console.log("✅ User 2 connected to WebSocket");
    user2Connected = true;

    // Join the same test room
    user2.emit("join", { userId: "user2", receiverId: "user1" });
  });

  user2.on("connect_error", (error) => {
    console.log("❌ User 2 connection failed:", error.message);
  });

  // Listen for messages on User 2
  user2.on("newMessage", (message) => {
    console.log("📨 User 2 received message:", message);
    messageReceived = true;
  });

  // Wait for both users to connect
  setTimeout(() => {
    if (user1Connected && user2Connected) {
      console.log("\n🚀 Both users connected. Testing message sending...");

      // User 1 sends a message
      const testMessage = {
        text: "Hello from User 1! This is a real-time test.",
        senderId: "user1",
        receiverId: "user2",
        createdAt: new Date().toISOString(),
      };

      console.log("📤 User 1 sending message...");
      user1.emit("sendMessage", testMessage);

      // Check if message was received after 3 seconds
      setTimeout(() => {
        if (messageReceived) {
          console.log("✅ Real-time messaging works!");
        } else {
          console.log("❌ Message not received in real-time");
          console.log("🔍 Debugging WebSocket events...");

          // List all events
          console.log("User 1 events:", user1.eventNames());
          console.log("User 2 events:", user2.eventNames());
        }

        // Cleanup
        user1.disconnect();
        user2.disconnect();
        process.exit(0);
      }, 3000);
    } else {
      console.log("❌ Not all users connected");
      console.log(`User 1: ${user1Connected ? "✅" : "❌"}`);
      console.log(`User 2: ${user2Connected ? "✅" : "❌"}`);
      process.exit(1);
    }
  }, 2000);

  // Test timeout
  setTimeout(() => {
    console.log("⏰ Test timeout - cleaning up");
    user1.disconnect();
    user2.disconnect();
    process.exit(1);
  }, 15000);
}

testRealTimeChat().catch(console.error);
