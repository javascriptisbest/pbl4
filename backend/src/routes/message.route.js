import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getMessages,
  getUsersForSidebar,
  sendMessage,
  addReaction,
  deleteMessage,
  editMessage,
  markMessagesAsRead,
  preloadMessages,
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/preload", protectRoute, preloadMessages);
router.get("/:id", protectRoute, getMessages);

router.post("/send/:id", protectRoute, sendMessage);
router.post("/read/:userId", protectRoute, markMessagesAsRead);
router.post("/reaction/:messageId", protectRoute, addReaction);
router.put("/:messageId", protectRoute, editMessage);
router.delete("/:messageId", protectRoute, deleteMessage);

export default router;
