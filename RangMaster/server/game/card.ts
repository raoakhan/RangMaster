import { Suit, CardValue, Card, CARD_VALUES_ORDER } from "@shared/types";

export const isRed = (suit: Suit): boolean => {
  return suit === Suit.HEARTS || suit === Suit.DIAMONDS;
};

export const compareCards = (
  card1: Card,
  card2: Card,
  leadSuit: Suit,
  trumpSuit: Suit
): number => {
  // If one is trump and the other isn't, trump wins
  if (card1.suit === trumpSuit && card2.suit !== trumpSuit) {
    return 1;
  }
  if (card1.suit !== trumpSuit && card2.suit === trumpSuit) {
    return -1;
  }

  // If both are trump, compare card values
  if (card1.suit === trumpSuit && card2.suit === trumpSuit) {
    return CARD_VALUES_ORDER[card1.value] - CARD_VALUES_ORDER[card2.value];
  }

  // If one follows lead suit and the other doesn't, lead suit wins
  if (card1.suit === leadSuit && card2.suit !== leadSuit) {
    return 1;
  }
  if (card1.suit !== leadSuit && card2.suit === leadSuit) {
    return -1;
  }

  // If both follow lead suit, compare card values
  if (card1.suit === leadSuit && card2.suit === leadSuit) {
    return CARD_VALUES_ORDER[card1.value] - CARD_VALUES_ORDER[card2.value];
  }

  // If neither follows lead suit or trumps, the first card played wins
  return 0;
};

export const getHighestCard = (
  cards: Card[],
  leadSuit: Suit,
  trumpSuit: Suit
): Card | null => {
  if (cards.length === 0) return null;
  
  return cards.reduce((highest, current) => {
    return compareCards(current, highest, leadSuit, trumpSuit) > 0 ? current : highest;
  }, cards[0]);
};

export const canPlayCard = (
  card: Card,
  hand: Card[],
  centerCards: Card[],
  trumpSuit: Suit
): boolean => {
  // First player can play any card
  if (centerCards.length === 0) {
    return true;
  }

  const leadSuit = centerCards[0].suit;
  
  // Check if player has any cards of the lead suit
  const hasSuitCards = hand.some(c => c.suit === leadSuit);
  
  // If player has lead suit, they must play it
  if (hasSuitCards) {
    return card.suit === leadSuit;
  }
  
  // Player doesn't have lead suit, can play any card
  return true;
};

export const getPlayableCards = (
  hand: Card[],
  centerCards: Card[],
  trumpSuit: Suit
): Card[] => {
  // First player can play any card
  if (centerCards.length === 0) {
    return [...hand];
  }

  const leadSuit = centerCards[0].suit;
  
  // Check if player has any cards of the lead suit
  const suitCards = hand.filter(c => c.suit === leadSuit);
  
  // If player has lead suit, they must play it
  if (suitCards.length > 0) {
    return suitCards;
  }
  
  // Player doesn't have lead suit, can play any card
  return [...hand];
};

export const serializeCard = (card: Card): string => {
  return `${card.value}-${card.suit}`;
};

export const deserializeCard = (serialized: string): Card => {
  const [value, suit] = serialized.split('-');
  return {
    value: value as CardValue,
    suit: suit as Suit
  };
};
