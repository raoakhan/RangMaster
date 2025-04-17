import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/game-store";
import { useUserStore } from "@/store/user-store";
import { PlayerPod } from "./player-pod";
import { Card } from "./card";
import { GameStatus } from "@shared/types";

export function CardTable() {
  const { id: userId } = useUserStore();
  const { 
    roomState, 
    playerHand, 
    centerCards, 
    isYourTurn, 
    playCard 
  } = useGameStore();
  
  // Calculate player positions
  const players = roomState?.players || [];
  const userIndex = players.findIndex(p => p.id === userId);
  
  // Get teams
  const teams = roomState?.teams || [];
  
  // Calculate player order based on current player
  const orderedPlayers = userIndex !== -1 ? [
    ...players.slice(userIndex),
    ...players.slice(0, userIndex)
  ] : players;
  
  // Track positions of players
  const getPosition = (index: number) => {
    if (index === 0) return "bottom";
    if (index === 1) return "left";
    if (index === 2) return "top";
    if (index === 3) return "right";
    return "bottom";
  };
  
  const getTeam = (playerId: string) => {
    for (const team of teams) {
      if (team.players.some(p => p.id === playerId)) {
        return team;
      }
    }
    return null;
  };
  
  // Helper to get player's teammate
  const isTeammate = (playerId: string) => {
    if (!userId) return false;
    
    const userTeam = getTeam(userId);
    const playerTeam = getTeam(playerId);
    
    return userTeam && playerTeam && userTeam.id === playerTeam.id;
  };
  
  return (
    <div className="flex-1 flex flex-col">
      {/* Game Information Bar */}
      <div className="bg-neutral-800 border-b border-neutral-700 p-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            <span className="material-icons text-primary-500 mr-1">meeting_room</span>
            <span className="text-sm">Room: <span className="font-medium">{roomState?.name || 'Game Room'}</span></span>
          </div>
          <div className="hidden sm:flex items-center">
            <span className="material-icons text-accent-500 mr-1">timer</span>
            <span className="text-sm">In progress</span>
          </div>
        </div>
        
        {/* Trump Indicator */}
        {roomState?.trumpSuit && (
          <div className="trump-indicator flex items-center bg-neutral-900 px-3 py-1 rounded-full">
            <span className="text-sm mr-2">Trump:</span>
            <div 
              className={`bg-white h-6 w-6 rounded-full flex items-center justify-center font-bold ${roomState.trumpSuit === 'hearts' || roomState.trumpSuit === 'diamonds' ? 'text-red-600' : 'text-black'}`}
            >
              {roomState.trumpSuit === 'hearts' && '♥'}
              {roomState.trumpSuit === 'diamonds' && '♦'}
              {roomState.trumpSuit === 'clubs' && '♣'}
              {roomState.trumpSuit === 'spades' && '♠'}
            </div>
          </div>
        )}
        
        <div className="flex gap-2">
          <button className="p-2 rounded-full hover:bg-neutral-700" title="Game Settings">
            <span className="material-icons">settings</span>
          </button>
          <button className="p-2 rounded-full hover:bg-neutral-700" title="Game Rules">
            <span className="material-icons">help_outline</span>
          </button>
        </div>
      </div>

      {/* Card Table */}
      <div className="flex-1 card-table relative flex flex-col">
        {/* Player pods */}
        {orderedPlayers.map((player, index) => {
          if (index === 0) return null; // Bottom player is handled separately
          
          const position = getPosition(index);
          const isCurrentPlayer = player.id === roomState?.currentPlayerId;
          const teammate = isTeammate(player.id);
          
          return (
            <PlayerPod 
              key={player.id}
              player={player}
              position={position}
              isCurrentPlayer={isCurrentPlayer}
              isTeammate={teammate}
              cardCount={roomState?.gameStatus === GameStatus.WAITING ? 0 : 8} // Default to 8 when game starts
            />
          );
        })}
        
        {/* Center Play Area */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-48 h-48 rounded-full border-4 border-dashed border-white border-opacity-20 flex items-center justify-center">
            {/* Played cards in center */}
            <div className="relative pointer-events-auto">
              <AnimatePresence>
                {centerCards.map((card, index) => {
                  // Position cards based on index
                  const positions = [
                    { top: "-40px", left: "-25px" },
                    { top: "10px", left: "-60px" },
                    { top: "20px", left: "-20px" },
                    { top: "-10px", left: "10px" }
                  ];
                  
                  const position = positions[index % positions.length];
                  
                  return (
                    <motion.div
                      key={`${card.suit}-${card.value}`}
                      className="absolute"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1, ...position }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card card={card} />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>
        
        {/* Bottom Player (You) */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
          <div className="flex items-center justify-center mb-1">
            {/* Your cards in hand */}
            <div className="flex relative">
              <AnimatePresence>
                {playerHand.map((card, index) => (
                  <motion.div
                    key={card.id}
                    className="card mx-1 transform transition-transform hover:-translate-y-4 hover:z-10"
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    onClick={() => {
                      if (isYourTurn && roomState?.gameStatus === GameStatus.IN_PROGRESS) {
                        playCard({ suit: card.suit, value: card.value });
                      }
                    }}
                    style={{ cursor: isYourTurn ? 'pointer' : 'default' }}
                  >
                    <Card card={card} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
          
          {/* Player info */}
          {userId && (
            <div className="bg-neutral-800 px-3 py-2 rounded-full flex items-center">
              <div className="player-avatar w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center overflow-hidden">
                {orderedPlayers[0]?.name?.charAt(0) || 'Y'}
              </div>
              <span className="ml-2 text-primary-500 font-medium">You</span>
              <div className="flex ml-3">
                <button className="p-1 rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors" title="Toggle Video">
                  <span className="material-icons text-sm">videocam</span>
                </button>
                <button className="p-1 rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors ml-1" title="Toggle Audio">
                  <span className="material-icons text-sm">mic</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
