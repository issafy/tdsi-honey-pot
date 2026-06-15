import { useEffect, useRef } from 'react';
import { connectSocket, onNewAttack } from '../api/socket';
import useStore from '../store';

/**
 * Hook that connects to the WebSocket and subscribes to attack events.
 * Updates the Zustand store on each new attack.
 * Handles reconnection and cleanup.
 */
export default function useWebSocket() {
  const addAttack = useStore((s) => s.addAttack);
  const setConnected = useStore((s) => s.setConnected);
  const setError = useStore((s) => s.setError);
  const cleanupRef = useRef(null);

  useEffect(() => {
    const socket = connectSocket();

    socket.on('connect', () => {
      setConnected(true);
      setError(null);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('connect_error', () => {
      setConnected(false);
      setError('Failed to connect to server');
    });

    // Subscribe to new attacks
    cleanupRef.current = onNewAttack((attack) => {
      addAttack(attack);
    });

    return () => {
      if (cleanupRef.current) cleanupRef.current();
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
    };
  }, [addAttack, setConnected, setError]);
}
