import { useAppStore } from "@/store";
import { Avatar, AvatarImage } from "./ui/avatar";
import { getColor } from "@/lib/utils";
import { HOST } from "@/utils/constants";
import { useNavigate } from "react-router-dom";
import { Badge } from "./ui/badge";

const ContactList = ({ contacts, isChannel=false }) => {
    
    const {
        selectedChatData,
        setSelectedChatData,
        selectedChatType,
        setSelectedChatType,
        setSelectedChatMessages,
        resetUnreadCount,
    } = useAppStore();

    const navigate = useNavigate();

    const handleClick = (contact) => {
  const type = isChannel ? "channel" : "contact";
  setSelectedChatType(type);
  setSelectedChatData(contact);

  if (!isChannel) {
  resetUnreadCount(contact._id);
} else {
  useAppStore.getState().resetChannelUnreadCount(contact._id);
}


  if(selectedChatData && selectedChatData._id === contact._id){
      setSelectedChatMessages([]);
  }

  navigate(`/chat/${type}/${contact._id}`);
};


    return (
  <div className="mt-5">
    {(contacts && contacts.length > 0) ? (
      contacts.map((contact) => (
        <div 
          key={contact._id}
          className={`pl-10 py-2 transition-all duration-300 cursor-pointer ${
            selectedChatData && selectedChatData._id === contact._id
              ? "bg-[#8417ff] hover:bg-[#8417ff]"
              : "hover:bg-[#f1f1f111]"
          }`}
          onClick={() => handleClick(contact)}
        >
          <div className="flex items-center gap-5 justify-start text-neutral-300">
            {!isChannel && (
              <Avatar className="h-10 w-10 rounded-full overflow-hidden">
                {contact.image ? (
                  <AvatarImage
                    src={`${HOST}/${contact.image}`}
                    alt="profile"
                    className="object-cover w-full h-full bg-black"
                  />
                ) : (
                  <div
                    className={`
                        ${selectedChatData && selectedChatData._id === contact._id ? "bg-[ffffff22] border border-white/70" : getColor(contact.color)}
                        uppercase h-10 w-10 text-lg border-[1px] flex items-center justify-center rounded-full`}
                  >
                    {contact.firstName
                      ? contact.firstName.charAt(0)
                      : contact.email.charAt(0)}
                  </div>
                )}
              </Avatar>
            )}
            {isChannel && <div className="bg-[#ffffff22] h-10 w-10 flex items-center justify-center rounded-full">#</div>}
            {
                isChannel ? (
                  <div className="flex items-center justify-between w-full mr-4">
                  <span>{contact.name}</span>
                  {contact.unreadCount > 0 && (
  <span className="bg-[#8417ff] text-white text-xs px-2 py-[1px] rounded-full ml-auto">
    {contact.unreadCount}
  </span>
)}
</div>
                  
                ) : (
                  <div className="flex items-center justify-between w-full mr-4">
                    <span>{contact.firstName ? `${contact.firstName} ${contact.lastName}` : contact.email}</span>
                    {contact.unreadCount > 0 && (
  <span className="bg-[#8417ff] text-white text-xs px-2 py-[1px] rounded-full ml-auto">
    {contact.unreadCount}
  </span>
)}

                  </div>
                )
            }
          </div>
        </div>
      ))
    ) : (
      <p className="text-gray-400 text-center mt-10">No contacts available</p>
    )}
  </div>
);

}

export default ContactList;