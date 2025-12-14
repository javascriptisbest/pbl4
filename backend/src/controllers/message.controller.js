/**
 * Message Controller
 * Xử lý các API endpoints liên quan đến tin nhắn
 */

import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import Friend from "../models/friend.model.js";

import cloudinary from "../lib/cloudinary.js";
import {
  getReceiverSocketId,
  emitToSocket,
} from "../lib/websocketServer.js";

/**
 * GET /api/messages/users
 * Lấy danh sách bạn bè để hiển thị trong sidebar
 * Trả về: thông tin user, lastMessage, unreadCount
 *
 * Performance: .lean() + .select() + index on email
 */
export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    console.log("📋 getUsersForSidebar called for user:", loggedInUserId.toString());

    // Lấy danh sách bạn bè (accepted friendships)
    const friendships = await Friend.find({
      $or: [{ requester: loggedInUserId }, { recipient: loggedInUserId }],
      status: "accepted",
    })
      .populate("requester", "fullName profilePic email")
      .populate("recipient", "fullName profilePic email")
      .lean();
    
    console.log("👫 Found friendships:", friendships.length);

    // Map để lấy thông tin bạn bè (không phải chính mình)
    const friendIds = friendships.map((friendship) => {
      return friendship.requester._id.toString() === loggedInUserId.toString()
        ? friendship.recipient._id
        : friendship.requester._id;
    });

    // Lấy lastMessage và unreadCount cho mỗi bạn bè
    const friendsWithMessages = await Promise.all(
      friendships.map(async (friendship) => {
        const friend =
          friendship.requester._id.toString() === loggedInUserId.toString()
            ? friendship.recipient
            : friendship.requester;

        const friendId = friend._id;

        // Lấy tin nhắn cuối cùng giữa 2 người
        const lastMessage = await Message.findOne({
          $or: [
            { senderId: loggedInUserId, receiverId: friendId },
            { senderId: friendId, receiverId: loggedInUserId },
          ],
          isDeleted: { $ne: true }, // Cho phép null/undefined hoặc false
          messageType: "direct",
        })
          .sort({ createdAt: -1 })
          .select("text image video audio file senderId createdAt isRead")
          .lean();

        // Đếm số tin nhắn chưa đọc (từ bạn gửi cho mình)
        const unreadCount = await Message.countDocuments({
          senderId: friendId,
          receiverId: loggedInUserId,
          isRead: { $ne: true }, // Cho phép null/undefined hoặc false
          isDeleted: { $ne: true },
          messageType: "direct",
        });

        return {
          ...friend,
          lastMessage: lastMessage || null,
          unreadCount,
        };
      })
    );

    // Sắp xếp theo thời gian tin nhắn cuối (mới nhất lên đầu)
    friendsWithMessages.sort((a, b) => {
      const timeA = a.lastMessage?.createdAt
        ? new Date(a.lastMessage.createdAt).getTime()
        : 0;
      const timeB = b.lastMessage?.createdAt
        ? new Date(b.lastMessage.createdAt).getTime()
        : 0;
      return timeB - timeA;
    });

    console.log("✅ Returning", friendsWithMessages.length, "friends");
    if (friendsWithMessages.length > 0) {
      console.log("   Sample:", friendsWithMessages[0].fullName, 
        "- lastMessage:", friendsWithMessages[0].lastMessage?.text?.substring(0, 30) || "null",
        "- unread:", friendsWithMessages[0].unreadCount);
    }
    
    res.status(200).json(friendsWithMessages);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    console.error(error.stack);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * GET /api/messages/preload
 * Preload messages cho sidebar (giống Facebook Messenger)
 * - Top 5 users: Load đủ 50 tin nhắn mỗi người
 * - Còn lại: Load 5 tin nhắn gần nhất
 * 
 * Response: { [userId]: { messages: [], hasMore: boolean } }
 */
export const preloadMessages = async (req, res) => {
  try {
    const myId = req.user._id;

    // Lấy danh sách bạn bè với lastMessage
    const friendships = await Friend.find({
      $or: [{ requester: myId }, { recipient: myId }],
      status: "accepted",
    }).lean();

    const friendIds = friendships.map((f) =>
      f.requester.toString() === myId.toString() ? f.recipient : f.requester
    );

    // Lấy conversation stats để xác định top 5 active users
    const conversationStats = await Promise.all(
      friendIds.map(async (friendId) => {
        const lastMsg = await Message.findOne({
          $or: [
            { senderId: myId, receiverId: friendId },
            { senderId: friendId, receiverId: myId },
          ],
          isDeleted: { $ne: true },
          messageType: "direct",
        })
          .sort({ createdAt: -1 })
          .select("createdAt")
          .lean();

        return {
          friendId: friendId.toString(),
          lastMessageTime: lastMsg?.createdAt || new Date(0),
        };
      })
    );

    // Sort by last message time (most recent first)
    conversationStats.sort(
      (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
    );

    const preloadedData = {};

    // Preload messages
    await Promise.all(
      conversationStats.map(async (stat, index) => {
        const friendId = stat.friendId;
        // Top 5: load 50 messages, others: load 5 messages
        const limit = index < 5 ? 50 : 5;

        const messages = await Message.find({
          $or: [
            { senderId: myId, receiverId: friendId },
            { senderId: friendId, receiverId: myId },
          ],
          isDeleted: { $ne: true },
          messageType: "direct",
        })
          .populate("senderId", "fullName profilePic")
          .sort({ createdAt: -1 })
          .limit(limit + 1) // Load 1 extra to check hasMore
          .lean();

        const hasMore = messages.length > limit;
        const finalMessages = hasMore ? messages.slice(0, limit) : messages;

        preloadedData[friendId] = {
          messages: finalMessages.reverse(), // Reverse to chronological order
          hasMore,
          preloadLevel: index < 5 ? "full" : "preview",
        };
      })
    );

    res.status(200).json(preloadedData);
  } catch (error) {
    console.error("Error in preloadMessages: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * POST /api/messages/read/:userId
 * Đánh dấu tất cả tin nhắn từ userId là đã đọc
 * Gọi khi user mở conversation
 */
export const markMessagesAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = req.user._id;

    // Cập nhật tất cả tin nhắn chưa đọc từ userId gửi cho mình
    const result = await Message.updateMany(
      {
        senderId: userId,
        receiverId: myId,
        isRead: { $ne: true }, // Cho phép null/undefined hoặc false
        isDeleted: { $ne: true },
        messageType: "direct",
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    // Emit socket event để notify sender rằng tin đã được đọc
    const senderSocketId = getReceiverSocketId(userId);
    if (senderSocketId) {
      emitToSocket(senderSocketId, "messagesRead", {
        readerId: myId.toString(),
        count: result.modifiedCount,
      });
    }

    res.status(200).json({
      success: true,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error in markMessagesAsRead: ", error.message);
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
      isDeleted: { $ne: true }, // Không lấy messages đã xóa
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
    const senderId = req.user?._id;

    console.log("📨 Send message request:", {
      senderId,
      receiverId,
      hasUser: !!req.user,
      userDetails: req.user
        ? { id: req.user._id, email: req.user.email }
        : null,
      hasText: !!text,
      hasImage: !!image,
      hasVideo: !!video,
      hasAudio: !!audio,
      hasFile: !!file,
    });

    // Validate authentication
    if (!req.user || !senderId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Validate required fields
    if (!receiverId) {
      return res.status(400).json({ error: "Receiver ID is required" });
    }

    if (!text && !image && !video && !audio && !file) {
      return res.status(400).json({ error: "Message content is required" });
    }

    // Validate MongoDB ObjectId format
    if (!receiverId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: "Invalid receiver ID format" });
    }

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

    console.log("💾 Creating message with data:", {
      senderId,
      receiverId,
      text,
      messageType: "direct",
      hasImage: !!imageUrl,
      hasVideo: !!videoUrl,
      hasAudio: !!audioUrl,
      hasFile: !!fileUrl,
      mediaType,
    });

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
      messageType: "direct", // Explicitly set messageType
      mediaType,
    });

    // Tự động tạo friend relationship nếu chưa có
    // Kiểm tra xem đây có phải tin nhắn đầu tiên giữa 2 users không
    const messageCount = await Message.countDocuments({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    });

    // Nếu đây là tin nhắn đầu tiên, tự động tạo friend relationship
    if (messageCount === 0) {
      const existingFriendship = await Friend.findOne({
        $or: [
          { requester: senderId, recipient: receiverId },
          { requester: receiverId, recipient: senderId },
        ],
      });

      if (!existingFriendship) {
        // Tạo friend relationship với status accepted
        const friendship = new Friend({
          requester: senderId,
          recipient: receiverId,
          status: "accepted",
        });
        await friendship.save();
        console.log("✅ Auto-created friendship between", senderId, "and", receiverId);
      }
    }

    console.log("💾 Saving message to database...");
    await newMessage.save();
    console.log("✅ Message saved successfully:", newMessage._id);

    // Populate sender info before emitting
    console.log("👤 Populating sender info...");
    await newMessage.populate("senderId", "fullName profilePic");
    console.log("✅ Sender info populated");

    const receiverSocketId = getReceiverSocketId(receiverId);
    console.log("🔍 Broadcasting message:", {
      receiverId,
      receiverSocketId,
      messageId: newMessage._id,
      timestamp: new Date().toISOString(),
    });

    if (receiverSocketId) {
      emitToSocket(receiverSocketId, "newMessage", newMessage);
      console.log("📤 Message broadcasted to:", receiverSocketId);
    } else {
      console.log("❌ Receiver not found online:", receiverId);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("❌ Error in sendMessage controller:");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Request body keys:", Object.keys(req.body));
    console.error("Request params:", req.params);
    console.error("User ID:", req.user?._id);

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
      res.status(500).json({
        error: "Internal server error",
        message: error.message,
        timestamp: new Date().toISOString(),
      });
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
      emitToSocket(receiverSocketId, "messageReaction", updatedMessage);
    }
    if (senderSocketId && senderSocketId !== receiverSocketId) {
      emitToSocket(senderSocketId, "messageReaction", updatedMessage);
    }

    res.status(200).json(updatedMessage);
  } catch (error) {
    console.log("Error in addReaction controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Text is required" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Only allow sender to edit their own message
    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "You can only edit your own messages" });
    }

    // Cannot edit deleted messages
    if (message.isDeleted) {
      return res.status(400).json({ error: "Cannot edit deleted message" });
    }

    // Update message
    message.text = text.trim();
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    // Emit to both sender and receiver
    const receiverSocketId = getReceiverSocketId(message.receiverId);
    const senderSocketId = getReceiverSocketId(message.senderId);

    if (receiverSocketId) {
      emitToSocket(receiverSocketId, "messageEdited", message);
    }
    if (senderSocketId && senderSocketId !== receiverSocketId) {
      emitToSocket(senderSocketId, "messageEdited", message);
    }

    res.status(200).json(message);
  } catch (error) {
    console.log("Error in editMessage controller: ", error.message);
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
      emitToSocket(receiverSocketId, "messageDeleted", message);
    }
    if (senderSocketId && senderSocketId !== receiverSocketId) {
      emitToSocket(senderSocketId, "messageDeleted", message);
    }

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.log("Error in deleteMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
