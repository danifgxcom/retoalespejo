import socketService, { Player } from './SocketService';

export interface GameState {
  gameMode: 'offline' | 'multiplayer';
  isGameActive: boolean;
  isGamePaused: boolean;
  gamePhase: 'waiting' | 'countdown' | 'playing';
  roomId: string | null;
  connectedPlayers: Player[];
  pausedBy: string | null;
}

export interface GameCallbacks {
  onStateChange: (state: Partial<GameState>) => void;
  onChallengeWinner: (winner: { id: string; username: string; completionTime: number }) => void;
  onGameNotification: (data: { type: string; message: string; isCorrect: boolean }) => void;
}

export class MultiplayerManager {
  private callbacks: GameCallbacks;
  private gameState: GameState;

  constructor(callbacks: GameCallbacks) {
    this.callbacks = callbacks;
    this.gameState = {
      gameMode: 'offline',
      isGameActive: false,
      isGamePaused: false,
      gamePhase: 'waiting',
      roomId: null,
      connectedPlayers: [],
      pausedBy: null
    };
  }

  // Initialize multiplayer mode
  initializeMultiplayer(): void {
    this.updateState({ gameMode: 'multiplayer' });
    socketService.connect();
    this.setupEventListeners();
  }

  // Cleanup
  cleanup(): void {
    this.removeEventListeners();
    if (socketService.isConnected()) {
      socketService.disconnect();
    }
  }

  // State management
  private updateState(updates: Partial<GameState>): void {
    this.gameState = { ...this.gameState, ...updates };
    this.callbacks.onStateChange(updates);
  }

  // Event listeners setup
  private setupEventListeners(): void {
    socketService.onPlayerJoined((data) => {
      this.updateState({ 
        connectedPlayers: data.players,
        roomId: socketService.getRoomId()
      });
    });

    socketService.onGameStarted((data) => {
      if (data.gameState) {
        this.updateState({
          isGameActive: data.gameState.isActive || false,
          isGamePaused: data.gameState.isPaused || false
        });
      }
    });

    socketService.onTimerCommand((data) => {
      switch (data.command) {
        case 'pause':
          this.updateState({ isGamePaused: true, pausedBy: data.pausedBy || null });
          break;
        case 'resume':
          this.updateState({ isGamePaused: false, pausedBy: null });
          break;
        case 'reset':
          this.updateState({ isGamePaused: true, pausedBy: null });
          break;
      }
    });

    socketService.onPhaseChanged((data) => {
      this.updateState({
        gamePhase: data.phase as 'waiting' | 'countdown' | 'playing'
      });
      if (data.gameState) {
        this.updateState({
          isGameActive: data.gameState.isActive || false,
          isGamePaused: data.gameState.isPaused || false
        });
      }
    });

    socketService.onChallengeSolved((data) => {
      this.callbacks.onChallengeWinner({
        id: data.playerId,
        username: data.username,
        completionTime: data.completionTime || 0
      });
    });

    socketService.onGameNotification((data) => {
      this.callbacks.onGameNotification(data);
    });
  }

  private removeEventListeners(): void {
    const events = ['playerJoined', 'gameStarted', 'timerCommand', 'phaseChanged', 'challengeSolved', 'gameNotification'];
    events.forEach(event => {
      socketService.socketInstance?.off(event);
    });
  }

  // Actions
  createRoom(username: string): void {
    socketService.createRoom(username);
  }

  joinRoom(roomId: string, username: string): void {
    socketService.joinRoom(roomId, username);
  }

  startGame(): void {
    socketService.startGame();
  }

  toggleTimer(isPaused: boolean): void {
    if (this.gameState.gameMode === 'multiplayer' && this.gameState.isGameActive) {
      socketService.toggleTimer(isPaused);
    }
  }

  reportSolution(challengeId: number, currentTime: number, isCorrect: boolean): void {
    if (this.gameState.gameMode === 'multiplayer' && this.gameState.isGameActive) {
      if (isCorrect) {
        socketService.reportSolvedPiece(challengeId, currentTime);
      } else {
        socketService.reportWrongPiece(currentTime);
      }
    }
  }

  requestNextChallenge(): void {
    socketService.nextChallenge();
  }

  getState(): GameState {
    return { ...this.gameState };
  }
}