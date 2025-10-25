import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { GET_REQUESTS_ROUTE } from '@/utils/constants';

export function useRequestCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let mounted = true;
    apiClient.get(GET_REQUESTS_ROUTE, { withCredentials: true })
      .then(res => {
        const contactReceived = res.data.received.filter(r => r.type === 'contact').length;
        const channelReceived = res.data.received.filter(r => r.type === 'channel').length;
        if (mounted) setCount(contactReceived + channelReceived);
      })
      .catch(() => setCount(0));
    return () => { mounted = false; };
  }, []);
  return count;
}

export default function RequestBadge({ className = '' }) {
  const count = useRequestCount();
  if (!count) return null;
  return (
    <span className={`inline-block bg-red-600 text-white text-xs rounded-full px-2 py-0.5 ml-1 ${className}`}>{count}</span>
  );
}
