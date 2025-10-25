
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '@/lib/api-client';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { getColor } from '@/lib/utils';
import { ACCEPT_REQUESTS_ROUTE, DECLINE_REQUESTS_ROUTE, GET_REQUESTS_ROUTE, HOST } from '@/utils/constants';
import { useRequest } from '@/context/RequestContext';
import { useSocket } from '@/context/SocketContext';

const TABS = [
    { label: 'Contact', value: 'contact' },
    { label: 'Channel', value: 'channel' },
];

const RequestPage = () => {
    const [tab, setTab] = useState('contact');
    const [requests, setRequests] = useState({ received: [], sent: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Set tab from URL query param
        const params = new URLSearchParams(location.search);
        const type = params.get('type');
        if (type && (type === 'contact' || type === 'channel')) {
            setTab(type);
        } else {
            // If no type parameter or invalid type, default to contact and update URL
            navigate('/requests?type=contact');
            setTab('contact');
        }
    }, [location.search, navigate]);

    useEffect(() => {
        setLoading(true);
        apiClient.get(GET_REQUESTS_ROUTE, { withCredentials: true })
            .then(res => {
                setRequests({ received: res.data.received, sent: res.data.sent });
                setLoading(false);
            })
            .catch(err => {
                setError('Failed to fetch requests');
                setLoading(false);
            });
    }, []);

    const handleTab = (value) => {
        setTab(value);
        navigate(`/requests?type=${value}`);
    };

    const { refreshRequests } = useRequest();
    const socket = useSocket();

    const handleAccept = async (id) => {
        try {
            await apiClient.post(`${ACCEPT_REQUESTS_ROUTE}/${id}`, {}, { withCredentials: true });
            // Refresh both local and global request state
            const res = await apiClient.get(GET_REQUESTS_ROUTE, { withCredentials: true });
            setRequests({ received: res.data.received, sent: res.data.sent });
            if (refreshRequests) refreshRequests();
            // notify other user via socket (so their UI updates immediately)
            const req = [...res.data.received, ...res.data.sent].find(r => r._id === id);
            if (socket && req) {
                const senderId = req.sender?._id || req.sender;
                const receiverId = req.receiver?._id || req.receiver;
                socket.emit('request-accepted', { requestId: id, senderId, receiverId });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to accept request');
        }
    };
    const handleDecline = async (id) => {
        try {
            await apiClient.post(`${DECLINE_REQUESTS_ROUTE}/${id}`, {}, { withCredentials: true });
            // Refresh both local and global request state
            const res = await apiClient.get(GET_REQUESTS_ROUTE, { withCredentials: true });
            setRequests({ received: res.data.received, sent: res.data.sent });
            if (refreshRequests) refreshRequests();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to decline request');
        }
    };

    // Filter requests by type
    const contactReceived = requests.received.filter(r => r.type === 'contact');
    const contactSent = requests.sent.filter(r => r.type === 'contact');
    const channelReceived = requests.received.filter(r => r.type === 'channel');
    // const channelSent = requests.sent.filter(r => r.type === 'channel'); // not needed per requirements

    return (
        <div className="bg-[#1b1c24] min-h-[100vh] text-white p-6">
            <div className="max-w-3xl mx-auto">
                <div className="flex gap-6 mb-8 border-b border-[#333] pb-2">
                    {TABS.map(t => (
                        <button
                            key={t.value}
                            className={`text-lg px-4 py-2 rounded-t ${tab === t.value ? 'bg-[#222] text-purple-400' : 'bg-transparent text-white/70'}`}
                            onClick={() => handleTab(t.value)}
                        >
                            {t.label} Requests
                        </button>
                    ))}
                </div>

                {loading && <div>Loading...</div>}
                {error && <div className="text-red-400">{error}</div>}

                {tab === 'contact' && !loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-xl mb-2">Received</h3>
                            {contactReceived.length === 0 && <div className="text-gray-400">No contact requests received.</div>}
                            {contactReceived.map(r => (
                                <RequestCard key={r._id} request={r} onAccept={handleAccept} onDecline={handleDecline} received />
                            ))}
                        </div>
                        <div>
                            <h3 className="text-xl mb-2">Sent</h3>
                            {contactSent.length === 0 && <div className="text-gray-400">No contact requests sent.</div>}
                            {contactSent.map(r => (
                                <RequestCard key={r._id} request={r} />
                            ))}
                        </div>
                    </div>
                )}

                {tab === 'channel' && !loading && (
                    <div>
                        <h3 className="text-xl mb-2">Channel Invites</h3>
                        {channelReceived.length === 0 && <div className="text-gray-400">No channel requests received.</div>}
                        {channelReceived.map(r => (
                            <RequestCard key={r._id} request={r} onAccept={handleAccept} onDecline={handleDecline} received channel />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

function RequestCard({ request, onAccept, onDecline, received, channel }) {
    const navigate = useNavigate();
    const user = received
        ? (channel ? request.sender : request.sender)
        : (channel ? null : request.receiver);
    return (
        <div className="flex items-center gap-4 bg-[#181a22] p-4 rounded mb-3">
            {user && (
                <div onClick={() => navigate(`/profile/${user._id}`)} className="cursor-pointer">
                    <Avatar className="h-10 w-10 rounded-full overflow-hidden">
                        {user.image ? (
                            <AvatarImage src={`${HOST}/${user.image}`} alt="profile" className="object-cover w-full h-full" />
                        ) : (
                            <div className={`uppercase h-10 w-10 text-lg border-[1px] flex items-center justify-center rounded-full ${getColor(user.color || 0)}`}>
                                {user.firstName ? user.firstName.charAt(0) : user.email?.charAt(0) || '?'}
                            </div>
                        )}
                    </Avatar>
                </div>
            )}
            <div className="flex-1">
                <div className="font-medium">
                    {user ? (user.firstName ? `${user.firstName} ${user.lastName || ''}` : user.email) : ''}
                </div>
                <div className="text-sm text-neutral-400">
                    {channel && request.channel ? `Channel: ${request.channel.name}` : ''}
                </div>
            </div>
            {received && (
                <>
                    <button className="bg-green-600 px-3 py-1 rounded text-white mr-2" onClick={() => onAccept(request._id)}>Accept</button>
                    <button className="bg-red-600 px-3 py-1 rounded text-white" onClick={() => onDecline(request._id)}>Decline</button>
                </>
            )}
            {!received && <span className="text-xs text-neutral-400">Pending</span>}
        </div>
    );
}

export default RequestPage