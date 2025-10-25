import Message from "../models/MessagesModel.js";
import Request from "../models/RequestModel.js";
import { mkdirSync, renameSync } from "fs";
// Send a message (with request/limit logic)
export const sendMessage = async (request, response, next) => {
    try {
        const sender = request.userId;
        const { recipient, messageType, content, fileUrl } = request.body;
        if (!sender || !recipient) {
            return response.status(400).json({ message: "Sender and recipient are required" });
        }

        // Check for existing accepted request or prior messages
        let reqDoc = await Request.findOne({
            type: "contact",
            sender,
            receiver: recipient,
        });
        let reverseReqDoc = await Request.findOne({
            type: "contact",
            sender: recipient,
            receiver: sender,
        });

        // If no accepted request, enforce request/limit logic
        if (!reqDoc || reqDoc.status !== "accepted") {
            // If no request exists, create one
            if (!reqDoc && !reverseReqDoc) {
                reqDoc = await Request.create({
                    type: "contact",
                    sender,
                    receiver: recipient,
                });
            }
            // Count messages sent by sender to recipient since request was created
            const requestTimestamp = reqDoc ? reqDoc.createdAt : reverseReqDoc?.createdAt;
            const sentCount = await Message.countDocuments({ 
                sender, 
                recipient,
                timestamp: { $gte: requestTimestamp }
            });
            if (sentCount >= 5) {
                return response.status(403).json({ message: "You can only send 5 messages until your request is accepted." });
            }
        }

        // Save the message
        const msg = new Message({ sender, recipient, messageType, content, fileUrl });
        await msg.save();
        return response.status(201).json({ message: msg });
    } catch (error) {
        console.log(error);
        return response.status(500).send("Internal Server Error");
    }
};
export const getMessages = async (request, response, next) => {
    try {
        const user1 =  request.userId
        const user2 = request.body.id;
        if (!user1 || !user2) {
            return response.status(400).json({ message: "Both user ID's are required" });
        }

        const messages = await Message.find({
            $or: [
                { sender: user1, recipient: user2 },
                { sender: user2, recipient: user1 }
            ],
        }).sort({timestamp: 1});

        return response.status(200).json({ messages });
    } catch (error) {
        console.log(error);
        return response.status(500).send("Internal Server Error");
    }
};

export const markMessagesAsRead = async (request, response, next) => {
    try {
        const reader = request.userId;
        const sender = request.body.senderId;
        
        if (!reader || !sender) {
            return response.status(400).json({ message: "Both reader and sender IDs are required" });
        }

        await Message.updateMany(
            { 
                sender: sender,
                recipient: reader,
                isRead: false
            },
            { isRead: true }
        );

        return response.status(200).json({ message: "Messages marked as read" });
    } catch (error) {
        console.log(error);
        return response.status(500).send("Internal Server Error");
    }
};

export const getUnreadCount = async (request, response, next) => {
    try {
        const recipient = request.userId;
        const sender = request.body.senderId;
        
        if (!recipient || !sender) {
            return response.status(400).json({ message: "Both recipient and sender IDs are required" });
        }

        const count = await Message.countDocuments({
            sender,
            recipient,
            isRead: false
        });

        return response.status(200).json({ count });
    } catch (error) {
        console.log(error);
        return response.status(500).send("Internal Server Error");
    }
};

export const uploadFile = async (request, response, next) => {
    try {
        if(!request.file){
            response.status(400).send("File is required")
        }
        const date = Date.now()
        let fileDir = `uploads/files/${date}`
        let fileName = `${fileDir}/${request.file.originalname}`

        mkdirSync(fileDir,{recursive:true})

        renameSync(request.file.path, fileName)


        return response.status(200).json({ filePath:fileName });
    } catch (error) {
        console.log(error);
        return response.status(500).send("Internal Server Error");
    }
};