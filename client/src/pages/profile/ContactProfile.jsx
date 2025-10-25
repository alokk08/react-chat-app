import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiClient } from '@/lib/api-client'
import { HOST } from '@/utils/constants'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { IoArrowBack } from 'react-icons/io5'
import { getColor } from '@/lib/utils'

const ContactProfile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await apiClient.get(`/api/contacts/${id}`, { withCredentials: true })
        if (res.status === 200 && res.data.user) {
          setUser(res.data.user)
        } else {
          setError('User not found')
        }
      } catch (err) {
        console.error(err)
        setError('Failed to fetch user')
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchUser()
  }, [id])

  return (
    <div className="bg-[#1b1c24] min-h-[100vh] text-white p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/80">
            <IoArrowBack /> Back
          </button>
        </div>

        {loading && <div>Loading...</div>}
        {error && <div className="text-red-400">{error}</div>}

        {user && (
          <div className="bg-[#111218] rounded-lg p-6 flex gap-6 items-center">
            <div>
              <Avatar className="h-28 w-28 rounded-full overflow-hidden">
                {user.image ? (
                  <AvatarImage src={`${HOST}/${user.image}`} alt="profile" className="object-cover w-full h-full" />
                ) : (
                  <div className={`uppercase h-28 w-28 text-4xl border-[1px] flex items-center justify-center rounded-full ${getColor(user.color || 0)}`}>
                    {user.firstName ? user.firstName.charAt(0) : user.email?.charAt(0) || '?'}
                  </div>
                )}
              </Avatar>
            </div>
            <div>
              <h2 className="text-2xl font-semibold">
                {user.firstName ? `${user.firstName} ${user.lastName || ''}` : user.email}
              </h2>
              <p className="text-sm text-neutral-400">{user.email}</p>
              {user.bio && <p className="mt-4 text-white/80">{user.bio}</p>}
              <div className="mt-4 text-sm text-neutral-400">Joined: {new Date(user.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ContactProfile
