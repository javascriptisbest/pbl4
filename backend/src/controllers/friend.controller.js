/**
 * Friend Controller
 * Xử lý các API endpoints liên quan đến bạn bè
 */

import Friend from "../models/friend.model.js";
import User from "../models/user.model.js";

/**
 * GET /api/friends
 * Lấy danh sách bạn bè của user hiện tại
 */
export const getFriends = async (req, res) => {
  try {
    const userId = req.user._id;

    // Tìm tất cả friend relationships mà user là requester hoặc recipient
    // và status là accepted
    const friendships = await Friend.find({
      $or: [{ requester: userId }, { recipient: userId }],
      status: "accepted",
    })
      .populate("requester", "fullName profilePic email")
      .populate("recipient", "fullName profilePic email")
      .lean();

    // Map để lấy thông tin bạn bè (không phải chính mình)
    const friends = friendships.map((friendship) => {
      const friend =
        friendship.requester._id.toString() === userId.toString()
          ? friendship.recipient
          : friendship.requester;
      return {
        ...friend,
        friendshipId: friendship._id,
        createdAt: friendship.createdAt,
      };
    });

    res.status(200).json(friends);
  } catch (error) {
    console.error("Error in getFriends: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * GET /api/friends/pending
 * Lấy danh sách friend requests đang chờ (sent và received)
 */
export const getPendingRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    // Friend requests mà user đã gửi (pending)
    const sentRequests = await Friend.find({
      requester: userId,
      status: "pending",
    })
      .populate("recipient", "fullName profilePic email")
      .lean();

    // Friend requests mà user nhận được (pending)
    const receivedRequests = await Friend.find({
      recipient: userId,
      status: "pending",
    })
      .populate("requester", "fullName profilePic email")
      .lean();

    res.status(200).json({
      sent: sentRequests.map((req) => ({
        ...req.recipient,
        requestId: req._id,
        sentAt: req.createdAt,
      })),
      received: receivedRequests.map((req) => ({
        ...req.requester,
        requestId: req._id,
        receivedAt: req.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error in getPendingRequests: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * POST /api/friends/request/:userId
 * Gửi friend request đến một user
 */
export const sendFriendRequest = async (req, res) => {
  try {
    const requesterId = req.user._id;
    const recipientId = req.params.userId;

    // Validation
    if (requesterId.toString() === recipientId.toString()) {
      return res.status(400).json({ error: "Cannot send friend request to yourself" });
    }

    // Kiểm tra user tồn tại
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ error: "User not found" });
    }

    // Kiểm tra đã có relationship chưa
    const existingFriendship = await Friend.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId },
      ],
    });

    if (existingFriendship) {
      if (existingFriendship.status === "accepted") {
        return res.status(400).json({ error: "Already friends" });
      }
      if (existingFriendship.status === "pending") {
        return res.status(400).json({ error: "Friend request already sent" });
      }
      if (existingFriendship.status === "blocked") {
        return res.status(400).json({ error: "User is blocked" });
      }
    }

    // Tạo friend request mới
    const friendship = new Friend({
      requester: requesterId,
      recipient: recipientId,
      status: "pending",
    });

    await friendship.save();

    // Populate để trả về thông tin user
    await friendship.populate("recipient", "fullName profilePic email");

    res.status(201).json({
      message: "Friend request sent",
      friendship: {
        ...friendship.toObject(),
        recipient: friendship.recipient,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error
      return res.status(400).json({ error: "Friend request already exists" });
    }
    console.error("Error in sendFriendRequest: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * POST /api/friends/accept/:requestId
 * Chấp nhận friend request
 */
export const acceptFriendRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const requestId = req.params.requestId;

    // Tìm friend request
    const friendship = await Friend.findOne({
      _id: requestId,
      recipient: userId, // User phải là recipient
      status: "pending",
    });

    if (!friendship) {
      return res.status(404).json({ error: "Friend request not found" });
    }

    // Cập nhật status thành accepted
    friendship.status = "accepted";
    await friendship.save();

    // Populate để trả về thông tin
    await friendship.populate("requester", "fullName profilePic email");
    await friendship.populate("recipient", "fullName profilePic email");

    // Emit WebSocket event để notify cả 2 users real-time
    const { emitToUser } = await import("../lib/websocketServer.js");
    const requesterId = friendship.requester._id.toString();
    const recipientId = friendship.recipient._id.toString();
    
    // Notify requester (người gửi request)
    emitToUser(requesterId, "friendAccepted", {
      friend: friendship.recipient,
      friendshipId: friendship._id,
    });
    
    // Notify recipient (người chấp nhận)
    emitToUser(recipientId, "friendAccepted", {
      friend: friendship.requester,
      friendshipId: friendship._id,
    });

    res.status(200).json({
      message: "Friend request accepted",
      friendship,
      friend: friendship.requester._id.toString() === userId.toString() 
        ? friendship.recipient 
        : friendship.requester,
    });
  } catch (error) {
    console.error("Error in acceptFriendRequest: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * POST /api/friends/reject/:requestId
 * Từ chối friend request (xóa request)
 */
export const rejectFriendRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const requestId = req.params.requestId;

    // Tìm và xóa friend request
    const friendship = await Friend.findOneAndDelete({
      _id: requestId,
      recipient: userId,
      status: "pending",
    });

    if (!friendship) {
      return res.status(404).json({ error: "Friend request not found" });
    }

    res.status(200).json({ message: "Friend request rejected" });
  } catch (error) {
    console.error("Error in rejectFriendRequest: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * DELETE /api/friends/:userId
 * Xóa bạn bè (unfriend)
 */
export const removeFriend = async (req, res) => {
  try {
    const userId = req.user._id;
    const friendId = req.params.userId;

    // Tìm và xóa friendship
    const friendship = await Friend.findOneAndDelete({
      $or: [
        { requester: userId, recipient: friendId },
        { requester: friendId, recipient: userId },
      ],
      status: "accepted",
    });

    if (!friendship) {
      return res.status(404).json({ error: "Friendship not found" });
    }

    res.status(200).json({ message: "Friend removed" });
  } catch (error) {
    console.error("Error in removeFriend: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * GET /api/friends/status/:userId
 * Kiểm tra trạng thái friendship với một user
 */
export const getFriendStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const otherUserId = req.params.userId;

    const friendship = await Friend.findOne({
      $or: [
        { requester: userId, recipient: otherUserId },
        { requester: otherUserId, recipient: userId },
      ],
    }).lean();

    if (!friendship) {
      return res.status(200).json({ status: "none" });
    }

    // Xác định user là requester hay recipient
    const isRequester = friendship.requester.toString() === userId.toString();
    const status = friendship.status;

    res.status(200).json({
      status,
      isRequester,
      friendshipId: friendship._id,
    });
  } catch (error) {
    console.error("Error in getFriendStatus: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * GET /api/friends/search?q=query
 * Tìm kiếm users để thêm bạn (chưa phải bạn bè)
 */
export const searchUsersToAdd = async (req, res) => {
  try {
    const userId = req.user._id;
    const query = (req.query.q || "").trim();

    // Nếu query rỗng, trả về empty array
    if (!query || query.length < 1) {
      return res.status(200).json([]);
    }

    // Lấy danh sách bạn bè hiện tại và pending requests
    const friendships = await Friend.find({
      $or: [{ requester: userId }, { recipient: userId }],
      status: { $in: ["accepted", "pending"] }, // Exclude cả pending requests
    }).lean();

    // Extract friend IDs (requester và recipient đã là ObjectId trong lean())
    const friendIds = friendships.map((f) => {
      const requesterId = f.requester.toString();
      const recipientId = f.recipient.toString();
      const userIdStr = userId.toString();
      // Trả về ID của người còn lại (không phải chính mình)
      return requesterId === userIdStr ? f.recipient : f.requester;
    });

    // Escape special regex characters để tránh lỗi
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    
    // Hàm normalize tiếng Việt (bỏ dấu) để tìm kiếm linh hoạt - GIỮ SPACE
    const normalizeVietnamese = (str) => {
      if (!str) return "";
      return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase()
        .trim();
    };

    const normalizedQuery = normalizeVietnamese(query);
    
    // Build query - tìm kiếm với cả có dấu và không dấu
    const mongoose = (await import("mongoose")).default;
    
    // Tìm tất cả users (trừ chính mình và bạn bè) - dùng find trước
    let excludeIds = [userId, ...friendIds];
    excludeIds = excludeIds.map(id => {
      try {
        return typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
      } catch {
        return id;
      }
    });
    
    // Lấy tất cả users có thể (trừ excludeIds)
    const allCandidates = await User.find({
      _id: { $nin: excludeIds }
    })
      .select("-password")
      .lean();
    
    // Filter ở application level với normalize để hỗ trợ tìm kiếm không dấu
    const users = allCandidates.filter(user => {
      const normalizedName = normalizeVietnamese(user.fullName || "");
      const normalizedEmail = normalizeVietnamese(user.email || "");
      const originalName = (user.fullName || "").toLowerCase();
      const originalEmail = (user.email || "").toLowerCase();
      const queryLower = query.toLowerCase();
      
      return (
        originalName.includes(queryLower) ||
        originalEmail.includes(queryLower) ||
        normalizedName.includes(normalizedQuery) ||
        normalizedEmail.includes(normalizedQuery)
      );
    })
      .sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""))
      .slice(0, 20);


    // Debug: Kiểm tra tổng số users trong database
    const totalUsers = await User.countDocuments({ _id: { $ne: userId } });


    res.status(200).json(users);
  } catch (error) {
    console.error("Error in searchUsersToAdd: ", error.message);
    console.error("Stack:", error.stack);
    res.status(500).json({ error: "Internal server error" });
  }
};

