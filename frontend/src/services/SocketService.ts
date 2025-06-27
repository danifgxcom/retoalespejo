import { io, Socket } from 'socket.io-client';

// Types for socket events
export interface Player {
  id: string;
  username: string;
  isActive: boolean;
}

export interface RoomData {
  roomId: string;
  players: Player[];
  messages: any[];
  gameState: {
    timer: number;
    isActive: boolean;
    isPaused: boolean;
    winner: string | null;
    scores: Record<string, number>; // Map of player ID to score
    showSolution: boolean;
  };
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

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
    this.socket = io(BACKEND_URL);

    this.socket.on('connect', () => {
      console.log('Connected to server with ID:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

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
  joinRoom(roomId: string, username: string): void {
    if (!this.socket) {
      this.connect();
    }

    this.roomId = roomId;
    this.username = username;

    this.socket?.emit('joinRoom', { roomId, username });
  }

  // Create a new room and join it
  createRoom(username: string): string {
    const roomId = `room_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    this.joinRoom(roomId, username);
    return roomId;
  }

  // Listen for player joined event
  onPlayerJoined(callback: (data: { playerId: string; username: string; players: Player[] }) => void): void {
    this.socket?.on('playerJoined', callback);
  }

  // Listen for room history event
  onRoomHistory(callback: (data: { messages: any[]; gameState: any }) => void): void {
    this.socket?.on('roomHistory', callback);
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

  // Update player score
  updateScore(playerId: string, score: number): void {
    if (!this.socket || !this.roomId) return;

    this.socket.emit('updateScore', { 
      roomId: this.roomId, 
      playerId, 
      score 
    });
  }

  // Listen for game started event
  onGameStarted(callback: (data: { gameState: any }) => void): void {
    this.socket?.on('gameStarted', callback);
  }

  // Listen for score updated event
  onScoreUpdated(callback: (data: { scores: Record<string, number>, winner: string | null }) => void): void {
    this.socket?.on('scoreUpdated', callback);
  }

  // Toggle timer (pause/resume)
  toggleTimer(isPaused: boolean): void {
    if (!this.socket || !this.roomId) {
      console.log('❌ toggleTimer failed - socket:', !!this.socket, 'roomId:', this.roomId);
      return;
    }

    console.log('📤 Emitting toggleTimer:', { roomId: this.roomId, isPaused });
    this.socket.emit('toggleTimer', { 
      roomId: this.roomId, 
      isPaused 
    });
  }

  // Reset timer
  resetTimer(): void {
    if (!this.socket || !this.roomId) {
      console.log('❌ resetTimer failed - socket:', !!this.socket, 'roomId:', this.roomId);
      return;
    }

    console.log('📤 Emitting resetTimer:', { roomId: this.roomId });
    this.socket.emit('resetTimer', { 
      roomId: this.roomId
    });
  }

  // Report wrong piece (player disqualified)
  reportWrongPiece(currentTime?: number): void {
    if (!this.socket || !this.roomId) return;

    console.log('📤 Emitting wrongPiece:', { roomId: this.roomId, currentTime });
    this.socket.emit('wrongPiece', { 
      roomId: this.roomId,
      currentTime
    });
  }

  // Report solved piece (player gets a point)
  reportSolvedPiece(pieceId: number, currentTime?: number): void {
    if (!this.socket || !this.roomId) return;

    console.log('📤 Emitting solvePiece:', { roomId: this.roomId, pieceId, currentTime });
    this.socket.emit('solvePiece', { 
      roomId: this.roomId, 
      pieceId,
      currentTime
    });
  }

  // Listen for timer state changed event
  onTimerStateChanged(callback: (data: { isPaused: boolean; pausedBy?: string }) => void): void {
    this.socket?.on('timerStateChanged', callback);
  }

  // Listen for timer reset event
  onTimerReset(callback: (data: { time: number; resetBy: string }) => void): void {
    this.socket?.on('timerReset', callback);
  }

  // Listen for timer update event
  onTimerUpdate(callback: (data: { time: number }) => void): void {
    this.socket?.on('timerUpdate', callback);
  }

  // Listen for challenge solved event
  onChallengeSolved(callback: (data: { 
    playerId: string, 
    username: string, 
    scores: Record<string, number>, 
    winner: string | null,
    completionTime?: number,
    challengeStats?: any[]
  }) => void): void {
    this.socket?.on('challengeSolved', callback);
  }

  // Listen for player eliminated event
  onPlayerEliminated(callback: (data: { 
    playerId: string, 
    username: string,
    isCurrentPlayer: boolean,
    message: string
  }) => void): void {
    this.socket?.on('playerEliminated', callback);
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
  }) => void): void {
    this.socket?.on('lastPlayerStanding', callback);
  }

  // Listen for countdown event
  onCountdown(callback: (data: { value: number | string }) => void): void {
    this.socket?.on('countdown', callback);
  }

  // Listen for phase changed event
  onPhaseChanged(callback: (data: { phase: string; gameState: any }) => void): void {
    this.socket?.on('phaseChanged', callback);
  }

  // Request reset challenge
  requestResetChallenge(): void {
    if (!this.socket || !this.roomId) {
      console.log('❌ requestResetChallenge failed - socket:', !!this.socket, 'roomId:', this.roomId);
      return;
    }

    console.log('📤 Emitting requestResetChallenge:', { roomId: this.roomId });
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
  }) => void): void {
    this.socket?.on('resetVoteUpdate', callback);
  }

  // Listen for challenge reset
  onChallengeReset(callback: (data: { resetBy: string }) => void): void {
    this.socket?.on('challengeReset', callback);
  }

  // Listen for player left event
  onPlayerLeft(callback: (data: { playerId: string; username: string }) => void): void {
    this.socket?.on('playerLeft', callback);
  }

  // Listen for timer start command
  onStartTimer(callback: (data: { startTime: number }) => void): void {
    this.socket?.on('startTimer', callback);
  }

  // Listen for timer commands (pause/resume/reset)
  onTimerCommand(callback: (data: { 
    command: 'pause' | 'resume' | 'reset';
    pausedBy?: string;
    resetBy?: string;
  }) => void): void {
    this.socket?.on('timerCommand', callback);
  }

  // Listen for game notifications (synchronized messages)
  onGameNotification(callback: (data: { 
    type: string;
    message: string;
    isCorrect: boolean;
  }) => void): void {
    this.socket?.on('gameNotification', callback);
  }

  // Signal player ready for next challenge
  playerReady(): void {
    if (!this.socket || !this.roomId) {
      console.log('❌ playerReady failed - socket:', !!this.socket, 'roomId:', this.roomId);
      return;
    }

    console.log('📤 Emitting playerReady:', { roomId: this.roomId });
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
  }) => void): void {
    this.socket?.on('playersReadyUpdate', callback);
  }
}

// Create a singleton instance
const socketService = new SocketService();

export default socketService;
