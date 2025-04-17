import { motion } from "framer-motion";
import { PlayerInfo } from "@shared/types";

interface PlayerPodProps {
  player: PlayerInfo;
  position: "top" | "left" | "right" | "bottom";
  isCurrentPlayer: boolean;
  isTeammate: boolean;
  cardCount: number;
}

export function PlayerPod({ 
  player, 
  position, 
  isCurrentPlayer, 
  isTeammate,
  cardCount 
}: PlayerPodProps) {
  // Position styles
  const positionStyles: Record<string, string> = {
    top: "absolute top-2 left-1/2 transform -translate-x-1/2 flex flex-col items-center",
    left: "absolute left-2 top-1/2 transform -translate-y-1/2 flex flex-col items-center",
    right: "absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col items-center",
    bottom: "absolute bottom-2 left-1/2 transform -translate-x-1/2 flex flex-col items-center"
  };
  
  // Card orientation based on position
  const cardStyles: Record<string, string> = {
    top: "card w-6 h-10 -ml-4 first:ml-0 bg-neutral-800 rounded-md border-2 border-neutral-700 transform rotate-180",
    left: "card w-10 h-6 -mt-4 first:mt-0 bg-neutral-800 rounded-md border-2 border-neutral-700 transform -rotate-90",
    right: "card w-10 h-6 -mt-4 first:mt-0 bg-neutral-800 rounded-md border-2 border-neutral-700 transform rotate-90",
    bottom: "card w-6 h-10 -ml-4 first:ml-0 bg-neutral-800 rounded-md border-2 border-neutral-700"
  };
  
  // Container for cards based on position
  const cardContainerStyles: Record<string, string> = {
    top: "flex mt-2 relative",
    left: "flex flex-col mt-2 relative",
    right: "flex flex-col mt-2 relative",
    bottom: "flex mt-2 relative"
  };
  
  // Team color
  const teamColor = isTeammate ? "text-primary-500" : "text-secondary-500";
  const avatarColor = isTeammate ? "bg-primary-700" : "bg-secondary-700";
  
  return (
    <div className={`${positionStyles[position]} ${isCurrentPlayer ? 'player-active' : ''}`}>
      <motion.div 
        className={`player-avatar w-12 h-12 rounded-full ${avatarColor} flex items-center justify-center overflow-hidden`}
        animate={{
          scale: isCurrentPlayer ? [1, 1.1, 1] : 1,
          boxShadow: isCurrentPlayer ? "0 0 15px rgba(16, 185, 129, 0.7)" : "none"
        }}
        transition={{ repeat: isCurrentPlayer ? Infinity : 0, duration: 2 }}
      >
        {player.name.charAt(0).toUpperCase()}
      </motion.div>
      
      <div className="mt-1 px-3 py-1 bg-neutral-800 bg-opacity-80 rounded-full text-xs text-center">
        <span className={`${teamColor} font-medium`}>{player.name}</span>
        {isCurrentPlayer ? (
          <div className="ml-1 inline-flex items-center">
            <span className="material-icons text-accent-500 text-xs">circle</span>
            <span className="material-icons text-accent-500 text-xs animate-pulse my-turn">more_time</span>
          </div>
        ) : (
          <span className="ml-2 text-xs flex items-center gap-1">
            <span className="material-icons text-xs">cards</span>
            <span>{cardCount}</span>
          </span>
        )}
      </div>
      
      {/* Cards in hand (face down) */}
      <div className={cardContainerStyles[position]}>
        {Array.from({ length: cardCount }).map((_, i) => (
          <div key={i} className={cardStyles[position]}></div>
        ))}
      </div>
    </div>
  );
}
