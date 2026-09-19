import { io, Socket } from 'socket.io-client';
import type { Piece } from '@reto/geometry';

// Types for socket events
export interface Player {
  id: string;
  username: string;
  isActive: boolean;
}

export interface SocketMessage {
  type?: string;
  message?: string;
  [key: string]: unknown;
}

export interface MultiplayerGameState {
  timer: number;
  isActive: boolean;
  isPaused: boolean;
  winner: string | null;
  scores: Record<string, number>;
  showSolution: boolean;
  phase: 'waiting' | 'countdown' | 'playing';
}

export interface ChallengeStat {
  [key: string]: unknown;
}

export interface RoomData {
  roomId: string;
  players: Player[];
  messages: SocketMessage[];
  gameState: MultiplayerGameState;
}

class SocketService {
  private socket: Socket | null = null;
  private roomId: string | null = null;
  private username: string | null = null;

  // Expose socket for cleanup (read-only access)
  get socketInstance(): Socket | null {
    return this.socket;
  }

  // Initialize socket connection
  connect(): void {
    if (this.socket) return;

    // Production nginx proxies /socket.io on the same public origin. A localhost
    // fallback there would connect to each player's computer, not our server.
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL
      || (import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin);
    this.socket = io(BACKEND_URL);


    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  // Disconnect socket
  disconnect(): void {
    if (!this.socket) return;

    this.socket.disconnect();
    this.socket = null;
    this.roomId = null;
    this.username = null;
  }

  // Join a room
  joinRoom(roomId: string, username: string, requireExisting = true): void {
    if (!this.socket) {
      this.connect();
    }

    this.roomId = roomId;
    this.username = username;

    this.socket?.emit('joinRoom', { roomId, username, requireExisting });
  }

  // Create a new room and join it
  createRoom(username: string): string {
    const roomId = `room_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    this.joinRoom(roomId, username, false);
    return roomId;
  }

  // Listen for player joined event
  onPlayerJoined(callback: (data: { playerId: string; username: string; players: Player[]; hostId: string | null }) => void): () => void {
    const socket = this.socket;
    socket?.on('playerJoined', callback);
    return () => { socket?.off('playerJoined', callback); };
  }

  // El anfitrión es el único que puede arrancar la partida o reiniciar el
  // cronómetro; el servidor lo reasigna solo si se marcha.
  onHostChanged(callback: (data: { hostId: string | null }) => void): () => void {
    const socket = this.socket;
    socket?.on('hostChanged', callback);
    return () => { socket?.off('hostChanged', callback); };
  }

  // El servidor rechaza acciones no autorizadas con este evento.
  onError(callback: (data: { message: string }) => void): () => void {
    const socket = this.socket;
    socket?.on('error', callback);
    return () => { socket?.off('error', callback); };
  }

  // Id de socket propio, para compararlo con el hostId.
  getSocketId(): string | null {
    return this.socket?.id ?? null;
  }

  // Listen for room history event
  onRoomHistory(callback: (data: { messages: SocketMessage[]; gameState: MultiplayerGameState; hostId: string | null; currentChallengeIndex?: number }) => void): () => void {
    const socket = this.socket;
    socket?.on('roomHistory', callback);
    return () => { socket?.off('roomHistory', callback); };
  }

  // Get current room ID
  getRoomId(): string | null {
    return this.roomId;
  }

  // Get current username
  getUsername(): string | null {
    return this.username;
  }

  // Check if socket is connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Start the game
  startGame(): void {
    if (!this.socket || !this.roomId) return;

    this.socket.emit('startGame', { roomId: this.roomId });
  }

  // Listen for game started event
  onGameStarted(callback: (data: { gameState?: MultiplayerGameState; winner?: string | null; timer?: number }) => void): () => void {
    const socket = this.socket;
    socket?.on('gameStarted', callback);
    return () => { socket?.off('gameStarted', callback); };
  }

  // Toggle timer (pause/resume)
  toggleTimer(isPaused: boolean): void {
    if (!this.socket || !this.roomId) {
      return;
    }

    this.socket.emit('toggleTimer', { 
      roomId: this.roomId, 
      isPaused 
    });
  }

  // Reset timer
  resetTimer(): void {
    if (!this.socket || !this.roomId) {
      return;
    }

    this.socket.emit('resetTimer', { 
      roomId: this.roomId
    });
  }

  // Report wrong piece (player disqualified).
  // El tiempo lo lleva el servidor: mandarlo desde aquí no tenía efecto y era
  // una vía de trampa.
  reportWrongPiece(): void {
    if (!this.socket || !this.roomId) return;

    this.socket.emit('wrongPiece', { roomId: this.roomId });
  }

  // El servidor valida esta instantánea; el cliente no comunica una victoria.
  reportSolvedPiece(pieces: ReadonlyArray<Piece>): void {
    if (!this.socket || !this.roomId) return;

    this.socket.emit('solvePiece', {
      roomId: this.roomId,
      pieces: pieces.map(({ type, face, x, y, rotation, placed }) => ({ type, face, x, y, rotation, placed }))
    });
  }

  // Listen for timer state changed event
  onTimerStateChanged(callback: (data: { isPaused: boolean; pausedBy?: string }) => void): () => void {
    const socket = this.socket;
    socket?.on('timerStateChanged', callback);
    return () => { socket?.off('timerStateChanged', callback); };
  }

  // Listen for timer reset event
  onTimerReset(callback: (data: { time: number; resetBy: string }) => void): () => void {
    const socket = this.socket;
    socket?.on('timerReset', callback);
    return () => { socket?.off('timerReset', callback); };
  }

  // Listen for timer update event
  onTimerUpdate(callback: (data: { time: number }) => void): () => void {
    const socket = this.socket;
    socket?.on('timerUpdate', callback);
    return () => { socket?.off('timerUpdate', callback); };
  }

  // Listen for challenge solved event
  onChallengeSolved(callback: (data: { 
    playerId: string, 
    username: string, 
    scores: Record<string, number>, 
    winner: string | null,
    completionTime?: number,
    challengeStats?: ChallengeStat[]
  }) => void): () => void {
    const socket = this.socket;
    socket?.on('challengeSolved', callback);
    return () => { socket?.off('challengeSolved', callback); };
  }

  // Listen for player eliminated event
  onPlayerEliminated(callback: (data: { 
    playerId: string, 
    username: string,
    isCurrentPlayer: boolean,
    message: string
  }) => void): () => void {
    const socket = this.socket;
    socket?.on('playerEliminated', callback);
    return () => { socket?.off('playerEliminated', callback); };
  }

  // Listen for last player standing event
  onLastPlayerStanding(callback: (data: { 
    playerId: string, 
    username: string, 
    scores: Record<string, number>, 
    winner: string | null,
    showSolution: boolean,
    isCurrentPlayer: boolean,
    completionTime?: number
  }) => void): () => void {
    const socket = this.socket;
    socket?.on('lastPlayerStanding', callback);
    return () => { socket?.off('lastPlayerStanding', callback); };
  }

  // Listen for countdown event
  onCountdown(callback: (data: { value: number | string }) => void): () => void {
    const socket = this.socket;
    socket?.on('countdown', callback);
    return () => { socket?.off('countdown', callback); };
  }

  // Listen for phase changed event
  onPhaseChanged(callback: (data: { phase: string; gameState: MultiplayerGameState; currentChallengeIndex?: number }) => void): () => void {
    const socket = this.socket;
    socket?.on('phaseChanged', callback);
    return () => { socket?.off('phaseChanged', callback); };
  }

  // Request reset challenge
  requestResetChallenge(): void {
    if (!this.socket || !this.roomId) {
      return;
    }

    this.socket.emit('requestResetChallenge', { 
      roomId: this.roomId
    });
  }

  // Vote for reset challenge
  voteResetChallenge(vote: boolean): void {
    if (!this.socket || !this.roomId) return;

    this.socket.emit('voteResetChallenge', { 
      roomId: this.roomId,
      vote
    });
  }

  // Listen for reset vote updates
  onResetVoteUpdate(callback: (data: { 
    requesterUsername?: string;
    votes: number; 
    totalPlayers: number; 
    needsVotes: number;
  }) => void): () => void {
    const socket = this.socket;
    socket?.on('resetVoteUpdate', callback);
    return () => { socket?.off('resetVoteUpdate', callback); };
  }

  // Listen for challenge reset
  onChallengeReset(callback: (data: { resetBy: string }) => void): () => void {
    const socket = this.socket;
    socket?.on('challengeReset', callback);
    return () => { socket?.off('challengeReset', callback); };
  }

  // Listen for player left event
  onPlayerLeft(callback: (data: { playerId: string; username: string }) => void): () => void {
    const socket = this.socket;
    socket?.on('playerLeft', callback);
    return () => { socket?.off('playerLeft', callback); };
  }

  // Listen for timer start command
  onStartTimer(callback: (data: { startTime: number }) => void): () => void {
    const socket = this.socket;
    socket?.on('startTimer', callback);
    return () => { socket?.off('startTimer', callback); };
  }

  // Listen for timer commands (pause/resume/reset)
  onTimerCommand(callback: (data: { 
    command: 'pause' | 'resume' | 'reset';
    pausedBy?: string;
    resetBy?: string;
  }) => void): () => void {
    const socket = this.socket;
    socket?.on('timerCommand', callback);
    return () => { socket?.off('timerCommand', callback); };
  }

  // Listen for game notifications (synchronized messages)
  onGameNotification(callback: (data: { 
    type: string;
    message: string;
    isCorrect: boolean;
  }) => void): () => void {
    const socket = this.socket;
    socket?.on('gameNotification', callback);
    return () => { socket?.off('gameNotification', callback); };
  }

  // Signal player ready for next challenge
  playerReady(): void {
    if (!this.socket || !this.roomId) {
      return;
    }

    this.socket.emit('playerReady', { 
      roomId: this.roomId
    });
  }

  // Listen for players ready update
  onPlayersReadyUpdate(callback: (data: { 
    readyCount: number;
    totalPlayers: number;
    readyPlayers: string[];
    playerUsername: string;
  }) => void): () => void {
    const socket = this.socket;
    socket?.on('playersReadyUpdate', callback);
    return () => { socket?.off('playersReadyUpdate', callback); };
  }
}

// Create a singleton instance
const socketService = new SocketService();

export default socketService;
