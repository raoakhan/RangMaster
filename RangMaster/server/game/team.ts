import { TeamInfo, PlayerInfo, Suit } from "@shared/types";

export class Team {
  private id: number;
  private name: string;
  private players: string[];
  private tricks: number;
  private score: number;

  constructor(id: number, name: string) {
    this.id = id;
    this.name = name;
    this.players = [];
    this.tricks = 0;
    this.score = 0;
  }

  public addPlayer(playerId: string): boolean {
    if (this.players.length >= 2 || this.players.includes(playerId)) {
      return false;
    }
    
    this.players.push(playerId);
    return true;
  }

  public removePlayer(playerId: string): boolean {
    const index = this.players.indexOf(playerId);
    if (index === -1) {
      return false;
    }
    
    this.players.splice(index, 1);
    return true;
  }

  public hasPlayer(playerId: string): boolean {
    return this.players.includes(playerId);
  }

  public getPlayerIds(): string[] {
    return [...this.players];
  }

  public getPlayerCount(): number {
    return this.players.length;
  }

  public canAddPlayer(): boolean {
    return this.players.length < 2;
  }

  public addTrick(): void {
    this.tricks += 1;
  }

  public resetTricks(): void {
    this.tricks = 0;
  }

  public getTricks(): number {
    return this.tricks;
  }

  public addScore(points: number): void {
    this.score += points;
  }

  public getScore(): number {
    return this.score;
  }

  public resetScore(): void {
    this.score = 0;
  }

  public getId(): number {
    return this.id;
  }

  public getName(): string {
    return this.name;
  }

  public toInfo(allPlayers: Map<string, PlayerInfo>): TeamInfo {
    return {
      id: this.id,
      name: this.name,
      score: this.score,
      tricks: this.tricks,
      players: this.players
        .map(playerId => allPlayers.get(playerId))
        .filter((player): player is PlayerInfo => player !== undefined)
    };
  }
}
