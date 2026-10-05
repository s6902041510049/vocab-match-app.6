'use client';

export function broadcastRoomEvent(roomCode: string, event: string, payload?: any) {
  if (typeof window === 'undefined') return;
  try {
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel(`vocab_room_${roomCode}`);
      channel.postMessage({ event, payload, timestamp: Date.now() });
      channel.close();
    }
  } catch (e) {
    console.warn('BroadcastChannel not available:', e);
  }
}

export function listenToRoomEvents(
  roomCode: string,
  onEvent: (event: string, payload?: any) => void
): () => void {
  if (typeof window === 'undefined' || !('BroadcastChannel' in window)) {
    return () => {};
  }

  try {
    const channel = new BroadcastChannel(`vocab_room_${roomCode}`);
    channel.onmessage = (e) => {
      if (e.data && e.data.event) {
        onEvent(e.data.event, e.data.payload);
      }
    };
    return () => {
      channel.close();
    };
  } catch (e) {
    return () => {};
  }
}
