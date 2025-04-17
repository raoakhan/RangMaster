import { PlayerState } from '@shared/schema';
import { motion } from 'framer-motion';
import { PlayingCard, SmallCard } from '../ui/card-components';
import { cn } from '@/lib/utils';

export function PlayerPosition({
  position,
  player,
  isActive = false,
  isCurrentPlayer = false,
  onPlayCard
}: {
  position: 'top' | 'right' | 'bottom' | 'left';
  player: PlayerState;
  isActive?: boolean;
  isCurrentPlayer?: boolean;
  onPlayCard?: (card: { suit: string; value: string }) => void;
}) {
  // Layout-specific styles based on position
  const containerStyles = {
    top: "absolute top-4 left-1/2 transform -translate-x-1/2 text-center",
    right: "absolute right-4 top-1/2 transform -translate-y-1/2 text-center",
    bottom: "absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center",
    left: "absolute left-4 top-1/2 transform -translate-y-1/2 text-center"
  };
  
  const innerContainerStyles = {
    top: "flex flex-col items-center",
    right: "flex items-center",
    bottom: "flex flex-col items-center",
    left: "flex items-center"
  };
  
  const cardContainerStyles = {
    top: "mt-1 flex justify-center",
    right: "flex flex-col",
    bottom: "mt-2 flex justify-center mb-2",
    left: "flex flex-col"
  };
  
  const avatarOrderStyles = {
    top: "",
    right: "order-last ml-2",
    bottom: "",
    left: "mr-2"
  };
  
  return (
    <div className={containerStyles[position]}>
      <div className={innerContainerStyles[position]}>
        {/* Show cards appropriate to position */}
        {position !== 'bottom' ? (
          <div className={cardContainerStyles[position]}>
            {player.cards.map((_, index) => (
              <SmallCard 
                key={index}
                orientation={position === 'top' || position === 'bottom' ? 'vertical' : 'horizontal'} 
              />
            ))}
          </div>
        ) : null}
        
        <div className={cn("flex flex-col items-center", avatarOrderStyles[position])}>
          <div className="relative mb-1">
            <div 
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center shadow-lg",
                player.teamNumber === 1 ? "bg-primary-light" : "bg-red-500",
                isActive && "player-active"
              )}
            >
              <span className="text-lg font-bold">{player.avatar}</span>
            </div>
            <div 
              className={cn(
                "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-secondary-dark flex items-center justify-center",
                player.isConnected ? "bg-green-500" : "bg-red-500"
              )}
            >
              <i className={`fas fa-${player.isConnected ? 'wifi' : 'times'} text-xs`}></i>
            </div>
          </div>
          <div className="font-medium text-sm bg-secondary-dark/70 px-2 py-0.5 rounded-lg shadow-lg mt-1">
            {isCurrentPlayer ? "You" : player.username}
          </div>
        </div>
        
        {/* Show playable cards for bottom position (current player) */}
        {position === 'bottom' && (
          <div className={cardContainerStyles[position]}>
            {player.cards.map((card, index) => (
              <PlayingCard
                key={`${card.suit}-${card.value}-${index}`}
                card={card}
                size="lg"
                onClick={onPlayCard ? () => onPlayCard(card) : undefined}
                className="-mx-2"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
