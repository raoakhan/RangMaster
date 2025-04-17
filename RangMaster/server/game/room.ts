import { Game } from "./game";
import { Player } from "./player";
import { AIPlayer } from "./ai";
import { nanoid } from "nanoid";
import { 
  RoomState, 
  Card, 
  GameStatus, 
  PlayerType, 
  Suit, 
  ChatMessage, 
  AuditMessage 
} from "@shared/types";

export class Room {
  private id: string;
  private code: string;
  private name: string;
  private createdById: string;
  private game: Game;
  private clients: Map<string, Set<WebSocket>>;
  private chatMessages: ChatMessage[];
  private auditLog: AuditMessage[];

  constructor(id: string, name: string, createdById: string) {
    this.id = id;
    this.code = nanoid(8);
    this.name = name;
    this.createdById = createdById;
    this.game = new Game();
    this.clients = new Map();
    this.chatMessages = [];
    this.auditLog = [];
    
    // Add audit message for room creation
    this.addAuditMessage(`Room "${name}" created by ${createdById}`, "info");
  }

  public getId(): string {
    return this.id;
  }

  public getCode(): string {
    return this.code;
  }

  public getName(): string {
    return this.name;
  }

  public getCreatedById(): string {
    return this.createdById;
  }

  public addPlayer(player: Player): boolean {
    if (this.game.addPlayer(player)) {
      this.addAuditMessage(`Player ${player.info.name} joined the room`, "info");
      return true;
    }
    return false;
  }

  public removePlayer(playerId: string): boolean {
    const player = this.game.getPlayer(playerId);
    if (player) {
      this.addAuditMessage(`Player ${player.info.name} left the room`, "info");
      return this.game.removePlayer(playerId);
    }
    return false;
  }

  public registerClient(playerId: string, ws: WebSocket): void {
    if (!this.clients.has(playerId)) {
      this.clients.set(playerId, new Set());
    }
    this.clients.get(playerId)!.add(ws);
    
    const player = this.game.getPlayer(playerId);
    if (player) {
      player.setConnected(true);
    }
  }

  public unregisterClient(playerId: string, ws: WebSocket): void {
    if (this.clients.has(playerId)) {
      this.clients.get(playerId)!.delete(ws);
      
      if (this.clients.get(playerId)!.size === 0) {
        const player = this.game.getPlayer(playerId);
        if (player) {
          player.setConnected(false);
        }
      }
    }
  }

  public hasConnectedClients(playerId: string): boolean {
    return this.clients.has(playerId) && this.clients.get(playerId)!.size > 0;
  }

  public startGame(): boolean {
    if (this.game.startGame()) {
      this.addAuditMessage(`Game started, selecting trump for round ${this.game.getCurrentRound()}`, "success");
      return true;
    }
    return false;
  }

  public selectTrump(suit: Suit): boolean {
    if (this.game.selectTrump(suit)) {
      this.addAuditMessage(`Trump selected: ${suit}`, "info");
      return true;
    }
    return false;
  }

  public passTrump(): boolean {
    if (this.game.passTrump()) {
      const selector = this.game.getTrumpSelector();
      if (selector) {
        const player = this.game.getPlayer(selector);
        if (player) {
          this.addAuditMessage(`Trump selection passed to ${player.info.name}`, "info");
        }
      }
      return true;
    }
    return false;
  }

  public playCard(playerId: string, card: Card): boolean {
    const player = this.game.getPlayer(playerId);
    if (!player) return false;
    
    if (this.game.playCard(playerId, card)) {
      this.addAuditMessage(`${player.info.name} played ${card.value} of ${card.suit}`, "info");
      
      // Check if trick is complete after play
      if (this.game.getCenterCards().length === 0 && this.game.getStatus() === GameStatus.IN_PROGRESS) {
        const currentPlayer = this.game.getCurrentPlayer();
        if (currentPlayer) {
          const team = this.game.getTeams().find(t => t.getId() === currentPlayer.info.teamId);
          if (team) {
            this.addAuditMessage(`${currentPlayer.info.name} (${team.getName()}) won the trick`, "success");
          }
        }
      }
      
      return true;
    }
    return false;
  }

  public handleAITurns(): void {
    // Handle AI player moves if it's their turn
    const currentPlayer = this.game.getCurrentPlayer();
    if (!currentPlayer || !currentPlayer.isAI()) return;
    
    setTimeout(() => {
      // AI trump selection
      if (this.game.getStatus() === GameStatus.SELECTING_TRUMP) {
        const selector = this.game.getTrumpSelector();
        if (selector === currentPlayer.info.id) {
          const hand = currentPlayer.getHand();
          const trumpSuit = AIPlayer.selectTrump(hand);
          
          if (trumpSuit) {
            this.selectTrump(trumpSuit);
          } else {
            this.passTrump();
            this.handleAITurns(); // Check if next player is also AI
          }
        }
      }
      
      // AI card play
      else if (this.game.getStatus() === GameStatus.IN_PROGRESS) {
        if (this.game.isPlayersTurn(currentPlayer.info.id)) {
          const hand = currentPlayer.getHand();
          const centerCards = this.game.getCenterCards();
          const trumpSuit = this.game.getTrumpSuit();
          
          if (trumpSuit) {
            const card = AIPlayer.selectCard(hand, centerCards, trumpSuit);
            this.playCard(currentPlayer.info.id, card);
            
            // Check if next player is also AI
            setTimeout(() => this.handleAITurns(), 1000);
          }
        }
      }
    }, 1500); // Small delay to make AI play seem more natural
  }

  public addAIPlayer(teamId: number): boolean {
    // Generate an AI player name
    const aiNames = [
      "AI-Bot", "CardMaster", "RangPro", "TrumpBot", 
      "Captain AI", "Dealer Bot", "CardShark", "GameBot"
    ];
    
    const existingAI = Array.from(this.game.getPlayers().values())
      .filter(p => p.isAI())
      .length;
    
    const aiName = `${aiNames[existingAI % aiNames.length]}-${existingAI + 1}`;
    const aiId = `ai-${nanoid(6)}`;
    
    // Create AI player
    const aiPlayer = new Player({
      id: aiId,
      name: aiName,
      type: PlayerType.AI,
      isConnected: true,
      isReady: true,
      teamId
    });
    
    if (this.game.addPlayer(aiPlayer)) {
      this.addAuditMessage(`AI player ${aiName} added to Team ${teamId + 1}`, "info");
      return true;
    }
    
    return false;
  }

  public removeAIPlayer(playerId: string): boolean {
    const player = this.game.getPlayer(playerId);
    if (!player || player.info.type !== PlayerType.AI) {
      return false;
    }
    
    this.addAuditMessage(`AI player ${player.info.name} removed`, "info");
    return this.game.removePlayer(playerId);
  }

  public addChatMessage(playerId: string, text: string): ChatMessage {
    const player = this.game.getPlayer(playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    const message: ChatMessage = {
      id: nanoid(),
      playerId,
      playerName: player.info.name,
      text,
      timestamp: Date.now()
    };
    
    this.chatMessages.push(message);
    
    // Keep only last 100 messages
    if (this.chatMessages.length > 100) {
      this.chatMessages.shift();
    }
    
    return message;
  }

  public getChatMessages(): ChatMessage[] {
    return [...this.chatMessages];
  }

  private addAuditMessage(text: string, type: "info" | "warning" | "success" | "error" = "info"): void {
    const message: AuditMessage = {
      id: nanoid(),
      text,
      timestamp: Date.now(),
      type
    };
    
    this.auditLog.push(message);
    
    // Keep only last 100 audit messages
    if (this.auditLog.length > 100) {
      this.auditLog.shift();
    }
  }

  public getAuditLog(): AuditMessage[] {
    return [...this.auditLog];
  }

  public getState(): RoomState {
    return this.game.toRoomState(this.id, this.code, this.name, this.createdById);
  }

  public switchTeam(playerId: string, teamId: number): boolean {
    if (this.game.assignPlayerToTeam(playerId, teamId)) {
      const player = this.game.getPlayer(playerId);
      if (player) {
        this.addAuditMessage(`${player.info.name} switched to Team ${teamId + 1}`, "info");
      }
      return true;
    }
    return false;
  }

  public broadcast(message: any, excludePlayerId?: string): void {
    const messageStr = JSON.stringify(message);
    
    for (const [playerId, clients] of this.clients.entries()) {
      if (excludePlayerId && playerId === excludePlayerId) continue;
      
      for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(messageStr);
        }
      }
    }
  }

  public broadcastToPlayer(playerId: string, message: any): void {
    if (!this.clients.has(playerId)) return;
    
    const messageStr = JSON.stringify(message);
    
    for (const client of this.clients.get(playerId)!) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    }
  }

  public getPlayerCount(): number {
    return this.game.getPlayers().size;
  }

  public hasPlayer(playerId: string): boolean {
    return this.game.getPlayer(playerId) !== undefined;
  }

  public setPlayerReady(playerId: string, ready: boolean): boolean {
    const player = this.game.getPlayer(playerId);
    if (!player) return false;
    
    player.setReady(ready);
    
    if (ready) {
      this.addAuditMessage(`${player.info.name} is ready to play`, "info");
    } else {
      this.addAuditMessage(`${player.info.name} is not ready`, "info");
    }
    
    return true;
  }

  public areAllPlayersReady(): boolean {
    let allReady = true;
    
    for (const player of this.game.getPlayers().values()) {
      if (!player.info.isReady) {
        allReady = false;
        break;
      }
    }
    
    return allReady;
  }

  public areTeamsBalanced(): boolean {
    const teams = this.game.getTeams();
    return teams[0].getPlayerCount() === 2 && teams[1].getPlayerCount() === 2;
  }
}
