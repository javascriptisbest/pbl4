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
  },
  { 
    timestamps: true // Tự động thêm createdAt và updatedAt
  }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
