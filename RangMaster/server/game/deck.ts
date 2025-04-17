import { Suit, CardValue, Card } from "@shared/types";

export class Deck {
  private cards: Card[];

  constructor() {
    this.cards = [];
    this.initialize();
  }

  private initialize(): void {
    this.cards = [];
    const suits = Object.values(Suit);
    const values = Object.values(CardValue);

    for (const suit of suits) {
      for (const value of values) {
        this.cards.push({ suit, value });
      }
    }
  }

  public shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  public deal(numPlayers: number, cardsPerPlayer: number = 13): Card[][] {
    if (this.cards.length < numPlayers * cardsPerPlayer) {
      throw new Error("Not enough cards in the deck to deal");
    }

    const hands: Card[][] = Array(numPlayers)
      .fill(null)
      .map(() => []);

    // Deal cards one at a time to each player
    for (let i = 0; i < cardsPerPlayer; i++) {
      for (let j = 0; j < numPlayers; j++) {
        hands[j].push(this.cards.pop()!);
      }
    }

    return hands;
  }

  public getRemainingCards(): Card[] {
    return [...this.cards];
  }

  public reset(): void {
    this.initialize();
  }
}
