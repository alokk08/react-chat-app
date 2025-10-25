import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { getColor } from '@/lib/utils';
import { useAppStore } from '@/store';
import { HOST } from '@/utils/constants';
import { RiCloseFill } from 'react-icons/ri'
import { useNavigate } from 'react-router-dom'

const ChatHeader = () => {

    const {closeChat, selectedChatData, selectedChatType } = useAppStore();
    const navigate = useNavigate();

    const handleClose = () => {
        closeChat();
        navigate('/chat');
    };

    // Early return if no chat data is available
    if (!selectedChatData) {
        return (
            <div className="h-[10vh] border-b-2 border-[#2f303b] flex items-center justify-between px-20">
                <div className="animate-pulse">Loading...</div>
            </div>
        );
    }

    return (
    <div className="h-[10vh] border-b-2 border-[#2f303b] flex items-center justify-between px-20">
        <div className="flex items-center gap-5 w-full justify-between">
            <div className="flex gap-3 items-center justify-center">

                <div className="w-12 h-12 relative cursor-pointer" onClick={() => {
                    try {
                        if (selectedChatType === 'contact') {
                            window.history.pushState({}, '', `/profile/${selectedChatData._id}`);
                        } else if (selectedChatType === 'channel') {
                            window.history.pushState({}, '', `/channel/${selectedChatData._id}`);
                        }
                        window.dispatchEvent(new PopStateEvent('popstate'));
                    } catch (e) {
                        console.error(e);
                    }
                }}>
                    {selectedChatType === "contact" ? (
                        <Avatar className="h-12 w-12 rounded-full overflow-hidden">
                            {selectedChatData?.image ? (
                                <AvatarImage
                                    src={`${HOST}/${selectedChatData.image}`}
                                    alt="profile"
                                    className="object-cover w-full h-full bg-black"
                                />
                            ) : (
                                <div
                                    className={`uppercase h-12 w-12 text-lg border-[1px] flex items-center justify-center rounded-full
                                    ${getColor(selectedChatData?.color || 0)}`}
                                >
                                    {selectedChatData?.firstName
                                        ? selectedChatData.firstName.charAt(0)
                                        : selectedChatData?.email?.charAt(0) || '?'}
                                </div>
                            )}
                        </Avatar>
                    ) : (
                        <div className="bg-[#ffffff22] h-10 w-10 flex items-center justify-center rounded-full">#</div>
                    )}
                </div>
                <div>
                    {selectedChatType === "channel" ? (
                        <span>{selectedChatData?.name || 'Unnamed Channel'}</span>
                    ) : (
                        <span>
                            {selectedChatData?.firstName
                                ? `${selectedChatData.firstName} ${selectedChatData.lastName || ''}`
                                : selectedChatData?.email || 'Unknown Contact'}
                        </span>
                    )}
                </div>
            </div>
            <div className="flex gap-5 items-center justify-center">
                <button
                    className='text-neutral-500 focus:border-none focus:outline-none
                    focus:text-white duration-300 transition-all'
                    onClick={handleClose}>
                    <RiCloseFill className='text-3xl'/>
                </button>
            </div>
        </div>
    </div>
    )
}

export default ChatHeader