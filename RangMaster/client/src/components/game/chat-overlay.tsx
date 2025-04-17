import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

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

export function ChatOverlay({
  isVisible,
  onClose,
  messages,
  onSendMessage,
  teamNumber,
  teamOnly = false,
  onToggleTeamOnly
}: {
  isVisible: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (message: string, teamOnly: boolean) => void;
  teamNumber: number;
  teamOnly?: boolean;
  onToggleTeamOnly: () => void;
}) {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when new messages come in
  useEffect(() => {
    if (isVisible && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isVisible]);
  
  // Handle message submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message, teamOnly);
      setMessage('');
    }
  };
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed right-4 bottom-20 w-72 h-96 bg-secondary-dark/90 rounded-xl shadow-xl backdrop-blur-md flex flex-col overflow-hidden transition-transform">
      <div className="bg-secondary px-3 py-2 flex justify-between items-center">
        <h3 className="font-semibold">
          {teamOnly ? 'Team Chat' : 'Game Chat'}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleTeamOnly}
            className="ml-2 h-6 px-2 text-xs"
          >
            {teamOnly ? 'Switch to All' : 'Switch to Team'}
          </Button>
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <i className="fas fa-times"></i>
        </Button>
      </div>
      
      <div className="flex-1 p-3 overflow-y-auto space-y-2">
        {messages.map((msg) => {
          // Skip team messages if they're not for this team
          if (msg.teamOnly && msg.teamNumber !== teamNumber) return null;
          
          return (
            <div 
              key={msg.id} 
              className={cn(
                "flex mb-2",
                msg.isMine && "justify-end"
              )}
            >
              {!msg.isMine && (
                <div 
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                    msg.teamNumber === 1 ? "bg-primary-light" : "bg-red-500"
                  )}
                >
                  <span className="text-xs font-bold">{msg.senderAvatar}</span>
                </div>
              )}
              <div 
                className={cn(
                  "px-3 py-1 rounded-lg max-w-[80%] mx-2",
                  msg.isMine 
                    ? (msg.teamOnly ? "bg-primary/50" : "bg-primary/30") 
                    : (msg.teamOnly ? "bg-secondary-light/50" : "bg-secondary-light/30")
                )}
              >
                <div className="text-xs text-white/70 mb-0.5">{msg.isMine ? 'You' : msg.sender}</div>
                <p className="text-sm">{msg.message}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="p-2 border-t border-secondary">
        <div className="flex">
          <Input
            type="text"
            className="bg-secondary-light/20 text-white rounded-l-lg px-3 py-2 flex-1 focus:outline-none"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button 
            type="submit" 
            className="bg-primary hover:bg-primary-light px-3 rounded-r-lg transition"
          >
            <i className="fas fa-paper-plane"></i>
          </Button>
        </div>
      </form>
    </div>
  );
}
