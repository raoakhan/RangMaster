import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GameState } from '@shared/schema';

interface GameOverModalProps {
  isOpen: boolean;
  gameState: GameState;
  onPlayAgain: () => void;
  onBackToLobby: () => void;
}

export function GameOverModal({
  isOpen,
  gameState,
  onPlayAgain,
  onBackToLobby
}: GameOverModalProps) {
  // Find teams
  const team1 = gameState.teams.find(t => t.teamNumber === 1);
  const team2 = gameState.teams.find(t => t.teamNumber === 2);
  
  // Determine game winner
  const winningTeam = team1 && team2 
    ? (team1.score > team2.score ? 1 : team1.score < team2.score ? 2 : 0)
    : 0;
    
  // Get winning team players
  const winningTeamPlayers = gameState.players.filter(
    p => p.teamNumber === winningTeam
  );
  
  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md bg-secondary-dark border-2 border-accent">
        <div className="text-accent text-center mb-2">
          <i className="fas fa-crown text-4xl"></i>
        </div>
        
        <DialogTitle className="text-2xl font-poppins font-bold text-center mb-4">
          Game Over!
        </DialogTitle>
        
        <div className="bg-accent/20 p-4 rounded-lg text-center mb-6">
          <div className="text-sm uppercase tracking-wide text-white/70 mb-1">Winners</div>
          <div className="font-bold text-2xl text-accent mb-2">
            {winningTeam === 1 ? 'Team 1' : winningTeam === 2 ? 'Team 2' : 'Tie'}
          </div>
          
          {winningTeam > 0 && (
            <div className="flex justify-center items-center space-x-2">
              {winningTeamPlayers.map((player, index) => (
                <>
                  {index > 0 && <span className="text-sm">and</span>}
                  <div 
                    key={player.id}
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      winningTeam === 1 ? 'bg-primary-light' : 'bg-red-500'
                    }`}
                  >
                    <span className="text-xs font-bold">{player.avatar}</span>
                  </div>
                </>
              ))}
            </div>
          )}
        </div>
        
        <div className="bg-secondary/30 p-3 rounded-lg text-center mb-6">
          <div className="text-sm uppercase tracking-wide text-white/70">Final Score</div>
          <div className="flex justify-center space-x-8">
            <div>
              <div className="font-medium">Team 1</div>
              <div className="font-bold text-xl text-primary-light">
                {team1?.score || 0}
              </div>
            </div>
            
            <div>
              <div className="font-medium">Team 2</div>
              <div className="font-bold text-xl text-red-400">
                {team2?.score || 0}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center space-x-3">
          <Button
            onClick={onBackToLobby}
            variant="secondary"
            className="font-semibold px-4 py-2"
          >
            Back to Lobby
          </Button>
          
          <Button
            onClick={onPlayAgain}
            className="bg-accent hover:bg-accent-dark text-black font-semibold px-4 py-2"
          >
            Play Again
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
