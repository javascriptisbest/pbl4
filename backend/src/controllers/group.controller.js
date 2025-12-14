/**
 * Group Controller
 * Xử lý các API endpoints liên quan đến group chat
 * 
 * Features:
 * - Tạo group mới
 * - Lấy danh sách groups của user
 * - Lấy tin nhắn trong group
 * - Gửi tin nhắn vào group (text, media)
 * - Thêm/xóa members
 */

import Group from "../models/group.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import {
  getReceiverSocketId,
  getAllUserSockets,
  emitToSocket,
} from "../lib/websocketServer.js";

/**
 * POST /api/groups
 * Tạo group chat mới
 */
export const createGroup = async (req, res) => {
  try {
    const { name, description, memberIds, avatar } = req.body;
    const creatorId = req.user._id;

    // Validation
    if (!name || !memberIds || memberIds.length === 0) {
      return res.status(400).json({ error: "Group name and members required" });
    }

    // Upload group avatar nếu có
    let avatarUrl = "";
    if (avatar) {
      const uploadResponse = await cloudinary.uploader.upload(avatar, {
        folder: "chat_app_groups",
      });
      avatarUrl = uploadResponse.secure_url;
    }

    // Thêm creator vào members với role admin
    const members = [
      { userId: creatorId, role: "admin" },
      ...memberIds.map((id) => ({ userId: id, role: "member" })),
    ];

    const group = new Group({
      name,
      description,
      avatar: avatarUrl,
      members,
      createdBy: creatorId,
    });

    await group.save();

    // Populate thông tin members
    await group.populate("members.userId", "fullName profilePic");

    // Emit socket event đến tất cả members
    // Để real-time update danh sách groups
    members.forEach((member) => {
      const socketId = getReceiverSocketId(member.userId);
      if (socketId) {
        emitToSocket(socketId, "newGroup", group);
      }
    });

    res.status(201).json(group);
  } catch (error) {
    console.error("Error in createGroup:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * GET /api/groups
 * Lấy danh sách groups mà user là member
 */
export const getUserGroups = async (req, res) => {
  try {
    const userId = req.user._id;

    // Tìm groups có userId trong members array
    const groups = await Group.find({
      "members.userId": userId,
    })
      .populate("members.userId", "fullName profilePic")
      .populate("lastMessage") // Populate tin nhắn cuối
      .sort({ lastMessageAt: -1 }); // Sort theo tin nhắn mới nhất

    res.status(200).json(groups);
  } catch (error) {
    console.error("Error in getUserGroups:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * GET /api/groups/:groupId/messages
 * Lấy tất cả tin nhắn trong group
 */
export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    // Check if user is member
    const group = await Group.findOne({
      _id: groupId,
      "members.userId": userId,
    });

    if (!group) {
      return res.status(403).json({ error: "Not a member of this group" });
    }

    const messages = await Message.find({
      groupId,
      messageType: "group",
    })
      .populate("senderId", "fullName profilePic")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getGroupMessages:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Send group message
export const sendGroupMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
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
    const senderId = req.user._id;

    // Check if user is member
    const group = await Group.findOne({
      _id: groupId,
      "members.userId": senderId,
    });

    if (!group) {
      return res.status(403).json({ error: "Not a member of this group" });
    }

    let mediaType = "text";
    let imageUrl = "";
    let videoUrl = "";
    let audioUrl = "";
    let fileUrl = "";

    // Handle media uploads (same as direct messages)
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image, {
        folder: "chat_app_images",
      });
      imageUrl = uploadResponse.secure_url;
      mediaType = "image";
    }

    if (video) {
      const uploadResponse = await cloudinary.uploader.upload(video, {
        resource_type: "video",
        folder: "chat_app_videos",
      });
      videoUrl = uploadResponse.secure_url;
      mediaType = "video";
    }

    if (audio) {
      const uploadResponse = await cloudinary.uploader.upload(audio, {
        resource_type: "video",
        folder: "chat_app_audio",
      });
      audioUrl = uploadResponse.secure_url;
      mediaType = "audio";
    }

    if (file) {
      const uploadResponse = await cloudinary.uploader.upload(file, {
        resource_type: "auto",
        folder: "chat_app_files",
      });
      fileUrl = uploadResponse.secure_url;
      mediaType = "file";
    }

    const newMessage = new Message({
      senderId,
      groupId,
      messageType: "group",
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
    await newMessage.populate("senderId", "fullName profilePic");

    // Update group last message
    group.lastMessage = newMessage._id;
    group.lastMessageAt = new Date();
    await group.save();

    // Emit to all group members except sender
    group.members.forEach((member) => {
      // Skip sender to avoid duplicate (sender gets message from API response)
      if (member.userId.toString() === senderId.toString()) return;

      const socketId = getReceiverSocketId(member.userId);
      if (socketId) {
        emitToSocket(socketId, "newGroupMessage", newMessage);
      }
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error in sendGroupMessage:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Add member to group
export const addGroupMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    const requesterId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Check if requester is admin
    const requester = group.members.find(
      (m) => m.userId.toString() === requesterId.toString()
    );
    if (!requester || requester.role !== "admin") {
      return res.status(403).json({ error: "Only admins can add members" });
    }

    // Check if user already member
    const existingMember = group.members.find(
      (m) => m.userId.toString() === userId
    );
    if (existingMember) {
      return res.status(400).json({ error: "User already a member" });
    }

    group.members.push({ userId, role: "member" });
    await group.save();
    await group.populate("members.userId", "fullName profilePic");

    // Notify new member
    const socketId = getReceiverSocketId(userId);
    if (socketId) {
      emitToSocket(socketId, "addedToGroup", group);
    }

    res.status(200).json(group);
  } catch (error) {
    console.error("Error in addGroupMember:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Leave group
export const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    group.members = group.members.filter(
      (m) => m.userId.toString() !== userId.toString()
    );

    // If no members left, delete group
    if (group.members.length === 0) {
      await Group.findByIdAndDelete(groupId);
      return res.status(200).json({ message: "Group deleted" });
    }

    // If last admin leaves, make someone else admin
    const hasAdmin = group.members.some((m) => m.role === "admin");
    if (!hasAdmin && group.members.length > 0) {
      group.members[0].role = "admin";
    }

    await group.save();

    res.status(200).json({ message: "Left group successfully" });
  } catch (error) {
    console.error("Error in leaveGroup:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
