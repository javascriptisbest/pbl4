import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createGroup,
  getUserGroups,
  getGroupMessages,
  sendGroupMessage,
  addGroupMember,
  leaveGroup,
} from "../controllers/group.controller.js";

const router = express.Router();

router.post("/create", protectRoute, createGroup);
router.get("/", protectRoute, getUserGroups);
router.get("/:groupId/messages", protectRoute, getGroupMessages);
router.post("/:groupId/messages", protectRoute, sendGroupMessage);
router.post("/:groupId/members", protectRoute, addGroupMember);
router.delete("/:groupId/leave", protectRoute, leaveGroup);

export default router;
