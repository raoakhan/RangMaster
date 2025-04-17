import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { GameTable } from '@/components/game/game-table';
import { ChatOverlay } from '@/components/game/chat-overlay';
import { TrumpSelectionModal } from '@/components/modals/trump-selection-modal';
import { RoundResultsModal } from '@/components/modals/round-results-modal';
import { GameOverModal } from '@/components/modals/game-over-modal';
import { RoomSharingModal } from '@/components/modals/room-sharing-modal';
import { useGame } from '@/hooks/use-game';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@shared/schema';

// Chat message type
interface ChatMessage {
  id: string;
  sender: string;
  senderAvatar: string;
  message: string;
  isMine: boolean;
  teamOnly: boolean;
  teamNumber: number;
  timestamp: number;
}

export default function Game() {
  const { roomId } = useParams();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // UI state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [teamOnlyChat, setTeamOnlyChat] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  
  // Game hook
  const {
    gameState,
    playerId,
    isConnected,
    playCard,
    selectTrump,
    passTrumpSelection,
    readyForNextRound,
    sendChatMessage,
    toggleAudio,
    toggleVideo,
    getCurrentPlayer
  } = useGame({
    onError: (error) => {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }
  });
  
  // Handle chat messages
  const handleSendMessage = (message: string, teamOnly: boolean) => {
    if (sendChatMessage(message, teamOnly)) {
      // Add to local chat (optimistic update)
      const currentPlayer = getCurrentPlayer();
      if (currentPlayer) {
        const newMessage: ChatMessage = {
          id: `local-${Date.now()}`,
          sender: currentPlayer.username,
          senderAvatar: currentPlayer.avatar,
          message,
          isMine: true,
          teamOnly,
          teamNumber: currentPlayer.teamNumber,
          timestamp: Date.now()
        };
        
        setChatMessages(prev => [...prev, newMessage]);
      }
    }
  };
  
  // Check if current player needs to select trump
  const isTrumpSelector = 
    gameState?.status === 'trump-selection' && 
    gameState.trumpSelector === playerId;
  
  // Check if round is completed
  const isRoundCompleted = gameState?.status === 'round-end';
  
  // Check if game is over
  const isGameOver = gameState?.status === 'game-end';
  
  // Handle play card
  const handlePlayCard = (card: Card) => {
    playCard(card);
  };
  
  // Handle continue to next round
  const handleContinueToNextRound = () => {
    readyForNextRound();
  };
  
  // Handle play again (new game)
  const handlePlayAgain = () => {
    readyForNextRound();
  };
  
  // Redirect to lobby if not in a game
  useEffect(() => {
    if (gameState && gameState.status === 'waiting') {
      setLocation(`/room/${roomId}`);
    }
  }, [gameState, roomId, setLocation]);
  
  // If no room ID or no connection, redirect to home
  useEffect(() => {
    if (!roomId || !isConnected) {
      setLocation('/');
    }
  }, [roomId, isConnected, setLocation]);
  
  // If game state is not loaded yet, show loading
  if (!gameState) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-secondary-dark">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-primary rounded-full mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold">Loading game...</h2>
        </div>
      </div>
    );
  }
  
  // Get current player info
  const currentPlayer = getCurrentPlayer();
  const currentTeam = currentPlayer?.teamNumber || 1;
  
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden text-white bg-secondary-dark">
      {/* Header */}
      <header className="bg-secondary-dark py-2 px-4 flex justify-between items-center shadow-md z-10">
        <div className="flex items-center">
          <h1 className="text-2xl font-poppins font-bold text-white">
            <i className="fas fa-crown text-accent mr-2"></i>Rang
          </h1>
          <span className="ml-2 text-xs bg-primary px-2 py-1 rounded-full">BETA</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="bg-secondary-light/30 px-3 py-1 rounded-lg text-sm flex items-center">
            <i className="fas fa-users mr-2"></i>
            <span>Room: <span className="font-medium">{roomId}</span></span>
          </div>
          <button 
            className="bg-accent hover:bg-accent-dark text-black font-medium px-3 py-1 rounded-lg text-sm transition"
            onClick={() => setIsShareModalOpen(true)}
          >
            <i className="fas fa-share-alt mr-1"></i> Share
          </button>
          <div className="relative">
            {currentPlayer && (
              <div className={`w-8 h-8 rounded-full ${currentTeam === 1 ? 'bg-primary-light' : 'bg-red-500'} flex items-center justify-center`}>
                <span className="text-sm font-bold">{currentPlayer.avatar}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {gameState && (
          <GameTable
            gameState={gameState}
            playerId={playerId}
            onPlayCard={handlePlayCard}
            onToggleChat={() => setIsChatOpen(!isChatOpen)}
            onToggleVideo={toggleVideo}
            onToggleAudio={toggleAudio}
            onShowSettings={() => {}}
            isChatOpen={isChatOpen}
          />
        )}
      </main>
      
      {/* Chat Overlay */}
      <ChatOverlay
        isVisible={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={chatMessages}
        onSendMessage={handleSendMessage}
        teamNumber={currentTeam}
        teamOnly={teamOnlyChat}
        onToggleTeamOnly={() => setTeamOnlyChat(!teamOnlyChat)}
      />
      
      {/* Trump Selection Modal */}
      <TrumpSelectionModal
        isOpen={isTrumpSelector}
        onSelectTrump={selectTrump}
        onPassTrumpSelection={passTrumpSelection}
      />
      
      {/* Round Results Modal */}
      {gameState && (
        <RoundResultsModal
          isOpen={isRoundCompleted}
          gameState={gameState}
          onContinue={handleContinueToNextRound}
        />
      )}
      
      {/* Game Over Modal */}
      {gameState && (
        <GameOverModal
          isOpen={isGameOver}
          gameState={gameState}
          onPlayAgain={handlePlayAgain}
          onBackToLobby={() => setLocation(`/room/${roomId}`)}
        />
      )}
      
      {/* Room Sharing Modal */}
      <RoomSharingModal
        isOpen={isShareModalOpen}
        roomId={roomId}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
}
