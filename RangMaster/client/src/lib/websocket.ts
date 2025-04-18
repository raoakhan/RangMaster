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

// Add a variable outside the store to track reconnect timeout
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

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
    // Support custom WS port via env or fallback to current logic
    let wsHost = window.location.hostname;
    let wsPort = (window as any).WS_PORT;
    let wsPath = (window as any).WS_PATH || '/ws';
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

    // Only add port if it is set and not 'undefined' or empty
    // Do NOT include token or any query parameter in the URL; authentication is handled via the first message after connect
    let wsUrl: string;
    if (typeof wsPort === 'string' && wsPort !== '' && wsPort !== 'undefined' && wsPort !== '80' && wsPort !== '443') {
      wsUrl = `${protocol}//${wsHost}:${wsPort}${wsPath}`;
    } else {
      wsUrl = `${protocol}//${window.location.host}${wsPath}`;
    }
    console.log('[WebSocket] Connecting to', wsUrl);
    // TODO: Allow override via .env or config for dev/prod

    // Create new WebSocket connection
    const newSocket = new WebSocket(wsUrl);
    
    newSocket.onopen = () => {
      console.log('WebSocket connected');
      set({ isConnected: true });
      // Clear any pending reconnects
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
      // Send authentication message
      newSocket.send(JSON.stringify({
        type: 'authenticate',
        payload: { id: userId, username }
      }));
    };
    
    newSocket.onclose = (event) => {
      console.log('WebSocket disconnected', event && event.code, event && event.reason);
      set({ isConnected: false, isAuthenticated: false });
      // Attempt to reconnect after delay, only if not already scheduled
      if (!reconnectTimeout) {
        reconnectTimeout = setTimeout(() => {
          reconnectTimeout = null;
          const store = get();
          if (!store.isConnected && userId && username) {
            store.connect(userId, username);
          }
        }, 3000);
      }
    };
    
    newSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    newSocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (!message || typeof message !== 'object') {
          console.error('Received invalid message (not an object):', event.data);
          return;
        }
        if (!('type' in message)) {
          console.error('Received message without type:', message);
          return;
        }
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
        console.error('Error parsing message:', error, event.data);
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
    // Clear any pending reconnects
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    set({ socket: null, isConnected: false, isAuthenticated: false });
  },
  
  send: (message: WebSocketMessage) => {
    const { socket, isConnected, isAuthenticated } = get();
    if (
      socket &&
      isConnected &&
      isAuthenticated &&
      socket.readyState === WebSocket.OPEN
    ) {
      socket.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message: WebSocket not connected, authenticated, or ready');
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
