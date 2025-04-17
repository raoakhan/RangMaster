import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useGame } from '@/hooks/use-game';
import { RoomSharingModal } from '@/components/modals/room-sharing-modal';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function Lobby() {
  const { roomId } = useParams();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  
  // On component mount, get a username from localStorage or generate one
  useEffect(() => {
    const generateUsername = () => {
      // Get existing username or generate a new one
      const storedId = localStorage.getItem('temp_user_id');
      if (storedId) {
        return 'Guest-' + storedId.substring(0, 6);
      }
      
      const id = Math.random().toString(36).substring(2, 8);
      localStorage.setItem('temp_user_id', id);
      return 'Guest-' + id;
    };
    
    setUsername(generateUsername());
  }, []);
  
  const {
    gameState,
    playerId,
    startGame,
    addAIPlayer,
    isConnected,
    joinRoom
  } = useGame({
    onError: (error) => {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }
  });
  
  // Automatically join the room when we have a roomId and username
  useEffect(() => {
    if (roomId && username && isConnected) {
      joinRoom(roomId, username);
    }
  }, [roomId, username, isConnected, joinRoom]);
  
  // Redirect to game page if game is started
  useEffect(() => {
    if (gameState && gameState.status !== 'waiting') {
      setLocation(`/game/${roomId}`);
    }
  }, [gameState, roomId, setLocation]);
  
  // Show error if not connected
  useEffect(() => {
    if (!isConnected) {
      toast({
        title: "Connection Error",
        description: "You are not connected to the game server. Please try again.",
        variant: "destructive",
      });
    }
  }, [isConnected, toast]);
  
  // If no room ID, redirect to home
  useEffect(() => {
    if (!roomId) {
      setLocation('/');
    }
  }, [roomId, setLocation]);
  
  // Current user is room creator if they are in position 0
  const isCreator = gameState?.players.some(p => p.id === playerId && p.position === 0);
  
  // Check if we have enough players to start
  const canStartGame = gameState?.players.length === 4;
  
  // Group players by team
  const team1Players = gameState?.players.filter(p => p.teamNumber === 1) || [];
  const team2Players = gameState?.players.filter(p => p.teamNumber === 2) || [];
  
  const handleStartGame = () => {
    if (roomId) {
      startGame();
    }
  };
  
  const handleAddAI = () => {
    if (roomId) {
      addAIPlayer();
    }
  };
  
  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-secondary-dark to-secondary flex items-center justify-center">
        <Card className="w-96 border-primary bg-secondary-dark/90 shadow-xl backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-center">Loading...</CardTitle>
            <CardDescription className="text-center">
              Connecting to room {roomId}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary-dark to-secondary p-4 flex flex-col">
      <header className="py-2 px-4 bg-secondary-dark/90 rounded-lg shadow-md flex justify-between items-center mb-4">
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
          <Button 
            onClick={() => setIsShareModalOpen(true)}
            className="bg-accent hover:bg-accent-dark text-black font-medium px-3 py-1 rounded-lg text-sm"
          >
            <i className="fas fa-share-alt mr-1"></i> Share
          </Button>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center">
        <Card className="w-full max-w-xl border-primary bg-secondary-dark/90 shadow-xl backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl">Game Lobby</CardTitle>
            <CardDescription>
              Waiting for players to join. You need 4 players to start.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Team 1 */}
              <div className="bg-primary/20 p-3 rounded-lg">
                <h3 className="font-semibold text-primary-light mb-2 flex items-center">
                  Team 1
                  <Badge variant="outline" className="ml-2 bg-primary text-white">
                    {team1Players.length}/2 Players
                  </Badge>
                </h3>
                <div className="space-y-2">
                  {team1Players.map(player => (
                    <div 
                      key={player.id}
                      className="flex items-center bg-secondary-dark/50 p-2 rounded-md"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center mr-2">
                        <span className="font-bold">{player.avatar}</span>
                      </div>
                      <div>
                        <p className="font-medium">{player.username}</p>
                        <p className="text-xs text-white/60">
                          {player.playerType === 'ai' ? 'AI Bot' : 'Human Player'}
                          {player.id === playerId && ' (You)'}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {team1Players.length < 2 && (
                    <div className="border-2 border-dashed border-primary/30 p-2 rounded-md text-center text-white/50">
                      Waiting for player...
                    </div>
                  )}
                </div>
              </div>
              
              {/* Team 2 */}
              <div className="bg-red-500/20 p-3 rounded-lg">
                <h3 className="font-semibold text-red-400 mb-2 flex items-center">
                  Team 2
                  <Badge variant="outline" className="ml-2 bg-red-500 text-white">
                    {team2Players.length}/2 Players
                  </Badge>
                </h3>
                <div className="space-y-2">
                  {team2Players.map(player => (
                    <div 
                      key={player.id}
                      className="flex items-center bg-secondary-dark/50 p-2 rounded-md"
                    >
                      <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center mr-2">
                        <span className="font-bold">{player.avatar}</span>
                      </div>
                      <div>
                        <p className="font-medium">{player.username}</p>
                        <p className="text-xs text-white/60">
                          {player.playerType === 'ai' ? 'AI Bot' : 'Human Player'}
                          {player.id === playerId && ' (You)'}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {team2Players.length < 2 && (
                    <div className="border-2 border-dashed border-red-500/30 p-2 rounded-md text-center text-white/50">
                      Waiting for player...
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4 justify-center">
              {/* Only show Add AI button if the room isn't full */}
              {gameState.players.length < 4 && (
                <Button 
                  onClick={handleAddAI}
                  variant="secondary"
                  className="space-x-2"
                >
                  <i className="fas fa-robot"></i>
                  <span>Add AI Player</span>
                </Button>
              )}
              
              {/* Only show Start Game button for the room creator */}
              {isCreator && (
                <Button 
                  onClick={handleStartGame} 
                  disabled={!canStartGame}
                  className={`bg-accent hover:bg-accent-dark text-black ${!canStartGame ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <i className="fas fa-play mr-2"></i>
                  Start Game
                </Button>
              )}
              
              <Button 
                onClick={() => setLocation('/')}
                variant="outline"
              >
                Leave Room
              </Button>
            </div>
            
            {isCreator && !canStartGame && (
              <p className="text-sm text-white/70 text-center">
                You need 4 players to start the game. Invite friends or add AI players.
              </p>
            )}
            
            {!isCreator && (
              <p className="text-sm text-white/70 text-center">
                Waiting for the room creator to start the game...
              </p>
            )}
          </CardContent>
        </Card>
      </main>
      
      <RoomSharingModal
        isOpen={isShareModalOpen}
        roomId={roomId}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
}
