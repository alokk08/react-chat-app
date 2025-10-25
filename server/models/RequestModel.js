import mongoose from "mongoose";

const requestSchema = new mongoose.Schema({
  type: { type: String, enum: ["contact", "channel"], required: true },
  sender: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
  receiver: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
  channel: { type: mongoose.Schema.ObjectId, ref: "Channels" }, // only for channel requests
  status: { type: String, enum: ["pending", "accepted", "declined"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

requestSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Request = mongoose.model("Request", requestSchema);
export default Request;
