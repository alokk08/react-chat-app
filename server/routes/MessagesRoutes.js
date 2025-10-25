import { Router } from "express";
import { verifyToken } from "../middlewares/AuthMiddleware.js";
import { getMessages, uploadFile, sendMessage, markMessagesAsRead, getUnreadCount } from "../controllers/MessagesController.js";
import multer from "multer"

const messagesRoutes = Router();

const upload = multer({dest:"uploads/files"})
messagesRoutes.post("/get-messages",verifyToken, getMessages);
messagesRoutes.post("/send-message", verifyToken, sendMessage);
messagesRoutes.post("/mark-as-read", verifyToken, markMessagesAsRead);
messagesRoutes.post("/get-unread-count", verifyToken, getUnreadCount);
messagesRoutes.post("/upload-file", verifyToken,upload.single("file"), uploadFile)

export default messagesRoutes;