import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { GET_REQUESTS_ROUTE } from '@/utils/constants';
import { useAppStore } from '@/store';

const RequestContext = createContext();

export function useRequest() {
    return useContext(RequestContext);
}

export function RequestProvider({ children }) {
    const [requests, setRequests] = useState({ sent: [], received: [] });
    const [loading, setLoading] = useState(true);
    const { selectedChatData, selectedChatType, messages, userInfo } = useAppStore();
    const totalRequests = useAppStore(state => state.totalRequests);
    const [currentRequestStatus, setCurrentRequestStatus] = useState(null);
    const [messageCount, setMessageCount] = useState(0);

    const fetchRequests = async () => {
        try {
            const res = await apiClient.get(GET_REQUESTS_ROUTE, { withCredentials: true });
            setRequests(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch requests:", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    // Re-fetch requests when the global totalRequests badge changes
    useEffect(() => {
        // totalRequests change may indicate new request accepted/created elsewhere
        fetchRequests();
    }, [totalRequests]);

    useEffect(() => {
        if (selectedChatType === "contact" && selectedChatData && userInfo) {
            const sentRequest = requests.sent.find(r => 
                r.type === "contact" && r.receiver._id === selectedChatData._id
            );
            const receivedRequest = requests.received.find(r => 
                r.type === "contact" && r.sender._id === selectedChatData._id
            );

            if (sentRequest) {
                setCurrentRequestStatus({ type: 'sent', ...sentRequest });
                // Count messages since request was created
                const sentCount = messages.filter(m => 
                    m.sender === userInfo.id && 
                    new Date(m.timestamp) >= new Date(sentRequest.createdAt)
                ).length;
                setMessageCount(sentCount);
            } else if (receivedRequest) {
                setCurrentRequestStatus({ type: 'received', ...receivedRequest });
            } else {
                setCurrentRequestStatus(null);
                setMessageCount(0);
            }
        }
    }, [selectedChatType, selectedChatData, messages, requests, userInfo]);

    const value = {
        requests,
        loading,
        refreshRequests: fetchRequests,
        currentRequestStatus,
        messageCount
    };

    return (
        <RequestContext.Provider value={value}>
            {children}
        </RequestContext.Provider>
    );
}