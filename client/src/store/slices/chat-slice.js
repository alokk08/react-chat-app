
export const createChatSlice = (set, get) => ({
  selectedChatType: undefined,
  selectedChatMessages: [],
  selectedChatData: undefined,
  directMessagesContacts: [],
  isUploading: false,
  isDownloading: false,
  fileUploadProgress:0,
  fileDownloadProgress:0,
  channels: [],
  totalRequests:2,
  setTotalRequests:(totalRequests)=>set({totalRequests}),
  setChannels: (channels)=>set({channels}),
  setIsUploading: (isUploading)=>set({isUploading}),
  setIsDownloading: (isDownloading)=>set({isDownloading}),
  setFileUploadProgress: (fileUploadProgress)=>set({fileUploadProgress}),
  setFileDownloadProgress: (fileDownloadProgress)=>set({fileDownloadProgress}),
  setSelectedChatType: (selectedChatType) => set({ selectedChatType }), // This is a setter
  setSelectedChatData: (selectedChatData) => set({ selectedChatData }),
  setSelectedChatMessages: (selectedChatMessages) => set({ selectedChatMessages }),
  setDirectMessagesContacts: (directMessagesContacts) => set({ directMessagesContacts }),
  updateUnreadCount: (senderId, count) => {
    const contacts = get().directMessagesContacts;
    const updatedContacts = contacts.map(contact => {
      if (contact._id === senderId) {
        return { ...contact, unreadCount: count };
      }
      return contact;
    });
    set({ directMessagesContacts: updatedContacts });
  },
  resetUnreadCount: (contactId) => {
    const contacts = get().directMessagesContacts;
    const updatedContacts = contacts.map(contact => {
      if (contact._id === contactId) {
        return { ...contact, unreadCount: 0 };
      }
      return contact;
    });
    set({ directMessagesContacts: updatedContacts });
  },
  addChannel:(channel)=>{
    const channels = get().channels
    set({channels: [channel,...channels]})
  },
  closeChat: () => 
    set({
        selectedChatType: undefined,
        selectedChatData: undefined,
        selectedChatMessages: [],
    }),
  addMessage: (message) =>{
    const selectedChatMessages = get().selectedChatMessages || [];
    const selectedChatType = get().selectedChatType;

    set({
        selectedChatMessages: [
          ...selectedChatMessages,{
            ...message,
            recipient: 
            selectedChatType === 'channel' 
            ? message.recipient 
            : message.recipient._id,
            sender: 
            selectedChatType === 'channel' 
            ? message.sender 
            : message.sender._id,
          }]
    })
  },
  addChannelInChannelList: (message)=>{
    const channels = get().channels
    const data = channels.find((channel)=>channel._id===message.channelId);
    const index = channels.findIndex((channel)=>channel._id===message.channelId)
    if(index !== -1 && index !== undefined){
      channels.splice(index, 1)
      channels.unshift(data)
    }
  },
  addContactsInDMContacts:(message) => {
    const userId = get().userInfo.id
    const fromId = message.sender._id === userId ? message.recipient._id : message.sender._id;
    const fromData = message.sender._id === userId ? message.recipient : message.sender
    const dmContacts = get().directMessagesContacts;
    const data = dmContacts.find((contact)=>contact._id===fromId)
    const index = dmContacts.findIndex((contact)=>contact._id===fromId)
    console.log({data, index, dmContacts, userId, message, fromData})
    if(index !== -1 && index!==undefined){
      // Existing contact - move to top
      dmContacts.splice(index, 1)
      dmContacts.unshift(data)
      set({directMessagesContacts: dmContacts})
    } else {
      // Do not add new contacts on incoming socket message. Contacts should only be added
      // via accepted requests / initial fetch from server (get-contacts-for-dm).
      // If needed, we could fetch contact details here, but skip to avoid exposing pending users.
      console.log('Incoming message from non-DM-contact; ignoring for DM list until accepted.');
    }
    }
})