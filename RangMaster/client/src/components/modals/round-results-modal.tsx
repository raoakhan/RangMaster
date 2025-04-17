import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GameState } from '@shared/schema';

interface RoundResultsModalProps {
  isOpen: boolean;
  gameState: GameState;
  onContinue: () => void;
}

export function RoundResultsModal({
  isOpen,
  gameState,
  onContinue
}: RoundResultsModalProps) {
  // Find teams
  const team1 = gameState.teams.find(t => t.teamNumber === 1);
  const team2 = gameState.teams.find(t => t.teamNumber === 2);
  
  // Determine round winner
  const roundWinner = team1 && team2 
    ? (team1.tricks > team2.tricks ? 1 : team1.tricks < team2.tricks ? 2 : 0)
    : 0;
    
  // Calculate points earned this round
  const team1Points = team1?.tricks || 0;
  const team2Points = team2?.tricks || 0;
  
  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md bg-secondary-dark border-2 border-primary">
        <DialogTitle className="text-xl font-poppins font-bold text-center mb-2">
          Round Completed!
        </DialogTitle>
        
        <div className="bg-secondary/30 p-4 rounded-lg mb-4">
          <div className="flex justify-between mb-2">
            <div className="font-medium">Team 1</div>
            <div className="font-bold text-lg text-primary-light">
              {team1?.tricks || 0} tricks
            </div>
          </div>
          
          <div className="flex justify-between">
            <div className="font-medium">Team 2</div>
            <div className="font-bold text-lg text-red-400">
              {team2?.tricks || 0} tricks
            </div>
          </div>
        </div>
        
        <div className="bg-primary-dark/30 p-3 rounded-lg text-center mb-4">
          <div className="text-sm uppercase tracking-wide text-white/70">Round Winner</div>
          <div className="font-bold text-xl text-primary-light">
            {roundWinner === 1 ? 'Team 1' : roundWinner === 2 ? 'Team 2' : 'Tie'}
          </div>
          <div className="text-accent font-medium mt-1">
            {roundWinner === 1 ? `+${team1Points} points` : 
             roundWinner === 2 ? `+${team2Points} points` : 'No points'}
          </div>
        </div>
        
        <div className="bg-secondary/30 p-3 rounded-lg text-center mb-6">
          <div className="text-sm uppercase tracking-wide text-white/70">Total Score</div>
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
        
        <div className="flex justify-center">
          <Button
            onClick={onContinue}
            className="bg-accent hover:bg-accent-dark text-black font-semibold px-6 py-2"
          >
            Continue to Next Round
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
