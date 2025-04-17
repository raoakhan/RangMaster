import { Room } from "./room";
import { Player } from "./player";
import { MessageType, WebSocketMessage, PlayerType, GameStatus } from "@shared/types";
import { storage } from "../storage";

export class GameManager {
  private rooms: Map<string, Room>;

  constructor() {
    this.rooms = new Map();
  }

  public createRoom(name: string, createdById: string, creatorName: string): Room {
    const roomId = `room-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const room = new Room(roomId, name, createdById);
    
    // Add creator to the room
    const creator = new Player({
      id: createdById,
      name: creatorName,
      type: PlayerType.HUMAN,
      isConnected: true,
      isReady: false,
    });
    
    room.addPlayer(creator);
    this.rooms.set(roomId, room);
    
    return room;
  }

  public getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  public getRoomByCode(code: string): Room | undefined {
    for (const room of this.rooms.values()) {
      if (room.getCode() === code) {
        return room;
      }
    }
    return undefined;
  }

  public removeRoom(roomId: string): boolean {
    return this.rooms.delete(roomId);
  }

  public handleSocketMessage(
    ws: WebSocket, 
    message: WebSocketMessage,
    playerIdentifier: { id: string, name: string }
  ): void {
    const { type, payload } = message;

    switch (type) {
      case MessageType.CREATE_ROOM:
        this.handleCreateRoom(ws, payload, playerIdentifier);
        break;
        
      case MessageType.JOIN_ROOM:
        this.handleJoinRoom(ws, payload, playerIdentifier);
        break;
        
      case MessageType.LEAVE_ROOM:
        this.handleLeaveRoom(ws, payload, playerIdentifier);
        break;
        
      case MessageType.START_GAME:
        this.handleStartGame(ws, payload, playerIdentifier);
        break;
        
      case MessageType.SELECT_TRUMP:
        this.handleSelectTrump(ws, payload, playerIdentifier);
        break;
        
      case MessageType.PLAY_CARD:
        this.handlePlayCard(ws, payload, playerIdentifier);
        break;
        
      case MessageType.PLAYER_READY:
        this.handlePlayerReady(ws, payload, playerIdentifier);
        break;
        
      case MessageType.ADD_AI_PLAYER:
        this.handleAddAIPlayer(ws, payload, playerIdentifier);
        break;
        
      case MessageType.REMOVE_AI_PLAYER:
        this.handleRemoveAIPlayer(ws, payload, playerIdentifier);
        break;
        
      case MessageType.CHAT_MESSAGE:
        this.handleChatMessage(ws, payload, playerIdentifier);
        break;
        
      case MessageType.SWITCH_TEAM:
        this.handleSwitchTeam(ws, payload, playerIdentifier);
        break;
        
      case MessageType.HEARTBEAT:
        // Just respond with a heartbeat message
        this.sendToClient(ws, { type: MessageType.HEARTBEAT });
        break;
        
      default:
        console.log(`Unknown message type: ${type}`);
    }
  }

  private handleCreateRoom(
    ws: WebSocket, 
    payload: any, 
    playerIdentifier: { id: string, name: string }
  ): void {
    try {
      const { name } = payload;
      
      const room = this.createRoom(name, playerIdentifier.id, playerIdentifier.name);
      room.registerClient(playerIdentifier.id, ws);
      
      // Respond with room created message
      this.sendToClient(ws, {
        type: MessageType.ROOM_CREATED,
        payload: {
          roomId: room.getId(),
          roomCode: room.getCode(),
          state: room.getState()
        }
      });
      
      // Persist room to DB (optional)
      storage.createRoom({
        name: name,
        createdBy: parseInt(playerIdentifier.id) || 1,
        isPrivate: false
      }).catch(err => console.error('Failed to persist room:', err));
    } catch (error) {
      console.error('Error creating room:', error);
      this.sendToClient(ws, {
        type: MessageType.ERROR,
        payload: { message: "Failed to create room" }
      });
    }
  }
  
  private handleJoinRoom(
    ws: WebSocket, 
    payload: any, 
    playerIdentifier: { id: string, name: string }
  ): void {
    try {
      const { roomCode } = payload;
      const room = this.getRoomByCode(roomCode);
      
      if (!room) {
        return this.sendToClient(ws, {
          type: MessageType.ERROR,
          payload: { message: "Room not found" }
        });
      }
      
      // Check if player is already in the room
      if (room.hasPlayer(playerIdentifier.id)) {
        room.registerClient(playerIdentifier.id, ws);
      } else {
        // Add new player to the room
        const player = new Player({
          id: playerIdentifier.id,
          name: playerIdentifier.name,
          type: PlayerType.HUMAN,
          isConnected: true,
          isReady: false
        });
        
        if (!room.addPlayer(player)) {
          return this.sendToClient(ws, {
            type: MessageType.ERROR,
            payload: { message: "Room is full" }
          });
        }
        
        room.registerClient(playerIdentifier.id, ws);
        
        // Notify other players that someone joined
        room.broadcast({
          type: MessageType.PLAYER_JOINED,
          payload: { 
            player: player.info,
            roomState: room.getState()
          }
        }, playerIdentifier.id);
      }
      
      // Send room state to the joining player
      this.sendToClient(ws, {
        type: MessageType.ROOM_JOINED,
        payload: {
          roomId: room.getId(),
          roomCode: room.getCode(),
          state: room.getState(),
          chatMessages: room.getChatMessages(),
          auditLog: room.getAuditLog()
        }
      });
    } catch (error) {
      console.error('Error joining room:', error);
      this.sendToClient(ws, {
        type: MessageType.ERROR,
        payload: { message: "Failed to join room" }
      });
    }
  }
  
  private handleLeaveRoom(
    ws: WebSocket, 
    payload: any, 
    playerIdentifier: { id: string, name: string }
  ): void {
    try {
      const { roomId } = payload;
      const room = this.getRoom(roomId);
      
      if (room) {
        room.unregisterClient(playerIdentifier.id, ws);
        
        // If no more clients for this player, remove from room
        if (!room.hasConnectedClients(playerIdentifier.id)) {
          room.removePlayer(playerIdentifier.id);
          
          // Notify other players
          room.broadcast({
            type: MessageType.PLAYER_LEFT,
            payload: { 
              playerId: playerIdentifier.id,
              roomState: room.getState()
            }
          });
          
          // If room is empty, remove it
          if (room.getPlayerCount() === 0) {
            this.removeRoom(roomId);
          }
        }
        
        this.sendToClient(ws, {
          type: MessageType.ROOM_STATE,
          payload: { left: true }
        });
      }
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  }
  
  private handleStartGame(
    ws: WebSocket, 
    payload: any, 
    playerIdentifier: { id: string, name: string }
  ): void {
    try {
      const { roomId } = payload;
      const room = this.getRoom(roomId);
      
      if (!room) {
        return this.sendToClient(ws, {
          type: MessageType.ERROR,
          payload: { message: "Room not found" }
        });
      }
      
      // Only the room creator can start the game
      if (room.getCreatedById() !== playerIdentifier.id) {
        return this.sendToClient(ws, {
          type: MessageType.ERROR,
          payload: { message: "Only the room creator can start the game" }
        });
      }
      
      // Check if teams are balanced (2v2)
      if (!room.areTeamsBalanced()) {
        return this.sendToClient(ws, {
          type: MessageType.ERROR,
          payload: { message: "Teams must be balanced (2v2)" }
        });
      }
      
      // Start the game
      if (!room.startGame()) {
        return this.sendToClient(ws, {
          type: MessageType.ERROR,
          payload: { message: "Failed to start game" }
        });
      }
      
      // Broadcast game started to all players
      room.broadcast({
        type: MessageType.GAME_STARTED,
        payload: { state: room.getState() }
      });
      
      // Check if AI needs to select trump
      room.handleAITurns();
    } catch (error) {
      console.error('Error starting game:', error);
      this.sendToClient(ws, {
        type: MessageType.ERROR,
        payload: { message: "Failed to start game" }
      });
    }
  }
  
  private handleSelectTrump(
    ws: WebSocket, 
    payload: any, 
    playerIdentifier: { id: string, name: string }
  ): void {
    try {
      const { roomId, suit, pass } = payload;
      const room = this.getRoom(roomId);
      
      if (!room) {
        return this.sendToClient(ws, {
          type: MessageType.ERROR,
          payload: { message: "Room not found" }
        });
      }
      
      // If passing on trump selection
      if (pass) {
        if (!room.passTrump()) {
          return this.sendToClient(ws, {
            type: MessageType.ERROR,
            payload: { message: "Failed to pass trump selection" }
          });
        }
        
        room.broadcast({
          type: MessageType.TRUMP_SELECTED,
          payload: { 
            passed: true,
            state: room.getState()
          }
        });
        
        // Check if AI needs to select trump next
        room.handleAITurns();
        
        return;
      }
      
      // Selecting trump
      if (!room.selectTrump(suit)) {
        return this.sendToClient(ws, {
          type: MessageType.ERROR,
          payload: { message: "Failed to select trump" }
        });
      }
      
      // Broadcast trump selected
      room.broadcast({
        type: MessageType.TRUMP_SELECTED,
        payload: { 
          suit,
          state: room.getState()
        }
      });
      
      // Check if AI needs to play next
      room.handleAITurns();
    } catch (error) {
      console.error('Error selecting trump:', error);
      this.sendToClient(ws, {
        type: MessageType.ERROR,
        payload: { message: "Failed to select trump" }
      });
    }
  }
  
  private handlePlayCard(
    ws: WebSocket, 
    payload: any, 
    playerIdentifier: { id: string, name: string }
  ): void {
    try {
      const { roomId, card } = payload;
      const room = this.getRoom(roomId);
      
      if (!room) {
        return this.sendToClient(ws, {
          type: MessageType.ERROR,
          payload: { message: "Room not found" }
        });
      }
      
      // Play the card
      if (!room.playCard(playerIdentifier.id, card)) {
        return this.sendToClient(ws, {
          type: MessageType.ERROR,
          payload: { message: "Invalid card play" }
        });
      }
      
      const roomState = room.getState();
      
      // Broadcast card played
      room.broadcast({
        type: MessageType.CARD_PLAYED,
        payload: { 
          playerId: playerIdentifier.id,
          card,
          state: roomState
        }
      });
      
      // Check if trick is complete (center is empty again)
      if (roomState.currentTrick && roomState.currentTrick.cards.length === 0 && roomState.gameStatus === GameStatus.IN_PROGRESS) {
        room.broadcast({
          type: MessageType.TRICK_COMPLETED,
          payload: { state: roomState }
        });
      }
      
      // Check if round is complete
      if (roomState.gameStatus === GameStatus.ROUND_END) {
        room.broadcast({
          type: MessageType.ROUND_COMPLETED,
          payload: { state: roomState }
        });
        
        // If next round exists, prepare it
        if (roomState.gameStatus !== GameStatus.GAME_END) {
          setTimeout(() => {
            const updatedState = room.getState();
            room.broadcast({
              type: MessageType.ROOM_STATE,
              payload: { state: updatedState }
            });
            
            // Check if AI needs to select trump for new round
            room.handleAITurns();
          }, 3000);
        } else {
          // Game is finished
          room.broadcast({
            type: MessageType.GAME_COMPLETED,
            payload: { state: roomState }
          });
        }
      } else {
        // Check if AI needs to play next
        room.handleAITurns();
      }
    } catch (error) {
      console.error('Error playing card:', error);
      this.sendToClient(ws, {
        type: MessageType.ERROR,
        payload: { message: "Failed to play card" }
      });
    }
  }
  
  private handlePlayerReady(
    ws: WebSocket, 
    payload: any, 
    playerIdentifier: { id: string, name: string }
  ): void {
    try {
      const { roomId, ready } = payload;
      const room = this.getRoom(roomId);
      
      if (!room) {
        return this.sendToClient(ws, {
          type: MessageType.ERROR,
          payload: { message: "Room not found" }
        });
      }
      
      room.setPlayerReady(playerIdentifier.id, ready);
      
      // Broadcast updated state
      room.broadcast({
        type: MessageType.ROOM_STATE,
        payload: { state: room.getState() }
      });
    } catch (error) {
      console.error('Error setting player ready:', error);
      this.sendToClient(ws, {
        type: MessageType.ERROR,
        payload: { message: "Failed to set ready status" }
      });
    }
  }
  
  private handleAddAIPlayer(
    ws: WebSocket, 
    payload: any, 
    playerIdentifier: { id: string, name: string }
  ): void {
    try {
      const { roomId, teamId } = payload;
      const room = this.getRoom(roomId);
      
      if (!room) {
        return this.sendToClient(ws, {
          type: MessageType.ERROR,
          payload: { message: "Room not found" }
        });
      }
      
      if (room.getCreatedById() !== playerIdentifier.id) {
        return this.sendToClient(ws, {
          type: MessageType.ERROR,
          payload: { message: "Only the room creator can add AI players" }
        });
      }
      
      if (!room.addAIPlayer(teamId)) {
        return this.sendToClient(ws, {
          type: MessageType.ERROR,
          payload: { message: "Failed to add AI player" }
        });
      }
      
      // Broadcast updated state
      room.broadcast({
        type: MessageType.ROOM_STATE,
        payload: { state: room.getState() }
      });
    } catch (error) {
      console.error('Error adding AI player:', error);
      this.sendToClient(ws, {
        type: MessageType.ERROR,
        payload: { message: "Failed to add AI player" }
      });
    }
  }
  
  private handleRemoveAIPlayer(
    ws: WebSocket, 
    payload: any, 
    playerIdentifier: { id: string, name: string }
  ): void {
    try {
      const { roomId, playerId } = payload;
      const room = this.getRoom(roomId);
      
      if (!room) {
        return this.sendToClient(ws, {
          type: MessageType.ERROR,
          payload: { message: "Room not found" }
        });
      }
      
      if (room.getCreatedById() !== playerIdentifier.id) {
        return this.sendToClient(ws, {
          type: MessageType.ERROR,
          payload: { message: "Only the room creator can remove AI players" }
        });
      }
      
      if (!room.removeAIPlayer(playerId)) {
        return this.sendToClient(ws, {
          type: MessageType.ERROR,
          payload: { message: "Failed to remove AI player" }
        });
      }
      
      // Broadcast updated state
      room.broadcast({
        type: MessageType.ROOM_STATE,
        payload: { state: room.getState() }
      });
    } catch (error) {
      console.error('Error removing AI player:', error);
      this.sendToClient(ws, {
        type: MessageType.ERROR,
        payload: { message: "Failed to remove AI player" }
      });
    }
  }
  
  private handleChatMessage(
    ws: WebSocket, 
    payload: any, 
    playerIdentifier: { id: string, name: string }
  ): void {
    try {
      const { roomId, text } = payload;
      const room = this.getRoom(roomId);
      
      if (!room) {
        return this.sendToClient(ws, {
          type: MessageType.ERROR,
          payload: { message: "Room not found" }
        });
      }
      
      const chatMessage = room.addChatMessage(playerIdentifier.id, text);
      
      // Broadcast chat message to all players
      room.broadcast({
        type: MessageType.CHAT_MESSAGE,
        payload: { message: chatMessage }
      });
    } catch (error) {
      console.error('Error sending chat message:', error);
      this.sendToClient(ws, {
        type: MessageType.ERROR,
        payload: { message: "Failed to send chat message" }
      });
    }
  }
  
  private handleSwitchTeam(
    ws: WebSocket, 
    payload: any, 
    playerIdentifier: { id: string, name: string }
  ): void {
    try {
      const { roomId, teamId } = payload;
      const room = this.getRoom(roomId);
      
      if (!room) {
        return this.sendToClient(ws, {
          type: MessageType.ERROR,
          payload: { message: "Room not found" }
        });
      }
      
      // Only allowed in waiting room
      if (room.getState().gameStatus !== GameStatus.WAITING) {
        return this.sendToClient(ws, {
          type: MessageType.ERROR,
          payload: { message: "Cannot switch teams during a game" }
        });
      }
      
      if (!room.switchTeam(playerIdentifier.id, teamId)) {
        return this.sendToClient(ws, {
          type: MessageType.ERROR,
          payload: { message: "Failed to switch team" }
        });
      }
      
      // Broadcast updated state
      room.broadcast({
        type: MessageType.ROOM_STATE,
        payload: { state: room.getState() }
      });
    } catch (error) {
      console.error('Error switching team:', error);
      this.sendToClient(ws, {
        type: MessageType.ERROR,
        payload: { message: "Failed to switch team" }
      });
    }
  }
  
  private sendToClient(ws: WebSocket, message: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  public getRooms(): Room[] {
    return Array.from(this.rooms.values());
  }
}

// Create singleton instance
export const gameManager = new GameManager();
