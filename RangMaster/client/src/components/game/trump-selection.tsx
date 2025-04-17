import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/game-store";
import { Suit } from "@shared/types";

export function TrumpSelection() {
  const { selectTrump } = useGameStore();
  const [isOpen, setIsOpen] = useState(true);
  
  const handleSelect = (suit: Suit | null) => {
    selectTrump(suit);
    setIsOpen(false);
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
            <h2 className="text-xl font-poppins font-bold mb-4">Select Trump Suit</h2>
            <p className="text-neutral-300 mb-6">Choose a trump suit for this round</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button 
                className="suit-option flex flex-col items-center p-4 bg-neutral-700 hover:bg-neutral-600 rounded-lg transition-colors"
                onClick={() => handleSelect(Suit.HEARTS)}
              >
                <div className="text-5xl text-red-500 mb-2">♥</div>
                <span>Hearts</span>
              </button>
              <button 
                className="suit-option flex flex-col items-center p-4 bg-neutral-700 hover:bg-neutral-600 rounded-lg transition-colors"
                onClick={() => handleSelect(Suit.DIAMONDS)}
              >
                <div className="text-5xl text-red-500 mb-2">♦</div>
                <span>Diamonds</span>
              </button>
              <button 
                className="suit-option flex flex-col items-center p-4 bg-neutral-700 hover:bg-neutral-600 rounded-lg transition-colors"
                onClick={() => handleSelect(Suit.CLUBS)}
              >
                <div className="text-5xl mb-2">♣</div>
                <span>Clubs</span>
              </button>
              <button 
                className="suit-option flex flex-col items-center p-4 bg-neutral-700 hover:bg-neutral-600 rounded-lg transition-colors"
                onClick={() => handleSelect(Suit.SPADES)}
              >
                <div className="text-5xl mb-2">♠</div>
                <span>Spades</span>
              </button>
            </div>
            
            <div className="text-center">
              <button 
                className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-md"
                onClick={() => handleSelect(null)}
              >
                Pass
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
