import { useEffect, useCallback } from 'react';
import { ClientMessage, MessageType, WebSocketMessage } from '@shared/types';
import { useWebSocketStore } from '@/lib/websocket';
import { nanoid } from 'nanoid';

interface UseWebSocketOptions {
  onOpen?: () => void;
  onMessage?: (data: any) => void;
  onClose?: () => void;
  onError?: (error: string) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { onOpen, onMessage, onClose, onError } = options;
  
  const {
    connect,
    disconnect,
    send,
    isConnected,
    isAuthenticated,
    addMessageHandler,
  } = useWebSocketStore();

  // Generate a temporary user ID for this session
  const userId = useCallback(() => {
    // Use existing ID from localStorage or create a new one
    const storedId = localStorage.getItem('temp_user_id');
    if (storedId) return storedId;
    
    const newId = nanoid();
    localStorage.setItem('temp_user_id', newId);
    return newId;
  }, []);

  // Connect on mount
  useEffect(() => {
    // Connect with a temporary user ID
    const id = userId();
    connect(id, 'Guest-' + id.substring(0, 6));
    
    // Handlers for connection events
    const handleAuthenticated = () => {
      if (onOpen) onOpen();
    };
    
    // Add handlers
    const cleanupAuthenticated = addMessageHandler('authenticated' as MessageType, handleAuthenticated);
    
    // Add generic message handler if provided
    let cleanupMessage = () => {};
    if (onMessage) {
      cleanupMessage = addMessageHandler('*' as MessageType, onMessage);
    }
    
    // Cleanup on unmount
    return () => {
      cleanupAuthenticated();
      cleanupMessage();
      // Don't disconnect on unmount to allow for page navigation without losing connection
    };
  }, [connect, userId, addMessageHandler, onOpen, onMessage]);
  
  // Handle connection status changes
  useEffect(() => {
    if (!isConnected && onClose) {
      onClose();
    }
  }, [isConnected, onClose]);
  
  // Send a message through the WebSocket store
  const sendMessage = useCallback((message: ClientMessage) => {
    if (isConnected && isAuthenticated) {
      send(message as WebSocketMessage);
      return true;
    }
    return false;
  }, [isConnected, isAuthenticated, send]);
  
  return {
    isConnected: isConnected && isAuthenticated,
    sendMessage,
    error: !isConnected ? 'WebSocket disconnected' : null,
    reconnect: () => {
      const id = userId();
      connect(id, 'Guest-' + id.substring(0, 6));
    }
  };
}
