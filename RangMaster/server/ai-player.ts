import { Card, GameState } from "@shared/schema";
import { CardSuit, CardValue } from "@shared/types";
import { CARD_POWER, AI_PLAY_DELAY } from "@shared/constants";
import { canPlayCard, isCardWinningOverCurrent } from "@shared/game-logic";
import { storage } from "./storage";
import { playCard, selectTrump, passTrumpSelection } from "./game-manager";

// Map of AI player IDs that are being managed
const aiPlayers = new Set<number>();

// Create an AI player that responds to game events
export function createAIPlayer(roomId: string, playerId: number): void {
  // Register this AI player
  aiPlayers.add(playerId);
  
  // Start checking for AI's turn periodically
  const interval = setInterval(async () => {
    // Check if AI player is still in the game
    if (!aiPlayers.has(playerId)) {
      clearInterval(interval);
      return;
    }
    
    // Get the current game state
    const gameState = await storage.getGameState(roomId);
    if (!gameState) {
      clearInterval(interval);
      aiPlayers.delete(playerId);
      return;
    }
    
    // Find the AI player
    const aiPlayer = gameState.players.find(p => p.id === playerId);
    if (!aiPlayer || aiPlayer.playerType !== 'ai') {
      clearInterval(interval);
      aiPlayers.delete(playerId);
      return;
    }
    
    // Handle trump selection
    if (gameState.status === 'trump-selection' && gameState.trumpSelector === playerId) {
      setTimeout(() => handleAITrumpSelection(roomId, playerId, gameState), AI_PLAY_DELAY);
    }
    
    // Handle card play
    if (gameState.status === 'playing' && gameState.currentTurn === aiPlayer.position) {
      setTimeout(() => handleAICardPlay(roomId, playerId, gameState), AI_PLAY_DELAY);
    }
  }, 1000); // Check every second
}

// Handle AI trump selection
async function handleAITrumpSelection(roomId: string, playerId: number, gameState: GameState): Promise<void> {
  const aiPlayer = gameState.players.find(p => p.id === playerId);
  if (!aiPlayer) return;
  
  // Count cards by suit to determine most common suit
  const suitCount: Record<CardSuit, number> = {
    'hearts': 0,
    'diamonds': 0,
    'clubs': 0,
    'spades': 0
  };
  
  // Also track power of cards in each suit
  const suitPower: Record<CardSuit, number> = {
    'hearts': 0,
    'diamonds': 0,
    'clubs': 0,
    'spades': 0
  };
  
  for (const card of aiPlayer.cards) {
    suitCount[card.suit]++;
    suitPower[card.suit] += CARD_POWER[card.value];
  }
  
  // Find suit with the most cards
  let bestSuit: CardSuit = 'hearts';
  let bestCount = 0;
  let bestPower = 0;
  
  for (const suit of Object.keys(suitCount) as CardSuit[]) {
    const count = suitCount[suit];
    const power = suitPower[suit];
    
    // Prefer suits with more cards, or higher power if tied
    if (count > bestCount || (count === bestCount && power > bestPower)) {
      bestSuit = suit;
      bestCount = count;
      bestPower = power;
    }
  }
  
  // If no strong preference, pass to partner 20% of the time
  if (bestCount < 4 && Math.random() < 0.2) {
    await passTrumpSelection(roomId, playerId);
    return;
  }
  
  // Select the best suit as trump
  await selectTrump(roomId, playerId, bestSuit);
}

// Handle AI card play
async function handleAICardPlay(roomId: string, playerId: number, gameState: GameState): Promise<void> {
  const aiPlayer = gameState.players.find(p => p.id === playerId);
  if (!aiPlayer) return;
  
  // Get playable cards according to rules
  const playableCards = aiPlayer.cards.filter(card => 
    canPlayCard(gameState, playerId, card)
  );
  
  if (playableCards.length === 0) return;
  
  let cardToPlay: Card;
  
  // If this is the first card of the trick
  if (gameState.leadSuit === null) {
    cardToPlay = chooseLeadCard(playableCards, gameState.trumpSuit, aiPlayer.teamNumber, gameState);
  } 
  // If this is the last card of the trick
  else if (gameState.cardsOnTable.filter(slot => slot.card !== null).length === 3) {
    cardToPlay = chooseLastCard(playableCards, gameState);
  }
  // Otherwise, choose a middle card
  else {
    cardToPlay = chooseMiddleCard(playableCards, gameState);
  }
  
  // Play the chosen card
  await playCard(roomId, playerId, cardToPlay);
}

// AI strategy: Choose the best card to lead a trick
function chooseLeadCard(
  playableCards: Card[], 
  trumpSuit: CardSuit | null,
  teamNumber: number,
  gameState: GameState
): Card {
  // If we have non-trump high cards, lead with those
  const highNonTrumpCards = playableCards
    .filter(card => trumpSuit === null || card.suit !== trumpSuit)
    .filter(card => CARD_POWER[card.value] >= 12) // A, K, Q
    .sort((a, b) => CARD_POWER[b.value] - CARD_POWER[a.value]);
  
  if (highNonTrumpCards.length > 0) {
    return highNonTrumpCards[0];
  }
  
  // If we have singleton suits, lead those (except trump)
  const suitCounts: Record<string, Card[]> = {};
  for (const card of playableCards) {
    if (!suitCounts[card.suit]) suitCounts[card.suit] = [];
    suitCounts[card.suit].push(card);
  }
  
  const singletons = Object.entries(suitCounts)
    .filter(([suit, cards]) => cards.length === 1 && suit !== trumpSuit)
    .map(([_, cards]) => cards[0]);
  
  if (singletons.length > 0) {
    return singletons[0];
  }
  
  // Otherwise, lead a mid-value card
  const midValueCards = playableCards
    .filter(card => CARD_POWER[card.value] >= 7 && CARD_POWER[card.value] <= 11) // J, 10, 9, 8, 7
    .sort((a, b) => CARD_POWER[a.value] - CARD_POWER[b.value]);
  
  if (midValueCards.length > 0) {
    return midValueCards[0];
  }
  
  // If all else fails, play the lowest card
  return playableCards
    .sort((a, b) => CARD_POWER[a.value] - CARD_POWER[b.value])[0];
}

// AI strategy: Choose the best card to play in the middle of a trick
function chooseMiddleCard(playableCards: Card[], gameState: GameState): Card {
  const { leadSuit, trumpSuit, cardsOnTable } = gameState;
  
  // Determine the current winning card
  let currentWinningCard: Card | null = null;
  let currentWinningPlayerId = 0;
  
  for (const slot of cardsOnTable) {
    if (!slot.card) continue;
    
    if (currentWinningCard === null || isCardWinningOverCurrent(
      slot.card, 
      currentWinningCard, 
      leadSuit!, 
      trumpSuit
    )) {
      currentWinningCard = slot.card;
      currentWinningPlayerId = slot.playerId;
    }
  }
  
  // Find our partner
  const aiPlayer = gameState.players.find(p => p.id === gameState.players[gameState.currentTurn].id);
  if (!aiPlayer) return playableCards[0];
  
  const partner = gameState.players.find(p => 
    p.teamNumber === aiPlayer.teamNumber && p.id !== aiPlayer.id
  );
  
  // If partner is winning, play a low card
  if (partner && currentWinningPlayerId === partner.id) {
    return playableCards
      .sort((a, b) => CARD_POWER[a.value] - CARD_POWER[b.value])[0];
  }
  
  // Try to win the trick with the lowest possible winning card
  const winningCards = playableCards.filter(card => 
    currentWinningCard === null || isCardWinningOverCurrent(
      card, 
      currentWinningCard, 
      leadSuit!, 
      trumpSuit
    )
  ).sort((a, b) => CARD_POWER[a.value] - CARD_POWER[b.value]);
  
  if (winningCards.length > 0) {
    return winningCards[0];
  }
  
  // If we can't win, play the lowest card
  return playableCards
    .sort((a, b) => CARD_POWER[a.value] - CARD_POWER[b.value])[0];
}

// AI strategy: Choose the best card to play as the last player in a trick
function chooseLastCard(playableCards: Card[], gameState: GameState): Card {
  const { leadSuit, trumpSuit, cardsOnTable } = gameState;
  
  // Determine the current winning card
  let currentWinningCard: Card | null = null;
  let currentWinningPlayerId = 0;
  
  for (const slot of cardsOnTable) {
    if (!slot.card) continue;
    
    if (currentWinningCard === null || isCardWinningOverCurrent(
      slot.card, 
      currentWinningCard, 
      leadSuit!, 
      trumpSuit
    )) {
      currentWinningCard = slot.card;
      currentWinningPlayerId = slot.playerId;
    }
  }
  
  // Find our partner
  const aiPlayer = gameState.players.find(p => p.id === gameState.players[gameState.currentTurn].id);
  if (!aiPlayer) return playableCards[0];
  
  const partner = gameState.players.find(p => 
    p.teamNumber === aiPlayer.teamNumber && p.id !== aiPlayer.id
  );
  
  // If partner is winning, play a low card
  if (partner && currentWinningPlayerId === partner.id) {
    return playableCards
      .sort((a, b) => CARD_POWER[a.value] - CARD_POWER[b.value])[0];
  }
  
  // Try to win the trick if possible
  const winningCards = playableCards.filter(card => 
    currentWinningCard === null || isCardWinningOverCurrent(
      card, 
      currentWinningCard, 
      leadSuit!, 
      trumpSuit
    )
  ).sort((a, b) => CARD_POWER[a.value] - CARD_POWER[b.value]);
  
  if (winningCards.length > 0) {
    return winningCards[0]; // Play the lowest winning card
  }
  
  // If we can't win, discard the highest losing card
  return playableCards
    .sort((a, b) => CARD_POWER[b.value] - CARD_POWER[a.value])[0];
}
