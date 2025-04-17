import { GameState } from '@shared/schema';
import { CardSuit } from '@shared/types';
import { getSuitIcon, getSuitClass, getSuitName } from '@/lib/card-utils';
import { cn } from '@/lib/utils';

export function ScoreBoard({
  gameState
}: {
  gameState: GameState;
}) {
  const { teams, round, maxRounds, trumpSuit } = gameState;
  
  // Get team scores
  const team1 = teams.find(t => t.teamNumber === 1);
  const team2 = teams.find(t => t.teamNumber === 2);
  
  return (
    <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-10 bg-secondary-dark/80 rounded-xl p-2 shadow-lg backdrop-blur-sm">
      <div className="flex justify-between items-center w-72 px-2">
        <div className="text-center">
          <div className="flex items-center">
            <span className="text-primary-light font-bold">Team 1</span>
            <span className="bg-primary ml-2 px-2 rounded text-xs">Us</span>
          </div>
          <div className="text-2xl font-bold">
            {team1?.score || 0}
          </div>
        </div>

        <div className="text-center px-3 py-1 bg-secondary/50 rounded-lg">
          <div className="text-xs text-accent">Round</div>
          <div className="font-bold text-lg">{round}/{maxRounds}</div>
        </div>

        <div className="text-center">
          <div className="text-red-400 font-bold">Team 2</div>
          <div className="text-2xl font-bold">
            {team2?.score || 0}
          </div>
        </div>
      </div>

      <TrumpIndicator suit={trumpSuit} />
    </div>
  );
}

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
