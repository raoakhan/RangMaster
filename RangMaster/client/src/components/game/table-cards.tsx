import { Card, GameState, PlayerState } from '@shared/schema';
import { motion } from 'framer-motion';
import { TableCard } from '../ui/card-components';
import { cn } from '@/lib/utils';

export function TableCards({
  gameState,
  currentPlayerId
}: {
  gameState: GameState;
  currentPlayerId: number | null;
}) {
  const { cardsOnTable, players, currentTurn } = gameState;
  
  // Find current player
  const currentPlayer = currentPlayerId ? players.find(p => p.id === currentPlayerId) : null;
  const currentPlayerPosition = currentPlayer?.position ?? -1;
  
  // Get player at each relative position
  const positionMap: Record<number, 'top' | 'right' | 'bottom' | 'left'> = 
    currentPlayerPosition === 0 ? { 0: 'bottom', 1: 'left', 2: 'top', 3: 'right' } :
    currentPlayerPosition === 1 ? { 0: 'right', 1: 'bottom', 2: 'left', 3: 'top' } :
    currentPlayerPosition === 2 ? { 0: 'top', 1: 'right', 2: 'bottom', 3: 'left' } :
                                 { 0: 'left', 1: 'top', 2: 'right', 3: 'bottom' };
  
  // Current player's turn
  const currentTurnPlayer = players.find(p => p.position === currentTurn);
  
  return (
    <div className="relative w-64 h-64 rounded-full border-4 border-primary-dark/30 flex items-center justify-center">
      {/* Top card */}
      <div className="absolute top-4 transform -translate-y-1/2">
        <TableCard 
          position="top"
          card={getCardForPosition(cardsOnTable, players, currentPlayerPosition, 'top')} 
        />
      </div>
      
      {/* Left card */}
      <div className="absolute left-4 transform -translate-x-1/2">
        <TableCard 
          position="left"
          card={getCardForPosition(cardsOnTable, players, currentPlayerPosition, 'left')} 
        />
      </div>
      
      {/* Right card */}
      <div className="absolute right-4 transform translate-x-1/2">
        <TableCard 
          position="right"
          card={getCardForPosition(cardsOnTable, players, currentPlayerPosition, 'right')} 
        />
      </div>
      
      {/* Bottom card */}
      <div className="absolute bottom-4 transform translate-y-1/2">
        <TableCard 
          position="bottom"
          card={getCardForPosition(cardsOnTable, players, currentPlayerPosition, 'bottom')} 
        />
      </div>
      
      {/* Center game status */}
      <div className="bg-primary-dark/70 px-3 py-1 rounded-lg text-sm shadow-md backdrop-blur-sm">
        <div className="text-center font-medium">
          <i className="fas fa-hourglass-half text-accent mr-1"></i>
          <span>
            {currentTurnPlayer ? 
              (currentTurnPlayer.id === currentPlayerId ? 
                "Your turn" : 
                `${currentTurnPlayer.username}'s turn`) :
              "Waiting..."}
          </span>
        </div>
      </div>
    </div>
  );
}

// Helper function to get the card for a specific position
function getCardForPosition(
  cardsOnTable: { playerId: number; card: Card | null }[],
  players: PlayerState[],
  currentPlayerPosition: number,
  position: 'top' | 'right' | 'bottom' | 'left'
): Card | null {
  // Map visual positions to actual positions based on current player
  const actualPositionMap: Record<string, number> = {
    'bottom': currentPlayerPosition,
    'left': (currentPlayerPosition + 1) % 4,
    'top': (currentPlayerPosition + 2) % 4,
    'right': (currentPlayerPosition + 3) % 4
  };
  
  const actualPosition = actualPositionMap[position];
  const player = players.find(p => p.position === actualPosition);
  
  if (!player) return null;
  
  // Find the card played by this player
  const cardEntry = cardsOnTable.find(entry => entry.playerId === player.id);
  return cardEntry ? cardEntry.card : null;
}
