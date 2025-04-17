// Card related types
export type CardSuit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type CardValue = 'A' | 'K' | 'Q' | 'J' | '10' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2';

// Player types (human or AI)
export type PlayerType = 'human' | 'ai';

// Position on table (0-3)
export type Position = 0 | 1 | 2 | 3;

// Messages between client and server
export interface ClientMessage {
  type: string;
  payload?: any;
}

export interface ServerMessage {
  type: string;
  payload?: any;
}

export interface WebSocketMessage {
  type: MessageType;
  payload?: any;
}

// Specific message types
export type MessageType = 
  // Client messages
  | 'create_room'
  | 'join_room'
  | 'start_game'
  | 'play_card'
  | 'select_trump'
  | 'pass_trump'
  | 'send_chat'
  | 'ready_for_next_round'
  | 'leave_room'
  | 'add_ai_player'
  | 'get_room_info'
  | 'toggle_audio'
  | 'toggle_video'
  | 'pong'
  | 'authenticate' // Authentication request
  
  // Server messages
  | 'room_created'
  | 'room_joined'
  | 'room_info'
  | 'game_started'
  | 'game_state_update'
  | 'trump_selection_request'
  | 'turn_update'
  | 'trick_completed'
  | 'round_completed'
  | 'game_completed'
  | 'card_played'
  | 'chat_message'
  | 'player_joined'
  | 'player_left'
  | 'error'
  | 'ping'
  | 'authenticated'; // Authentication response

// Event payloads
export interface CreateRoomPayload {
  username: string;
  maxRounds: number;
  winningScore: number;
  enableAudio: boolean;
  enableVideo: boolean;
}

export interface JoinRoomPayload {
  roomId: string;
  username: string;
}

export interface PlayCardPayload {
  roomId: string;
  playerId: number;
  card: {
    suit: CardSuit;
    value: CardValue;
  };
}

export interface SelectTrumpPayload {
  roomId: string;
  playerId: number;
  suit: CardSuit;
}

export interface SendChatPayload {
  roomId: string;
  playerId: number;
  message: string;
  teamOnly: boolean;
}
