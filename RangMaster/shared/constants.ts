import { CardSuit, CardValue } from "./types";

// Card values in descending order of power
export const CARD_VALUES: CardValue[] = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];

// Card value power (higher number = more powerful)
export const CARD_POWER: Record<CardValue, number> = {
  'A': 14,
  'K': 13,
  'Q': 12,
  'J': 11,
  '10': 10,
  '9': 9,
  '8': 8,
  '7': 7,
  '6': 6,
  '5': 5,
  '4': 4,
  '3': 3,
  '2': 2
};

// Card suits
export const CARD_SUITS: CardSuit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

// Icons for card suits
export const SUIT_ICONS: Record<CardSuit, string> = {
  'hearts': 'fa-heart',
  'diamonds': 'fa-diamond',
  'clubs': 'fa-club',
  'spades': 'fa-spade'
};

// CSS classes for card suits
export const SUIT_CLASSES: Record<CardSuit, string> = {
  'hearts': 'text-card-red',
  'diamonds': 'text-card-red',
  'clubs': 'text-card-black',
  'spades': 'text-card-black'
};

// Game constants
export const MAX_PLAYERS = 4;
export const MAX_CARDS_PER_PLAYER = 13;
export const DEFAULT_MAX_ROUNDS = 5;
export const DEFAULT_WINNING_SCORE = 101;

// Timeouts in milliseconds
export const TRICK_COMPLETION_TIMEOUT = 1500;
export const AI_PLAY_DELAY = 1000;
export const ROUND_COMPLETION_TIMEOUT = 2000;

// Team numbers
export const TEAM_1 = 1;
export const TEAM_2 = 2;

// Points for winning tricks
export const POINTS_PER_TRICK = 1;
