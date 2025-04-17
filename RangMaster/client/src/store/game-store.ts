import { create } from 'zustand';
import { useWebSocketStore } from '@/lib/websocket';
import { useUserStore } from './user-store';
import { 
  RoomState, 
  Card, 
  MessageType, 
  GameStatus, 
  DisplayCard,
  ChatMessage,
  AuditMessage,
  Suit
} from '@shared/types';
import { nanoid } from 'nanoid';

interface GameState {
  // Room state
  roomId: string | null;
  roomCode: string | null;
  roomState: RoomState | null;
  
  // Player state
  playerHand: DisplayCard[];
  playableCards: string[];
  
  // Game UI state
  centerCards: Card[];
  isYourTurn: boolean;
  trumpSelector: string | null;
  selectedTab: 'score' | 'chat' | 'audit';
  
  // Messages
  chatMessages: ChatMessage[];
  auditLog: AuditMessage[];
  notifications: { id: string; message: string; timeout: number }[];
  
  // Actions
  createRoom: (name: string) => void;
  joinRoom: (code: string) => void;
  leaveRoom: () => void;
  startGame: () => void;
  selectTrump: (suit: Suit | null) => void;
  playCard: (card: Card) => void;
  toggleReady: (ready: boolean) => void;
  addAIPlayer: (teamId: number) => void;
  removeAIPlayer: (playerId: string) => void;
  sendChatMessage: (text: string) => void;
  switchTeam: (teamId: number) => void;
  setSelectedTab: (tab: 'score' | 'chat' | 'audit') => void;
  
  // Notifications
  addNotification: (message: string, timeout?: number) => void;
  removeNotification: (id: string) => void;
  
  // Cleanup
  reset: () => void;
}

export const useGameStore = create<GameState>((set, get) => {
  // Set up WebSocket message handlers
  const registerHandlers = () => {
    const socket = useWebSocketStore.getState();
    
    // Room created handler
    const roomCreatedHandler = socket.addMessageHandler(
      MessageType.ROOM_CREATED, 
      (payload) => {
        const { roomId, roomCode, state } = payload;
        set({ 
          roomId, 
          roomCode, 
          roomState: state,
          playerHand: getPlayerHand(state),
          playableCards: []
        });
      }
    );
    
    // Room joined handler
    const roomJoinedHandler = socket.addMessageHandler(
      MessageType.ROOM_JOINED, 
      (payload) => {
        const { roomId, roomCode, state, chatMessages, auditLog } = payload;
        set({ 
          roomId, 
          roomCode, 
          roomState: state,
          playerHand: getPlayerHand(state),
          playableCards: [],
          chatMessages: chatMessages || [],
          auditLog: auditLog || []
        });
      }
    );
    
    // Room state handler
    const roomStateHandler = socket.addMessageHandler(
      MessageType.ROOM_STATE, 
      (payload) => {
        if (payload.left) {
          // We've left the room
          set({ 
            roomId: null, 
            roomCode: null, 
            roomState: null,
            playerHand: [],
            playableCards: [],
            chatMessages: [],
            auditLog: [],
            centerCards: []
          });
          return;
        }
        
        const { state } = payload;
        
        if (state) {
          const userId = useUserStore.getState().id;
          
          // Get cards in center if any
          const centerCards: Card[] = state.currentTrick?.cards || [];
          
          // Check if it's player's turn
          const isYourTurn = userId === state.currentPlayerId;
          
          // Check if current player is selecting trump
          const trumpSelector = state.gameStatus === GameStatus.SELECTING_TRUMP 
            ? state.currentPlayerId
            : null;
            
          // Get player hand
          const playerHand = getPlayerHand(state);
          
          // Get playable cards
          let playableCards: string[] = [];
          
          if (isYourTurn && state.gameStatus === GameStatus.IN_PROGRESS) {
            // Request playable cards from server on next render
            setTimeout(() => {
              requestPlayableCards();
            }, 0);
          }
          
          set({ 
            roomState: state,
            playerHand,
            centerCards,
            isYourTurn,
            trumpSelector,
            playableCards
          });
        }
      }
    );
    
    // Game started handler
    const gameStartedHandler = socket.addMessageHandler(
      MessageType.GAME_STARTED, 
      (payload) => {
        const { state } = payload;
        const userId = useUserStore.getState().id;
        
        // Find player's cards
        const playerHand = getPlayerHand(state);
        
        // Check if player is selecting trump
        const trumpSelector = state.gameStatus === GameStatus.SELECTING_TRUMP 
          ? state.currentPlayerId
          : null;
          
        set({ 
          roomState: state,
          playerHand,
          centerCards: [],
          isYourTurn: userId === state.currentPlayerId,
          trumpSelector
        });
        
        // Show notification
        get().addNotification('Game started! Select trump suit or pass.', 5000);
      }
    );
    
    // Trump selected handler
    const trumpSelectedHandler = socket.addMessageHandler(
      MessageType.TRUMP_SELECTED, 
      (payload) => {
        const { suit, passed, state } = payload;
        
        if (passed) {
          // Trump selection was passed
          if (state) {
            const userId = useUserStore.getState().id;
            const isYourTurn = userId === state.currentPlayerId;
            
            set({
              roomState: state,
              isYourTurn,
              trumpSelector: state.currentPlayerId
            });
            
            // Show notification if it's your turn
            if (isYourTurn) {
              get().addNotification('Your turn to select trump suit', 5000);
            }
          }
        } else {
          // Trump was selected
          if (state) {
            const userId = useUserStore.getState().id;
            
            set({
              roomState: state,
              isYourTurn: userId === state.currentPlayerId,
              trumpSelector: null
            });
            
            // Show notification
            get().addNotification(`Trump suit: ${suit}`, 3000);
            
            // If it's your turn to play, show notification
            if (userId === state.currentPlayerId) {
              get().addNotification('Your turn to play a card', 3000);
            }
          }
        }
      }
    );
    
    // Card played handler
    const cardPlayedHandler = socket.addMessageHandler(
      MessageType.CARD_PLAYED, 
      (payload) => {
        const { playerId, card, state } = payload;
        const userId = useUserStore.getState().id;
        
        if (state) {
          // Update room state
          const centerCards = state.currentTrick?.cards || [];
          const isYourTurn = userId === state.currentPlayerId;
          
          set({
            roomState: state,
            centerCards,
            isYourTurn
          });
          
          // If own card was played, update hand
          if (playerId === userId) {
            const playerHand = getPlayerHand(state);
            set({ playerHand, playableCards: [] });
          }
          
          // If it's now your turn, show notification
          if (isYourTurn) {
            get().addNotification('Your turn to play a card', 3000);
            
            // Request playable cards
            requestPlayableCards();
          }
        }
      }
    );
    
    // Trick completed handler
    const trickCompletedHandler = socket.addMessageHandler(
      MessageType.TRICK_COMPLETED, 
      (payload) => {
        const { state } = payload;
        const userId = useUserStore.getState().id;
        
        if (state) {
          set({
            roomState: state,
            centerCards: [],
            isYourTurn: userId === state.currentPlayerId
          });
          
          // If it's your turn now, show notification
          if (userId === state.currentPlayerId) {
            get().addNotification('You won the trick! Your turn to lead.', 3000);
            
            // Request playable cards
            requestPlayableCards();
          }
        }
      }
    );
    
    // Round completed handler
    const roundCompletedHandler = socket.addMessageHandler(
      MessageType.ROUND_COMPLETED, 
      (payload) => {
        const { state } = payload;
        
        if (state) {
          set({
            roomState: state,
            centerCards: [],
            playableCards: []
          });
          
          // Show notification
          get().addNotification(`Round ${state.currentRound} completed!`, 5000);
        }
      }
    );
    
    // Game completed handler
    const gameCompletedHandler = socket.addMessageHandler(
      MessageType.GAME_COMPLETED, 
      (payload) => {
        const { state } = payload;
        
        if (state) {
          // Find the winning team
          const teams = state.teams || [];
          let winningTeam = teams[0];
          
          if (teams.length > 1) {
            winningTeam = teams[0].score > teams[1].score ? teams[0] : teams[1];
          }
          
          set({
            roomState: state,
            centerCards: [],
            playableCards: []
          });
          
          // Show notification
          get().addNotification(`Game completed! ${winningTeam.name} wins!`, 10000);
        }
      }
    );
    
    // Player joined handler
    const playerJoinedHandler = socket.addMessageHandler(
      MessageType.PLAYER_JOINED, 
      (payload) => {
        const { player, roomState } = payload;
        
        if (roomState) {
          set({ roomState });
          
          // Show notification
          get().addNotification(`${player.name} joined the game`, 3000);
        }
      }
    );
    
    // Player left handler
    const playerLeftHandler = socket.addMessageHandler(
      MessageType.PLAYER_LEFT, 
      (payload) => {
        const { playerId, roomState } = payload;
        
        if (roomState) {
          set({ roomState });
          
          // Show notification
          get().addNotification(`A player left the game`, 3000);
        }
      }
    );
    
    // Chat message handler
    const chatMessageHandler = socket.addMessageHandler(
      MessageType.CHAT_MESSAGE, 
      (payload) => {
        const { message } = payload;
        
        if (message) {
          set(state => ({
            chatMessages: [...state.chatMessages, message]
          }));
          
          // If not on chat tab, add notification
          if (get().selectedTab !== 'chat') {
            get().addNotification(`New message from ${message.playerName}`, 3000);
          }
        }
      }
    );
    
    // Return cleanup function
    return () => {
      roomCreatedHandler();
      roomJoinedHandler();
      roomStateHandler();
      gameStartedHandler();
      trumpSelectedHandler();
      cardPlayedHandler();
      trickCompletedHandler();
      roundCompletedHandler();
      gameCompletedHandler();
      playerJoinedHandler();
      playerLeftHandler();
      chatMessageHandler();
    };
  };
  
  // Help functions to extract player data
  const getPlayerHand = (state: RoomState | null): DisplayCard[] => {
    if (!state) return [];
    
    const userId = useUserStore.getState().id;
    
    // Find current player
    const currentPlayer = state.players.find(p => p.id === userId);
    if (!currentPlayer) return [];
    
    // Find player's team
    const team = state.teams.find(t => 
      t.players.some(p => p.id === userId)
    );
    
    if (!team) return [];
    
    // Request player hand from server
    const socket = useWebSocketStore.getState();
    socket.send({
      type: MessageType.ROOM_STATE,
      payload: { roomId: state.id, requestHand: true }
    });
    
    // Return current hand (will be updated when server responds)
    return get().playerHand;
  };
  
  // Request playable cards from server
  const requestPlayableCards = () => {
    const { roomId } = get();
    if (!roomId) return;
    
    const socket = useWebSocketStore.getState();
    socket.send({
      type: MessageType.ROOM_STATE,
      payload: { roomId, requestPlayableCards: true }
    });
  };
  
  // Register handlers on init
  const cleanupHandlers = registerHandlers();
  
  return {
    // State
    roomId: null,
    roomCode: null,
    roomState: null,
    playerHand: [],
    playableCards: [],
    centerCards: [],
    isYourTurn: false,
    trumpSelector: null,
    selectedTab: 'score',
    chatMessages: [],
    auditLog: [],
    notifications: [],
    
    // Actions
    createRoom: (name: string) => {
      const socket = useWebSocketStore.getState();
      socket.send({
        type: MessageType.CREATE_ROOM,
        payload: { name }
      });
    },
    
    joinRoom: (code: string) => {
      const socket = useWebSocketStore.getState();
      socket.send({
        type: MessageType.JOIN_ROOM,
        payload: { roomCode: code }
      });
    },
    
    leaveRoom: () => {
      const { roomId } = get();
      if (!roomId) return;
      
      const socket = useWebSocketStore.getState();
      socket.send({
        type: MessageType.LEAVE_ROOM,
        payload: { roomId }
      });
    },
    
    startGame: () => {
      const { roomId } = get();
      if (!roomId) return;
      
      const socket = useWebSocketStore.getState();
      socket.send({
        type: MessageType.START_GAME,
        payload: { roomId }
      });
    },
    
    selectTrump: (suit: Suit | null) => {
      const { roomId } = get();
      if (!roomId) return;
      
      const socket = useWebSocketStore.getState();
      socket.send({
        type: MessageType.SELECT_TRUMP,
        payload: { 
          roomId,
          suit,
          pass: suit === null
        }
      });
    },
    
    playCard: (card: Card) => {
      const { roomId, isYourTurn, playableCards } = get();
      if (!roomId || !isYourTurn) return;
      
      // Check if card is playable
      const cardString = `${card.value}-${card.suit}`;
      if (playableCards.length > 0 && !playableCards.includes(cardString)) {
        get().addNotification("You can't play that card", 3000);
        return;
      }
      
      const socket = useWebSocketStore.getState();
      socket.send({
        type: MessageType.PLAY_CARD,
        payload: { 
          roomId,
          card
        }
      });
    },
    
    toggleReady: (ready: boolean) => {
      const { roomId } = get();
      if (!roomId) return;
      
      const socket = useWebSocketStore.getState();
      socket.send({
        type: MessageType.PLAYER_READY,
        payload: { 
          roomId,
          ready
        }
      });
    },
    
    addAIPlayer: (teamId: number) => {
      const { roomId } = get();
      if (!roomId) return;
      
      const socket = useWebSocketStore.getState();
      socket.send({
        type: MessageType.ADD_AI_PLAYER,
        payload: { 
          roomId,
          teamId
        }
      });
    },
    
    removeAIPlayer: (playerId: string) => {
      const { roomId } = get();
      if (!roomId) return;
      
      const socket = useWebSocketStore.getState();
      socket.send({
        type: MessageType.REMOVE_AI_PLAYER,
        payload: { 
          roomId,
          playerId
        }
      });
    },
    
    sendChatMessage: (text: string) => {
      const { roomId } = get();
      if (!roomId || !text.trim()) return;
      
      const socket = useWebSocketStore.getState();
      socket.send({
        type: MessageType.CHAT_MESSAGE,
        payload: { 
          roomId,
          text: text.trim()
        }
      });
    },
    
    switchTeam: (teamId: number) => {
      const { roomId } = get();
      if (!roomId) return;
      
      const socket = useWebSocketStore.getState();
      socket.send({
        type: MessageType.SWITCH_TEAM,
        payload: { 
          roomId,
          teamId
        }
      });
    },
    
    setSelectedTab: (tab: 'score' | 'chat' | 'audit') => {
      set({ selectedTab: tab });
    },
    
    addNotification: (message: string, timeout: number = 5000) => {
      const notification = {
        id: nanoid(),
        message,
        timeout
      };
      
      set(state => ({
        notifications: [...state.notifications, notification]
      }));
      
      // Auto-remove notification after timeout
      setTimeout(() => {
        get().removeNotification(notification.id);
      }, timeout);
    },
    
    removeNotification: (id: string) => {
      set(state => ({
        notifications: state.notifications.filter(n => n.id !== id)
      }));
    },
    
    // Reset all state
    reset: () => {
      set({
        roomId: null,
        roomCode: null,
        roomState: null,
        playerHand: [],
        playableCards: [],
        centerCards: [],
        isYourTurn: false,
        trumpSelector: null,
        selectedTab: 'score',
        chatMessages: [],
        auditLog: [],
        notifications: []
      });
    }
  };
});
