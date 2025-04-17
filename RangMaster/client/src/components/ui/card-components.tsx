import { Card as CardType } from '@shared/schema';
import { CardSuit, CardValue } from '@shared/types';
import { motion } from 'framer-motion';
import { getSuitClass, getSuitIcon } from '@/lib/card-utils';
import { cn } from '@/lib/utils';

// Card back - used for opponent cards and deck
export function CardBack({
  className,
  style = {},
  size = 'md',
  ...props
}: {
  className?: string;
  style?: React.CSSProperties;
  size?: 'sm' | 'md' | 'lg';
  [key: string]: any;
}) {
  const sizeClasses = {
    sm: 'w-8 h-12',
    md: 'w-16 h-24',
    lg: 'w-20 h-32'
  };
  
  return (
    <div
      className={cn(
        sizeClasses[size],
        'bg-white rounded-md border-2 border-secondary-dark shadow-md',
        'flex items-center justify-center',
        className
      )}
      style={style}
      {...props}
    >
      <div className="bg-secondary-dark/20 w-3/4 h-3/4 rounded-md flex items-center justify-center">
        <span className="text-secondary-dark font-bold">R</span>
      </div>
    </div>
  );
}

// Playing card component
export function PlayingCard({
  card,
  onClick,
  selected = false,
  disabled = false,
  size = 'md',
  className,
  ...props
}: {
  card: CardType;
  onClick?: (card: CardType) => void;
  selected?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  [key: string]: any;
}) {
  const suitClass = getSuitClass(card.suit);
  const suitIcon = getSuitIcon(card.suit);
  
  const sizeClasses = {
    sm: 'w-8 h-12 text-sm',
    md: 'w-16 h-24 text-base',
    lg: 'w-20 h-32 text-lg'
  };
  
  const clickHandler = () => {
    if (!disabled && onClick) {
      onClick(card);
    }
  };
  
  return (
    <motion.div
      className={cn(
        sizeClasses[size],
        'playing-card bg-white rounded-md shadow-card',
        'border-2',
        selected ? 'border-accent' : 'border-secondary-dark',
        disabled ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-card-hover cursor-pointer',
        className
      )}
      whileHover={!disabled ? { y: -10, rotate: 2, zIndex: 10 } : {}}
      onClick={clickHandler}
      {...props}
    >
      <div className={cn("flex flex-col justify-between h-full p-2", suitClass)}>
        <div className="text-left">
          <div className={cn("font-card font-bold", size === 'lg' ? 'text-xl' : 'text-lg')}>
            {card.value}
          </div>
          <div className={size === 'lg' ? 'text-lg' : 'text-sm'}>
            <i className={`fas ${suitIcon}`}></i>
          </div>
        </div>
        
        <div className={cn("text-center", size === 'lg' ? 'text-3xl' : 'text-xl')}>
          <i className={`fas ${suitIcon}`}></i>
        </div>
        
        <div className="text-right rotate-180">
          <div className={cn("font-card font-bold", size === 'lg' ? 'text-xl' : 'text-lg')}>
            {card.value}
          </div>
          <div className={size === 'lg' ? 'text-lg' : 'text-sm'}>
            <i className={`fas ${suitIcon}`}></i>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Card played on table
export function TableCard({
  card,
  position,
  className,
  ...props
}: {
  card: CardType | null;
  position: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
  [key: string]: any;
}) {
  if (!card) {
    return (
      <div 
        className={cn(
          "w-16 h-24 rounded-md border-2 border-white/30 border-dashed",
          "flex items-center justify-center",
          className
        )}
        {...props}
      >
        <span className="text-white/50 text-xs">
          {position === 'bottom' ? 'Your turn' : 'Waiting...'}
        </span>
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ scale: 0.8, y: -50, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn("card-played", className)}
      {...props}
    >
      <PlayingCard card={card} size="md" />
    </motion.div>
  );
}

// Small cards used for displaying opponent's hands
export function SmallCard({
  orientation = 'vertical',
  className,
  ...props
}: {
  orientation?: 'vertical' | 'horizontal';
  className?: string;
  [key: string]: any;
}) {
  return (
    <div
      className={cn(
        orientation === 'vertical' ? 'w-8 h-12' : 'w-12 h-8',
        'rounded-md bg-white border-2 border-secondary-dark shadow-md',
        orientation === 'vertical' ? '-mx-1.5' : '-my-1.5',
        className
      )}
      {...props}
    />
  );
}
