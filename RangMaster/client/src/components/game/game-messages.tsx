import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface GameMessage {
  id: string;
  text: string;
  timeout: number;
}

interface GameMessagesProps {
  messages: GameMessage[];
}

export function GameMessages({ messages }: GameMessagesProps) {
  const [visibleMessages, setVisibleMessages] = useState<GameMessage[]>([]);
  
  // Filter out expired messages
  useEffect(() => {
    const now = Date.now();
    const currentMessages = messages.filter(msg => msg.timeout > now);
    setVisibleMessages(currentMessages);
    
    // Set up a cleanup timer
    const timer = setInterval(() => {
      const now = Date.now();
      setVisibleMessages(prev => prev.filter(msg => msg.timeout > now));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [messages]);
  
  return (
    <div className="absolute top-24 left-1/2 transform -translate-x-1/2 w-80 pointer-events-none">
      <AnimatePresence>
        {visibleMessages.map(message => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="bg-secondary-dark/80 text-white px-3 py-2 rounded-lg shadow-lg backdrop-blur-sm text-center mb-2"
          >
            <p className="text-sm">{message.text}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
