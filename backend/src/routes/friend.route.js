import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getFriends,
  getPendingRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getFriendStatus,
  searchUsersToAdd,
} from "../controllers/friend.controller.js";

const router = express.Router();

// Specific routes phải đứng trước dynamic routes
router.get("/pending", protectRoute, getPendingRequests);
router.get("/search", protectRoute, searchUsersToAdd);
router.get("/status/:userId", protectRoute, getFriendStatus);
router.get("/", protectRoute, getFriends);
router.post("/request/:userId", protectRoute, sendFriendRequest);
router.post("/accept/:requestId", protectRoute, acceptFriendRequest);
router.post("/reject/:requestId", protectRoute, rejectFriendRequest);
router.delete("/:userId", protectRoute, removeFriend);

export default router;

