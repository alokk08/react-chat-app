import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiClient } from '@/lib/api-client'
import { HOST } from '@/utils/constants'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { getColor } from '@/lib/utils'
import { IoArrowBack, IoCheckmarkCircle } from 'react-icons/io5'
import { TiArrowForwardOutline } from "react-icons/ti";
import moment from 'moment'

const ChannelProfile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [channel, setChannel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchChannel = async () => {
      try {
        const res = await apiClient.get(`/api/channel/${id}`, { withCredentials: true })
        if (res.status === 200 && res.data.channel) {
          setChannel(res.data.channel)
        } else {
          setError('Channel not found')
        }
      } catch (err) {
        console.error(err)
        setError('Failed to fetch channel')
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchChannel()
  }, [id])

  const goToProfile = (userId) => {
    navigate(`/profile/${userId}`)
  }

  return (
    <div className="bg-[#1b1c24] min-h-[100vh] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/80">
            <IoArrowBack /> Back
          </button>
        </div>

        {loading && <div>Loading...</div>}
        {error && <div className="text-red-400">{error}</div>}

        {channel && (
          <div className="bg-[#111218] rounded-lg p-6">
            <div className='flex gap-3 items-center'>
                <div className="bg-[#ffffff22] h-10 w-10 flex items-center justify-center rounded-full">#</div>
                <div>
                <h2 className="text-2xl font-semibold">{channel.name}</h2>
                <h4 className="text-sm">Created At : {moment(channel.createdAt).format("LL")}</h4>
            </div>
            </div>
            
            <div className="mt-4">
              <div className="text-sm text-neutral-400">Admin</div>
              <div className="flex items-center gap-4 mt-3 cursor-pointer bg-[#0f1113] p-3 rounded" onClick={() => goToProfile(channel.admin._id)}>
                <div>
                  <Avatar className="h-12 w-12 rounded-full overflow-hidden">
                    {channel.admin.image ? (
                      <AvatarImage src={`${HOST}/${channel.admin.image}`} alt="admin" className="object-cover w-full h-full" />
                    ) : (
                      <div className={`uppercase h-12 w-12 text-lg border-[1px] flex items-center justify-center rounded-full ${getColor(channel.admin.color || 0)}`}>
                        {channel.admin.firstName ? channel.admin.firstName.charAt(0) : channel.admin.email?.charAt(0) || '?'}
                      </div>
                    )}
                  </Avatar>
                </div>
                <div>
                  <div className="font-medium">{channel.admin.firstName ? `${channel.admin.firstName} ${channel.admin.lastName || ''}` : channel.admin.email}</div>
                  <div className="text-sm text-neutral-400">{channel.admin.email}</div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="text-sm text-neutral-400">Members ({channel.members.length})</div>
              <div className="flex flex-col gap-4 mt-3" >
                {channel.members.map((m) => (
                  <div key={m._id} className="flex items-center gap-3 bg-[#0f1113] p-3 rounded cursor-pointer" onClick={() => goToProfile(m._id)}>
                    <div>
                      <Avatar className="h-10 w-10 rounded-full overflow-hidden">
                        {m.image ? (
                          <AvatarImage src={`${HOST}/${m.image}`} alt="member" className="object-cover w-full h-full" />
                        ) : (
                          <div className={`uppercase h-10 w-10 text-lg border-[1px] flex items-center justify-center rounded-full ${getColor(m.color || 0)}`}>
                            {m.firstName ? m.firstName.charAt(0) : m.email?.charAt(0) || '?'}
                          </div>
                        )}
                      </Avatar>
                    </div>
                    <div>
                      <div className="font-medium">{m.firstName ? `${m.firstName} ${m.lastName || ''}` : m.email}</div>
                      <div className="text-sm text-neutral-400">{m.email}</div>
                    </div>
                    <div className="ml-auto">
                        <IoCheckmarkCircle className="text-green-400 text-2xl font-medium "/>
                        <TiArrowForwardOutline className='text-2xl'/>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
export default ChannelProfile
