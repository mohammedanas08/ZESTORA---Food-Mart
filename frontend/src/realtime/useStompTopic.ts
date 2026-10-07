import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import { getAccessToken, refreshSession } from '../api/client';

/**
 * Subscribe to a STOMP topic over WebSocket (/ws) while the component is mounted.
 * The backend authenticates the CONNECT frame with the access token and authorises each subscription.
 * Pages also poll as a fallback, so a dropped socket never leaves the screen stale.
 */
export function useStompTopic(destination: string | null, onMessage: (body: unknown) => void) {
  const handler = useRef(onMessage);
  handler.current = onMessage;

  useEffect(() => {
    if (!destination) return;
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const client = new Client({
      brokerURL: `${proto}://${window.location.host}/ws`,
      reconnectDelay: 5000,
      // Re-read the (possibly refreshed) token on every (re)connect.
      beforeConnect: async () => {
        if (!getAccessToken()) await refreshSession();
        client.connectHeaders = { Authorization: `Bearer ${getAccessToken() ?? ''}` };
      },
      onConnect: () => {
        client.subscribe(destination, (msg) => {
          try {
            handler.current(JSON.parse(msg.body));
          } catch {
            handler.current(msg.body);
          }
        });
      },
    });
    client.activate();
    return () => {
      void client.deactivate();
    };
  }, [destination]);
}
