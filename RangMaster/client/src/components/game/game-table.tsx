import { GameState, PlayerState } from '@shared/schema';
import { TableCards } from './table-cards';
import { PlayerPosition } from './player-position';
import { ScoreBoard } from './score-board';
import { RoundInfo } from './round-info';
import { GameControls } from './game-controls';
import { GameMessages } from './game-messages';
import { useState, useEffect } from 'react';
import { Card } from '@shared/schema';
import { cn } from '@/lib/utils';

interface GameTableProps {
  gameState: GameState;
  playerId: number | null;
  onPlayCard: (card: Card) => void;
  onToggleChat: () => void;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onShowSettings: () => void;
  isChatOpen?: boolean;
}

export function GameTable({
  gameState,
  playerId,
  onPlayCard,
  onToggleChat,
  onToggleVideo,
  onToggleAudio,
  onShowSettings,
  isChatOpen = false
}: GameTableProps) {
  // Get current player
  const currentPlayer = playerId 
    ? gameState.players.find(p => p.id === playerId) 
    : null;
  
  // Get relative positions
  const positions = currentPlayer 
    ? getRelativePositions(currentPlayer.position, gameState.players)
    : {
        bottom: null,
        left: null,
        top: null,
        right: null
      };

  // Get active player
  const activePlayerPosition = gameState.currentTurn;
  const isActivePlayer = (player: PlayerState | null) => {
    return player?.position === activePlayerPosition;
  };
  
  return (
    <div className="game-table flex-1 rounded-3xl m-4 relative flex flex-col items-center justify-center">
      {/* Score Board */}
      <ScoreBoard gameState={gameState} />
      
      {/* Players */}
      {positions.top && (
        <PlayerPosition 
          position="top" 
          player={positions.top} 
          isActive={isActivePlayer(positions.top)}
          isCurrentPlayer={positions.top.id === playerId}
        />
      )}
      
      {positions.left && (
        <PlayerPosition 
          position="left" 
          player={positions.left} 
          isActive={isActivePlayer(positions.left)}
          isCurrentPlayer={positions.left.id === playerId}
        />
      )}
      
      {positions.right && (
        <PlayerPosition 
          position="right" 
          player={positions.right} 
          isActive={isActivePlayer(positions.right)}
          isCurrentPlayer={positions.right.id === playerId}
        />
      )}
      
      {positions.bottom && (
        <PlayerPosition 
          position="bottom" 
          player={positions.bottom} 
          isActive={isActivePlayer(positions.bottom)}
          isCurrentPlayer={positions.bottom.id === playerId}
          onPlayCard={onPlayCard}
        />
      )}
      
      {/* Center Table Cards */}
      <TableCards gameState={gameState} currentPlayerId={playerId} />
      
      {/* Game Controls */}
      <GameControls 
        onToggleChat={onToggleChat}
        onToggleVideo={onToggleVideo}
        onToggleAudio={onToggleAudio}
        onShowSettings={onShowSettings}
        isVideoEnabled={gameState.enableVideo}
        isAudioEnabled={gameState.enableAudio}
        isChatOpen={isChatOpen}
      />
      
      {/* Round Info */}
      <RoundInfo gameState={gameState} />
      
      {/* Game Messages */}
      <GameMessages messages={gameState.messages} />
    </div>
  );
}

// Helper function to get players at relative positions
function getRelativePositions(
  currentPosition: number,
  players: PlayerState[]
): Record<string, PlayerState> {
  const result: Record<string, PlayerState> = {
    bottom: players.find(p => p.position === currentPosition)!,
    left: players.find(p => p.position === (currentPosition + 1) % 4)!,
    top: players.find(p => p.position === (currentPosition + 2) % 4)!,
    right: players.find(p => p.position === (currentPosition + 3) % 4)!
  };
  
  return result;
}
