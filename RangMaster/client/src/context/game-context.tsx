import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { GameState, Card, PlayerState } from '@shared/schema';
import { CardSuit, MessageType, WebSocketMessage } from '@shared/types';
import { useWebSocketStore } from '@/lib/websocket';
import { nanoid } from 'nanoid';
import { useToast } from '@/hooks/use-toast';

// Context type
interface GameContextType {
  roomId: string | null;
  playerId: number | null;
  gameState: GameState | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Game actions
  createRoom: (username: string, maxRounds?: number, winningScore?: number, enableAudio?: boolean, enableVideo?: boolean) => boolean;
  joinRoom: (roomId: string, username: string) => boolean;
  startGame: () => boolean;
  addAIPlayer: () => boolean;
  playCard: (card: Card) => boolean;
  selectTrump: (suit: CardSuit) => boolean;
  passTrumpSelection: () => boolean;
  readyForNextRound: () => boolean;
  sendChatMessage: (message: string, teamOnly?: boolean) => boolean;
  toggleAudio: () => boolean;
  toggleVideo: () => boolean;
  
  // Helper methods
  getCurrentPlayer: () => PlayerState | null;
}

// Create context
const GameContext = createContext<GameContextType | undefined>(undefined);

// Provider component
export function GameProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<number | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  
  // Get WebSocket store
  const {
    connect,
    send,
    isConnected,
    isAuthenticated,
    addMessageHandler
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
  
  // Initialize connection
  useEffect(() => {
    const id = userId();
    const username = 'Guest-' + id.substring(0, 6);
    
    // Connect when component mounts
    connect(id, username);
    
    // Clean-up on unmount - but we don't disconnect to allow
    // navigation between pages without losing connection
    return () => {};
  }, [connect, userId]);
  
  // Handle WebSocket messages
  useEffect(() => {
    // Register message handlers
    const handleRoomCreated = (payload: any) => {
      console.log("Room created:", payload);
      setRoomId(payload.roomId);
      setPlayerId(payload.playerId);
      setIsLoading(false);
    };
    
    const handleRoomJoined = (payload: any) => {
      console.log("Room joined:", payload);
      setRoomId(payload.roomId);
      setPlayerId(payload.playerId);
      setIsLoading(false);
    };
    
    const handleGameState = (payload: any) => {
      console.log("Game state updated:", payload);
      setGameState(payload);
      setIsLoading(false);
    };
    
    const handleError = (payload: any) => {
      console.error("Server error:", payload);
      toast({
        title: "Error",
        description: payload.message || "An error occurred",
        variant: "destructive",
      });
    };
    
    // Add handlers
    const cleanup1 = addMessageHandler('room_created' as MessageType, handleRoomCreated);
    const cleanup2 = addMessageHandler('room_joined' as MessageType, handleRoomJoined);
    const cleanup3 = addMessageHandler('game_state_update' as MessageType, handleGameState);
    const cleanup4 = addMessageHandler('error' as MessageType, handleError);
    
    return () => {
      cleanup1();
      cleanup2();
      cleanup3();
      cleanup4();
    };
  }, [addMessageHandler, toast]);
  
  // Set a timeout to stop loading if nothing happens
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Game actions
  const createRoom = useCallback((
    username: string,
    maxRounds = 5,
    winningScore = 101,
    enableAudio = false,
    enableVideo = false
  ) => {
    if (!isConnected || !isAuthenticated) return false;
    
    setIsLoading(true);
    
    send({
      type: 'create_room' as MessageType,
      payload: {
        username,
        maxRounds,
        winningScore,
        enableAudio,
        enableVideo
      }
    });
    
    return true;
  }, [isConnected, isAuthenticated, send]);
  
  const joinRoom = useCallback((roomId: string, username: string) => {
    if (!isConnected || !isAuthenticated) return false;
    
    setIsLoading(true);
    
    send({
      type: 'join_room' as MessageType,
      payload: {
        roomId,
        username
      }
    });
    
    return true;
  }, [isConnected, isAuthenticated, send]);
  
  const startGame = useCallback(() => {
    if (!isConnected || !isAuthenticated || !roomId) return false;
    
    send({
      type: 'start_game' as MessageType,
      payload: { roomId }
    });
    
    return true;
  }, [isConnected, isAuthenticated, send, roomId]);
  
  const addAIPlayer = useCallback(() => {
    if (!isConnected || !isAuthenticated || !roomId) return false;
    
    send({
      type: 'add_ai_player' as MessageType,
      payload: { roomId }
    });
    
    return true;
  }, [isConnected, isAuthenticated, send, roomId]);
  
  const playCard = useCallback((card: Card) => {
    if (!isConnected || !isAuthenticated || !roomId || !playerId) return false;
    
    send({
      type: 'play_card' as MessageType,
      payload: {
        roomId,
        playerId,
        card
      }
    });
    
    return true;
  }, [isConnected, isAuthenticated, send, roomId, playerId]);
  
  const selectTrump = useCallback((suit: CardSuit) => {
    if (!isConnected || !isAuthenticated || !roomId || !playerId) return false;
    
    send({
      type: 'select_trump' as MessageType,
      payload: {
        roomId,
        playerId,
        suit
      }
    });
    
    return true;
  }, [isConnected, isAuthenticated, send, roomId, playerId]);
  
  const passTrumpSelection = useCallback(() => {
    if (!isConnected || !isAuthenticated || !roomId || !playerId) return false;
    
    send({
      type: 'pass_trump' as MessageType,
      payload: {
        roomId,
        playerId
      }
    });
    
    return true;
  }, [isConnected, isAuthenticated, send, roomId, playerId]);
  
  const readyForNextRound = useCallback(() => {
    if (!isConnected || !isAuthenticated || !roomId) return false;
    
    send({
      type: 'ready_for_next_round' as MessageType,
      payload: { roomId }
    });
    
    return true;
  }, [isConnected, isAuthenticated, send, roomId]);
  
  const sendChatMessage = useCallback((message: string, teamOnly: boolean = false) => {
    if (!isConnected || !isAuthenticated || !roomId || !playerId) return false;
    
    send({
      type: 'send_chat' as MessageType,
      payload: {
        roomId,
        playerId,
        message,
        teamOnly
      }
    });
    
    return true;
  }, [isConnected, isAuthenticated, send, roomId, playerId]);
  
  const toggleAudio = useCallback(() => {
    if (!isConnected || !isAuthenticated || !roomId) return false;
    
    send({
      type: 'toggle_audio' as MessageType,
      payload: { roomId }
    });
    
    return true;
  }, [isConnected, isAuthenticated, send, roomId]);
  
  const toggleVideo = useCallback(() => {
    if (!isConnected || !isAuthenticated || !roomId) return false;
    
    send({
      type: 'toggle_video' as MessageType,
      payload: { roomId }
    });
    
    return true;
  }, [isConnected, isAuthenticated, send, roomId]);
  
  // Helper to get the current player
  const getCurrentPlayer = useCallback((): PlayerState | null => {
    if (!gameState || !playerId) return null;
    
    return gameState.players.find(p => p.id === playerId) || null;
  }, [gameState, playerId]);
  
  // Combine all game state and methods
  const value: GameContextType = {
    roomId,
    playerId,
    gameState,
    isConnected: isConnected && isAuthenticated,
    isLoading,
    error: !isConnected ? 'WebSocket disconnected' : null,
    
    // Game actions
    createRoom,
    joinRoom,
    startGame,
    addAIPlayer,
    playCard,
    selectTrump,
    passTrumpSelection,
    readyForNextRound,
    sendChatMessage,
    toggleAudio,
    toggleVideo,
    
    // Helper methods
    getCurrentPlayer
  };
  
  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

// Custom hook to use the game context
export function useGameContext() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
}
