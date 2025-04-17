import { Card } from '@shared/schema';
import { CardSuit, CardValue } from '@shared/types';
import { CARD_POWER, CARD_SUITS, CARD_VALUES, SUIT_CLASSES, SUIT_ICONS } from '@shared/constants';

// Get the display name for a card suit
export function getSuitName(suit: CardSuit): string {
  const suitNames: Record<CardSuit, string> = {
    'hearts': 'Hearts',
    'diamonds': 'Diamonds',
    'clubs': 'Clubs',
    'spades': 'Spades'
  };
  
  return suitNames[suit];
}

// Get the icon class for a card suit
export function getSuitIcon(suit: CardSuit): string {
  return SUIT_ICONS[suit];
}

// Get the CSS class for a card suit color
export function getSuitClass(suit: CardSuit): string {
  return SUIT_CLASSES[suit];
}

// Sort cards by suit and value
export function sortCards(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => {
    // Sort by suit first
    const suitOrder = CARD_SUITS.indexOf(a.suit) - CARD_SUITS.indexOf(b.suit);
    if (suitOrder !== 0) return suitOrder;
    
    // Then by value (higher values first)
    return CARD_POWER[b.value] - CARD_POWER[a.value];
  });
}

// Get cards of a specific suit
export function getCardsOfSuit(cards: Card[], suit: CardSuit): Card[] {
  return cards.filter(card => card.suit === suit);
}

// Check if a player has any cards of a specific suit
export function hasCardsOfSuit(cards: Card[], suit: CardSuit): boolean {
  return cards.some(card => card.suit === suit);
}

// Get the display value for a card
export function getCardDisplayValue(value: CardValue): string {
  return value;
}

// Parse a card string (e.g., "10H" for 10 of Hearts)
export function parseCardString(cardStr: string): Card | null {
  if (!cardStr || cardStr.length < 2) return null;
  
  const valueStr = cardStr.slice(0, -1);
  const suitChar = cardStr.slice(-1).toUpperCase();
  
  let suit: CardSuit | null = null;
  
  switch (suitChar) {
    case 'H':
      suit = 'hearts';
      break;
    case 'D':
      suit = 'diamonds';
      break;
    case 'C':
      suit = 'clubs';
      break;
    case 'S':
      suit = 'spades';
      break;
    default:
      return null;
  }
  
  if (!CARD_VALUES.includes(valueStr as CardValue)) {
    return null;
  }
  
  return {
    suit,
    value: valueStr as CardValue
  };
}

// Format a card as a string (e.g., "10H" for 10 of Hearts)
export function formatCardString(card: Card): string {
  const suitChar = card.suit.charAt(0).toUpperCase();
  return `${card.value}${suitChar}`;
}

// Get cards grouped by suit
export function getCardsBySuit(cards: Card[]): Record<CardSuit, Card[]> {
  const result: Record<CardSuit, Card[]> = {
    'hearts': [],
    'diamonds': [],
    'clubs': [],
    'spades': []
  };
  
  for (const card of cards) {
    result[card.suit].push(card);
  }
  
  // Sort each suit by value
  for (const suit of CARD_SUITS) {
    result[suit].sort((a, b) => CARD_POWER[b.value] - CARD_POWER[a.value]);
  }
  
  return result;
}
