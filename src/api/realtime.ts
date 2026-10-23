import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { io, type Socket } from 'socket.io-client';

import { API_BASE_URL } from '@/api/config';
import { getTokens } from '@/api/tokens';

/**
 * One authenticated socket to `/realtime`. Events are hints — they say WHAT
 * changed, never the new state — so every listener just refetches over REST.
 * Rooms are re-joined after each (re)authentication, because a reconnect
 * starts a fresh socket with no memberships.
 */
let socket: Socket | null = null;
let authed = false;
const rooms = new Map<string, number>();

function connect() {
  const token = getTokens()?.accessToken;
  if (!token) return null;
  if (socket) return socket;

  socket = io(`${API_BASE_URL}/realtime`, {
    transports: ['websocket'],
    auth: (cb) => cb({ token: getTokens()?.accessToken }),
    reconnectionDelayMax: 10_000,
  });
  socket.on('authenticated', () => {
    authed = true;
    for (const room of rooms.keys()) socket?.emit('join_room', room);
  });
  socket.on('auth_error', () => {
    authed = false;
    // the access token likely expired; the next REST call refreshes it and we retry
    setTimeout(() => socket?.connect(), 3_000);
  });
  socket.on('disconnect', () => {
    authed = false;
  });
  return socket;
}

export function disconnectRealtime() {
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = null;
  authed = false;
  rooms.clear();
}

/**
 * Subscribe to `events` (in `room`, when given) and call `onEvent` on each.
 * `pollMs` also refetches on a timer as a fallback for missed events and for
 * environments where the socket cannot connect.
 */
export function useLiveRefresh({
  room,
  events,
  onEvent,
  pollMs,
  enabled = true,
}: {
  room?: string | null;
  events: string[];
  onEvent: () => void;
  pollMs?: number;
  enabled?: boolean;
}) {
  const handler = useRef(onEvent);
  useEffect(() => {
    handler.current = onEvent;
  });
  const key = events.join('|');

  useEffect(() => {
    if (!enabled) return;
    const s = connect();
    const fire = () => handler.current();
    const names = key.split('|');
    names.forEach((e) => s?.on(e, fire));

    if (room) {
      rooms.set(room, (rooms.get(room) ?? 0) + 1);
      if (authed) s?.emit('join_room', room);
    }

    const timer = pollMs ? setInterval(fire, pollMs) : null;
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') fire();
    });

    return () => {
      names.forEach((e) => s?.off(e, fire));
      if (room) {
        const left = (rooms.get(room) ?? 1) - 1;
        if (left <= 0) rooms.delete(room);
        else rooms.set(room, left);
      }
      if (timer) clearInterval(timer);
      appState.remove();
    };
  }, [room, key, pollMs, enabled]);
}
