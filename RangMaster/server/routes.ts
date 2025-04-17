import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { z } from "zod";
import { ClientMessage, MessageType, ServerMessage } from "@shared/types";
import { 
  addAIPlayer, 
  broadcastToRoom, 
  createRoom, 
  handlePlayerDisconnect, 
  joinRoom, 
  passTrumpSelection, 
  playCard, 
  savePlayerConnection, 
  selectTrump, 
  sendToPlayer, 
  startGame, 
  startNewGame 
} from "./game-manager";
import { nanoid } from "nanoid";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time game communication
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws: WebSocket) => {
    let playerId: number | null = null;
    let roomId: string | null = null;
    
    // Keep-alive ping/pong
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
    
    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message) as ClientMessage;
        
        // Handle authentication message first
        if (data.type === 'authenticate') {
          const { id, username } = data.payload;
          // Respond with authenticated message
          ws.send(JSON.stringify({
            type: 'authenticated',
            payload: { id, username }
          }));
          // We don't need to do anything else with this message as this is just for connection establishment
          return;
        }
        
        switch (data.type as MessageType) {
          case 'create_room': {
            const { username, maxRounds, winningScore, enableAudio, enableVideo } = data.payload;
            
            // Create a temporary user for this session
            const user = await storage.createUser({
              username,
              password: nanoid() // Generate a random password for this temporary user
            });
            
            // Create the room with this user
            const result = await createRoom(user.id, username, maxRounds, winningScore, enableAudio, enableVideo);
            
            // Save connection for this player
            roomId = result.roomId;
            playerId = result.player.id;
            savePlayerConnection(roomId, playerId, ws);
            
            // Send room info back to the client
            ws.send(JSON.stringify({
              type: 'room_created',
              payload: {
                roomId: result.roomId,
                playerId: result.player.id,
                player: result.player
              }
            }));
            break;
          }
          
          case 'join_room': {
            const { roomId: joinRoomId, username } = data.payload;
            
            // Create a temporary user for this session
            const user = await storage.createUser({
              username,
              password: nanoid() // Generate a random password for this temporary user
            });
            
            // Join the room with this user
            const result = await joinRoom(joinRoomId, user.id, username);
            
            if (result.success && result.player) {
              // Save connection for this player
              roomId = joinRoomId;
              playerId = result.player.id;
              
              // Make sure roomId is not null before saving connection
              if (roomId) {
                savePlayerConnection(roomId, playerId, ws);
              }
              
              // Send room info back to the client
              ws.send(JSON.stringify({
                type: 'room_joined',
                payload: {
                  roomId: joinRoomId,
                  playerId: result.player.id,
                  player: result.player
                }
              }));
              
              // Send the current game state
              const gameState = await storage.getGameState(joinRoomId);
              if (gameState) {
                ws.send(JSON.stringify({
                  type: 'game_state_update',
                  payload: {
                    ...gameState,
                    players: gameState.players.map(p => ({
                      ...p,
                      // Only include the full hand for the current player
                      cards: p.id === result.player?.id ? p.cards : []
                    }))
                  }
                }));
              }
            } else {
              ws.send(JSON.stringify({
                type: 'error',
                payload: { message: result.error || 'Failed to join room' }
              }));
            }
            break;
          }
          
          case 'get_room_info': {
            const { roomId: requestRoomId } = data.payload;
            
            // Get room information
            const room = await storage.getRoom(requestRoomId);
            const gameState = await storage.getGameState(requestRoomId);
            
            if (room && gameState) {
              ws.send(JSON.stringify({
                type: 'room_info',
                payload: {
                  room,
                  gameState: {
                    ...gameState,
                    players: gameState.players.map(p => ({
                      ...p,
                      cards: [] // Don't send cards in room info
                    }))
                  }
                }
              }));
            } else {
              ws.send(JSON.stringify({
                type: 'error',
                payload: { message: 'Room not found' }
              }));
            }
            break;
          }
          
          case 'start_game': {
            if (!roomId) {
              ws.send(JSON.stringify({
                type: 'error',
                payload: { message: 'Not in a room' }
              }));
              break;
            }
            
            const result = await startGame(roomId);
            
            if (!result.success) {
              ws.send(JSON.stringify({
                type: 'error',
                payload: { message: result.error || 'Failed to start game' }
              }));
            }
            break;
          }
          
          case 'add_ai_player': {
            if (!roomId) {
              ws.send(JSON.stringify({
                type: 'error',
                payload: { message: 'Not in a room' }
              }));
              break;
            }
            
            const result = await addAIPlayer(roomId);
            
            if (!result.success) {
              ws.send(JSON.stringify({
                type: 'error',
                payload: { message: result.error || 'Failed to add AI player' }
              }));
            }
            break;
          }
          
          case 'select_trump': {
            if (!roomId || !playerId) {
              ws.send(JSON.stringify({
                type: 'error',
                payload: { message: 'Not in a room' }
              }));
              break;
            }
            
            const { suit } = data.payload;
            const result = await selectTrump(roomId, playerId, suit);
            
            if (!result.success) {
              ws.send(JSON.stringify({
                type: 'error',
                payload: { message: result.error || 'Failed to select trump' }
              }));
            }
            break;
          }
          
          case 'pass_trump': {
            if (!roomId || !playerId) {
              ws.send(JSON.stringify({
                type: 'error',
                payload: { message: 'Not in a room' }
              }));
              break;
            }
            
            const result = await passTrumpSelection(roomId, playerId);
            
            if (!result.success) {
              ws.send(JSON.stringify({
                type: 'error',
                payload: { message: result.error || 'Failed to pass trump selection' }
              }));
            }
            break;
          }
          
          case 'play_card': {
            if (!roomId || !playerId) {
              ws.send(JSON.stringify({
                type: 'error',
                payload: { message: 'Not in a room' }
              }));
              break;
            }
            
            const { card } = data.payload;
            const result = await playCard(roomId, playerId, card);
            
            if (!result.success) {
              ws.send(JSON.stringify({
                type: 'error',
                payload: { message: result.error || 'Failed to play card' }
              }));
            }
            break;
          }
          
          case 'ready_for_next_round': {
            if (!roomId) {
              ws.send(JSON.stringify({
                type: 'error',
                payload: { message: 'Not in a room' }
              }));
              break;
            }
            
            // Check if everyone is ready, then start next round
            const gameState = await storage.getGameState(roomId);
            if (gameState && gameState.status === 'round-end') {
              await startNewGame(roomId);
            }
            break;
          }
          
          case 'send_chat': {
            if (!roomId || !playerId) {
              ws.send(JSON.stringify({
                type: 'error',
                payload: { message: 'Not in a room' }
              }));
              break;
            }
            
            const { message: chatMessage, teamOnly } = data.payload;
            
            // Find the player
            const gameState = await storage.getGameState(roomId);
            if (!gameState) break;
            
            const player = gameState.players.find(p => p.id === playerId);
            if (!player) break;
            
            // If team-only message, only send to team members
            if (teamOnly) {
              const teamPlayers = gameState.players.filter(p => p.teamNumber === player.teamNumber);
              
              for (const teamPlayer of teamPlayers) {
                sendToPlayer(roomId, teamPlayer.id, {
                  type: 'chat_message',
                  payload: {
                    playerId,
                    playerName: player.username,
                    message: chatMessage,
                    teamOnly: true
                  }
                });
              }
            } else {
              // Broadcast to all players
              broadcastToRoom(roomId, {
                type: 'chat_message',
                payload: {
                  playerId,
                  playerName: player.username,
                  message: chatMessage,
                  teamOnly: false
                }
              });
            }
            break;
          }
          
          case 'toggle_audio': {
            if (!roomId) {
              ws.send(JSON.stringify({
                type: 'error',
                payload: { message: 'Not in a room' }
              }));
              break;
            }
            
            const gameState = await storage.getGameState(roomId);
            if (!gameState) break;
            
            await storage.updateGameState(roomId, {
              enableAudio: !gameState.enableAudio
            });
            
            // Broadcast updated setting
            broadcastToRoom(roomId, {
              type: 'game_state_update',
              payload: {
                ...gameState,
                enableAudio: !gameState.enableAudio
              }
            });
            break;
          }
          
          case 'toggle_video': {
            if (!roomId) {
              ws.send(JSON.stringify({
                type: 'error',
                payload: { message: 'Not in a room' }
              }));
              break;
            }
            
            const gameState = await storage.getGameState(roomId);
            if (!gameState) break;
            
            await storage.updateGameState(roomId, {
              enableVideo: !gameState.enableVideo
            });
            
            // Broadcast updated setting
            broadcastToRoom(roomId, {
              type: 'game_state_update',
              payload: {
                ...gameState,
                enableVideo: !gameState.enableVideo
              }
            });
            break;
          }
          
          case 'pong':
            // Received pong, no need to handle
            break;
            
          default:
            ws.send(JSON.stringify({
              type: 'error',
              payload: { message: 'Unknown message type' }
            }));
        }
      } catch (err) {
        console.error('Error processing message:', err);
        ws.send(JSON.stringify({
          type: 'error',
          payload: { message: 'Failed to process message' }
        }));
      }
    });
    
    ws.on('close', () => {
      clearInterval(pingInterval);
      
      // Handle player disconnection
      if (roomId && playerId) {
        handlePlayerDisconnect(roomId, playerId);
      }
    });
  });
  
  // API routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });
  
  return httpServer;
}
