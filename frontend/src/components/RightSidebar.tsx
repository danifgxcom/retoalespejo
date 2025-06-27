import React, { useState, useEffect } from 'react';
import { Clock, Users, User, Play, Pause, RotateCcw, Link } from 'lucide-react';
import ValidationFeedback from './ValidationFeedback';
import { Player } from '../services/SocketService';
import socketService from '../services/SocketService';
import ThemeSwitcher from './accessibility/ThemeSwitcher';
import ChallengeThumbnail from './ui/ChallengeThumbnail';
import { Challenge } from './ChallengeCard';

interface RightSidebarProps {
  currentChallenge: number;
  totalChallenges: number;
  challenges: Challenge[];
  onResetLevel: () => void;
  onCheckSolution: () => { isCorrect: boolean; message: string };
  isMultiplayerEnabled?: boolean;
  gameMode?: 'offline' | 'multiplayer';
  connectedPlayers?: Player[];
  roomId?: string | null;
  isGameActive?: boolean;
  isPaused?: boolean;
  onPauseChange?: (isPaused: boolean) => void;
  onPausedByChange?: (pausedBy: string | null) => void;
}

const RightSidebar: React.FC<RightSidebarProps> = ({
  currentChallenge,
  totalChallenges,
  challenges,
  onResetLevel,
  onCheckSolution,
  isMultiplayerEnabled = false,
  gameMode = 'offline',
  connectedPlayers = [],
  roomId = null,
  isGameActive = false,
  isPaused = true,
  onPauseChange,
  onPausedByChange
}) => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false); // Start stopped
  // Use internal state as fallback if props are not provided
  // In multiplayer mode, start unpaused and wait for server commands
  // In offline mode, start paused
  const [internalIsPaused, setInternalIsPaused] = useState(gameMode === 'offline');

  // Use props if provided, otherwise use internal state
  const effectiveIsPaused = onPauseChange ? isPaused : internalIsPaused;
  const [validationResult, setValidationResult] = useState<{isCorrect: boolean; message: string} | null>(null);
  const [showJoinRoomDialog, setShowJoinRoomDialog] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState('');

  // Game state for multiplayer
  const [scores, setScores] = useState<Record<string, number>>({});
  const [currentWinner, setCurrentWinner] = useState<string | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [pausedBy, setPausedBy] = useState<string | null>(null);
  const [resetVoteData, setResetVoteData] = useState<{
    requesterUsername?: string;
    votes: number;
    totalPlayers: number;
    needsVotes: number;
  } | null>(null);
  const [showResetVoting, setShowResetVoting] = useState(false);

  // Listen for game events
  useEffect(() => {
    if (gameMode === 'multiplayer') {
      // Clear any existing listeners first
      socketService.socketInstance?.off('gameStarted');
      socketService.socketInstance?.off('scoreUpdated');
      socketService.socketInstance?.off('timerStateChanged');
      socketService.socketInstance?.off('timerReset');
      socketService.socketInstance?.off('timerUpdate');
      socketService.socketInstance?.off('startTimer');
      socketService.socketInstance?.off('timerCommand');
      socketService.socketInstance?.off('gameNotification');
      socketService.socketInstance?.off('challengeSolved');
      socketService.socketInstance?.off('playerEliminated');
      socketService.socketInstance?.off('lastPlayerStanding');
      socketService.socketInstance?.off('resetVoteUpdate');
      socketService.socketInstance?.off('challengeReset');
      // Game started event
      socketService.onGameStarted((data) => {
        console.log('RightSidebar: Game started event received:', data);
        try {
          if (data && data.gameState) {
            setScores(data.gameState.scores || {});
            setCurrentWinner(data.gameState.winner || null);
            // Set timer to the server's timer value or 0 if undefined
            setTime(data.gameState.timer || 0);
            setIsRunning(true);

            // Update pause state based on whether we're using props or internal state
            if (onPauseChange) {
              onPauseChange(data.gameState.isPaused || true);
            } else {
              setInternalIsPaused(data.gameState.isPaused || true);
            }
          } else if (data) {
            // Handle case where data is sent directly (fallback)
            setScores({});
            setCurrentWinner(data.winner || null);
            setTime(data.timer || 0);
            setIsRunning(true);

            if (onPauseChange) {
              onPauseChange(true);
            } else {
              setInternalIsPaused(true);
            }
          } else {
            // Fallback for completely invalid data
            console.warn('Invalid gameStarted data received:', data);
            setScores({});
            setCurrentWinner(null);
            setTime(0);
            setIsRunning(true);

            if (onPauseChange) {
              onPauseChange(true);
            } else {
              setInternalIsPaused(true);
            }
          }
        } catch (error) {
          console.error('Error handling gameStarted event:', error, data);
          // Safe fallback
          setScores({});
          setCurrentWinner(null);
          setTime(0);
          setIsRunning(true);

          if (onPauseChange) {
            onPauseChange(true);
          } else {
            setInternalIsPaused(true);
          }
        }
      });

      // Score updated event
      socketService.onScoreUpdated((data) => {
        setScores(data.scores);
        setCurrentWinner(data.winner);
      });

      // Timer state changed event
      socketService.onTimerStateChanged((data) => {
        if (onPauseChange) {
          onPauseChange(data.isPaused);
        } else {
          setInternalIsPaused(data.isPaused);
        }
        const pausedByUser = data.pausedBy || null;
        setPausedBy(pausedByUser);
        if (onPausedByChange) {
          onPausedByChange(pausedByUser);
        }
      });

      // Timer reset event
      socketService.onTimerReset((data) => {
        setTime(data.time);
        setPausedBy(null);
        if (onPausedByChange) {
          onPausedByChange(null);
        }
      });

      // Timer update event
      socketService.onTimerUpdate((data) => {
        // Ensure timer value is valid
        const timerValue = Number.isFinite(data.time) ? data.time : 0;
        setTime(timerValue);
      });

      // Challenge solved event
      socketService.onChallengeSolved((data) => {
        setScores(data.scores);
        setCurrentWinner(data.winner);
        // Show notification
        setValidationResult({
          isCorrect: true,
          message: `¡${data.username} ha resuelto el desafío y gana un punto!`
        });
      });

      // Player eliminated event
      socketService.onPlayerEliminated((data) => {
        // Show different messages based on whether it's the current player
        setValidationResult({
          isCorrect: false,
          message: data.message
        });
      });

      // Last player standing event
      socketService.onLastPlayerStanding((data) => {
        setScores(data.scores);
        setCurrentWinner(data.winner);
        setShowSolution(data.showSolution);

        // Show different messages based on whether it's the current player
        if (data.isCurrentPlayer) {
          // If it's the current player, they won by elimination
          setValidationResult({
            isCorrect: true,
            message: '¡Enhorabuena! Eres el último jugador en pie.'
          });
        } else {
          // If it's not the current player, show who won
          setValidationResult({
            isCorrect: false,
            message: `${data.username} ha ganado al ser el último jugador en pie.`
          });
        }
      });

      // Reset vote events
      socketService.onResetVoteUpdate((data) => {
        setResetVoteData(data);
        setShowResetVoting(true);

        // Auto-hide after 5 seconds if all votes aren't received
        setTimeout(() => {
          if (data.needsVotes > 0) {
            setShowResetVoting(false);
          }
        }, 5000);
      });

      socketService.onChallengeReset((data) => {
        setResetVoteData(null);
        setShowResetVoting(false);
        // No mostramos mensaje local, viene del servidor como gameNotification
      });

      // New timer system
      socketService.onStartTimer((data) => {
        console.log('Timer start command received:', data);
        setTime(data.startTime);
        setIsRunning(true);
        if (onPauseChange) {
          onPauseChange(false);
        } else {
          setInternalIsPaused(false);
        }
      });

      socketService.onTimerCommand((data) => {
        console.log('📥 RightSidebar received timerCommand:', data);
        switch (data.command) {
          case 'pause':
            console.log('🔄 Processing pause command');
            if (onPauseChange) {
              onPauseChange(true);
            } else {
              setInternalIsPaused(true);
            }
            setPausedBy(data.pausedBy || null);
            if (onPausedByChange) {
              onPausedByChange(data.pausedBy || null);
            }
            break;
          case 'resume':
            console.log('🔄 Processing resume command');
            if (onPauseChange) {
              onPauseChange(false);
            } else {
              setInternalIsPaused(false);
            }
            setPausedBy(null);
            if (onPausedByChange) {
              onPausedByChange(null);
            }
            break;
          case 'reset':
            console.log('🔄 Processing reset command');
            setTime(0);
            setIsRunning(true);
            if (onPauseChange) {
              onPauseChange(true);
            } else {
              setInternalIsPaused(true);
            }
            setPausedBy(null);
            if (onPausedByChange) {
              onPausedByChange(null);
            }
            break;
        }
      });

      // Listen for synchronized game notifications
      socketService.onGameNotification((data) => {
        console.log('Game notification received:', data);

        // Only show validation-style notifications for certain types
        const validationTypes = ['challengeReset', 'challengeSolved', 'playerEliminated'];
        if (validationTypes.includes(data.type)) {
          setValidationResult({
            isCorrect: data.isCorrect,
            message: data.message
          });
        }
        // For pause/resume notifications, we could show them differently in the future
        // but for now, just log them without showing the toast
      });
    }
  }, [gameMode, onPauseChange, onPausedByChange]);

  // Timer tick effect (works for both offline and multiplayer)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && !effectiveIsPaused) {
      interval = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, effectiveIsPaused]);

  // Reset timer when challenge changes
  useEffect(() => {
    // Only reset in offline mode or if not in active game
    if (gameMode === 'offline' || !isGameActive) {
      setTime(0);
      setIsRunning(false);

      // Update pause state based on whether we're using props or internal state
      if (onPauseChange) {
        onPauseChange(true);
      } else {
        setInternalIsPaused(true);
      }
    }
  }, [currentChallenge, gameMode, isGameActive, onPauseChange]);

  const formatTime = (seconds: number): string => {
    // Handle NaN, null, undefined, or negative values
    if (!Number.isFinite(seconds) || seconds < 0) {
      seconds = 0;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePauseResume = () => {
    const newPausedState = !effectiveIsPaused;
    console.log('🔄 handlePauseResume called:', { 
      effectiveIsPaused, 
      newPausedState, 
      gameMode, 
      isGameActive,
      roomId: socketService.getRoomId() 
    });

    // Ensure timer is running when we resume
    if (!isRunning && !newPausedState) {
      setIsRunning(true);
    }

    // Update state based on whether we're using props or internal state
    if (onPauseChange) {
      onPauseChange(newPausedState);
    } else {
      setInternalIsPaused(newPausedState);
    }

    // In multiplayer mode, synchronize with other players
    if (gameMode === 'multiplayer' && isGameActive) {
      console.log('✅ Sending toggleTimer to server:', { newPausedState });
      socketService.toggleTimer(newPausedState);
    } else {
      console.log('❌ Not sending to server - gameMode:', gameMode, 'isGameActive:', isGameActive);
    }
  };

  const handleResetLevel = () => {
    console.log('🔄 handleResetLevel called:', { gameMode, isGameActive });
    if (gameMode === 'multiplayer' && isGameActive) {
      // In multiplayer mode, request reset vote
      console.log('✅ Requesting reset challenge vote');
      socketService.requestResetChallenge();
    } else {
      // In offline mode, call the provided reset function
      console.log('❌ Calling local reset - gameMode:', gameMode, 'isGameActive:', isGameActive);
      onResetLevel();
    }
  };

  const handleResetTimer = () => {
    console.log('🔄 handleResetTimer called:', { gameMode, isGameActive });
    if (gameMode === 'multiplayer' && isGameActive) {
      // In multiplayer mode, let server handle the reset
      console.log('✅ Sending resetTimer to server');
      socketService.resetTimer();
    } else {
      // In offline mode, handle locally
      console.log('❌ Resetting timer locally - gameMode:', gameMode, 'isGameActive:', isGameActive);
      setTime(0);
      setIsRunning(true);
      // Update pause state based on whether we're using props or internal state
      if (onPauseChange) {
        onPauseChange(true); // Start paused
      } else {
        setInternalIsPaused(true); // Start paused
      }
    }
  };

  const handleCheckSolution = () => {
    const result = onCheckSolution();
    setValidationResult(result);

    // In multiplayer mode, report to server
    if (gameMode === 'multiplayer' && isGameActive) {
      if (result.isCorrect) {
        // Report solved piece with current timer value
        socketService.reportSolvedPiece(currentChallenge, time);
      } else {
        // Report wrong piece (player disqualified) with current time
        socketService.reportWrongPiece(time);
      }
    }
  };

  const handleJoinRoom = () => {
    setShowJoinRoomDialog(true);
  };

  const handleJoinRoomSubmit = () => {
    if (joinRoomId.trim()) {
      const username = prompt('Ingresa tu nombre de usuario:') || `Player_${Date.now().toString().slice(-4)}`;
      socketService.joinRoom(joinRoomId.trim(), username);
      setShowJoinRoomDialog(false);
      setJoinRoomId('');
    }
  };

  const handleCreateRoom = () => {
    const username = prompt('Ingresa tu nombre de usuario:') || `Player_${Date.now().toString().slice(-4)}`;
    socketService.createRoom(username);
  };

  const handleStartGame = () => {
    socketService.startGame();
  };

  // DEBUG: Check what CSS variables are resolving to
  React.useEffect(() => {
    const computedStyle = getComputedStyle(document.body);
    console.log('🔍 RightSidebar CSS Variables Debug:', {
      cardBg: computedStyle.getPropertyValue('--card-bg').trim(),
      textPrimary: computedStyle.getPropertyValue('--text-primary').trim(),
      buttonPrimaryBg: computedStyle.getPropertyValue('--button-primary-bg').trim(),
      buttonSuccessBg: computedStyle.getPropertyValue('--button-success-bg').trim(),
      bodyClass: document.body.className,
      bodyClassList: Array.from(document.body.classList)
    });
  }, [gameMode]);

  return (
    <div className="w-full h-full rounded-lg shadow-lg p-4 space-y-6 flex flex-col" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' }}>
      {/* Timer Section - Redesigned */}
      <div className="text-center pb-6" style={{ borderBottom: '1px solid var(--border-light)' }}>
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-2 rounded-full" style={{ backgroundColor: 'var(--card-elevated-bg)' }}>
            <Clock size={28} aria-hidden="true" style={{ color: 'var(--text-primary)' }} />
          </div>
          <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Cronómetro</h3>
        </div>

        {/* Large, beautiful timer display */}
        <div className="relative mb-6">
          <div className="rounded-2xl p-6 shadow-inner" style={{ backgroundColor: 'var(--card-elevated-bg)' }}>
            <div className="text-5xl font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
              {formatTime(time)}
            </div>
            <div className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
              <span aria-hidden="true">{effectiveIsPaused ? '⏸️' : '⏱️'}</span> {effectiveIsPaused ? 'Pausado' : 'En curso'}
            </div>
          </div>
        </div>

        {/* Timer controls - responsive buttons */}
        <div className="flex gap-1 sm:gap-2 lg:gap-3 justify-center">
          <button
            onClick={handlePauseResume}
            className={`px-2 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm lg:text-lg font-medium flex items-center gap-1 sm:gap-2 transition-all shadow-lg transform hover:scale-105 ${
              effectiveIsPaused 
                ? 'bg-success-gradient hover:bg-success-gradient-hover' 
                : 'bg-warning-gradient hover:bg-warning-gradient-hover'
            }`}
            aria-label={effectiveIsPaused ? 'Reanudar cronómetro' : 'Pausar cronómetro'}
          >
            {effectiveIsPaused ? <Play size={16} className="sm:w-5 sm:h-5" aria-hidden="true" /> : <Pause size={16} className="sm:w-5 sm:h-5" aria-hidden="true" />}
            <span className="hidden sm:inline">{effectiveIsPaused ? 'Reanudar' : 'Pausar'}</span>
            <span className="sm:hidden" aria-hidden="true">{effectiveIsPaused ? '▶️' : '⏸️'}</span>
          </button>

          <button
            onClick={handleResetTimer}
            className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm lg:text-lg font-medium flex items-center gap-1 sm:gap-2 transition-all shadow-lg transform hover:scale-105"
            style={{
              backgroundColor: 'var(--button-gray-bg)',
              color: 'var(--text-on-dark)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--button-gray-hover)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--button-gray-bg)';
            }}
            aria-label="Reiniciar cronómetro"
            type="button"
          >
            <RotateCcw size={16} className="sm:w-5 sm:h-5" aria-hidden="true" />
            <span className="hidden sm:inline">Reset</span>
            <span className="sm:hidden" aria-hidden="true">🔄</span>
          </button>
        </div>
      </div>



      {/* Primary Action - Verify Solution */}
      <div className="pb-4" style={{ borderBottom: '1px solid var(--border-light)' }}>
        <button
          onClick={handleCheckSolution}
          className="w-full font-bold py-3 lg:py-4 px-4 lg:px-6 rounded-lg sm:rounded-xl transition-all shadow-lg transform hover:scale-105 text-sm sm:text-base lg:text-lg flex items-center justify-center gap-2 sm:gap-3"
          style={{
            backgroundColor: 'var(--button-success-bg)',
            color: 'var(--text-on-success)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--button-success-hover)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--button-success-bg)';
          }}
          aria-label="Verificar solución actual"
          type="button"
        >
          <span aria-hidden="true">✓</span>
          <span>Verificar Solución</span>
        </button>
      </div>

      {/* Challenge Card Section */}
      <div className="pb-4" style={{ borderBottom: '1px solid var(--border-light)' }}>
        <div className="text-center mb-3">
          <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Desafío {currentChallenge + 1} de {totalChallenges}
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {challenges[currentChallenge]?.name || 'Cargando...'}
          </p>
        </div>

        {challenges[currentChallenge] && (
          <div className="flex justify-center">
            <ChallengeThumbnail
              challenge={challenges[currentChallenge]}
              width={300}
              height={225}
              backgroundColor="dark-blue"
              alt={`Objetivo del reto ${currentChallenge + 1}: ${challenges[currentChallenge]?.name}`}
            />
          </div>
        )}

        <div className="text-center mt-2">
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {challenges[currentChallenge]?.description || 'Objetivo del reto'}
          </p>
        </div>
      </div>

      {/* Secondary Action - Reset Level */}
      <div className="pb-4" style={{ borderBottom: '1px solid var(--border-light)' }}>
        <button
          onClick={handleResetLevel}
          className="w-full font-bold py-3 lg:py-4 px-4 lg:px-6 rounded-lg sm:rounded-xl transition-all shadow-lg transform hover:scale-105 text-sm sm:text-base lg:text-lg flex items-center justify-center gap-2 sm:gap-3"
          style={{
            backgroundColor: 'var(--button-danger-bg)',
            color: 'var(--text-on-danger)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--button-danger-hover)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--button-danger-bg)';
          }}
          aria-label="Reiniciar nivel actual"
          type="button"
        >
          <span aria-hidden="true">🔄</span>
          <span>Reiniciar Nivel</span>
        </button>
      </div>


      {/* Multiplayer Section Removed */}
      {false && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Users size={20} className="text-secondary-600" aria-hidden="true" />
            <h3 className="font-bold text-gray-800">Multijugador</h3>
          </div>

          {!roomId && (
            <div className="space-y-2 mb-3">
              <button 
                onClick={handleCreateRoom}
                className="w-full py-2 px-4 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                style={{
                  backgroundColor: 'var(--button-secondary-bg)',
                  color: 'var(--text-on-secondary)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--button-secondary-hover)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--button-secondary-bg)';
                }}
                aria-label="Crear sala de multijugador"
                type="button"
              >
                <Play size={16} aria-hidden="true" />
                Crear Sala
              </button>
              <button 
                onClick={handleJoinRoom}
                className="w-full py-2 px-4 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                style={{
                  backgroundColor: 'var(--button-primary-bg)',
                  color: 'var(--text-on-primary)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--button-primary-hover)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--button-primary-bg)';
                }}
                aria-label="Unirse a sala existente"
                type="button"
              >
                <Link size={16} aria-hidden="true" />
                Unirse a Sala
              </button>
            </div>
          )}

          {roomId && (
            <div className="p-2 rounded-lg mb-3" style={{ backgroundColor: 'var(--card-elevated-bg)', border: '1px solid var(--border-light)' }}>
              <p className="text-xs font-medium text-center" style={{ color: 'var(--text-primary)' }}>
                Sala: {roomId}
              </p>
            </div>
          )}

          {/* Current Winner Display (if game is active) */}
          {isGameActive && currentWinner && (
            <div className="p-2 rounded-lg mb-3" style={{ backgroundColor: 'var(--card-elevated-bg)', border: '1px solid var(--border-medium)' }}>
              <p className="text-xs text-center font-medium">
                <span style={{ color: 'var(--text-secondary)' }}>Ganando: </span>
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                  {connectedPlayers.find(p => p.id === currentWinner)?.username || 'Desconocido'}
                </span>
              </p>
            </div>
          )}

          {/* Players List with Scores */}
          <div className="rounded-lg p-2 mb-3" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-light)' }}>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
              <Users size={14} aria-hidden="true" />
              Jugadores Conectados
            </h4>

            <div className="max-h-32 overflow-y-auto">
              {connectedPlayers.length > 0 ? (
                <ul className="space-y-1">
                  {connectedPlayers.map((player) => (
                    <li key={player.id} className="flex items-center justify-between gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--button-success-bg)' }} aria-hidden="true"></span>
                        <span style={{ color: 'var(--text-primary)' }}>{player.username}</span>
                      </div>
                      {isGameActive && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'var(--card-elevated-bg)', color: 'var(--text-primary)' }}>
                          {scores[player.id] || 0}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>No hay jugadores conectados</p>
              )}
            </div>

            <div className="text-xs text-center mt-2" style={{ color: 'var(--text-secondary)' }}>
              <div className="flex items-center justify-center gap-1">
                <User size={12} aria-hidden="true" />
                Jugadores: {connectedPlayers.length}/4
              </div>
            </div>
          </div>

          {/* Game Start Button (only show when multiple players and game not active) */}
          {(() => {
            const shouldShowStartButton = roomId && connectedPlayers.length > 1 && !isGameActive;
            const shouldShowActiveIndicator = roomId && isGameActive;
            console.log('🎮 Button visibility:', { 
              roomId: !!roomId, 
              playersCount: connectedPlayers.length, 
              isGameActive, 
              shouldShowStartButton, 
              shouldShowActiveIndicator 
            });

            if (shouldShowStartButton) {
              return (
                <button 
                  onClick={handleStartGame}
                  className="w-full py-2 px-4 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2 mb-3"
                  style={{
                    backgroundColor: 'var(--button-success-bg)',
                    color: 'var(--text-on-success)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--button-success-hover)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--button-success-bg)';
                  }}
                  aria-label="Comenzar partida multijugador"
                >
                  <Play size={16} aria-hidden="true" />
                  Comenzar Partida
                </button>
              );
            }

            if (shouldShowActiveIndicator) {
              return (
                <div className="w-full bg-primary-100 border border-primary-300 text-primary-800 py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" aria-hidden="true"></div>
                  Partida en Curso
                </div>
              );
            }

            return null;
          })()}

          {/* Join Room Dialog */}
          {showJoinRoomDialog && (
            <div className="fixed inset-0 bg-modal-overlay flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="join-room-title">
              <div className="bg-modal rounded-lg p-4 max-w-sm w-full">
                <h3 id="join-room-title" className="text-lg font-bold mb-3">Unirse a una Sala</h3>
                <div className="mb-3">
                  <label htmlFor="room-id-input" className="block text-sm font-medium text-gray-700 mb-1">
                    ID de la Sala
                  </label>
                  <input
                    id="room-id-input"
                    type="text"
                    value={joinRoomId}
                    onChange={(e) => setJoinRoomId(e.target.value)}
                    className="w-full px-3 py-2 border border-card rounded-md focus:outline-none focus:ring-2 focus:ring-focus"
                    placeholder="Ingresa el ID de la sala"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowJoinRoomDialog(false)}
                    className="px-4 py-2 rounded-md"
                    style={{
                      backgroundColor: 'var(--button-gray-bg)',
                      color: 'var(--text-on-dark)'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--button-gray-hover)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--button-gray-bg)';
                    }}
                    aria-label="Cancelar unirse a sala"
                    type="button"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleJoinRoomSubmit}
                    className="px-4 py-2 rounded-md"
                    style={{
                      backgroundColor: 'var(--button-primary-bg)',
                      color: 'var(--text-on-primary)'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--button-primary-hover)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--button-primary-bg)';
                    }}
                    aria-label="Confirmar unirse a sala"
                    type="button"
                  >
                    Unirse
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Multiplayer Section Removed */}
      {false && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Users size={20} className="text-secondary-600" aria-hidden="true" />
            <h3 className="font-bold text-gray-800">Multijugador</h3>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-gray-600 text-center">
              Estás jugando en modo offline. Reinicia el juego para jugar en modo multijugador.
            </p>
          </div>
        </div>
      )}

      {/* Disabled Multiplayer Notice */}
      {!isMultiplayerEnabled && (
        <div className="border-t pt-4">
          <div className="text-center text-gray-500">
            <Users size={20} className="mx-auto mb-2 opacity-50" aria-hidden="true" />
            <p className="text-xs">Modo multijugador</p>
            <p className="text-xs">próximamente</p>
          </div>
        </div>
      )}

      {/* Reset Voting Modal */}
      {showResetVoting && resetVoteData && (
        <div className="fixed inset-0 bg-modal-overlay flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="reset-vote-title">
          <div className="bg-modal rounded-lg p-6 max-w-md w-full mx-4">
            <h3 id="reset-vote-title" className="text-xl font-bold mb-4 text-center">🔄 Solicitud de Reinicio</h3>
            {resetVoteData.requesterUsername && (
              <p className="text-gray-600 mb-4 text-center">
                <span className="font-semibold">{resetVoteData.requesterUsername}</span> quiere reiniciar el reto.
              </p>
            )}
            <div className="mb-4 text-center">
              <p className="text-lg font-semibold text-gray-800">
                Votos: {resetVoteData.votes} / {resetVoteData.totalPlayers}
              </p>
              <p className="text-sm text-gray-600">
                Faltan {resetVoteData.needsVotes} votos para reiniciar
              </p>
            </div>
            {resetVoteData.needsVotes > 0 && (
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => socketService.voteResetChallenge(true)}
                  className="px-6 py-2 bg-success-gradient hover:bg-success-gradient-hover rounded-lg font-medium"
                  style={{ color: 'var(--text-on-success)' }}
                  aria-label="Aceptar reinicio del reto"
                >
                  <span aria-hidden="true">✓</span> Aceptar
                </button>
                <button
                  onClick={() => socketService.voteResetChallenge(false)}
                  className="px-6 py-2 bg-danger-gradient hover:bg-danger-gradient-hover rounded-lg font-medium"
                  style={{ color: 'var(--text-on-danger)' }}
                  aria-label="Rechazar reinicio del reto"
                >
                  <span aria-hidden="true">✗</span> Rechazar
                </button>
              </div>
            )}
            <button
              onClick={() => setShowResetVoting(false)}
              className="w-full mt-3 px-4 py-2 bg-gray-gradient hover:bg-gray-gradient-hover rounded-lg text-sm"
              style={{ color: 'var(--text-on-dark)' }}
              aria-label="Cerrar diálogo de votación"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}


      {/* Validation Feedback */}
      <ValidationFeedback 
        result={validationResult}
        onClose={() => setValidationResult(null)}
      />
    </div>
  );
};

export default RightSidebar;
