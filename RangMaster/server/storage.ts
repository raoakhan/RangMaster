import {
  User, InsertUser,
  Room, InsertRoom,
  Player, InsertPlayer,
  GameState, InsertGameState,
  GameStateRecord,
  Card,
  PlayerState,
  TeamState
} from "@shared/schema";
import { CardSuit, CardValue, PlayerType, Position } from "@shared/types";
import { nanoid } from "nanoid";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { users, rooms, players, gameStates } from "@shared/schema";
import { Pool } from "@neondatabase/serverless";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Room operations
  getRoom(id: string): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
  updateRoom(id: string, updates: Partial<Room>): Promise<Room | undefined>;
  
  // Player operations
  getPlayer(id: number): Promise<Player | undefined>;
  getPlayersByRoomId(roomId: string): Promise<Player[]>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayer(id: number, updates: Partial<Player>): Promise<Player | undefined>;
  
  // Game state operations
  getGameState(roomId: string): Promise<GameState | undefined>;
  saveGameState(gameState: GameState): Promise<GameState>;
  updateGameState(roomId: string, updates: Partial<GameState>): Promise<GameState | undefined>;
  deleteGameState(roomId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private usersByUsername: Map<string, User> = new Map();
  private rooms: Map<string, Room> = new Map();
  private players: Map<number, Player> = new Map();
  private playersByRoomId: Map<string, Player[]> = new Map();
  private gameStates: Map<string, GameState> = new Map();
  
  private userIdCounter = 1;
  private playerIdCounter = 1;
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.usersByUsername.get(username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    // Create user with correct types - User type only has id, username, and password
    const user: User = {
      id,
      username: insertUser.username,
      password: insertUser.password
    };
    
    this.users.set(id, user);
    this.usersByUsername.set(insertUser.username, user);
    
    return user;
  }
  
  // Room operations
  async getRoom(id: string): Promise<Room | undefined> {
    return this.rooms.get(id);
  }
  
  async createRoom(room: InsertRoom): Promise<Room> {
    // Create room with correct typing
    const newRoom: Room = {
      id: room.id,
      createdById: room.createdById === undefined ? null : room.createdById,
      createdAt: typeof room.createdAt === 'string' ? room.createdAt : new Date().toISOString(),
      config: room.config === undefined ? null : room.config,
      isActive: true
    };
    
    this.rooms.set(room.id, newRoom);
    return newRoom;
  }
  
  async updateRoom(id: string, updates: Partial<Room>): Promise<Room | undefined> {
    const room = await this.getRoom(id);
    if (!room) return undefined;
    
    const updatedRoom = { ...room, ...updates };
    this.rooms.set(id, updatedRoom);
    
    return updatedRoom;
  }
  
  // Player operations
  async getPlayer(id: number): Promise<Player | undefined> {
    return this.players.get(id);
  }
  
  async getPlayersByRoomId(roomId: string): Promise<Player[]> {
    return this.playersByRoomId.get(roomId) || [];
  }
  
  async createPlayer(player: InsertPlayer): Promise<Player> {
    const id = this.playerIdCounter++;
    
    // Ensure player type is one of the valid options
    let playerType: PlayerType;
    if (player.playerType === 'human' || player.playerType === 'ai') {
      playerType = player.playerType;
    } else {
      // Default to human if invalid type
      playerType = 'human';
    }
    
    const newPlayer: Player = {
      id,
      position: player.position,
      teamNumber: player.teamNumber,
      playerType,
      roomId: player.roomId || null,
      userId: player.userId || null,
      isConnected: player.isConnected === undefined ? true : player.isConnected
    };
    
    this.players.set(id, newPlayer);
    
    // Add to room players list
    if (player.roomId) {
      const roomPlayers = this.playersByRoomId.get(player.roomId) || [];
      roomPlayers.push(newPlayer);
      this.playersByRoomId.set(player.roomId, roomPlayers);
    }
    
    return newPlayer;
  }
  
  async updatePlayer(id: number, updates: Partial<Player>): Promise<Player | undefined> {
    const player = await this.getPlayer(id);
    if (!player) return undefined;
    
    // If updating roomId, update player listings for rooms
    if (updates.roomId !== undefined && updates.roomId !== player.roomId) {
      // Remove from old room
      if (player.roomId) {
        const oldRoomPlayers = this.playersByRoomId.get(player.roomId) || [];
        const filtered = oldRoomPlayers.filter(p => p.id !== id);
        this.playersByRoomId.set(player.roomId, filtered);
      }
      
      // Add to new room
      if (updates.roomId) {
        const newRoomPlayers = this.playersByRoomId.get(updates.roomId) || [];
        newRoomPlayers.push({ ...player, ...updates });
        this.playersByRoomId.set(updates.roomId, newRoomPlayers);
      }
    }
    
    const updatedPlayer = { ...player, ...updates };
    this.players.set(id, updatedPlayer);
    
    return updatedPlayer;
  }
  
  // Game state operations
  async getGameState(roomId: string): Promise<GameState | undefined> {
    return this.gameStates.get(roomId);
  }
  
  async saveGameState(gameState: GameState): Promise<GameState> {
    this.gameStates.set(gameState.roomId, gameState);
    return gameState;
  }
  
  async updateGameState(roomId: string, updates: Partial<GameState>): Promise<GameState | undefined> {
    const gameState = await this.getGameState(roomId);
    if (!gameState) return undefined;
    
    const updatedState = { ...gameState, ...updates };
    this.gameStates.set(roomId, updatedState);
    
    return updatedState;
  }
  
  async deleteGameState(roomId: string): Promise<boolean> {
    this.gameStates.delete(roomId);
    return true;
  }
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }
  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Room operations
  async getRoom(id: string): Promise<Room | undefined> {
    const result = await db.select().from(rooms).where(eq(rooms.id, id));
    return result[0];
  }
  async createRoom(room: InsertRoom): Promise<Room> {
    const result = await db.insert(rooms).values(room).returning();
    return result[0];
  }
  async updateRoom(id: string, updates: Partial<Room>): Promise<Room | undefined> {
    const result = await db.update(rooms).set(updates).where(eq(rooms.id, id)).returning();
    return result[0];
  }

  // Player operations
  async getPlayer(id: number): Promise<Player | undefined> {
    const result = await db.select().from(players).where(eq(players.id, id));
    return result[0];
  }
  async getPlayersByRoomId(roomId: string): Promise<Player[]> {
    const result = await db.select().from(players).where(eq(players.roomId, roomId));
    return result;
  }
  async createPlayer(player: InsertPlayer): Promise<Player> {
    const result = await db.insert(players).values(player).returning();
    return result[0];
  }
  async updatePlayer(id: number, updates: Partial<Player>): Promise<Player | undefined> {
    const result = await db.update(players).set(updates).where(eq(players.id, id)).returning();
    return result[0];
  }

  // Game state operations
  async getGameState(roomId: string): Promise<GameState | undefined> {
    const result = await db.select().from(gameStates).where(eq(gameStates.roomId, roomId));
    return result[0]?.state;
  }
  async saveGameState(gameState: GameState): Promise<GameState> {
    // Upsert: try insert, if conflict update
    await db.insert(gameStates).values({ roomId: gameState.roomId, state: gameState, updatedAt: new Date().toISOString() })
      .onConflictDoUpdate({ target: gameStates.roomId, set: { state: gameState, updatedAt: new Date().toISOString() } });
    return gameState;
  }
  async updateGameState(roomId: string, updates: Partial<GameState>): Promise<GameState | undefined> {
    // Only supports updating the state blob
    if (updates) {
      const prev = await this.getGameState(roomId);
      const merged = { ...prev, ...updates };
      await db.update(gameStates).set({ state: merged, updatedAt: new Date().toISOString() }).where(eq(gameStates.roomId, roomId));
      return merged;
    }
    return undefined;
  }
  async deleteGameState(roomId: string): Promise<boolean> {
    await db.delete(gameStates).where(eq(gameStates.roomId, roomId));
    return true;
  }
}


// Use MemStorage instead of DatabaseStorage
export const storage = new DatabaseStorage();
