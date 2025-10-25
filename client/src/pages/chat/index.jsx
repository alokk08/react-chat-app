import React from 'react'
import { useAppStore } from '@/store';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { toast } from 'sonner';
import ContactsContainer from './components/contacts-container';
import EmptyChatContainer from './components/empty-chat-container';
import ChatContainer from './components/chat-container';

const Chat = () => {

  const {
    userInfo, 
    selectedChatType,
    setSelectedChatData,
    setSelectedChatType,
    isUploading,
    isDownloading,
    fileUploadProgress,
    fileDownloadProgress,
    directMessagesContacts,
    channels
  } = useAppStore();
  const navigate = useNavigate();
  const { type, id } = useParams();

  useEffect(() => {
    if (!userInfo.profileSetup) {
      toast("Please complete your profile setup");
      navigate('/profile');
    }
  }, [userInfo, navigate]);

  useEffect(() => {
    if (type && id) {
      setSelectedChatType(type);
      // We need to fetch the chat data based on the ID
      const fetchChatData = async () => {
        try {
          let data;
          if (type === 'contact') {
            // Get contact from directMessagesContacts
            data = directMessagesContacts.find(contact => contact._id === id);
          } else if (type === 'channel') {
            // Get channel from channels
            data = channels.find(channel => channel._id === id);
          }
          if (data) {
            setSelectedChatData(data);
          }
        } catch (error) {
          console.error('Error fetching chat data:', error);
        }
      };
      fetchChatData();
    }
  }, [type, id, setSelectedChatType, setSelectedChatData, directMessagesContacts, channels]);

  return(
  <div className='flex h-[100vh] text-white overflow-hidden'>
    {
      isUploading && <div className='h-[100vh] w-[100vw] fixed top-0 z-10 left-0 bg-black/80 flex items-center justify-center flex-colgap-5 backdrop-blur-lg'>
        <h5 className='text-5xl animate-pulse'>Uploading File:
        {fileUploadProgress}%
        </h5>
        </div>
    }
    {
      isDownloading && <div className='h-[100vh] w-[100vw] fixed top-0 z-10 left-0 bg-black/80 flex items-center justify-center flex-colgap-5 backdrop-blur-lg'>
        <h5 className='text-5xl animate-pulse'>Downloading File:
         {fileDownloadProgress}%
        </h5> 
        </div>
    }
    <ContactsContainer/>
    {
      selectedChatType === undefined ? (
      <EmptyChatContainer/>
    ) : (
    <ChatContainer/>
    
    )}
  </div>
  )
}

export default Chat