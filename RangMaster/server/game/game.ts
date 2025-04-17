import { Player } from "./player";
import { Team } from "./team";
import { Deck } from "./deck";
import {
  Card,
  Suit,
  GameStatus,
  Trick,
  Round,
  RoundSummary,
  PlayerInfo,
  PlayerType,
  TeamInfo,
  RoomState
} from "@shared/types";
import { getHighestCard, getPlayableCards } from "./card";

export class Game {
  private players: Map<string, Player>;
  private teams: Team[];
  private currentPlayerId: string | null;
  private trumpSuit: Suit | null;
  private trumpSelector: string | null;
  private deck: Deck;
  private centerCards: Card[];
  private tricks: Trick[];
  private rounds: Round[];
  private leadPlayerId: string | null;
  private status: GameStatus;
  private currentRound: number;
  private playerOrder: string[];
  
  constructor() {
    this.players = new Map();
    this.teams = [
      new Team(0, "Team Blue"),
      new Team(1, "Team Red")
    ];
    this.currentPlayerId = null;
    this.trumpSuit = null;
    this.trumpSelector = null;
    this.deck = new Deck();
    this.centerCards = [];
    this.tricks = [];
    this.rounds = [];
    this.leadPlayerId = null;
    this.status = GameStatus.WAITING;
    this.currentRound = 0;
    this.playerOrder = [];
  }

  public addPlayer(player: Player): boolean {
    if (this.players.size >= 4 || this.players.has(player.info.id)) {
      return false;
    }

    this.players.set(player.info.id, player);
    
    // Auto-assign to a team if not already assigned
    if (player.info.teamId === undefined) {
      const teamId = this.teams[0].getPlayerCount() < 2 ? 0 : 1;
      this.assignPlayerToTeam(player.info.id, teamId);
    }
    
    return true;
  }

  public removePlayer(playerId: string): boolean {
    const player = this.players.get(playerId);
    if (!player) {
      return false;
    }

    if (player.info.teamId !== undefined) {
      this.teams[player.info.teamId].removePlayer(playerId);
    }
    
    this.players.delete(playerId);
    
    // Update player order if necessary
    this.playerOrder = this.playerOrder.filter(id => id !== playerId);
    
    // If it was the current player's turn, move to next player
    if (this.currentPlayerId === playerId && this.status === GameStatus.IN_PROGRESS) {
      this.moveToNextPlayer();
    }
    
    return true;
  }

  public getPlayer(playerId: string): Player | undefined {
    return this.players.get(playerId);
  }

  public getPlayers(): Map<string, Player> {
    return new Map(this.players);
  }

  public getPlayerInfos(): Map<string, PlayerInfo> {
    const playerInfos = new Map<string, PlayerInfo>();
    this.players.forEach(player => {
      playerInfos.set(player.info.id, { ...player.info });
    });
    return playerInfos;
  }

  public getTeams(): Team[] {
    return [...this.teams];
  }

  public getTeamInfos(): TeamInfo[] {
    const playerInfos = this.getPlayerInfos();
    return this.teams.map(team => team.toInfo(playerInfos));
  }

  public assignPlayerToTeam(playerId: string, teamId: number): boolean {
    const player = this.players.get(playerId);
    if (!player || teamId < 0 || teamId >= this.teams.length) {
      return false;
    }

    // Remove from current team if assigned
    if (player.info.teamId !== undefined) {
      this.teams[player.info.teamId].removePlayer(playerId);
    }

    // Add to new team
    if (!this.teams[teamId].addPlayer(playerId)) {
      return false;
    }

    player.setTeam(teamId);
    return true;
  }

  public startGame(): boolean {
    // Ensure we have 4 players in 2 teams of 2
    if (this.players.size !== 4) {
      return false;
    }

    if (this.teams[0].getPlayerCount() !== 2 || this.teams[1].getPlayerCount() !== 2) {
      return false;
    }

    // Reset game state for a new game
    this.currentRound = 1;
    this.tricks = [];
    this.rounds = [];
    this.status = GameStatus.SELECTING_TRUMP;

    // Determine player order - alternate teams
    // Team 1 player, Team 2 player, Team 1 player, Team 2 player
    this.playerOrder = [];
    const team0Players = this.teams[0].getPlayerIds();
    const team1Players = this.teams[1].getPlayerIds();
    
    this.playerOrder.push(team0Players[0]);
    this.playerOrder.push(team1Players[0]);
    this.playerOrder.push(team0Players[1]);
    this.playerOrder.push(team1Players[1]);

    // Deal cards
    this.deck.reset();
    this.deck.shuffle();
    const hands = this.deck.deal(4, 13);
    
    for (let i = 0; i < this.playerOrder.length; i++) {
      const player = this.players.get(this.playerOrder[i]);
      if (player) {
        player.setHand(hands[i]);
      }
    }

    // First player selects trump
    this.trumpSelector = this.playerOrder[0];
    
    return true;
  }

  public selectTrump(suit: Suit): boolean {
    if (this.status !== GameStatus.SELECTING_TRUMP) {
      return false;
    }

    this.trumpSuit = suit;
    this.status = GameStatus.IN_PROGRESS;
    
    // First player leads
    this.currentPlayerId = this.playerOrder[0];
    this.leadPlayerId = this.currentPlayerId;
    this.centerCards = [];
    
    return true;
  }

  public passTrump(): boolean {
    if (this.status !== GameStatus.SELECTING_TRUMP || !this.trumpSelector) {
      return false;
    }

    // Find next player to select trump
    const currentIndex = this.playerOrder.indexOf(this.trumpSelector);
    const nextIndex = (currentIndex + 1) % this.playerOrder.length;
    this.trumpSelector = this.playerOrder[nextIndex];
    
    return true;
  }

  public playCard(playerId: string, card: Card): boolean {
    if (
      this.status !== GameStatus.IN_PROGRESS ||
      this.currentPlayerId !== playerId ||
      !this.trumpSuit
    ) {
      return false;
    }

    const player = this.players.get(playerId);
    if (!player) {
      return false;
    }

    // Check if the card can be played
    if (!player.canPlayCard(card, this.centerCards, this.trumpSuit)) {
      return false;
    }

    // Play the card
    const playedCard = player.playCard(card);
    if (!playedCard) {
      return false;
    }

    // Set lead suit if first card played
    if (this.centerCards.length === 0) {
      this.leadPlayerId = playerId;
    }

    // Add card to center
    this.centerCards.push(playedCard);

    // If all 4 players have played, determine winner and start new trick
    if (this.centerCards.length === 4) {
      this.completeTrick();
    } else {
      // Move to next player
      this.moveToNextPlayer();
    }

    return true;
  }

  private completeTrick(): void {
    if (!this.trumpSuit || !this.leadPlayerId) return;

    const leadSuit = this.centerCards[0].suit;
    const highestCard = getHighestCard(this.centerCards, leadSuit, this.trumpSuit);
    
    if (!highestCard) return;

    // Find which player played the highest card
    let winnerIndex = -1;
    let i = 0;
    let currentIndex = this.playerOrder.indexOf(this.currentPlayerId!);
    
    // Work backwards from current player to find who played each card
    while (i < this.centerCards.length) {
      const checkIndex = (currentIndex - i + this.playerOrder.length) % this.playerOrder.length;
      const playerId = this.playerOrder[checkIndex];
      
      if (
        this.centerCards[this.centerCards.length - 1 - i].suit === highestCard.suit &&
        this.centerCards[this.centerCards.length - 1 - i].value === highestCard.value
      ) {
        winnerIndex = checkIndex;
        break;
      }
      
      i++;
    }

    if (winnerIndex === -1) return;

    const winnerId = this.playerOrder[winnerIndex];
    const winner = this.players.get(winnerId);
    
    if (!winner || winner.info.teamId === undefined) return;

    const winnerTeamId = winner.info.teamId;
    const team = this.teams[winnerTeamId];
    
    // Record trick
    const trick: Trick = {
      cards: [...this.centerCards],
      leadSuit,
      winnerId,
      winnerTeamId
    };
    
    this.tricks.push(trick);
    team.addTrick();

    // Clear center cards for next trick
    this.centerCards = [];
    
    // Set winner as next lead player
    this.currentPlayerId = winnerId;
    this.leadPlayerId = winnerId;

    // Check if round is complete
    if (this.isRoundComplete()) {
      this.completeRound();
    }
  }

  private isRoundComplete(): boolean {
    // Round is complete when all players have no cards left
    return Array.from(this.players.values()).every(player => player.getHandSize() === 0);
  }

  private completeRound(): void {
    // Calculate scores for the round
    const teamScores: Record<number, number> = {};
    
    this.teams.forEach(team => {
      teamScores[team.getId()] = team.getTricks();
      team.addScore(team.getTricks());
      team.resetTricks();
    });

    // Record round
    const round: Round = {
      number: this.currentRound,
      trumpSuit: this.trumpSuit!,
      tricks: [...this.tricks],
      teamScores
    };
    
    this.rounds.push(round);
    
    this.status = GameStatus.ROUND_END;
    
    // Check if game is complete (13 rounds played)
    if (this.currentRound >= 13) {
      this.completeGame();
    } else {
      // Prepare for next round
      this.prepareNextRound();
    }
  }

  private prepareNextRound(): void {
    this.currentRound++;
    this.tricks = [];
    this.centerCards = [];
    this.trumpSuit = null;
    this.status = GameStatus.SELECTING_TRUMP;
    
    // Rotate dealer - next round starts with the player after the last dealer
    this.playerOrder.push(this.playerOrder.shift()!);
    
    // Deal new cards
    this.deck.reset();
    this.deck.shuffle();
    const hands = this.deck.deal(4, 13);
    
    for (let i = 0; i < this.playerOrder.length; i++) {
      const player = this.players.get(this.playerOrder[i]);
      if (player) {
        player.setHand(hands[i]);
      }
    }
    
    // First player selects trump
    this.trumpSelector = this.playerOrder[0];
  }

  private completeGame(): void {
    this.status = GameStatus.GAME_END;
    // Game logic for end state is handled at higher level
  }

  private moveToNextPlayer(): void {
    if (!this.currentPlayerId) return;
    
    const currentIndex = this.playerOrder.indexOf(this.currentPlayerId);
    const nextIndex = (currentIndex + 1) % this.playerOrder.length;
    this.currentPlayerId = this.playerOrder[nextIndex];
  }

  public getCurrentPlayer(): Player | null {
    if (!this.currentPlayerId) return null;
    return this.players.get(this.currentPlayerId) || null;
  }

  public getTrumpSuit(): Suit | null {
    return this.trumpSuit;
  }

  public getTrumpSelector(): string | null {
    return this.trumpSelector;
  }

  public getCurrentPlayerId(): string | null {
    return this.currentPlayerId;
  }

  public getStatus(): GameStatus {
    return this.status;
  }

  public getCenterCards(): Card[] {
    return [...this.centerCards];
  }

  public getCurrentRound(): number {
    return this.currentRound;
  }

  public getRounds(): Round[] {
    return [...this.rounds];
  }

  public getRoundSummaries(): RoundSummary[] {
    return this.rounds.map(round => ({
      number: round.number,
      trumpSuit: round.trumpSuit,
      teamScores: round.teamScores
    }));
  }

  public isPlayersTurn(playerId: string): boolean {
    return this.currentPlayerId === playerId;
  }

  public getLeadSuit(): Suit | null {
    if (this.centerCards.length === 0) return null;
    return this.centerCards[0].suit;
  }
  
  public getPlayableCards(playerId: string): Card[] {
    const player = this.players.get(playerId);
    if (!player || !this.trumpSuit) return [];
    
    return getPlayableCards(player.getHand(), this.centerCards, this.trumpSuit);
  }

  public toRoomState(roomId: string, roomCode: string, roomName: string, createdBy: string): RoomState {
    const playerInfos = Array.from(this.players.values()).map(p => p.info);
    
    return {
      id: roomId,
      code: roomCode,
      name: roomName,
      createdBy,
      players: playerInfos,
      teams: this.getTeamInfos(),
      gameStatus: this.status,
      currentRound: this.currentRound,
      trumpSuit: this.trumpSuit || undefined,
      currentTrick: {
        cards: this.centerCards,
        leadSuit: this.getLeadSuit() || undefined
      },
      currentPlayerId: this.currentPlayerId || undefined,
      rounds: this.getRoundSummaries()
    };
  }
}
