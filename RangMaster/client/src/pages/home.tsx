import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useGameContext } from '@/context/game-context';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [view, setView] = useState<'main' | 'create' | 'join'>('main');
  const [maxRounds, setMaxRounds] = useState(5);
  const [winningScore, setWinningScore] = useState(101);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  
  const {
    createRoom,
    joinRoom,
    roomId,
    isConnected,
    isLoading,
  } = useGameContext();
  
  const handleCreateRoom = () => {
    if (!username) {
      toast({
        title: "Username required",
        description: "Please enter a username to create a room",
        variant: "destructive",
      });
      return;
    }
    
    setIsCreatingRoom(true);
    const success = createRoom(username, maxRounds, winningScore);
    
    if (!success) {
      setIsCreatingRoom(false);
      toast({
        title: "Connection Error",
        description: "Unable to connect to server. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleJoinRoom = () => {
    if (!username || !roomCode) {
      toast({
        title: "Information required",
        description: "Please enter both username and room code",
        variant: "destructive",
      });
      return;
    }
    
    setIsJoiningRoom(true);
    const success = joinRoom(roomCode, username);
    
    if (!success) {
      setIsJoiningRoom(false);
      toast({
        title: "Connection Error",
        description: "Unable to connect to server. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Reset loading states when connection is lost
  useEffect(() => {
    if (!isConnected) {
      setIsCreatingRoom(false);
      setIsJoiningRoom(false);
    }
  }, [isConnected]);
  
  // Reset loading states when loading is done
  useEffect(() => {
    if (!isLoading) {
      setIsCreatingRoom(false);
      setIsJoiningRoom(false);
    }
  }, [isLoading]);
  
  // Redirect to lobby if room is created or joined
  useEffect(() => {
    if (roomId) {
      setLocation(`/room/${roomId}`);
    }
  }, [roomId, setLocation]);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary-dark to-secondary flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Main Menu */}
        {view === 'main' && (
          <Card className="border-primary bg-secondary-dark/90 shadow-xl backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="mx-auto text-4xl font-bold mb-2 text-white">
                <i className="fas fa-crown text-accent mr-2"></i>Rang
              </div>
              <CardTitle className="text-2xl">Pakistani Card Game</CardTitle>
              <CardDescription>Play the classic trick-taking game online with friends</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Button onClick={() => setView('create')} className="h-14 text-lg">
                <i className="fas fa-plus mr-2"></i> Create New Game
              </Button>
              <Button variant="secondary" onClick={() => setView('join')} className="h-14 text-lg">
                <i className="fas fa-sign-in-alt mr-2"></i> Join Game
              </Button>
            </CardContent>
            <CardFooter className="text-sm text-center text-muted-foreground">
              <p className="w-full">A 2v2 team card game with tricks and trump suits</p>
            </CardFooter>
          </Card>
        )}
        
        {/* Create Room Form */}
        {view === 'create' && (
          <Card className="border-primary bg-secondary-dark/90 shadow-xl backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Create New Game</CardTitle>
              <CardDescription>Set up a new Rang game room</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Your Name</Label>
                <Input
                  id="username"
                  placeholder="Enter your name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="rounds">Number of Rounds</Label>
                <Input
                  id="rounds"
                  type="number"
                  min={1}
                  max={10}
                  value={maxRounds}
                  onChange={(e) => setMaxRounds(parseInt(e.target.value) || 5)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="winningScore">Winning Score</Label>
                <Input
                  id="winningScore"
                  type="number"
                  min={50}
                  max={200}
                  step={10}
                  value={winningScore}
                  onChange={(e) => setWinningScore(parseInt(e.target.value) || 101)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setView('main')}>
                Back
              </Button>
              <Button 
                onClick={handleCreateRoom} 
                disabled={isCreatingRoom}
                className="bg-accent hover:bg-accent-dark text-black"
              >
                {isCreatingRoom ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-play mr-2"></i>
                    Create Room
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}
        
        {/* Join Room Form */}
        {view === 'join' && (
          <Card className="border-primary bg-secondary-dark/90 shadow-xl backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Join Game</CardTitle>
              <CardDescription>Enter a room code to join an existing game</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="join-username">Your Name</Label>
                <Input
                  id="join-username"
                  placeholder="Enter your name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="roomCode">Room Code</Label>
                <Input
                  id="roomCode"
                  placeholder="Enter 6-digit room code"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  maxLength={6}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setView('main')}>
                Back
              </Button>
              <Button 
                onClick={handleJoinRoom} 
                disabled={isJoiningRoom}
                className="bg-accent hover:bg-accent-dark text-black"
              >
                {isJoiningRoom ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Joining...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt mr-2"></i>
                    Join Room
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
      
      <div className="mt-8 text-white/60 text-sm">
        <p>
          Rang (Trump) is a popular Pakistani card game played in teams.
        </p>
      </div>
    </div>
  );
}
