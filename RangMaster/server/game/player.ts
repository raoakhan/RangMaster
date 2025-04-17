import { Card, PlayerInfo, PlayerType, Suit } from "@shared/types";
import { canPlayCard } from "./card";

export class Player {
  public readonly info: PlayerInfo;
  private hand: Card[];
  private isActive: boolean;

  constructor(info: PlayerInfo) {
    this.info = info;
    this.hand = [];
    this.isActive = true;
  }

  public setHand(cards: Card[]): void {
    this.hand = [...cards];
  }

  public getHand(): Card[] {
    return [...this.hand];
  }

  public getHandSize(): number {
    return this.hand.length;
  }

  public playCard(card: Card): Card | null {
    const index = this.hand.findIndex(
      c => c.suit === card.suit && c.value === card.value
    );
    
    if (index === -1) {
      return null; // Card not in hand
    }
    
    const playedCard = this.hand[index];
    this.hand.splice(index, 1);
    
    return playedCard;
  }

  public hasCard(card: Card): boolean {
    return this.hand.some(c => c.suit === card.suit && c.value === card.value);
  }

  public canPlayCard(card: Card, centerCards: Card[], trumpSuit: Suit): boolean {
    if (!this.hasCard(card)) {
      return false;
    }
    
    return canPlayCard(card, this.hand, centerCards, trumpSuit);
  }

  public hasSuit(suit: Suit): boolean {
    return this.hand.some(card => card.suit === suit);
  }

  public isAI(): boolean {
    return this.info.type === PlayerType.AI;
  }

  public isConnected(): boolean {
    return this.info.isConnected;
  }

  public setActive(active: boolean): void {
    this.isActive = active;
  }

  public isActivePlayer(): boolean {
    return this.isActive;
  }

  public setTeam(teamId: number): void {
    this.info.teamId = teamId;
  }

  public setReady(ready: boolean): void {
    this.info.isReady = ready;
  }

  public setConnected(connected: boolean): void {
    this.info.isConnected = connected;
  }
}
