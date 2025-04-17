import { useState, useCallback, useEffect } from 'react';
import { useWebSocket } from './use-websocket';
import { GameState, Card, PlayerState } from '@shared/schema';
import { CardSuit, CardValue } from '@shared/types';
import { nanoid } from 'nanoid';
import { useToast } from '@/hooks/use-toast';

interface UseGameProps {
  onGameStateUpdate?: (gameState: GameState) => void;
  onError?: (error: string) => void;
}

export function useGame({ onGameStateUpdate, onError }: UseGameProps = {}) {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<number | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const { toast } = useToast();

  // Handle WebSocket messages
  const handleMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'room_created':
        setRoomId(data.payload.roomId);
        setPlayerId(data.payload.playerId);
        setIsCreatingRoom(false);
        break;
      
      case 'room_joined':
        setRoomId(data.payload.roomId);
        setPlayerId(data.payload.playerId);
        setIsJoiningRoom(false);
        break;
      
      case 'game_state_update':
        setGameState(data.payload);
        if (onGameStateUpdate) onGameStateUpdate(data.payload);
        break;
      
      case 'error':
        if (onError) onError(data.payload.message);
        toast({
          title: "Error",
          description: data.payload.message,
          variant: "destructive",
        });
        setIsCreatingRoom(false);
        setIsJoiningRoom(false);
        break;
      
      case 'card_played':
        // Could add additional handling for card play animations
        break;
      
      case 'trick_completed':
        // Could add additional handling for trick completion
        break;
      
      case 'round_completed':
        // Could add additional handling for round completion
        break;
      
      case 'game_completed':
        // Could add additional handling for game completion
        break;
    }
  }, [onGameStateUpdate, onError, toast]);

  const { isConnected, sendMessage, error } = useWebSocket({
    onMessage: handleMessage,
  });

  // Create a new game room
  const createRoom = useCallback((
    username: string,
    maxRounds = 5,
    winningScore = 101,
    enableAudio = false,
    enableVideo = false
  ) => {
    if (!isConnected) return false;
    
    setIsCreatingRoom(true);
    
    return sendMessage({
      type: 'create_room',
      payload: {
        username,
        maxRounds,
        winningScore,
        enableAudio,
        enableVideo
      }
    });
  }, [isConnected, sendMessage]);

  // Join an existing game room
  const joinRoom = useCallback((roomId: string, username: string) => {
    if (!isConnected) return false;
    
    setIsJoiningRoom(true);
    
    return sendMessage({
      type: 'join_room',
      payload: {
        roomId,
        username
      }
    });
  }, [isConnected, sendMessage]);

  // Start the game
  const startGame = useCallback(() => {
    if (!isConnected || !roomId) return false;
    
    return sendMessage({
      type: 'start_game',
      payload: {
        roomId
      }
    });
  }, [isConnected, sendMessage, roomId]);

  // Add an AI player
  const addAIPlayer = useCallback(() => {
    if (!isConnected || !roomId) return false;
    
    return sendMessage({
      type: 'add_ai_player',
      payload: {
        roomId
      }
    });
  }, [isConnected, sendMessage, roomId]);

  // Play a card
  const playCard = useCallback((card: Card) => {
    if (!isConnected || !roomId || !playerId) return false;
    
    return sendMessage({
      type: 'play_card',
      payload: {
        roomId,
        playerId,
        card
      }
    });
  }, [isConnected, sendMessage, roomId, playerId]);

  // Select trump suit
  const selectTrump = useCallback((suit: CardSuit) => {
    if (!isConnected || !roomId || !playerId) return false;
    
    return sendMessage({
      type: 'select_trump',
      payload: {
        roomId,
        playerId,
        suit
      }
    });
  }, [isConnected, sendMessage, roomId, playerId]);

  // Pass trump selection to partner
  const passTrumpSelection = useCallback(() => {
    if (!isConnected || !roomId || !playerId) return false;
    
    return sendMessage({
      type: 'pass_trump',
      payload: {
        roomId,
        playerId
      }
    });
  }, [isConnected, sendMessage, roomId, playerId]);

  // Ready for next round
  const readyForNextRound = useCallback(() => {
    if (!isConnected || !roomId) return false;
    
    return sendMessage({
      type: 'ready_for_next_round',
      payload: {
        roomId
      }
    });
  }, [isConnected, sendMessage, roomId]);

  // Send chat message
  const sendChatMessage = useCallback((message: string, teamOnly: boolean = false) => {
    if (!isConnected || !roomId || !playerId) return false;
    
    return sendMessage({
      type: 'send_chat',
      payload: {
        roomId,
        playerId,
        message,
        teamOnly
      }
    });
  }, [isConnected, sendMessage, roomId, playerId]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (!isConnected || !roomId) return false;
    
    return sendMessage({
      type: 'toggle_audio',
      payload: {
        roomId
      }
    });
  }, [isConnected, sendMessage, roomId]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (!isConnected || !roomId) return false;
    
    return sendMessage({
      type: 'toggle_video',
      payload: {
        roomId
      }
    });
  }, [isConnected, sendMessage, roomId]);

  // Helper to get the current player
  const getCurrentPlayer = useCallback((): PlayerState | null => {
    if (!gameState || !playerId) return null;
    
    return gameState.players.find(p => p.id === playerId) || null;
  }, [gameState, playerId]);

  // Connection status effects
  useEffect(() => {
    if (error) {
      toast({
        title: "Connection Error",
        description: error,
        variant: "destructive",
      });
      
      if (onError) onError(error);
    }
  }, [error, toast, onError]);

  return {
    roomId,
    playerId,
    gameState,
    isConnected,
    isCreatingRoom,
    isJoiningRoom,
    error,
    
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
}
