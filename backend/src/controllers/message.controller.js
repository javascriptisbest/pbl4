/**
 * Message Controller
 * Xử lý các API endpoints liên quan đến tin nhắn
 */

import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

/**
 * GET /api/messages/users
 * Lấy danh sách users để hiển thị trong sidebar
 * (Exclude user hiện tại, không lấy password)
 *
 * Performance: .lean() + .select() + index on email
 */
export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // Tìm tất cả users trừ chính mình
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId }, // $ne = not equal
    })
      .select("-password") // Không trả về password
      .limit(100) // Limit 100 users (pagination nếu cần)
      .lean(); // Plain objects cho performance

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * GET /api/messages/:id
 * Lấy tất cả tin nhắn giữa 2 users
 * :id = userId của người đang chat
 *
 * Performance optimizations:
 * - .lean() để return plain JS objects (nhanh hơn 5-10x)
 * - .limit() để pagination (chỉ load 100 messages gần nhất)
 * - .sort() để sắp xếp theo thời gian
 * - Index sẽ tự động được dùng nhờ compound index
 */
export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    // Pagination params (optional)
    const limit = parseInt(req.query.limit) || 100; // Default 100 messages
    const skip = parseInt(req.query.skip) || 0;

    // Tìm messages có senderId hoặc receiverId là 2 users này
    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId }, // Tin mình gửi
        { senderId: userToChatId, receiverId: myId }, // Tin người kia gửi
      ],
      isDeleted: false, // Không lấy messages đã xóa
    })
      .populate("senderId", "fullName profilePic") // Populate thông tin sender
      .sort({ createdAt: -1 }) // Sort mới nhất trước
      .limit(limit) // Giới hạn số lượng
      .skip(skip) // Pagination offset
      .lean(); // Return plain objects (faster)

    res.status(200).json(messages.reverse()); // Reverse để cũ nhất ở đầu
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * POST /api/messages/send/:id
 * Gửi tin nhắn (text/image/video/audio/file) đến user khác
 * :id = receiverId
 */
export const sendMessage = async (req, res) => {
  try {
    const {
      text,
      image,
      video,
      audio,
      audioDuration,
      file,
      fileName,
      fileSize,
      fileType,
    } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl,
      videoUrl,
      audioUrl,
      fileUrl,
      mediaType = "text";

    /**
     * Upload media files lên Cloudinary (cloud storage)
     * Frontend gửi file dạng base64, backend upload lên cloud
     */
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
      mediaType = "image";
    }

    if (video) {
      console.log("Processing video upload...");
      console.log("Video data prefix:", video.substring(0, 100));

      // Validate base64 video format
      if (!video.startsWith("data:video/")) {
        console.error("Invalid video format - not a video base64");
        return res.status(400).json({ error: "Invalid video format" });
      }

      // Upload base64 video to cloudinary with increased timeout and chunking
      const uploadResponse = await cloudinary.uploader.upload(video, {
        resource_type: "video",
        timeout: 600000, // 10 minutes timeout cho file lớn
        chunk_size: 6000000, // 6MB chunks
        eager: [
          { quality: "auto", fetch_format: "auto" }, // Auto optimization
        ],
      });
      videoUrl = uploadResponse.secure_url;
      mediaType = "video";
      console.log("Video uploaded successfully:", videoUrl);
    }

    if (audio) {
      console.log("Processing audio upload...");
      console.log("Audio duration:", audioDuration, "seconds");

      // Validate base64 audio format
      if (!audio.startsWith("data:audio/")) {
        console.error("Invalid audio format - not an audio base64");
        return res.status(400).json({ error: "Invalid audio format" });
      }

      // Upload base64 audio to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(audio, {
        resource_type: "video", // Cloudinary treats audio as video resource
        timeout: 300000, // 5 minutes timeout for audio
        folder: "chat_app_audio",
        eager: [
          { quality: "auto", fetch_format: "auto" }, // Auto optimization
        ],
      });
      audioUrl = uploadResponse.secure_url;
      mediaType = "audio";
      console.log("Audio uploaded successfully:", audioUrl);
    }

    if (file) {
      console.log("Processing file upload...");
      console.log("File info:", { fileName, fileSize, fileType });

      // Upload general file to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(file, {
        resource_type: "auto", // Auto detect resource type
        timeout: 600000, // 10 minutes timeout
        chunk_size: 6000000, // 6MB chunks
        folder: "chat_app_files",
      });
      fileUrl = uploadResponse.secure_url;
      mediaType = "file";
      console.log("File uploaded successfully:", fileUrl);
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      video: videoUrl,
      audio: audioUrl,
      audioDuration,
      file: fileUrl,
      fileName,
      fileSize,
      fileType,
      mediaType,
    });

    await newMessage.save();

    // Populate sender info before emitting
    await newMessage.populate("senderId", "fullName profilePic");

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    console.log("Full error:", error); // Log full error for debugging

    // Handle specific error types
    if (error.message?.includes("File size too large")) {
      res
        .status(413)
        .json({ error: "Video file is too large. Please use a smaller file." });
    } else if (error.message?.includes("timeout")) {
      res
        .status(408)
        .json({ error: "Upload timeout. Please try a smaller video." });
    } else if (error.message?.includes("Invalid video format")) {
      res
        .status(400)
        .json({ error: "Invalid video format. Please use MP4, AVI, or MOV." });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
};

export const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (!emoji) {
      return res.status(400).json({ error: "Emoji is required" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find(
      (reaction) =>
        reaction.userId.toString() === userId.toString() &&
        reaction.emoji === emoji
    );

    if (existingReaction) {
      // Remove the reaction if it already exists
      message.reactions = message.reactions.filter(
        (reaction) =>
          !(
            reaction.userId.toString() === userId.toString() &&
            reaction.emoji === emoji
          )
      );
    } else {
      // Add new reaction
      message.reactions.push({
        userId: userId,
        emoji: emoji,
        createdAt: new Date(),
      });
    }

    await message.save();

    // Emit to both sender and receiver
    const receiverSocketId = getReceiverSocketId(message.receiverId);
    const senderSocketId = getReceiverSocketId(message.senderId);

    const updatedMessage = await Message.findById(messageId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageReaction", updatedMessage);
    }
    if (senderSocketId && senderSocketId !== receiverSocketId) {
      io.to(senderSocketId).emit("messageReaction", updatedMessage);
    }

    res.status(200).json(updatedMessage);
  } catch (error) {
    console.log("Error in addReaction controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Only allow sender to delete their own message
    if (message.senderId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ error: "You can only delete your own messages" });
    }

    // Soft delete - mark as deleted
    message.isDeleted = true;
    message.deletedAt = new Date();
    message.text = "This message was deleted";

    // Clear media fields
    message.image = null;
    message.video = null;
    message.audio = null;
    message.file = null;
    message.fileName = null;
    message.fileSize = null;
    message.fileType = null;
    message.audioDuration = null;
    message.mediaType = "text";

    await message.save();

    // Emit to both sender and receiver
    const receiverSocketId = getReceiverSocketId(message.receiverId);
    const senderSocketId = getReceiverSocketId(message.senderId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", message);
    }
    if (senderSocketId && senderSocketId !== receiverSocketId) {
      io.to(senderSocketId).emit("messageDeleted", message);
    }

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.log("Error in deleteMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
