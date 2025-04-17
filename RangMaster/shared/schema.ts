import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { CardSuit, CardValue, PlayerType } from "./types";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const rooms = pgTable("rooms", {
  id: text("id").primaryKey(), // Room code like "XYKL89"
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: text("created_at").notNull(),
  isActive: boolean("is_active").default(true),
  config: jsonb("config").$type<{
    maxRounds: number;
    winningScore: number;
    enableAudio: boolean;
    enableVideo: boolean;
  }>(),
});

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  roomId: text("room_id").references(() => rooms.id),
  userId: integer("user_id").references(() => users.id),
  position: integer("position").notNull(),
  teamNumber: integer("team_number").notNull(),
  playerType: text("player_type").$type<PlayerType>().notNull(),
  isConnected: boolean("is_connected").default(true),
});

export const gameStates = pgTable("game_states", {
  roomId: text("room_id").references(() => rooms.id).primaryKey(),
  state: jsonb("state").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertRoomSchema = createInsertSchema(rooms).pick({
  id: true,
  createdById: true,
  createdAt: true,
  config: true,
});

export const insertPlayerSchema = createInsertSchema(players).pick({
  roomId: true,
  userId: true,
  position: true,
  teamNumber: true,
  playerType: true,
  isConnected: true,
});

export const insertGameStateSchema = createInsertSchema(gameStates).pick({
  roomId: true,
  state: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof rooms.$inferSelect;

export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof players.$inferSelect;

export type InsertGameState = z.infer<typeof insertGameStateSchema>;
export type GameStateRecord = typeof gameStates.$inferSelect;

// Create a Game state schema for tracking game state
export type Card = {
  suit: CardSuit;
  value: CardValue;
};

export type PlayerState = {
  id: number;
  username: string;
  position: number;
  teamNumber: number;
  playerType: PlayerType;
  isConnected: boolean;
  isActive: boolean;
  cards: Card[];
  avatar: string;
};

export type TeamState = {
  teamNumber: number;
  score: number;
  tricks: number;
};

export type GameState = {
  roomId: string;
  status: 'waiting' | 'trump-selection' | 'playing' | 'round-end' | 'game-end';
  players: PlayerState[];
  teams: TeamState[];
  round: number;
  maxRounds: number;
  trick: number;
  maxTricks: number;
  trumpSuit: CardSuit | null;
  trumpSelector: number | null;
  currentTurn: number;
  leadSuit: CardSuit | null;
  cardsOnTable: {
    playerId: number;
    card: Card | null;
  }[];
  winningScore: number;
  lastTrickWinner: number | null;
  enableAudio: boolean;
  enableVideo: boolean;
  messages: { id: string; text: string; timeout: number }[];
};
