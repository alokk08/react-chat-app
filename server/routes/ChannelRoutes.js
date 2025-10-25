import {Router} from 'express'
import { verifyToken } from "../middlewares/AuthMiddleware.js";
import { createChannel, getChannelMessages, getUserChannels, getChannelById } from '../controllers/ChannelController.js';
const channelRoutes = Router()

channelRoutes.post("/create-channel", verifyToken, createChannel)
channelRoutes.get("/get-user-channels", verifyToken, getUserChannels)
channelRoutes.get("/get-channel-messages/:channelId", verifyToken, getChannelMessages)

// get channel details (admin + members)
channelRoutes.get("/:id", verifyToken, getChannelById)


export default channelRoutes