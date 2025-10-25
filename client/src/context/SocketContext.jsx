import { useAppStore } from "@/store";
import { HOST } from "@/utils/constants";
import { io } from "socket.io-client";
import { createContext, useContext, useEffect, useRef } from "react"


const SocketContext = createContext(null);


export const useSocket = () => {
    return useContext(SocketContext);
}

export const SocketProvider = ({ children }) => {
    const socket = useRef();
    const {userInfo} = useAppStore();

    useEffect(() => {

        if (userInfo) {
            socket.current = io(HOST,{
                withCredentials: true,
                query: {
                    userId: userInfo.id
                }
            })
            socket.current.on("connect", () => {
                console.log("Socket connected");
            } );

            const handleReceiveMessage = async (message) => {
    const { selectedChatData, selectedChatType, addMessage, addContactsInDMContacts, userInfo } = useAppStore.getState();
    
    // Check if this is a message we sent or received
    const isSender = message.sender._id === userInfo.id;
    
    // If we're the sender, update our view immediately
    if (isSender) {
        if (selectedChatType === "contact" && selectedChatData._id === message.recipient._id) {
            addMessage(message);
        }
    } else {
        // We're the recipient
        if (selectedChatType === "contact" && selectedChatData._id === message.sender._id) {
            addMessage(message);
            // Mark as read immediately if we're viewing the chat
            socket.current.emit('markMessagesAsRead', {
                senderId: message.sender._id,
                readerId: userInfo.id
            });
        }
    }
    addContactsInDMContacts(message);
  };

  const handleReceiveChannelMessage = (message) => {
    const { selectedChatData, selectedChatType, addMessage, addChannelInChannelList } = useAppStore.getState();
    if(selectedChatType !== undefined && selectedChatData._id === message.channelId){
        addMessage(message)
    }
    addChannelInChannelList(message)
  }


  socket.current.on("recieveMessage", handleReceiveMessage);
  socket.current.on("recieve-channel-message", handleReceiveChannelMessage);

    // Handle new contact request notifications from server
    const handleNewRequest = (request) => {
        const state = useAppStore.getState();
        const current = typeof state.totalRequests === 'number' ? state.totalRequests : 0;
        state.setTotalRequests(current + 1);
    }
    socket.current.on('newRequest', handleNewRequest);

    const handleRequestAccepted = (data) => {
        // Decrement badge or refresh count when a request is accepted
        const state = useAppStore.getState();
        const current = typeof state.totalRequests === 'number' ? state.totalRequests : 0;
        state.setTotalRequests(Math.max(0, current - 1));
    }
    socket.current.on('requestAccepted', handleRequestAccepted);

    // Handle message blocked notification (e.g., reached 5-message limit)
    const handleMessageBlocked = (data) => {
        console.warn('Message blocked:', data.message);
        // Optionally show UI toast here
    }
    socket.current.on('messageBlocked', handleMessageBlocked);

    // Handle unread count updates
    const handleUnreadCount = (data) => {
        const state = useAppStore.getState();
        state.updateUnreadCount(data.senderId, data.count);
    }
    socket.current.on('unreadCount', handleUnreadCount);

            return () => {
                socket.current.disconnect();
                console.log("Socket disconnected");
            }
        }

    }, [userInfo]);

    return (
        <SocketContext.Provider value={socket.current}>
            {children}
        </SocketContext.Provider>
    )
}