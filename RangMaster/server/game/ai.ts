import { Card, Suit, CARD_VALUES_ORDER } from "@shared/types";
import { getPlayableCards, getHighestCard } from "./card";

export class AIPlayer {
  // AI logic for playing a card
  public static selectCard(
    hand: Card[],
    centerCards: Card[],
    trumpSuit: Suit
  ): Card {
    // Get playable cards based on rules
    const playableCards = getPlayableCards(hand, centerCards, trumpSuit);
    
    if (playableCards.length === 0) {
      throw new Error("No playable cards");
    }
    
    // If first to play, lead with strategy
    if (centerCards.length === 0) {
      return this.selectLeadCard(playableCards, hand, trumpSuit);
    }
    
    const leadSuit = centerCards[0].suit;
    const otherCardsPlayed = centerCards.length;
    
    // If last to play in trick (4th player)
    if (otherCardsPlayed === 3) {
      return this.selectLastCard(playableCards, centerCards, leadSuit, trumpSuit);
    }
    
    // Middle player strategy (2nd or 3rd)
    return this.selectMiddleCard(playableCards, centerCards, leadSuit, trumpSuit);
  }
  
  // AI logic for selecting trump
  public static selectTrump(hand: Card[]): Suit | null {
    // Count cards in each suit
    const suitCounts: Map<Suit, number> = new Map();
    const suitStrengths: Map<Suit, number> = new Map();
    
    for (const suit of Object.values(Suit)) {
      suitCounts.set(suit, 0);
      suitStrengths.set(suit, 0);
    }
    
    // Count and calculate strength of each suit
    for (const card of hand) {
      const count = suitCounts.get(card.suit) || 0;
      suitCounts.set(card.suit, count + 1);
      
      // Add card strength (A=14, K=13, etc.)
      const strength = suitStrengths.get(card.suit) || 0;
      suitStrengths.set(card.suit, strength + CARD_VALUES_ORDER[card.value]);
    }
    
    // Find the suit with the best combination of count and strength
    let bestSuit: Suit | null = null;
    let bestScore = -1;
    
    for (const suit of Object.values(Suit)) {
      const count = suitCounts.get(suit) || 0;
      const strength = suitStrengths.get(suit) || 0;
      
      // Score based on count and strength
      // Prioritize suits with more cards and higher strength
      const score = count * 10 + strength / 10;
      
      if (score > bestScore) {
        bestScore = score;
        bestSuit = suit;
      }
    }
    
    // Pass if not confident (less than 4 cards in the best suit)
    if (bestSuit && (suitCounts.get(bestSuit) || 0) < 4) {
      return null; // Pass
    }
    
    return bestSuit;
  }
  
  // Helper methods for different play situations
  
  private static selectLeadCard(
    playableCards: Card[],
    hand: Card[],
    trumpSuit: Suit
  ): Card {
    // Lead with high card in non-trump suit if possible
    const nonTrumpCards = playableCards.filter(c => c.suit !== trumpSuit);
    
    if (nonTrumpCards.length > 0) {
      // Sort by value, highest first
      nonTrumpCards.sort((a, b) => 
        CARD_VALUES_ORDER[b.value] - CARD_VALUES_ORDER[a.value]
      );
      
      // Lead with highest non-trump card
      return nonTrumpCards[0];
    }
    
    // If only trump cards, play lowest
    playableCards.sort((a, b) => 
      CARD_VALUES_ORDER[a.value] - CARD_VALUES_ORDER[b.value]
    );
    
    return playableCards[0];
  }
  
  private static selectLastCard(
    playableCards: Card[],
    centerCards: Card[],
    leadSuit: Suit,
    trumpSuit: Suit
  ): Card {
    // Check if partner is winning
    const highestCardPlayed = getHighestCard(centerCards, leadSuit, trumpSuit);
    const partnerIndex = 1; // Assuming partner played the 2nd card (index 1)
    
    if (highestCardPlayed && 
        centerCards[partnerIndex].suit === highestCardPlayed.suit && 
        centerCards[partnerIndex].value === highestCardPlayed.value) {
      // Partner is winning, play lowest card
      playableCards.sort((a, b) => 
        CARD_VALUES_ORDER[a.value] - CARD_VALUES_ORDER[b.value]
      );
      
      return playableCards[0];
    }
    
    // Try to win the trick
    // Sort by strength against the current highest card
    const trumpCards = playableCards.filter(c => c.suit === trumpSuit);
    const leadSuitCards = playableCards.filter(c => c.suit === leadSuit);
    
    // If we have trump cards and highest isn't a trump
    if (trumpCards.length > 0 && highestCardPlayed && highestCardPlayed.suit !== trumpSuit) {
      // Play lowest trump that can win
      trumpCards.sort((a, b) => 
        CARD_VALUES_ORDER[a.value] - CARD_VALUES_ORDER[b.value]
      );
      
      return trumpCards[0];
    }
    
    // If we have lead suit cards
    if (leadSuitCards.length > 0) {
      // Sort by value, highest first
      leadSuitCards.sort((a, b) => 
        CARD_VALUES_ORDER[b.value] - CARD_VALUES_ORDER[a.value]
      );
      
      // If our highest card can beat the current highest
      if (highestCardPlayed && 
          leadSuitCards[0].suit === leadSuit &&
          CARD_VALUES_ORDER[leadSuitCards[0].value] > CARD_VALUES_ORDER[highestCardPlayed.value]) {
        return leadSuitCards[0];
      }
      
      // Otherwise play lowest card
      leadSuitCards.sort((a, b) => 
        CARD_VALUES_ORDER[a.value] - CARD_VALUES_ORDER[b.value]
      );
      
      return leadSuitCards[0];
    }
    
    // If we can't win or don't have the right cards, play lowest value
    playableCards.sort((a, b) => 
      CARD_VALUES_ORDER[a.value] - CARD_VALUES_ORDER[b.value]
    );
    
    return playableCards[0];
  }
  
  private static selectMiddleCard(
    playableCards: Card[],
    centerCards: Card[],
    leadSuit: Suit,
    trumpSuit: Suit
  ): Card {
    const highestCardPlayed = getHighestCard(centerCards, leadSuit, trumpSuit);
    
    // If we have trump and the highest card isn't a trump
    const trumpCards = playableCards.filter(c => c.suit === trumpSuit);
    if (trumpCards.length > 0 && highestCardPlayed && highestCardPlayed.suit !== trumpSuit) {
      // Play lowest trump
      trumpCards.sort((a, b) => 
        CARD_VALUES_ORDER[a.value] - CARD_VALUES_ORDER[b.value]
      );
      
      return trumpCards[0];
    }
    
    // If following suit
    const leadSuitCards = playableCards.filter(c => c.suit === leadSuit);
    if (leadSuitCards.length > 0) {
      // Check if we can beat the highest card
      if (highestCardPlayed) {
        const higherCards = leadSuitCards.filter(c => 
          CARD_VALUES_ORDER[c.value] > CARD_VALUES_ORDER[highestCardPlayed.value]
        );
        
        if (higherCards.length > 0) {
          // Play lowest card that can win
          higherCards.sort((a, b) => 
            CARD_VALUES_ORDER[a.value] - CARD_VALUES_ORDER[b.value]
          );
          
          return higherCards[0];
        }
      }
      
      // If can't beat, play lowest
      leadSuitCards.sort((a, b) => 
        CARD_VALUES_ORDER[a.value] - CARD_VALUES_ORDER[b.value]
      );
      
      return leadSuitCards[0];
    }
    
    // If we can't follow suit or trump, play lowest value card
    playableCards.sort((a, b) => 
      CARD_VALUES_ORDER[a.value] - CARD_VALUES_ORDER[b.value]
    );
    
    return playableCards[0];
  }
}
