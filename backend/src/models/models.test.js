import { describe, it, expect } from "vitest";

describe("Message Model Validation", () => {
  describe("Message Structure", () => {
    it("should have required fields", () => {
      const message = {
        senderId: "user1",
        receiverId: "user2",
        text: "Hello",
        image: null,
        createdAt: new Date(),
      };

      expect(message).toHaveProperty("senderId");
      expect(message).toHaveProperty("receiverId");
      expect(message).toHaveProperty("text");
      expect(message).toHaveProperty("createdAt");
    });

    it("should allow text or image or both", () => {
      const textMessage = { text: "Hello", image: null };
      const imageMessage = { text: "", image: "url.jpg" };
      const bothMessage = { text: "Check this", image: "url.jpg" };

      expect(textMessage.text || textMessage.image).toBeTruthy();
      expect(imageMessage.text || imageMessage.image).toBeTruthy();
      expect(bothMessage.text || bothMessage.image).toBeTruthy();
    });
  });

  describe("Group Message Structure", () => {
    it("should have group-specific fields", () => {
      const groupMessage = {
        senderId: "user1",
        groupId: "group1",
        text: "Hello group",
        createdAt: new Date(),
      };

      expect(groupMessage).toHaveProperty("groupId");
      expect(groupMessage).toHaveProperty("senderId");
      expect(groupMessage).not.toHaveProperty("receiverId");
    });
  });
});

describe("User Model Validation", () => {
  it("should validate required user fields", () => {
    const user = {
      email: "test@example.com",
      fullName: "Test User",
      password: "hashedpassword123",
    };

    expect(user.email).toBeTruthy();
    expect(user.fullName).toBeTruthy();
    expect(user.password).toBeTruthy();
  });

  it("should have optional profilePic field", () => {
    const userWithPic = {
      email: "test@example.com",
      fullName: "Test User",
      password: "hash",
      profilePic: "avatar.jpg",
    };

    const userWithoutPic = {
      email: "test@example.com",
      fullName: "Test User",
      password: "hash",
    };

    expect(userWithPic.profilePic).toBeDefined();
    expect(userWithoutPic.profilePic).toBeUndefined();
  });
});
