import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getColor } from "@/lib/utils";
import { useAppStore } from "@/store";
import { HOST, LOGOUT_ROUTE } from "@/utils/constants";
import { Avatar, AvatarImage } from "@radix-ui/react-avatar"
import { FiEdit2 } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { IoPowerSharp,IoNotificationsOutline  } from "react-icons/io5";
import { apiClient } from "@/lib/api-client";
import RequestBadge from "@/components/RequestBadge";

const ProfileInfo = () => {
    const {userInfo, setUserInfo, totalRequests, setTotalRequests} = useAppStore();
    const navigate = useNavigate();

    const logOut = async() => {
        try {
            const response = await apiClient.post(LOGOUT_ROUTE, {}, {withCredentials: true});
            if(response.status === 200){
                navigate("/auth")
                setUserInfo(null);
            }
        } catch (error) {
            console.log(error);
        }
    }
    const requests = () => {
    navigate(`/requests`)
  }

    return <div className="absolute bottom-0 h-16 flex items-center justify-between px-3 w-full bg-[#2a2b33]">
        <div className="flex items-center justify-center">
            <div className="w-12 h-12 relative flex items-center justify-center">
    <Avatar className="h-12 w-12 rounded-full overflow-hidden">
        {userInfo.image ? (
            <AvatarImage
                src={`${HOST}/${userInfo.image}`}
                alt="profile"
                className="object-cover w-full h-full bg-black rounded-full"
            />
        ) : (
            <div
                className={`uppercase h-full w-full text-lg flex items-center justify-center rounded-full ${getColor(userInfo.color)}`}
            >
                {userInfo.firstName
                    ? userInfo.firstName.charAt(0)
                    : userInfo.email.charAt(0)}
            </div>
        )}
    </Avatar>
</div>

            <div className="pl-2 flex-col">
                <div>
                    {
                        userInfo.firstName && userInfo.lastName ? `${userInfo.firstName} ${userInfo.lastName}` : ""
                    }
                </div>
                <div className="text-xs">
                    @
                    {
                        userInfo.username ? `${userInfo.username}` : ""
                    }
                </div>
            </div>
        </div>
        <div className="flex gap-5 ">
            <TooltipProvider>
                <Tooltip>
                <TooltipTrigger>
                    <FiEdit2 className="text-purple-500 text-xl font-medium"
                    onClick={()=>navigate('/profile')}/>
                </TooltipTrigger>
                <TooltipContent className="bg-[#1c1b1e] text-white border-none">
                    Edit Profile
                </TooltipContent>
            </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
                <Tooltip>
                <TooltipTrigger>
                    <IoPowerSharp className="text-red-500 text-xl font-medium"
                    onClick={logOut}/>
                </TooltipTrigger>
                <TooltipContent className="bg-[#1c1b1e] text-white border-none">
                    Logout
                </TooltipContent>
            </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
  <Tooltip>
    <TooltipTrigger>
      <div className="relative cursor-pointer" onClick={requests}>
        <IoNotificationsOutline className="text-yellow-400 text-xl font-medium" />
        {/*
        totalRequests > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold h-5 w-5 flex items-center justify-center rounded-full">
            {totalRequests}
          </span>
        )*/}
        <RequestBadge/>
      </div>
    </TooltipTrigger>

    <TooltipContent className="bg-[#1c1b1e] text-white border-none">
      Requests
    </TooltipContent>
  </Tooltip>
</TooltipProvider>

        </div>
    </div>
}

export default ProfileInfo