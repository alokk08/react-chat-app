import { useSocket } from "@/context/SocketContext"
import { apiClient } from "@/lib/api-client"
import { useRequest } from "@/context/RequestContext"
import { useAppStore } from "@/store"
import { UPLOAD_FILE_ROUTE } from "@/utils/constants"
import EmojiPicker from "emoji-picker-react"
import { useEffect, useRef, useState } from "react"
import { GrAttachment } from "react-icons/gr"
import { IoSend } from "react-icons/io5"
import { RiEmojiStickerLine } from "react-icons/ri"

const MessageBar = () => {
    const emojiRef = useRef();
    const fileInputRef = useRef();
    const socket = useSocket();
    const { selectedChatType, selectedChatData, userInfo, setIsUploading, setFileUploadProgress } = useAppStore();
    const { currentRequestStatus, messageCount } = useRequest();
    const [message, setMessage] = useState("");
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        function handleClickOutside(event) {
            if (emojiRef.current && !emojiRef.current.contains(event.target)) {
                setEmojiPickerOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleAddEmoji = (emoji) => setMessage((msg) => msg + emoji.emoji);

    const handleSendMessage = async () => {
        if (!message.trim()) return;

        if (selectedChatType === "contact") {
            // Block sending if request rules apply
            if (currentRequestStatus?.type === 'sent' && messageCount >= 5) {
                setError("You've reached the limit of 5 messages. Please wait for the user to accept your request.");
                return;
            }
            if (currentRequestStatus?.type === 'received' && currentRequestStatus.status !== 'accepted') {
                setError("Please accept the contact request to send messages.");
                return;
            }
        }

        if (selectedChatType === "contact") {
            socket.emit("sendMessage", {
                sender: userInfo.id,
                recipient: selectedChatData._id,
                messageType: "text",
                content: message,
                fileUrl: undefined,
            });
        } else if (selectedChatType === "channel") {
            socket.emit("send-channel-message", {
                sender: userInfo.id,
                messageType: "text",
                content: message,
                fileUrl: undefined,
                channelId: selectedChatData._id,
            });
        }

        setMessage("");
        setError("");
    };

    const handleAttachmentClick = () => fileInputRef.current?.click();

    const handleAttachmentChange = async (event) => {
        try {
            const file = event.target.files[0];
            if (file) {
                const formData = new FormData();
                formData.append("file", file);
                setIsUploading(true);
                const response = await apiClient.post(UPLOAD_FILE_ROUTE, formData, {
                    withCredentials: true,
                    onUploadProgress: (data) => setFileUploadProgress(Math.round((100 * data.loaded) / data.total)),
                });
                if (response.status === 200 && response.data) {
                    setIsUploading(false);
                    if (selectedChatType === "contact") {
                        socket.emit("sendMessage", {
                            sender: userInfo.id,
                            recipient: selectedChatData._id,
                            messageType: "file",
                            content: undefined,
                            fileUrl: response.data.filePath,
                        });
                    } else if (selectedChatType === "channel") {
                        socket.emit("send-channel-message", {
                            sender: userInfo.id,
                            messageType: "file",
                            content: undefined,
                            fileUrl: response.data.filePath,
                            channelId: selectedChatData._id,
                        });
                    }
                }
            }
        } catch (err) {
            setIsUploading(false);
            console.error(err);
        }
    };

    const warningMessage = (() => {
        if (selectedChatType !== "contact" || !currentRequestStatus) return null;
        if (currentRequestStatus.type === 'sent' && messageCount >= 5) return "You've reached the limit of 5 messages. Please wait for the user to accept your request.";
        if (currentRequestStatus.type === 'received' && currentRequestStatus.status !== 'accepted') return "Please accept the contact request to send messages.";
        return null;
    })();

    if (warningMessage) {
        return (
            <div className="h-[10vh] bg-[#1c1d25] flex justify-center items-center px-8 mb-6">
                <div className="w-full p-4 bg-yellow-500/10 text-yellow-500 rounded-md text-center">{warningMessage}</div>
            </div>
        );
    }

    return (
        <div className="h-[10vh] bg-[#1c1d25] flex justify-center items-center px-8 mb-6 gap-6">
            <div className="flex-1 flex bg-[#2a2b33] rounded-md items-center gap-5 pr-5">
                <input
                    type="text"
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-1 p-5 bg-transparent rounded-md focus:border-none focus:outline-none"
                />

                <button
                    className="text-neutral-500 focus:border-none focus:outline-none focus:text-white duration-300 transition-all"
                    onClick={handleAttachmentClick}
                >
                    <GrAttachment className="text-2xl" />
                </button>
                <input type="file" className="hidden" ref={fileInputRef} onChange={handleAttachmentChange} />
                <div className="relative">
                    <button
                        className="text-neutral-500 focus:border-none focus:outline-none focus:text-white duration-300 transition-all"
                        onClick={() => setEmojiPickerOpen(true)}
                    >
                        <RiEmojiStickerLine className="text-2xl" />
                    </button>
                    <div className="absolute bottom-16 right-0" ref={emojiRef}>
                        <EmojiPicker theme="dark" open={emojiPickerOpen} onEmojiClick={handleAddEmoji} autoFocusSearch={false} />
                    </div>
                </div>
            </div>
            <button
                className="bg-[#8417ff] rounded-md flex items-center justify-center p-5 focus:border-none focus:outline-none focus:text-white duration-300 transition-all hover:bg-[#5c08bc] focus:bg-[#5c08bc]"
                onClick={handleSendMessage}
            >
                <IoSend className="text-2xl" />
            </button>
        </div>
    );
};

export default MessageBar;