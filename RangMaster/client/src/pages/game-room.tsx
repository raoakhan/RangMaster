import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useGameStore } from "@/store/game-store";
import { useUserStore } from "@/store/user-store";
import { CardTable } from "@/components/game/card-table";
import { GameHeader } from "@/components/game/game-header";
import { ScoreSidebar } from "@/components/game/score-sidebar";
import { ChatSidebar } from "@/components/game/chat-sidebar";
import { AuditSidebar } from "@/components/game/audit-sidebar";
import { TrumpSelection } from "@/components/game/trump-selection";
import { InvitePlayers } from "@/components/game/invite-players";
import { NotificationToast } from "@/components/game/notification-toast";
import { GameStatus } from "@shared/types";

export default function GameRoom() {
  const { code } = useParams<{ code: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useUserStore();
  const { 
    roomState, 
    roomCode,
    joinRoom, 
    leaveRoom,
    notifications,
    removeNotification,
    selectedTab,
    setSelectedTab,
    trumpSelector
  } = useGameStore();
  
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/");
      toast({
        title: "Authentication required",
        description: "Please login to join a game",
        variant: "destructive",
      });
    }
  }, [isAuthenticated, setLocation, toast]);
  
  // Join room when component mounts
  useEffect(() => {
    if (isAuthenticated && code) {
      joinRoom(code);
    }
    
    // Cleanup: leave room when component unmounts
    return () => {
      leaveRoom();
    };
  }, [isAuthenticated, code, joinRoom, leaveRoom]);
  
  // Redirect if room code changes
  useEffect(() => {
    if (roomCode && roomCode !== code) {
      setLocation(`/room/${roomCode}`);
    }
  }, [roomCode, code, setLocation]);
  
  // Show trump selection modal when needed
  const showTrumpModal = roomState?.gameStatus === GameStatus.SELECTING_TRUMP && !!trumpSelector;
  
  return (
    <div className="flex flex-col h-screen bg-neutral-900 bg-[radial-gradient(circle_at_10%_20%,rgba(30,64,175,0.2)_0%,transparent_20%),radial-gradient(circle_at_90%_80%,rgba(153,27,27,0.2)_0%,transparent_20%)]">
      {/* Game Header */}
      <GameHeader onInviteClick={() => setShowInviteModal(true)} />
      
      {/* Main Game Area */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Game Table Section */}
        <div className="flex-1 flex flex-col">
          <CardTable />
        </div>
        
        {/* Game Info Sidebar */}
        <div className="md:w-64 bg-neutral-800 flex flex-col border-t md:border-t-0 md:border-l border-neutral-700">
          {/* Tab Navigation */}
          <div className="flex border-b border-neutral-700">
            <button 
              className={`flex-1 py-3 px-4 text-center ${selectedTab === 'score' ? 'text-primary-500 border-b-2 border-primary-500 font-medium' : 'text-neutral-300 hover:text-neutral-100'}`}
              onClick={() => setSelectedTab('score')}
            >
              Score
            </button>
            <button 
              className={`flex-1 py-3 px-4 text-center ${selectedTab === 'chat' ? 'text-primary-500 border-b-2 border-primary-500 font-medium' : 'text-neutral-300 hover:text-neutral-100'}`}
              onClick={() => setSelectedTab('chat')}
            >
              Chat
            </button>
            <button 
              className={`flex-1 py-3 px-4 text-center ${selectedTab === 'audit' ? 'text-primary-500 border-b-2 border-primary-500 font-medium' : 'text-neutral-300 hover:text-neutral-100'}`}
              onClick={() => setSelectedTab('audit')}
            >
              Audit
            </button>
          </div>
          
          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {selectedTab === 'score' && <ScoreSidebar />}
            {selectedTab === 'chat' && <ChatSidebar />}
            {selectedTab === 'audit' && <AuditSidebar />}
          </div>
        </div>
      </main>
      
      {/* Modals */}
      {showTrumpModal && <TrumpSelection />}
      {showInviteModal && <InvitePlayers onClose={() => setShowInviteModal(false)} />}
      
      {/* Notifications */}
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          id={notification.id}
          message={notification.message}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}
