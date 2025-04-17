import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGameStore } from "@/store/game-store";
import { useToast } from "@/hooks/use-toast";

export function CreateRoom() {
  const [roomName, setRoomName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const createRoom = useGameStore((state) => state.createRoom);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomName.trim()) {
      toast({
        title: "Room name required",
        description: "Please enter a name for your room",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsCreating(true);
      createRoom(roomName);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create room. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="room-name">Room Name</Label>
        <Input
          id="room-name"
          placeholder="Enter room name"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          className="bg-neutral-700 border-neutral-600"
          disabled={isCreating}
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full"
        disabled={isCreating}
      >
        {isCreating ? "Creating..." : "Create Room"}
      </Button>
    </form>
  );
}
