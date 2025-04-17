import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGameStore } from "@/store/game-store";
import { useToast } from "@/hooks/use-toast";

export function JoinRoom() {
  const [roomCode, setRoomCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const joinRoom = useGameStore((state) => state.joinRoom);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomCode.trim()) {
      toast({
        title: "Room code required",
        description: "Please enter a room code to join",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsJoining(true);
      joinRoom(roomCode);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join room. Please check the code and try again.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="room-code">Room Code</Label>
        <Input
          id="room-code"
          placeholder="Enter room code"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          className="bg-neutral-700 border-neutral-600"
          disabled={isJoining}
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full"
        disabled={isJoining}
      >
        {isJoining ? "Joining..." : "Join Room"}
      </Button>
    </form>
  );
}
