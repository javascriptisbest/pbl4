/**
 * Message Model - MongoDB Schema
 *
 * Schema cho tin nhắn trong hệ thống chat
 * Hỗ trợ cả Direct Chat (1-1) và Group Chat
 *
 * Features:
 * - Multi-media support (text, image, video, audio, file)
 * - Message reactions (emoji)
 * - Soft delete (isDeleted flag)
 * - Reply to message (replyToId)
 */

import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    // Người gửi - required cho mọi tin nhắn
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference đến User model
      required: true,
    },

    // Người nhận - chỉ có trong direct chat
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Group - chỉ có trong group chat
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },

    // Loại tin nhắn: direct (1-1) hoặc group
    messageType: {
      type: String,
      enum: ["direct", "group"],
      default: "direct",
    },

    // Nội dung tin nhắn
    text: {
      type: String,
    },

    // Media URLs (lưu trên Cloudinary)
    image: {
      type: String, // URL của ảnh
    },
    video: {
      type: String, // URL của video
    },
    audio: {
      type: String, // URL của voice message
    },
    audioDuration: {
      type: Number, // Độ dài audio (giây)
    },
    file: {
      type: String, // URL của file
    },
    fileName: {
      type: String, // Tên file gốc
    },
    fileSize: {
      type: Number, // Kích thước file (bytes)
    },
    fileType: {
      type: String, // MIME type (application/pdf, etc.)
    },

    // Reply feature - reference đến tin nhắn được reply
    replyToId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },

    // Loại media chính của tin nhắn
    mediaType: {
      type: String,
      enum: ["text", "image", "video", "audio", "file"],
      default: "text",
    },

    // Emoji reactions - array of reactions
    reactions: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        emoji: {
          type: String, // Emoji character (👍, ❤️, etc.)
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Soft delete - không xóa thật khỏi DB
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    
    // Đã đọc - cho tính năng unread messages
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    
    // Đã sửa - cho tính năng edit message
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // Tự động thêm createdAt và updatedAt
  }
);

// ===== DATABASE INDEXES FOR PERFORMANCE =====

// 1. Index cho direct chat queries (getMessages)
// Tìm messages giữa 2 users nhanh hơn 10-100x
messageSchema.index({ senderId: 1, receiverId: 1 });
messageSchema.index({ receiverId: 1, senderId: 1 });

// 2. Index cho group chat queries
messageSchema.index({ groupId: 1, createdAt: -1 });

// 3. Index cho soft delete queries
// Chỉ lấy messages chưa bị xóa
messageSchema.index({ isDeleted: 1 });

// 4. Compound index cho pagination
// Sort by createdAt khi query messages
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
// messageSchema.index({ groupId: 1, createdAt: -1 }); // ❌ DUPLICATE - removed

// 5. Index cho messageType (nếu cần filter by type)
messageSchema.index({ messageType: 1 });

// 6. Index cho unread messages queries
messageSchema.index({ receiverId: 1, isRead: 1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
