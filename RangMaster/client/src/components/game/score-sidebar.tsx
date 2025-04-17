import { useGameStore } from "@/store/game-store";
import { GameStatus } from "@shared/types";

export function ScoreSidebar() {
  const { roomState } = useGameStore();
  const teams = roomState?.teams || [];
  const rounds = roomState?.rounds || [];
  
  return (
    <div className="flex-1 p-4 overflow-y-auto">
      {/* Teams */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-neutral-300 mb-2">Teams</h3>
        
        {teams.map((team) => (
          <div 
            key={team.id}
            className={`score-card bg-neutral-900 rounded-lg p-3 mb-3 border-l-4 ${team.id === 0 ? 'border-primary-700' : 'border-secondary-700'}`}
          >
            <div className="flex justify-between items-center mb-2">
              <h4 className={`font-medium ${team.id === 0 ? 'text-primary-500' : 'text-secondary-500'}`}>
                {team.name}
              </h4>
              <div className={`${team.id === 0 ? 'bg-primary-700' : 'bg-secondary-700'} rounded-full px-2 py-0.5 text-xs font-rubik`}>
                {roomState?.gameStatus !== GameStatus.WAITING ? 
                  `${team.tricks}/13` : 
                  '0/13'}
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex -space-x-2">
                {team.players.map((player) => (
                  <div 
                    key={player.id}
                    className={`w-7 h-7 rounded-full border-2 border-neutral-900 flex items-center justify-center text-xs ${team.id === 0 ? 'bg-primary-700' : 'bg-secondary-700'}`}
                  >
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
              <div className="ml-3 text-xs text-neutral-300">
                {team.players.map(p => p.name).join(', ')}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Round History */}
      <div>
        <h3 className="text-sm font-medium text-neutral-300 mb-2">Game History</h3>
        <div className="bg-neutral-900 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-800">
                <th className="py-2 px-3 text-left font-medium text-neutral-300">Round</th>
                <th className="py-2 px-3 text-center font-medium text-neutral-300">Trump</th>
                <th className="py-2 px-3 text-right font-medium text-primary-500">Blue</th>
                <th className="py-2 px-3 text-right font-medium text-secondary-500">Red</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {rounds.map((round) => {
                const isCurrentRound = round.number === roomState?.currentRound;
                const team0Score = round.teamScores[0] || 0;
                const team1Score = round.teamScores[1] || 0;
                const suitIsRed = round.trumpSuit === 'hearts' || round.trumpSuit === 'diamonds';
                
                return (
                  <tr key={round.number} className={`hover:bg-neutral-800 ${isCurrentRound ? 'bg-neutral-800 text-white' : ''}`}>
                    <td className="py-2 px-3">{isCurrentRound ? <span className="font-medium">Current</span> : round.number}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={suitIsRed ? 'text-red-500' : ''}>
                        {round.trumpSuit === 'hearts' && '♥'}
                        {round.trumpSuit === 'diamonds' && '♦'}
                        {round.trumpSuit === 'clubs' && '♣'}
                        {round.trumpSuit === 'spades' && '♠'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-rubik">{team0Score}</td>
                    <td className="py-2 px-3 text-right font-rubik">{team1Score}</td>
                  </tr>
                );
              })}
              
              {roomState?.gameStatus === GameStatus.IN_PROGRESS && rounds.length === 0 && (
                <tr className="bg-neutral-800 text-white">
                  <td className="py-2 px-3 font-medium">Current</td>
                  <td className="py-2 px-3 text-center">
                    <span className={roomState.trumpSuit === 'hearts' || roomState.trumpSuit === 'diamonds' ? 'text-red-500' : ''}>
                      {roomState.trumpSuit === 'hearts' && '♥'}
                      {roomState.trumpSuit === 'diamonds' && '♦'}
                      {roomState.trumpSuit === 'clubs' && '♣'}
                      {roomState.trumpSuit === 'spades' && '♠'}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right font-rubik">0</td>
                  <td className="py-2 px-3 text-right font-rubik">0</td>
                </tr>
              )}
            </tbody>
            
            {rounds.length > 0 && (
              <tfoot>
                <tr className="bg-neutral-800 border-t border-neutral-700">
                  <td colSpan={2} className="py-2 px-3 font-medium">Total</td>
                  <td className="py-2 px-3 text-right font-rubik font-medium">
                    {teams[0]?.score || 0}
                  </td>
                  <td className="py-2 px-3 text-right font-rubik font-medium">
                    {teams[1]?.score || 0}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
