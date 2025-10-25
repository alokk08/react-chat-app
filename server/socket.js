import{Server as SocketIoServer}from'socket.io';
import Message from './models/MessagesModel.js';
import Request from './models/RequestModel.js';
import Channel from './models/ChannelModel.js';

const setUpSocket = (server) => {
    const io = new SocketIoServer(server, {
        cors: {
            origin: process.env.ORIGIN,
            methods: ["GET", "POST"],
            credentials: true
        }
    
    })  

    const userSocketMap = new Map();
    const disconnect = (socket) => {
        console.log(`Client disconnected: ${socket}`);
        for(const [userId, socketId] of userSocketMap.entries()){
            if(socketId === socket.id){
                userSocketMap.delete(userId);
                break;
            }
        }
    }

    const sendMessage = async(message) => {
        try {
            const senderSocketId = userSocketMap.get(message.sender);
            const recipientSocketId = userSocketMap.get(message.recipient);

            // Ensure contact request logic on socket message as well
            // Check for an accepted request between the two users
            const acceptedReq = await Request.findOne({
                type: 'contact',
                $or: [
                    { sender: message.sender, receiver: message.recipient, status: 'accepted' },
                    { sender: message.recipient, receiver: message.sender, status: 'accepted' }
                ]
            });

            // If no accepted request, find or create pending request and enforce limits
            if (!acceptedReq) {
                let pendingReq = await Request.findOne({
                    type: 'contact',
                    $or: [
                        { sender: message.sender, receiver: message.recipient, status: 'pending' },
                        { sender: message.recipient, receiver: message.sender, status: 'pending' }
                    ]
                });

                if (!pendingReq) {
                    // Create a pending request where the sender is the message sender
                    pendingReq = await Request.create({
                        type: 'contact',
                        sender: message.sender,
                        receiver: message.recipient,
                        status: 'pending'
                    });

                    // Notify recipient about new request if they're online
                    if (recipientSocketId) {
                        io.to(recipientSocketId).emit('newRequest', pendingReq);
                    }
                } else {
                    // If pending request exists and the sender is the same as the pending sender
                    if (pendingReq.sender.toString() === message.sender) {
                        const msgsSince = await Message.countDocuments({
                            sender: message.sender,
                            recipient: message.recipient,
                            timestamp: { $gte: pendingReq.createdAt }
                        });
                        if (msgsSince >= 5) {
                            // Notify sender that they've hit limit
                            if (senderSocketId) {
                                io.to(senderSocketId).emit('messageBlocked', { message: "You have reached the 5-message limit. Wait until the request is accepted." });
                            }
                            return;
                        }
                    } else if (pendingReq.receiver.toString() === message.sender) {
                        // The sender is actually the receiver of a pending request - block until they accept
                        if (senderSocketId) {
                            io.to(senderSocketId).emit('messageBlocked', { message: "Please accept the contact request to send messages." });
                        }
                        return;
                    }
                }
            }

            // Save message
            const createMessage = await Message.create({
                sender: message.sender,
                recipient: message.recipient,
                content: message.content,
                messageType: message.messageType,
                fileUrl: message.fileUrl,
                timestamp: new Date()
            });

            const messageData = await Message.findById(createMessage._id)
                .populate('sender', 'id email firstName lastName image color')
                .populate('recipient', 'id email firstName lastName image color');

            // Get unread count for this conversation
            const unreadCount = await Message.countDocuments({
                sender: message.sender,
                recipient: message.recipient,
                isRead: false
            });

            if(recipientSocketId){
                io.to(recipientSocketId).emit('recieveMessage', messageData);
                io.to(recipientSocketId).emit('unreadCount', {
                    senderId: message.sender,
                    count: unreadCount
                });
            }
            if(senderSocketId){
                io.to(senderSocketId).emit('receiveMessage', messageData);
            }
        } catch (err) {
            console.error('Error in socket sendMessage:', err);
        }
    }

    const sendChannelMessage = async(message)=>{
        const {channelId, sender, content, messageType, fileUrl} = message;

        const createMessage = await Message.create({
            sender,
            recipient: null,
            content,
            messageType,
            timestamp: new Date(),
            fileUrl
        });

        const messageData = await Message.findById(createMessage._id)
        .populate("sender", "id email firstName lastName image color")
        .exec()

        await Channel.findByIdAndUpdate(channelId,{
            $push:{messages: createMessage._id},
        })

        const channel = await Channel.findById(channelId).populate("members")

        const finalData = { ...messageData._doc, channelId: channel._id};

        if(channel && channel.members){
            channel.members.forEach((member)=>{
                const memberSocketId = userSocketMap.get(member._id.toString())
                if (memberSocketId){
                    io.to(memberSocketId).emit("recieve-channel-message", finalData)
                }
            })
            const adminSocketId = userSocketMap.get(channel.admin._id.toString())
                if (adminSocketId){
                    io.to(adminSocketId).emit("recieve-channel-message", finalData)
                }
        }
    }

    io.on('connection', (socket) => {
        const userId = socket.handshake.query.userId;

        if (userId) {
            userSocketMap.set(userId, socket.id);
            console.log(`User connected: ${userId} with socket ID: ${socket.id}`);
        } else {
            console.log('User ID not provided during connection.');
        }

        socket.on('sendMessage', (message) => {sendMessage(message);});
        socket.on('send-channel-message', (message)=>{sendChannelMessage(message)});
        socket.on('markMessagesAsRead', async (data) => {
            try {
                // Mark messages as read
                await Message.updateMany(
                    { 
                        sender: data.senderId,
                        recipient: data.readerId,
                        isRead: false
                    },
                    { isRead: true }
                );

                // Get updated unread count after marking as read
                const unreadCount = await Message.countDocuments({
                    sender: data.senderId,
                    recipient: data.readerId,
                    isRead: false
                });

                // Notify both sender and reader about read status
                const senderSocketId = userSocketMap.get(data.senderId);
                const readerSocketId = userSocketMap.get(data.readerId);

                // Send updated count to reader
                if (readerSocketId) {
                    io.to(readerSocketId).emit('unreadCount', {
                        senderId: data.senderId,
                        count: unreadCount
                    });
                }

                // Notify sender their messages were read
                if (senderSocketId) {
                    io.to(senderSocketId).emit('messagesRead', {
                        by: data.readerId,
                        timestamp: new Date()
                    });
                }
            } catch (err) {
                console.error('Error marking messages as read:', err);
            }
        });
        socket.on('request-accepted', (data) => {
            try {
                const senderSocketId = userSocketMap.get(data.senderId);
                if (senderSocketId) {
                    io.to(senderSocketId).emit('requestAccepted', data);
                }
            } catch (err) {
                console.error('Error forwarding request-accepted event:', err);
            }
        });

        socket.on('disconnect', () => disconnect(socket.id));

    })
    
};

export default setUpSocket;