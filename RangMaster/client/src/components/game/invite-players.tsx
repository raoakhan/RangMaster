import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/game-store";
import { useToast } from "@/hooks/use-toast";

interface InvitePlayersProps {
  onClose: () => void;
}

export function InvitePlayers({ onClose }: InvitePlayersProps) {
  const { roomCode, addAIPlayer } = useGameStore();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(true);
  
  const roomUrl = `${window.location.origin}/room/${roomCode}`;
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(roomUrl);
    toast({
      title: "Copied!",
      description: "Room link copied to clipboard",
    });
  };
  
  const handleAddAI = (teamId: number) => {
    addAIPlayer(teamId);
    toast({
      title: "AI Player Added",
      description: `Added AI player to Team ${teamId + 1}`,
    });
  };
  
  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 200);
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-neutral-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-poppins font-bold">Invite Players</h2>
              <button className="text-neutral-400 hover:text-white" onClick={handleClose}>
                <span className="material-icons">close</span>
              </button>
            </div>
            
            <p className="text-neutral-300 mb-4">Share this link with friends to join your game:</p>
            
            <div className="flex mb-6">
              <input 
                type="text" 
                value={roomUrl} 
                className="flex-1 bg-neutral-900 border border-neutral-700 rounded-l-md px-3 py-2 text-sm" 
                readOnly 
              />
              <button 
                className="bg-primary-700 hover:bg-primary-600 px-3 py-2 rounded-r-md flex items-center"
                onClick={handleCopyLink}
              >
                <span className="material-icons text-sm">content_copy</span>
              </button>
            </div>
            
            <div className="border-t border-neutral-700 pt-4">
              <h3 className="text-sm font-medium mb-2">Add AI Players</h3>
              <div className="flex flex-wrap gap-2">
                <button 
                  className="px-3 py-1 bg-primary-700 hover:bg-primary-600 rounded-md text-sm flex items-center gap-1"
                  onClick={() => handleAddAI(0)}
                >
                  <span className="material-icons text-xs">smart_toy</span>
                  <span>Add to Team 1</span>
                </button>
                <button 
                  className="px-3 py-1 bg-secondary-700 hover:bg-secondary-600 rounded-md text-sm flex items-center gap-1"
                  onClick={() => handleAddAI(1)}
                >
                  <span className="material-icons text-xs">smart_toy</span>
                  <span>Add to Team 2</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
