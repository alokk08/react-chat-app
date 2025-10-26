import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { FaPlus } from "react-icons/fa";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import { CREATE_CHANNEL_ROUTE, GET_ALL_CONTACTS_ROUTE, SEARCH_CONTACTS_ROUTE } from "@/utils/constants";
import { useAppStore } from "@/store";
import { Button } from "@/components/ui/button";
import MultipleSelector from "@/components/ui/multipleselect";

const CreateChannel = () => {
  const [newChannelModal, setNewChannelModal] = useState(false);
  const { addChannel } = useAppStore();

  const [allContacts, setAllContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [channelName, setChannelName] = useState("");

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await apiClient.get(GET_ALL_CONTACTS_ROUTE, { withCredentials: true });
        if (response.status === 200 && Array.isArray(response.data.contacts)) {
          const mapped = response.data.contacts.map((user) => ({
            label: user.firstName
              ? `${user.firstName} ${user.lastName}`
              : user.username || user.email,
            value: user._id,
          }));
          setAllContacts(mapped);
          setFilteredContacts(mapped);
        }
      } catch (err) {
        console.log("Error fetching contacts:", err);
      }
    };
    fetchContacts();
  }, []);

  const searchContacts = async (value) => {
    const trimmed = value.trim();

    // 🧹 If empty, reset full list
    if (trimmed.length === 0) {
      setFilteredContacts(allContacts);
      return;
    }

    try {
      const response = await apiClient.post(
        SEARCH_CONTACTS_ROUTE,
        { searchTerm: trimmed },
        { withCredentials: true }
      );

      if (response.status === 200 && Array.isArray(response.data.contacts)) {
        const mapped = response.data.contacts.map((user) => ({
  label: user.firstName ? `${user.firstName} ${user.lastName}` : user.username || user.email,
  value: user._id || user.email || user.username, // ensure unique value
}));
setAllContacts(mapped);
setFilteredContacts(mapped);


        setFilteredContacts(mapped);
      } else {
        setFilteredContacts([]);
      }
    } catch (error) {
      console.log("searchContacts error:", error);
      setFilteredContacts([]);
    }
  };

  const createChannel = async () => {
    try {
      if (channelName.length > 0 && selectedContacts.length > 0) {
        const response = await apiClient.post(
          CREATE_CHANNEL_ROUTE,
          {
            name: channelName,
            members: selectedContacts.map((contact) => contact.value),
          },
          { withCredentials: true }
        );

        if (response.status === 201) {
          setChannelName("");
          setSelectedContacts([]);
          setNewChannelModal(false);
          addChannel(response.data.channel);
        }
      }
    } catch (error) {
      console.log("Create channel error:", error);
    }
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <FaPlus
              className="text-neutral-400 font-light text-opacity-90 text-start hover:text-neutral-100 cursor-pointer transition-all duration-300"
              onClick={() => setNewChannelModal(true)}
            />
          </TooltipTrigger>
          <TooltipContent className="bg-[#1c1b1e] border-none mb-2 p-3 text-white">
            Create New Channel
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={newChannelModal} onOpenChange={setNewChannelModal}>
        <DialogContent className="bg-[#1c1d25] border-none text-white w-[400px] h-[400px] flex flex-col items-center">
          <DialogHeader>
            <DialogTitle>Please fill up the details for new Channel.</DialogTitle>
            <DialogDescription />
          </DialogHeader>

          <div>
            <Input
              placeholder="Channel Name"
              className="rounded-lg p-6 bg-[#2c2e3b] border-[#2c2e3b] focus:border-white focus:outline-none focus:ring-0 w-[350px] mb-1"
              onChange={(e) => setChannelName(e.target.value)}
              value={channelName}
            />
          </div>

          <div>
            <MultipleSelector
  className="rounded-lg bg-[#2c2e3b] border-none py-2 text-white w-[350px]"
  defaultOptions={allContacts}
  options={filteredContacts}
  placeholder="Search Contacts"
  onSearch={searchContacts}
  value={selectedContacts}
  onChange={setSelectedContacts}
  emptyIndicator={
    <p className="text-center text-lg leading-10 text-gray-600">No results found</p>
    
  }
  
/>


          </div>

          <div>
            <Button
              className="w-full bg-purple-700 hover:bg-purple-900 transition-all duration-300"
              onClick={createChannel}
            >
              Create Channel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreateChannel;
