import { Card, GameState } from "./schema";
import { CardSuit, Position } from "./types";
import { CARD_POWER } from "./constants";

/**
 * Check if a card can be played based on the game rules
 * @param gameState Current game state
 * @param playerId Player attempting to play
 * @param card Card being played
 */
export function canPlayCard(gameState: GameState, playerId: number, card: Card): boolean {
  // Check if it's the player's turn
  const playerState = gameState.players.find(p => p.id === playerId);
  if (!playerState || gameState.currentTurn !== playerState.position) {
    return false;
  }

  // Check if player has the card
  if (!playerState.cards.some(c => c.suit === card.suit && c.value === card.value)) {
    return false;
  }

  // If this is the first card in the trick, any card can be played
  if (gameState.leadSuit === null) {
    return true;
  }

  // Check if player has any cards of the lead suit
  const hasLeadSuit = playerState.cards.some(c => c.suit === gameState.leadSuit);

  // If player has cards of lead suit, they must play one of those
  if (hasLeadSuit && card.suit !== gameState.leadSuit) {
    return false;
  }

  // Otherwise, any card can be played
  return true;
}

/**
 * Determine the winner of a trick
 * @param gameState Current game state
 * @returns Position of the winning player
 */
export function determineTrickWinner(gameState: GameState): Position {
  const { cardsOnTable, leadSuit, trumpSuit } = gameState;

  // Find highest card of lead suit or trump suit
  let winningCard: Card | null = null;
  let winningPosition: Position = 0;

  for (let i = 0; i < cardsOnTable.length; i++) {
    const entry = cardsOnTable[i];
    if (!entry.card) continue;

    const isCurrentWinner = isCardWinningOverCurrent(
      entry.card,
      winningCard,
      leadSuit!,
      trumpSuit
    );

    if (isCurrentWinner) {
      winningCard = entry.card;
      winningPosition = gameState.players.find(p => p.id === entry.playerId)?.position as Position;
    }
  }

  return winningPosition;
}

/**
 * Check if a new card beats the current winning card
 */
export function isCardWinningOverCurrent(
  newCard: Card,
  currentWinningCard: Card | null,
  leadSuit: CardSuit,
  trumpSuit: CardSuit | null
): boolean {
  // If no current winning card, the new card wins
  if (!currentWinningCard) return true;

  // Trump beats non-trump
  if (trumpSuit && newCard.suit === trumpSuit && currentWinningCard.suit !== trumpSuit) {
    return true;
  }

  // Non-trump cannot beat trump
  if (trumpSuit && currentWinningCard.suit === trumpSuit && newCard.suit !== trumpSuit) {
    return false;
  }

  // Both trump or both not trump
  if (newCard.suit === currentWinningCard.suit) {
    // Higher value of same suit wins
    return CARD_POWER[newCard.value] > CARD_POWER[currentWinningCard.value];
  }

  // Only lead suit can win if no trump is played
  return trumpSuit ? false : newCard.suit === leadSuit;
}

/**
 * Calculate the score for a team based on tricks won
 * @param tricksWon Number of tricks won
 * @returns Score for the tricks
 */
export function calculateScore(tricksWon: number): number {
  return tricksWon;
}

/**
 * Check if team has completed their bid
 * @param team Team state
 * @returns Whether the team completed their bid
 */
export function checkRoundWinner(gameState: GameState): number {
  const team1Tricks = gameState.teams.find(t => t.teamNumber === 1)?.tricks || 0;
  const team2Tricks = gameState.teams.find(t => t.teamNumber === 2)?.tricks || 0;
  
  if (team1Tricks > team2Tricks) return 1;
  if (team2Tricks > team1Tricks) return 2;
  return 0; // Tie
}

/**
 * Check if the game is over (a team has reached the winning score)
 * @param gameState Current game state
 * @returns Team number of winner, or 0 if no winner yet
 */
export function checkGameWinner(gameState: GameState): number {
  for (const team of gameState.teams) {
    if (team.score >= gameState.winningScore) {
      return team.teamNumber;
    }
  }
  
  // Check if we've reached max rounds
  if (gameState.round >= gameState.maxRounds) {
    const team1Score = gameState.teams.find(t => t.teamNumber === 1)?.score || 0;
    const team2Score = gameState.teams.find(t => t.teamNumber === 2)?.score || 0;
    
    if (team1Score > team2Score) return 1;
    if (team2Score > team1Score) return 2;
    return 0; // Tie
  }
  
  return 0; // No winner yet
}

/**
 * Get the next position after the current position
 * @param currentPosition Current position
 * @returns Next position
 */
export function getNextPosition(currentPosition: Position): Position {
  return ((currentPosition + 1) % 4) as Position;
}

/**
 * Get the team number for a position
 * @param position Player position
 * @returns Team number (1 or 2)
 */
export function getTeamForPosition(position: Position): 1 | 2 {
  // Positions 0 and 2 are team 1, positions 1 and 3 are team 2
  return (position % 2 === 0 ? 1 : 2) as 1 | 2;
}

/**
 * Get positions for a specific team
 * @param teamNumber Team number
 * @returns Array of positions for that team
 */
export function getPositionsForTeam(teamNumber: 1 | 2): Position[] {
  return teamNumber === 1 ? [0, 2] : [1, 3];
}

/**
 * Get the partner position for a given position
 * @param position Player position
 * @returns Partner's position
 */
export function getPartnerPosition(position: Position): Position {
  return ((position + 2) % 4) as Position;
}
