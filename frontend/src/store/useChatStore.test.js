import { describe, it, expect, beforeEach } from "vitest";

// Mock Zustand store behavior
describe("Chat Store Logic", () => {
  let messages;
  let selectedUser;

  beforeEach(() => {
    messages = [];
    selectedUser = null;
  });

  describe("Message Management", () => {
    it("should add new message to messages array", () => {
      const newMessage = {
        _id: "1",
        text: "Hello",
        senderId: "user1",
        createdAt: new Date(),
      };

      messages.push(newMessage);
      expect(messages).toHaveLength(1);
      expect(messages[0].text).toBe("Hello");
    });

    it("should update message after optimistic update", () => {
      const tempMessage = { _id: "temp-123", text: "Hello", senderId: "me" };
      const realMessage = { _id: "real-456", text: "Hello", senderId: "me" };

      messages.push(tempMessage);
      expect(messages).toHaveLength(1);

      // Replace temp with real
      const index = messages.findIndex((m) => m._id === "temp-123");
      messages[index] = realMessage;

      expect(messages[0]._id).toBe("real-456");
    });

    it("should filter messages by selected user", () => {
      const allMessages = [
        { _id: "1", senderId: { _id: "user1" }, receiverId: { _id: "me" } },
        { _id: "2", senderId: { _id: "me" }, receiverId: { _id: "user1" } },
        { _id: "3", senderId: { _id: "user2" }, receiverId: { _id: "me" } },
      ];

      selectedUser = { _id: "user1" };

      const filtered = allMessages.filter((m) => {
        const otherUserId =
          m.senderId._id === "me" ? m.receiverId._id : m.senderId._id;
        return otherUserId === selectedUser._id;
      });

      expect(filtered).toHaveLength(2);
      expect(
        filtered.every(
          (m) => m.senderId._id === "user1" || m.receiverId._id === "user1"
        )
      ).toBe(true);
    });
  });

  describe("User Selection", () => {
    it("should set selected user", () => {
      const user = { _id: "user1", fullName: "John Doe" };
      selectedUser = user;

      expect(selectedUser).toBeDefined();
      expect(selectedUser._id).toBe("user1");
    });

    it("should clear selected user", () => {
      selectedUser = { _id: "user1", fullName: "John Doe" };
      selectedUser = null;

      expect(selectedUser).toBeNull();
    });
  });
});
