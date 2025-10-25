import mongoose from "mongoose";
import Channel from "../models/ChannelModel.js";
import User from "../models/UserModel.js";
import Request from "../models/RequestModel.js";


export const createChannel = async (request, response, next) => {
    try {
        const { name, members } = request.body;
        const userId = request.userId;

        const admin = await User.findById(userId);
        if (!admin) {
            return response.status(400).send("Admin user not found.");
        }

        const validMembers = await User.find({ _id: { $in: members } });
        if (validMembers.length !== members.length) {
            return response.status(400).send("Some members are not valid users.");
        }

        // Only add admin as initial member, send requests to others
        const newChannel = new Channel({
            name,
            members: [userId],
            admin: userId
        });
        await newChannel.save();

        // Send channel requests to each member (except admin/creator)
        for (const memberId of members) {
            if (memberId !== userId) {
                await Request.create({
                    type: "channel",
                    sender: userId,
                    receiver: memberId,
                    channel: newChannel._id
                });
            }
        }

        return response.status(201).json({ channel: newChannel });
    } catch (error) {
        console.log(error);
        return response.status(500).send("Internal Server Error");
    }
};

export const getUserChannels = async (request, response, next) => {
    try {
        const userId = new mongoose.Types.ObjectId(request.userId);
        // Only show channels where user is admin or member and there is no pending channel request for this user/channel
        const pendingChannelIds = (await Request.find({ receiver: userId, type: "channel", status: "pending" }).select("channel")).map(r => r.channel.toString());
        const channels = await Channel.find({
            $or: [{ admin: userId }, { members: userId }],
            _id: { $nin: pendingChannelIds }
        }).sort({ updatedAt: -1 });
        return response.status(201).json({ channels });
    } catch (error) {
        console.log(error);
        return response.status(500).send("Internal Server Error");
    }
};

export const getChannelMessages = async (request, response, next) => {
    try {
        const {channelId} = request.params
        const channel = await Channel.findById(channelId).populate({
            path:"messages",
            populate:{
                path:"sender",
                select: "firstName lastName email _id image color"
            }
        })

        if(!channel){
            return response.status(404).send("Channel not Found")
        }
        const messages = channel.messages
        return response.status(201).json({messages})
    } catch (error) {
        console.log(error);
        return response.status(500).send("Internal Server Error");
    }
};

export const getChannelById = async (request, response, next) => {
    try {
        const { id } = request.params;
        if (!id) return response.status(400).json({ message: 'id is required' });

        const channel = await Channel.findById(id)
            .populate({ path: 'admin', select: 'firstName lastName email _id image color' })
            .populate({ path: 'members', select: 'firstName lastName email _id image color' });

        if (!channel) return response.status(404).json({ message: 'Channel not found' });

        return response.status(200).json({ channel });
    } catch (error) {
        console.log(error);
        return response.status(500).send('Internal Server Error');
    }
};