import { useState, useRef, useEffect } from "react";
import { useGameStore } from "@/store/game-store";
import { useUserStore } from "@/store/user-store";

export function ChatSidebar() {
  const [message, setMessage] = useState("");
  const { chatMessages, sendChatMessage } = useGameStore();
  const { username } = useUserStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendChatMessage(message);
      setMessage("");
    }
  };
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);
  
  return (
    <div className="flex flex-col h-full">
      {/* Chat messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-3">
          {chatMessages.length === 0 ? (
            <div className="text-center py-8 text-neutral-400">
              <span className="material-icons text-3xl mb-2">chat</span>
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1">Send a message to start the conversation</p>
            </div>
          ) : (
            chatMessages.map((msg) => (
              <div key={msg.id} className="chat-message">
                <div className="flex items-start">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${msg.playerName === username ? 'bg-primary-700' : 'bg-neutral-700'}`}>
                    {msg.playerName.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-2">
                    <div className="flex items-center">
                      <span className={`text-sm font-medium ${msg.playerName === username ? 'text-primary-500' : 'text-neutral-300'}`}>
                        {msg.playerName}
                      </span>
                      <span className="text-xs text-neutral-500 ml-2">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-200 break-words">{msg.text}</p>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Chat input */}
      <div className="border-t border-neutral-700 p-3">
        <form onSubmit={handleSendMessage} className="flex">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-neutral-700 border border-neutral-600 rounded-l-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary-500"
          />
          <button 
            type="submit"
            className="bg-primary-700 hover:bg-primary-600 px-3 py-2 rounded-r-md flex items-center justify-center transition-colors"
            disabled={!message.trim()}
          >
            <span className="material-icons text-sm">send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
