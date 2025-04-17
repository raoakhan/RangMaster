import { GameState } from '@shared/schema';

export function RoundInfo({
  gameState
}: {
  gameState: GameState;
}) {
  const { trick, maxTricks, teams } = gameState;
  
  const team1 = teams.find(t => t.teamNumber === 1);
  const team2 = teams.find(t => t.teamNumber === 2);
  
  return (
    <div className="absolute bottom-4 left-4 bg-secondary-dark/80 rounded-lg p-2 shadow-lg backdrop-blur-sm">
      <div className="text-xs uppercase tracking-wide text-white/70">Current Trick</div>
      <div className="font-bold text-lg">{trick + 1}/{maxTricks}</div>
      <div className="mt-1 text-xs text-accent">
        <span className="font-medium">Team 1:</span> <span>{team1?.tricks || 0} tricks</span>
      </div>
      <div className="text-xs text-red-400">
        <span className="font-medium">Team 2:</span> <span>{team2?.tricks || 0} tricks</span>
      </div>
    </div>
  );
}
