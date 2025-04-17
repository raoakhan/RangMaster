import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CardSuit } from '@shared/types';
import { CARD_SUITS } from '@shared/constants';
import { getSuitClass, getSuitIcon, getSuitName } from '@/lib/card-utils';
import { cn } from '@/lib/utils';

interface TrumpSelectionModalProps {
  isOpen: boolean;
  onSelectTrump: (suit: CardSuit) => void;
  onPassTrumpSelection: () => void;
}

export function TrumpSelectionModal({
  isOpen,
  onSelectTrump,
  onPassTrumpSelection
}: TrumpSelectionModalProps) {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md bg-secondary-dark border-2 border-primary">
        <DialogTitle className="text-xl font-poppins font-bold text-center mb-4">
          Select Trump Suit
        </DialogTitle>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          {CARD_SUITS.map(suit => (
            <Button
              key={suit}
              onClick={() => onSelectTrump(suit)}
              variant="secondary"
              className="p-4 flex flex-col items-center h-auto"
            >
              <i className={cn(`fas ${getSuitIcon(suit)} text-4xl mb-2`, getSuitClass(suit))}></i>
              <span className="font-medium">{getSuitName(suit)}</span>
            </Button>
          ))}
        </div>
        
        <div className="flex justify-center">
          <Button
            onClick={onPassTrumpSelection}
            className="bg-accent hover:bg-accent-dark text-black font-semibold px-4 py-2"
          >
            Pass (Let partner choose)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
