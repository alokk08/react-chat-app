import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import cookieParser from "cookie-parser"
import mongoose, { set } from "mongoose"
import authRouters from "./routes/AuthRoutes.js"
import contactsRouter from "./routes/ContactRoutes.js"
import setUpSocket from "./socket.js"
import messagesRoutes from "./routes/MessagesRoutes.js"
import channelRoutes from "./routes/ChannelRoutes.js"

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;
const databaseURL = process.env.DATABASE_URL;

app.use(cors({
    origin: [process.env.ORIGIN],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

app.use("/uploads/profiles", express.static("uploads/profiles"));
app.use("/uploads/files", express.static("uploads/files"));

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouters);
app.use("/api/contacts", contactsRouter);
app.use("/api/messages", messagesRoutes);
app.use("/api/channel", channelRoutes)

const server = app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

setUpSocket(server);
  
const connectDB = async () => {
  try {
    await mongoose.connect(databaseURL);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1); // Exit process with failure
  }
};

  connectDB();
  