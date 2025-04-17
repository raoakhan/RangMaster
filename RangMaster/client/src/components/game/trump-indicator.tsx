import { CardSuit } from '@shared/types';
import { getSuitClass, getSuitIcon, getSuitName } from '@/lib/card-utils';
import { cn } from '@/lib/utils';

export function TrumpIndicator({
  suit
}: {
  suit: CardSuit | null;
}) {
  if (!suit) {
    return (
      <div className="flex items-center justify-center mt-1 p-1 bg-accent/20 rounded-lg">
        <div className="text-xs uppercase tracking-wide mr-2">Trump:</div>
        <div className="text-lg font-bold text-accent">
          Not selected
        </div>
      </div>
    );
  }
  
  return (
    <div className="trump-indicator flex items-center justify-center mt-1 p-1 bg-accent/20 rounded-lg">
      <div className="text-xs uppercase tracking-wide mr-2">Trump:</div>
      <div className="text-lg font-bold text-accent">
        <i className={cn(`fas ${getSuitIcon(suit)}`, getSuitClass(suit))}></i> {getSuitName(suit)}
      </div>
    </div>
  );
}
