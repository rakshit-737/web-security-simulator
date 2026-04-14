import { useState, useEffect, useCallback } from 'react';
import socket from '../services/socket';

export function useSocket(eventName, maxItems = 50) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    function handler(data) {
      setEvents((prev) => {
        const updated = [data, ...prev];
        return updated.slice(0, maxItems);
      });
    }

    socket.on(eventName, handler);
    return () => {
      socket.off(eventName, handler);
    };
  }, [eventName, maxItems]);

  const clearEvents = useCallback(() => setEvents([]), []);

  return [events, clearEvents];
}
