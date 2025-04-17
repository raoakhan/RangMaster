import { create } from 'zustand';
import { MessageType, WebSocketMessage } from '@shared/types';

interface WebSocketStore {
  socket: WebSocket | null;
  isConnected: boolean;
  isAuthenticated: boolean;
  connect: (userId: string, username: string) => void;
  disconnect: () => void;
  send: (message: WebSocketMessage) => void;
  addMessageHandler: (
    type: MessageType | '*', 
    handler: (payload: any, messageType?: MessageType) => void
  ) => () => void;
}

// Message handlers for different message types
const messageHandlers = new Map<MessageType | '*', Set<(payload: any, messageType?: MessageType) => void>>();

export const useWebSocketStore = create<WebSocketStore>((set, get) => ({
  socket: null,
  isConnected: false,
  isAuthenticated: false,

  connect: (userId: string, username: string) => {
    const { socket } = get();
    
    // If socket already exists and is open, disconnect first
    if (socket) {
      socket.close();
    }

    // Determine WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    // Create new WebSocket connection
    const newSocket = new WebSocket(wsUrl);
    
    newSocket.onopen = () => {
      console.log('WebSocket connected');
      set({ isConnected: true });
      
      // Send authentication message
      newSocket.send(JSON.stringify({
        type: 'authenticate',
        payload: { id: userId, username }
      }));
    };
    
    newSocket.onclose = () => {
      console.log('WebSocket disconnected');
      set({ isConnected: false, isAuthenticated: false });
      
      // Attempt to reconnect after delay
      setTimeout(() => {
        const store = get();
        if (!store.isConnected && userId && username) {
          store.connect(userId, username);
        }
      }, 3000);
    };
    
    newSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    newSocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        
        // Handle authentication response
        if (message.type === 'authenticated') {
          set({ isAuthenticated: true });
        }
        
        // Handle error messages
        if (message.type === 'error') {
          console.error('Server error:', message.payload);
        }
        
        // Dispatch to specific handlers
        const handlers = messageHandlers.get(message.type);
        if (handlers) {
          handlers.forEach(handler => handler(message.payload, message.type));
        }
        
        // Also dispatch to wildcard handlers
        const wildcardHandlers = messageHandlers.get('*');
        if (wildcardHandlers) {
          wildcardHandlers.forEach(handler => handler(message.payload, message.type));
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };
    
    // Set heartbeat to keep connection alive
    const heartbeatInterval = setInterval(() => {
      if (newSocket.readyState === WebSocket.OPEN) {
        newSocket.send(JSON.stringify({
          type: 'pong'
        }));
      }
    }, 30000);
    
    // Clean up interval on unmount
    newSocket.addEventListener('close', () => {
      clearInterval(heartbeatInterval);
    });
    
    set({ socket: newSocket });
  },
  
  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.close();
    }
    set({ socket: null, isConnected: false, isAuthenticated: false });
  },
  
  send: (message: WebSocketMessage) => {
    const { socket, isConnected, isAuthenticated } = get();
    if (socket && isConnected && isAuthenticated) {
      socket.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message: WebSocket not connected or authenticated');
    }
  },
  
  addMessageHandler: (type: MessageType | '*', handler: (payload: any, messageType?: MessageType) => void) => {
    if (!messageHandlers.has(type)) {
      messageHandlers.set(type, new Set());
    }
    
    const handlers = messageHandlers.get(type)!;
    handlers.add(handler);
    
    // Return a function to remove this handler
    return () => {
      const handlers = messageHandlers.get(type);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }
}));
