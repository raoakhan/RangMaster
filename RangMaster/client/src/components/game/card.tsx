import { motion } from "framer-motion";
import { Card as CardType } from "@shared/types";

interface CardProps {
  card: CardType;
  faceDown?: boolean;
}

export function Card({ card, faceDown = false }: CardProps) {
  const { suit, value } = card;
  
  const isRed = suit === 'hearts' || suit === 'diamonds';
  const textColor = isRed ? 'text-red-600' : 'text-black';
  
  const getSuitSymbol = () => {
    switch (suit) {
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      case 'spades': return '♠';
      default: return '';
    }
  };
  
  // Card back design
  if (faceDown) {
    return (
      <div className="card-inner bg-neutral-800 rounded-md w-16 h-24 flex items-center justify-center p-1 shadow-lg border-2 border-neutral-700">
        <div className="w-full h-full rounded bg-neutral-700 flex items-center justify-center">
          <span className="text-xs text-neutral-400">RANG</span>
        </div>
      </div>
    );
  }
  
  // Card front design
  return (
    <motion.div 
      className="card-inner bg-white rounded-md w-16 h-24 flex flex-col p-1 shadow-lg"
      whileHover={{ y: -8, rotate: 2 }}
    >
      <div className={`text-left text-lg font-bold ${textColor}`}>{value}</div>
      <div className="flex-1 flex items-center justify-center">
        <div className={`text-4xl ${textColor}`}>{getSuitSymbol()}</div>
      </div>
      <div className={`text-right text-lg font-bold ${textColor} transform rotate-180`}>{value}</div>
    </motion.div>
  );
}
