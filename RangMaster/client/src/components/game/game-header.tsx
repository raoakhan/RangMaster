import { useState } from "react";
import { useLocation } from "wouter";
import { useUserStore } from "@/store/user-store";
import { useGameStore } from "@/store/game-store";
import { Button } from "@/components/ui/button";
import { GameStatus } from "@shared/types";

interface GameHeaderProps {
  onInviteClick: () => void;
}

export function GameHeader({ onInviteClick }: GameHeaderProps) {
  const [, setLocation] = useLocation();
  const { username, clearUser } = useUserStore();
  const { roomState, leaveRoom, startGame } = useGameStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  const handleLeaveGame = () => {
    leaveRoom();
    setLocation("/");
  };
  
  const handleSignOut = () => {
    clearUser();
    leaveRoom();
    setLocation("/");
  };
  
  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };
  
  const canStartGame = roomState?.gameStatus === GameStatus.WAITING;
  
  return (
    <header className="bg-neutral-800 py-3 px-4 shadow-lg z-10">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="font-poppins font-bold text-2xl text-primary-500">Rang</span>
          <span className="bg-primary-700 text-xs px-2 py-1 rounded-full">BETA</span>
        </div>
        
        <div className="flex items-center gap-4">
          {canStartGame && (
            <Button 
              variant="default"
              size="sm"
              onClick={() => startGame()}
              className="bg-accent-500 hover:bg-accent-600"
            >
              Start Game
            </Button>
          )}
          
          <button 
            className="bg-primary-700 hover:bg-primary-900 px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
            onClick={onInviteClick}
          >
            <span className="material-icons text-sm">people</span>
            <span className="hidden sm:inline">Invite Players</span>
          </button>
          
          <div className="relative">
            <button 
              className="flex items-center gap-2"
              onClick={toggleUserMenu}
            >
              <div className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center overflow-hidden">
                {username ? username.charAt(0).toUpperCase() : "U"}
              </div>
              <span className="hidden sm:inline">{username}</span>
              <span className="material-icons text-sm">arrow_drop_down</span>
            </button>
            
            {/* User dropdown menu */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-neutral-800 rounded-md shadow-lg z-20 border border-neutral-700">
                <div className="py-1">
                  <button 
                    className="block w-full text-left px-4 py-2 hover:bg-neutral-700"
                    onClick={handleLeaveGame}
                  >
                    Leave Game
                  </button>
                  <button 
                    className="block w-full text-left px-4 py-2 hover:bg-neutral-700 text-secondary-500"
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
