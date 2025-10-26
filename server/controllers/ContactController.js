import mongoose, { Mongoose } from "mongoose";
import User from "../models/UserModel.js";
import Message from "../models/MessagesModel.js";

export const searchContacts = async (req, res, next) => {
  try {
    const { searchTerm } = req.body;
    const term = typeof searchTerm === "string" ? searchTerm.trim() : ""; // ✅ fix here

    if (term.length === 0) {
      return res.status(200).json({ contacts: [] });
    }

    // your search logic (example)
    const contacts = await User.find({
      $or: [
        { firstName: { $regex: term, $options: "i" } },
        { lastName: { $regex: term, $options: "i" } },
        { email: { $regex: term, $options: "i" } },
        { username: { $regex: term, $options: "i" } },
      ],
    });

    res.status(200).json({ contacts });
  } catch (error) {
    next(error);
  }
};



export const getContactsForDMList = async (request, response, next) => {
    try {
        let {userId} = request;
        userId = new mongoose.Types.ObjectId(userId);

        // First get all accepted requests
        const acceptedRequests = await mongoose.model('Request').find({
            $or: [
                { sender: userId, status: 'accepted' },
                { receiver: userId, status: 'accepted' }
            ],
            type: 'contact'
        });

        // Get all the user IDs from accepted requests
        const acceptedUserIds = acceptedRequests.map(req => 
            req.sender.equals(userId) ? req.receiver : req.sender
        );

        const contacts = await Message.aggregate([
            {
                $match:{
                    $and: [
                        {
                            $or: [
                                {sender: userId},
                                {recipient: userId}
                            ]
                        },
                        {
                            $or: [
                                {sender: { $in: acceptedUserIds }},
                                {recipient: { $in: acceptedUserIds }}
                            ]
                        }
                    ]
                }
            },
            {
                $sort: { timestamp: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: {
                            if: { $eq: ["$sender", userId] },
                            then: "$recipient",
                            else: "$sender"
                        }
                    },
                    lastMessageTime: { $first: "$timestamp" }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "contactInfo"
                }
            },
            {
                $unwind: "$contactInfo"
            },
            {
                $project: {
                    _id: 1,
                    lastMessageTime: 1,
                    username:"$contactInfo.username",
                    email: "$contactInfo.email",
                    firstName: "$contactInfo.firstName",
                    lastName: "$contactInfo.lastName",
                    image: "$contactInfo.image",
                    color: "$contactInfo.color"
                }
            },
            {
                $sort: { lastMessageTime: -1 }
            }
        ]);
        return response.status(200).json({ contacts });
    } catch (error) {
        console.log(error);
        return response.status(500).send("Internal Server Error");
    }
};

export const getAllContacts = async (request, response, next) => {
    try {
        const users = await User.find(
            {_id: {$ne: request.userId}},
            "username firstName lastName _id email"
        );
        const contacts = users.map((user)=>({
            label: user.firstName ? `${user.firstName} ${user.lastName}` : user.email,
            value: user._id,
        }))
        return response.status(200).json({ contacts });
    } catch (error) {
        console.log(error);
        return response.status(500).send("Internal Server Error");
    }
};

export const getContactById = async (request, response, next) => {
    try {
        const { id } = request.params;
        if(!id) return response.status(400).json({ message: "id is required" });

        const user = await User.findById(id).select("username firstName lastName email image color bio createdAt _id");
        if(!user) return response.status(404).json({ message: "User not found" });

        return response.status(200).json({ user });
    } catch (error) {
        console.log(error);
        return response.status(500).send("Internal Server Error");
    }
};