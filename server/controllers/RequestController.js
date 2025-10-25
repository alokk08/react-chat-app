import Request from "../models/RequestModel.js";
import Channel from "../models/ChannelModel.js";
import User from "../models/UserModel.js";

// Fetch all requests for a user (sent/received, contact/channel)
export const getRequests = async (req, res) => {
  try {
    const userId = req.userId;
    const received = await Request.find({ receiver: userId, status: "pending" })
      .populate("sender", "firstName lastName email image color")
      .populate("channel", "name");
    const sent = await Request.find({ sender: userId, status: "pending" })
      .populate("receiver", "firstName lastName email image color")
      .populate("channel", "name");
    return res.status(200).json({ received, sent });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Accept a request
export const acceptRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await Request.findById(id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.status !== "pending") return res.status(400).json({ message: "Request already handled" });
    request.status = "accepted";
    await request.save();
    // For channel: add user to channel members if not already
    if (request.type === "channel" && request.channel) {
      await Channel.findByIdAndUpdate(request.channel, { $addToSet: { members: request.receiver } });
    }
    return res.status(200).json({ message: "Request accepted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Decline a request
export const declineRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await Request.findById(id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.status !== "pending") return res.status(400).json({ message: "Request already handled" });
    request.status = "declined";
    await request.save();
    return res.status(200).json({ message: "Request declined" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
