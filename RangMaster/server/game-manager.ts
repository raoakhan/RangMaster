import { GameState, PlayerState, TeamState, Card } from "@shared/schema";
import { CardSuit, CardValue, PlayerType, Position } from "@shared/types";
import { CARD_SUITS, CARD_VALUES, DEFAULT_MAX_ROUNDS, DEFAULT_WINNING_SCORE, MAX_PLAYERS, MAX_CARDS_PER_PLAYER, TEAM_1, TEAM_2, TRICK_COMPLETION_TIMEOUT } from "@shared/constants";
import { canPlayCard, checkGameWinner, checkRoundWinner, determineTrickWinner, getNextPosition, getTeamForPosition } from "@shared/game-logic";
import { storage } from "./storage";
import { createAIPlayer } from "./ai-player";
import { WebSocket } from "ws";
import { nanoid } from "nanoid";

// Map of roomId to array of connected WebSocket clients
const roomConnections = new Map<string, Map<number, WebSocket>>();

// Generate a random 6-character room code
export function generateRoomCode(): string {
  return nanoid(6).toUpperCase();
}

// Create a new game room
export async function createRoom(
  createdBy: number, 
  username: string,
  maxRounds = DEFAULT_MAX_ROUNDS,
  winningScore = DEFAULT_WINNING_SCORE,
  enableAudio = false,
  enableVideo = false
): Promise<{ roomId: string; player: PlayerState }> {
  const roomId = generateRoomCode();
  
  // Create the room in storage
  await storage.createRoom({
    id: roomId,
    createdById: createdBy,
    createdAt: new Date().toISOString(),
    config: {
      maxRounds,
      winningScore,
      enableAudio,
      enableVideo
    }
  });
  
  // Create the first player
  const player = await storage.createPlayer({
    roomId,
    userId: createdBy,
    position: 0, // First player is at position 0
    teamNumber: TEAM_1, // First player is in team 1
    playerType: 'human'
  });
  
  // Create initial game state
  const initialState: GameState = {
    roomId,
    status: 'waiting',
    players: [{
      id: player.id,
      username,
      position: player.position,
      teamNumber: player.teamNumber,
      playerType: player.playerType,
      isConnected: true,
      isActive: false,
      cards: [],
      avatar: username.charAt(0).toUpperCase()
    }],
    teams: [
      { teamNumber: TEAM_1, score: 0, tricks: 0 },
      { teamNumber: TEAM_2, score: 0, tricks: 0 }
    ],
    round: 0,
    maxRounds,
    trick: 0,
    maxTricks: MAX_CARDS_PER_PLAYER,
    trumpSuit: null,
    trumpSelector: null,
    currentTurn: 0,
    leadSuit: null,
    cardsOnTable: [
      { playerId: player.id, card: null },
      { playerId: 0, card: null },
      { playerId: 0, card: null },
      { playerId: 0, card: null }
    ],
    winningScore,
    lastTrickWinner: null,
    enableAudio,
    enableVideo,
    messages: []
  };
  
  await storage.saveGameState(initialState);
  
  // Initialize the connections map for this room
  roomConnections.set(roomId, new Map());
  
  return { 
    roomId, 
    player: initialState.players[0]
  };
}

// Add a player to a room
export async function joinRoom(
  roomId: string, 
  userId: number, 
  username: string
): Promise<{ success: boolean; player?: PlayerState; error?: string }> {
  // Get the game state
  const gameState = await storage.getGameState(roomId);
  if (!gameState) {
    return { success: false, error: 'Room not found' };
  }
  
  // Check if game is full
  if (gameState.players.filter(p => p.playerType === 'human').length >= MAX_PLAYERS) {
    return { success: false, error: 'Room is full' };
  }
  
  // Check if player is already in the room
  const existingPlayer = gameState.players.find(p => p.username === username);
  if (existingPlayer) {
    // Update connection status for returning player
    const updatedPlayers = gameState.players.map(p => 
      p.id === existingPlayer.id ? { ...p, isConnected: true } : p
    );
    
    await storage.updateGameState(roomId, { players: updatedPlayers });
    
    return { success: true, player: existingPlayer };
  }
  
  // Find the next available position
  const occupiedPositions = new Set(gameState.players.map(p => p.position));
  let position: Position | undefined;
  
  for (let i = 0; i < MAX_PLAYERS; i++) {
    if (!occupiedPositions.has(i)) {
      position = i as Position;
      break;
    }
  }
  
  if (position === undefined) {
    return { success: false, error: 'No available positions' };
  }
  
  // Determine team based on position
  const teamNumber = getTeamForPosition(position);
  
  // Create new player
  const player = await storage.createPlayer({
    roomId,
    userId,
    position,
    teamNumber,
    playerType: 'human'
  });
  
  // Update game state with new player
  const playerState: PlayerState = {
    id: player.id,
    username,
    position: player.position,
    teamNumber: player.teamNumber,
    playerType: player.playerType,
    isConnected: true,
    isActive: false,
    cards: [],
    avatar: username.charAt(0).toUpperCase()
  };
  
  gameState.players.push(playerState);
  gameState.cardsOnTable[position] = { playerId: player.id, card: null };
  
  await storage.updateGameState(roomId, { players: gameState.players, cardsOnTable: gameState.cardsOnTable });
  
  // Broadcast player joined to all clients
  broadcastToRoom(roomId, {
    type: 'player_joined',
    payload: { player: playerState }
  });
  
  return { success: true, player: playerState };
}

// Add an AI player to a room
export async function addAIPlayer(roomId: string): Promise<{ success: boolean; player?: PlayerState; error?: string }> {
  // Get the game state
  const gameState = await storage.getGameState(roomId);
  if (!gameState) {
    return { success: false, error: 'Room not found' };
  }
  
  // Check if game is full
  if (gameState.players.length >= MAX_PLAYERS) {
    return { success: false, error: 'Room is full' };
  }
  
  // Find the next available position
  const occupiedPositions = new Set(gameState.players.map(p => p.position));
  let position: Position | undefined;
  
  for (let i = 0; i < MAX_PLAYERS; i++) {
    if (!occupiedPositions.has(i)) {
      position = i as Position;
      break;
    }
  }
  
  if (position === undefined) {
    return { success: false, error: 'No available positions' };
  }
  
  // Determine team based on position
  const teamNumber = getTeamForPosition(position);
  
  // Generate AI name
  const aiNames = ['AI-Bot', 'RoboCard', 'CardMaster', 'TrumpBot'];
  const aiName = aiNames[Math.floor(Math.random() * aiNames.length)];
  
  // Create new AI player
  const player = await storage.createPlayer({
    roomId,
    userId: 0, // AI players have userId 0
    position,
    teamNumber,
    playerType: 'ai'
  });
  
  // Update game state with new AI player
  const playerState: PlayerState = {
    id: player.id,
    username: aiName,
    position: player.position,
    teamNumber: player.teamNumber,
    playerType: player.playerType,
    isConnected: true,
    isActive: false,
    cards: [],
    avatar: aiName.charAt(0).toUpperCase()
  };
  
  gameState.players.push(playerState);
  gameState.cardsOnTable[position] = { playerId: player.id, card: null };
  
  await storage.updateGameState(roomId, { players: gameState.players, cardsOnTable: gameState.cardsOnTable });
  
  // Create AI player handler
  createAIPlayer(roomId, playerState.id);
  
  // Broadcast player joined to all clients
  broadcastToRoom(roomId, {
    type: 'player_joined',
    payload: { player: playerState }
  });
  
  return { success: true, player: playerState };
}

// Start a game
export async function startGame(roomId: string): Promise<{ success: boolean; error?: string }> {
  const gameState = await storage.getGameState(roomId);
  if (!gameState) {
    return { success: false, error: 'Room not found' };
  }
  
  // Need exactly 4 players to start
  if (gameState.players.length !== MAX_PLAYERS) {
    // Auto-fill with AI players
    const playersNeeded = MAX_PLAYERS - gameState.players.length;
    for (let i = 0; i < playersNeeded; i++) {
      await addAIPlayer(roomId);
    }
  }
  
  // Start first round
  await startRound(roomId);
  
  return { success: true };
}

// Start a round
export async function startRound(roomId: string): Promise<void> {
  const gameState = await storage.getGameState(roomId);
  if (!gameState) return;
  
  // Increment round
  const round = gameState.round + 1;
  
  // Reset trick count
  for (const team of gameState.teams) {
    team.tricks = 0;
  }
  
  // Deal cards
  const allCards = generateDeck();
  const shuffledDeck = shuffleDeck(allCards);
  
  const players = [...gameState.players];
  const cardsPerPlayer = MAX_CARDS_PER_PLAYER;
  
  for (let i = 0; i < players.length; i++) {
    players[i].cards = shuffledDeck.slice(i * cardsPerPlayer, (i + 1) * cardsPerPlayer);
    players[i].isActive = false;
  }
  
  // Determine who selects trump (it rotates each round)
  const trumpSelectorPosition = ((round - 1) % MAX_PLAYERS) as Position;
  const trumpSelector = players.find(p => p.position === trumpSelectorPosition)?.id || null;
  
  // Clear table
  const cardsOnTable = gameState.cardsOnTable.map(slot => ({ ...slot, card: null }));
  
  // Update game state
  await storage.updateGameState(roomId, {
    status: 'trump-selection',
    players,
    round,
    trick: 0,
    trumpSuit: null,
    trumpSelector,
    currentTurn: trumpSelectorPosition,
    leadSuit: null,
    cardsOnTable,
    lastTrickWinner: null,
    messages: []
  });
  
  // Request trump selection from the selector
  broadcastToRoom(roomId, {
    type: 'trump_selection_request',
    payload: { playerId: trumpSelector }
  });
  
  // Send game state update to all clients
  const updatedState = await storage.getGameState(roomId);
  if (updatedState) {
    broadcastGameState(roomId, updatedState);
  }
}

// Select trump suit
export async function selectTrump(
  roomId: string, 
  playerId: number, 
  suit: CardSuit
): Promise<{ success: boolean; error?: string }> {
  const gameState = await storage.getGameState(roomId);
  if (!gameState) {
    return { success: false, error: 'Room not found' };
  }
  
  // Verify it's the right player selecting
  if (gameState.trumpSelector !== playerId) {
    return { success: false, error: 'Not your turn to select trump' };
  }
  
  // Set the trump suit and start playing
  await storage.updateGameState(roomId, {
    status: 'playing',
    trumpSuit: suit,
    currentTurn: gameState.trumpSelector === null ? 0 : gameState.players.find(p => p.id === gameState.trumpSelector)?.position || 0,
    messages: [
      ...gameState.messages,
      { 
        id: nanoid(), 
        text: `Trump is ${suit}`, 
        timeout: Date.now() + 5000 
      }
    ]
  });
  
  // Send game state update to all clients
  const updatedState = await storage.getGameState(roomId);
  if (updatedState) {
    broadcastGameState(roomId, updatedState);
  }
  
  return { success: true };
}

// Pass trump selection to partner
export async function passTrumpSelection(
  roomId: string, 
  playerId: number
): Promise<{ success: boolean; error?: string }> {
  const gameState = await storage.getGameState(roomId);
  if (!gameState) {
    return { success: false, error: 'Room not found' };
  }
  
  // Verify it's the right player
  if (gameState.trumpSelector !== playerId) {
    return { success: false, error: 'Not your turn to select trump' };
  }
  
  // Find the player
  const player = gameState.players.find(p => p.id === playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }
  
  // Find partner (player on the same team, different position)
  const partner = gameState.players.find(
    p => p.teamNumber === player.teamNumber && p.position !== player.position
  );
  
  if (!partner) {
    return { success: false, error: 'Partner not found' };
  }
  
  // Update trump selector
  await storage.updateGameState(roomId, {
    trumpSelector: partner.id,
    currentTurn: partner.position,
    messages: [
      ...gameState.messages,
      { 
        id: nanoid(), 
        text: `${player.username} passed trump selection to ${partner.username}`, 
        timeout: Date.now() + 5000 
      }
    ]
  });
  
  // Request trump selection from partner
  broadcastToRoom(roomId, {
    type: 'trump_selection_request',
    payload: { playerId: partner.id }
  });
  
  // Send game state update to all clients
  const updatedState = await storage.getGameState(roomId);
  if (updatedState) {
    broadcastGameState(roomId, updatedState);
  }
  
  return { success: true };
}

// Play a card
export async function playCard(
  roomId: string, 
  playerId: number, 
  card: Card
): Promise<{ success: boolean; error?: string }> {
  const gameState = await storage.getGameState(roomId);
  if (!gameState) {
    return { success: false, error: 'Room not found' };
  }
  
  // Check if the game is in playing state
  if (gameState.status !== 'playing') {
    return { success: false, error: 'Game is not in playing state' };
  }
  
  // Find the player
  const playerIndex = gameState.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) {
    return { success: false, error: 'Player not found' };
  }
  
  const player = gameState.players[playerIndex];
  
  // Verify it's the player's turn
  if (gameState.currentTurn !== player.position) {
    return { success: false, error: 'Not your turn' };
  }
  
  // Check if the card can be played according to game rules
  if (!canPlayCard(gameState, playerId, card)) {
    return { success: false, error: 'Invalid play - you must follow suit if possible' };
  }
  
  // If this is the first card of the trick, set the lead suit
  const leadSuit = gameState.leadSuit === null ? card.suit : gameState.leadSuit;
  
  // Remove the card from player's hand
  const updatedPlayers = [...gameState.players];
  updatedPlayers[playerIndex] = {
    ...player,
    cards: player.cards.filter(c => !(c.suit === card.suit && c.value === card.value))
  };
  
  // Place the card on the table
  const tablePosition = player.position;
  const updatedCardsOnTable = [...gameState.cardsOnTable];
  updatedCardsOnTable[tablePosition] = { playerId, card };
  
  // Find the next player
  const nextPosition = getNextPosition(player.position);
  
  // Update game state
  await storage.updateGameState(roomId, {
    players: updatedPlayers,
    leadSuit,
    cardsOnTable: updatedCardsOnTable,
    currentTurn: nextPosition
  });
  
  // Broadcast that a card was played
  broadcastToRoom(roomId, {
    type: 'card_played',
    payload: { playerId, card, position: player.position }
  });
  
  // Check if trick is complete (all 4 cards played)
  if (updatedCardsOnTable.every(slot => slot.card !== null)) {
    // Wait a moment before completing the trick (for UI animation)
    setTimeout(() => completeTrick(roomId), TRICK_COMPLETION_TIMEOUT);
  }
  
  // Send game state update to all clients
  const updatedState = await storage.getGameState(roomId);
  if (updatedState) {
    broadcastGameState(roomId, updatedState);
  }
  
  return { success: true };
}

// Complete a trick
async function completeTrick(roomId: string): Promise<void> {
  const gameState = await storage.getGameState(roomId);
  if (!gameState || gameState.status !== 'playing') return;
  
  // Determine who won the trick
  const winnerPosition = determineTrickWinner(gameState);
  const winner = gameState.players.find(p => p.position === winnerPosition);
  
  if (!winner) return;
  
  // Increment trick count for the winning team
  const updatedTeams = gameState.teams.map(team => 
    team.teamNumber === winner.teamNumber
      ? { ...team, tricks: team.tricks + 1 }
      : team
  );
  
  // Clear the table
  const clearedTable = gameState.cardsOnTable.map(slot => ({ ...slot, card: null }));
  
  // Increment trick counter
  const trick = gameState.trick + 1;
  
  // Add message about trick winner
  const updatedMessages = [
    ...gameState.messages.filter(msg => Date.now() < msg.timeout),
    { id: nanoid(), text: `${winner.username} won the trick!`, timeout: Date.now() + 5000 }
  ];
  
  // Update game state
  await storage.updateGameState(roomId, {
    teams: updatedTeams,
    cardsOnTable: clearedTable,
    currentTurn: winnerPosition,
    leadSuit: null,
    trick,
    lastTrickWinner: winner.id,
    messages: updatedMessages
  });
  
  // Broadcast trick completion
  broadcastToRoom(roomId, {
    type: 'trick_completed',
    payload: { winnerId: winner.id, winnerPosition, team: winner.teamNumber }
  });
  
  // Send game state update to all clients
  const updatedState = await storage.getGameState(roomId);
  if (!updatedState) return;
  
  broadcastGameState(roomId, updatedState);
  
  // Check if round is complete (all tricks played)
  if (trick >= gameState.maxTricks) {
    // Wait a moment before completing the round
    setTimeout(() => completeRound(roomId), TRICK_COMPLETION_TIMEOUT);
  }
}

// Complete a round
async function completeRound(roomId: string): Promise<void> {
  const gameState = await storage.getGameState(roomId);
  if (!gameState) return;
  
  // Determine round winner
  const winningTeam = checkRoundWinner(gameState);
  
  // Award points to winning team
  const updatedTeams = gameState.teams.map(team => {
    if (team.teamNumber === winningTeam) {
      return {
        ...team,
        score: team.score + team.tricks
      };
    }
    return team;
  });
  
  // Update game state
  await storage.updateGameState(roomId, {
    status: 'round-end',
    teams: updatedTeams
  });
  
  // Broadcast round completion
  broadcastToRoom(roomId, {
    type: 'round_completed',
    payload: {
      winningTeam,
      teams: updatedTeams,
      round: gameState.round
    }
  });
  
  // Check if game is complete (winning score reached or max rounds played)
  const gameWinner = checkGameWinner({ ...gameState, teams: updatedTeams });
  
  if (gameWinner > 0) {
    await completeGame(roomId, gameWinner);
  }
  
  // Send game state update to all clients
  const updatedState = await storage.getGameState(roomId);
  if (updatedState) {
    broadcastGameState(roomId, updatedState);
  }
}

// Complete the game
async function completeGame(roomId: string, winningTeam: number): Promise<void> {
  const gameState = await storage.getGameState(roomId);
  if (!gameState) return;
  
  // Update game state
  await storage.updateGameState(roomId, {
    status: 'game-end'
  });
  
  // Broadcast game completion
  broadcastToRoom(roomId, {
    type: 'game_completed',
    payload: {
      winningTeam,
      teams: gameState.teams,
      players: gameState.players
    }
  });
  
  // Send game state update to all clients
  const updatedState = await storage.getGameState(roomId);
  if (updatedState) {
    broadcastGameState(roomId, updatedState);
  }
}

// Start a new game with the same players
export async function startNewGame(roomId: string): Promise<{ success: boolean; error?: string }> {
  const gameState = await storage.getGameState(roomId);
  if (!gameState) {
    return { success: false, error: 'Room not found' };
  }
  
  // Reset the game state, keeping players
  const resetState: GameState = {
    ...gameState,
    status: 'waiting',
    round: 0,
    trick: 0,
    trumpSuit: null,
    trumpSelector: null,
    leadSuit: null,
    lastTrickWinner: null,
    teams: gameState.teams.map(team => ({ ...team, score: 0, tricks: 0 })),
    players: gameState.players.map(player => ({ ...player, cards: [], isActive: false })),
    cardsOnTable: gameState.cardsOnTable.map(slot => ({ ...slot, card: null })),
    messages: []
  };
  
  await storage.saveGameState(resetState);
  
  // Start the game
  return startGame(roomId);
}

// Handle player disconnection
export async function handlePlayerDisconnect(roomId: string, playerId: number): Promise<void> {
  const gameState = await storage.getGameState(roomId);
  if (!gameState) return;
  
  // Find the player
  const playerIndex = gameState.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) return;
  
  // Update connection status
  const updatedPlayers = [...gameState.players];
  updatedPlayers[playerIndex] = {
    ...updatedPlayers[playerIndex],
    isConnected: false
  };
  
  await storage.updateGameState(roomId, { players: updatedPlayers });
  
  // Broadcast player disconnection
  broadcastToRoom(roomId, {
    type: 'player_left',
    payload: { playerId }
  });
  
  // Check if all human players have left
  const allHumansDisconnected = updatedPlayers
    .filter(p => p.playerType === 'human')
    .every(p => !p.isConnected);
  
  // If all humans left, clean up the room
  if (allHumansDisconnected) {
    // Remove all connections
    roomConnections.delete(roomId);
    
    // Mark the room as inactive
    await storage.updateRoom(roomId, { isActive: false });
    
    // Clean up game state
    await storage.deleteGameState(roomId);
  } else {
    // Send game state update to all clients
    const updatedState = await storage.getGameState(roomId);
    if (updatedState) {
      broadcastGameState(roomId, updatedState);
    }
  }
}

// Save WebSocket connection for a player
export function savePlayerConnection(roomId: string, playerId: number, ws: WebSocket): void {
  let roomWsMap = roomConnections.get(roomId);
  if (!roomWsMap) {
    roomWsMap = new Map();
    roomConnections.set(roomId, roomWsMap);
  }
  
  roomWsMap.set(playerId, ws);
}

// Remove WebSocket connection for a player
export function removePlayerConnection(roomId: string, playerId: number): void {
  const roomWsMap = roomConnections.get(roomId);
  if (roomWsMap) {
    roomWsMap.delete(playerId);
    if (roomWsMap.size === 0) {
      roomConnections.delete(roomId);
    }
  }
}

// Broadcast a message to all players in a room
export function broadcastToRoom(roomId: string, message: any): void {
  const roomWsMap = roomConnections.get(roomId);
  if (!roomWsMap) return;
  
  const messageStr = JSON.stringify(message);
  
  for (const ws of roomWsMap.values()) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(messageStr);
    }
  }
}

// Broadcast game state to all players in a room, filtering out other players' cards
export function broadcastGameState(roomId: string, gameState: GameState): void {
  const roomWsMap = roomConnections.get(roomId);
  if (!roomWsMap) return;
  
  // For each player, create a filtered game state that hides other players' cards
  for (const [playerId, ws] of roomWsMap.entries()) {
    if (ws.readyState === WebSocket.OPEN) {
      const playerSpecificState = {
        ...gameState,
        players: gameState.players.map(player => ({
          ...player,
          // Only include the full hand for the current player
          cards: player.id === playerId ? player.cards : player.cards.map(() => ({ suit: 'hidden', value: 'hidden' } as Card))
        }))
      };
      
      ws.send(JSON.stringify({
        type: 'game_state_update',
        payload: playerSpecificState
      }));
    }
  }
}

// Send a message to a specific player
export function sendToPlayer(roomId: string, playerId: number, message: any): void {
  const roomWsMap = roomConnections.get(roomId);
  if (!roomWsMap) return;
  
  const ws = roomWsMap.get(playerId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

// Generate a complete deck of cards
function generateDeck(): Card[] {
  const deck: Card[] = [];
  
  for (const suit of CARD_SUITS) {
    for (const value of CARD_VALUES) {
      deck.push({ suit, value });
    }
  }
  
  return deck;
}

// Shuffle a deck of cards
function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}
