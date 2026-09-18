import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Users, User, Play, Pause, RotateCcw, Link } from 'lucide-react';
import ValidationFeedback from './ValidationFeedback';
import { Player } from '../services/SocketService';
import socketService from '../services/SocketService';
import ChallengeObjective from './ChallengeObjective';
import { Challenge } from './ChallengeCard';
import type { Piece } from '@reto/geometry';

interface RightSidebarProps {
  currentChallenge: number;
  totalChallenges: number;
  challenges: Challenge[];
  pieces?: Piece[];
  onResetLevel: () => void;
  onCheckSolution: (elapsedSeconds?: number) => { isCorrect: boolean; message: string };
  isMultiplayerEnabled?: boolean;
  gameMode?: 'offline' | 'multiplayer';
  connectedPlayers?: Player[];
  roomId?: string | null;
  isGameActive?: boolean;
  isPaused?: boolean;
  onPauseChange?: (isPaused: boolean) => void;
  onPausedByChange?: (pausedBy: string | null) => void;
  /** F-mobile: el cronómetro vive aquí; esto deja un espejo de sólo lectura
   *  para el badge compacto de la cabecera móvil, sin duplicar el estado. */
  onTimerChange?: (formattedTime: string, isPaused: boolean) => void;
  /** F-mobile: expone la MISMA función que usa el botón "Verificar Solución"
   *  de este panel (con su rama de multijugador y el tiempo transcurrido
   *  correcto) para que la barra flotante de acciones en móvil la reutilice
   *  en vez de reimplementar la comprobación. */
  onExposeCheckSolution?: (checkSolution: () => void) => void;
}

const RightSidebar: React.FC<RightSidebarProps> = ({
  currentChallenge,
  totalChallenges,
  challenges,
  pieces = [],
  onResetLevel,
  onCheckSolution,
  isMultiplayerEnabled = false,
  gameMode = 'offline',
  connectedPlayers = [],
  roomId = null,
  isGameActive = false,
  isPaused = true,
  onPauseChange,
  onPausedByChange,
  onTimerChange,
  onExposeCheckSolution
}) => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false); // Start stopped
  // Use internal state as fallback if props are not provided
  // In multiplayer mode, start unpaused and wait for server commands
  // In offline mode, start paused
  const [internalIsPaused, setInternalIsPaused] = useState(gameMode === 'offline');

  // Use props if provided, otherwise use internal state
  const effectiveIsPaused = onPauseChange ? isPaused : internalIsPaused;

  const formatTime = useCallback((seconds: number): string => {
    // Handle NaN, null, undefined, or negative values
    if (!Number.isFinite(seconds) || seconds < 0) {
      seconds = 0;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // F-mobile: espejo de sólo lectura para el badge de cabecera en móvil.
  useEffect(() => {
    onTimerChange?.(formatTime(time), effectiveIsPaused);
  }, [time, effectiveIsPaused, onTimerChange, formatTime]);
  const [validationResult, setValidationResult] = useState<{isCorrect: boolean; message: string} | null>(null);
  const [showJoinRoomDialog, setShowJoinRoomDialog] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState('');

  // Anfitrión de la sala y errores del servidor (acciones no autorizadas)
  const [hostId, setHostId] = useState<string | null>(null);
  const [socketErrorMessage, setSocketErrorMessage] = useState<string | null>(null);
  const esAnfitrion = hostId !== null && hostId === socketService.getSocketId();

  // Diálogo propio para pedir el nombre de usuario (sustituye a prompt())
  const [showUsernameDialog, setShowUsernameDialog] = useState(false);
  const [usernameDialogAction, setUsernameDialogAction] = useState<'join' | 'create' | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);

  // Game state for multiplayer
  const [scores, setScores] = useState<Record<string, number>>({});
  const [currentWinner, setCurrentWinner] = useState<string | null>(null);
  const [, setShowSolution] = useState(false);
  const [, setPausedBy] = useState<string | null>(null);
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
      // El estado de partida (sala, fase y overlays) también lo escucha el
      // componente raíz. No eliminar listeners por nombre: Socket.io borraría
      // los del raíz y el tablero dejaría de reflejar al servidor.
      // Game started event
      socketService.onGameStarted((data) => {
        try {
          if (data && data.gameState) {
            setScores(data.gameState.scores || {});
            setCurrentWinner(data.gameState.winner || null);
            // Set timer to the server's timer value or 0 if undefined
            setTime(data.gameState.timer || 0);
            setIsRunning(true);

            // Update pause state based on whether we're using props or internal state
            if (onPauseChange) {
              onPauseChange(data.gameState.isPaused ?? true);
            } else {
              setInternalIsPaused(data.gameState.isPaused ?? true);
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

      // El marcador ya no llega por 'scoreUpdated' (el servidor eliminó ese
      // evento). Los marcadores y el ganador se actualizan desde
      // 'challengeSolved' y 'lastPlayerStanding', más abajo.

      // Anfitrión: se asigna al primer jugador de la sala y solo él puede
      // arrancar la partida o reiniciar el cronómetro.
      socketService.onPlayerJoined((data) => {
        setHostId(data.hostId);
      });

      socketService.onRoomHistory((data) => {
        setHostId(data.hostId);
      });

      socketService.onHostChanged((data) => {
        setHostId(data.hostId);
      });

      // El servidor rechaza acciones no autorizadas (p.ej. no ser anfitrión)
      // con un evento 'error' que hay que mostrar al usuario.
      socketService.onError((data) => {
        setSocketErrorMessage(data.message);
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

      socketService.onChallengeReset(() => {
        setResetVoteData(null);
        setShowResetVoting(false);
        // No mostramos mensaje local, viene del servidor como gameNotification
      });

      // New timer system
      socketService.onStartTimer((data) => {
        setTime(data.startTime);
        setIsRunning(true);
        if (onPauseChange) {
          onPauseChange(false);
        } else {
          setInternalIsPaused(false);
        }
      });

      socketService.onTimerCommand((data) => {
        switch (data.command) {
          case 'pause':
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
    if (gameMode === 'offline') {
      setTime(0);
      setIsRunning(true);

      if (onPauseChange) {
        onPauseChange(false);
      } else {
        setInternalIsPaused(false);
      }
      setPausedBy(null);
      if (onPausedByChange) {
        onPausedByChange(null);
      }
      return;
    }

    // In menus or inactive multiplayer rooms, keep the timer reset and stopped.
    if (!isGameActive) {
      setTime(0);
      setIsRunning(false);

      if (onPauseChange) {
        onPauseChange(true);
      } else {
        setInternalIsPaused(true);
      }
    }
  }, [currentChallenge, gameMode, isGameActive, onPauseChange, onPausedByChange]);

  const handlePauseResume = () => {
    const newPausedState = !effectiveIsPaused;

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
      socketService.toggleTimer(newPausedState);
    }
  };

  const handleResetLevel = () => {
    if (gameMode === 'multiplayer' && isGameActive) {
      // In multiplayer mode, request reset vote
      socketService.requestResetChallenge();
    } else {
      // In offline mode, call the provided reset function
      onResetLevel();
      setTime(0);
      setIsRunning(true);
      if (onPauseChange) {
        onPauseChange(false);
      } else {
        setInternalIsPaused(false);
      }
      setPausedBy(null);
      if (onPausedByChange) {
        onPausedByChange(null);
      }
    }
  };

  const handleResetTimer = () => {
    if (gameMode === 'multiplayer' && isGameActive) {
      // In multiplayer mode, let server handle the reset
      socketService.resetTimer();
    } else {
      // In offline mode, handle locally
      setTime(0);
      setIsRunning(true);
      if (onPauseChange) {
        onPauseChange(false);
      } else {
        setInternalIsPaused(false);
      }
      setPausedBy(null);
      if (onPausedByChange) {
        onPausedByChange(null);
      }
    }
  };

  const handleCheckSolution = useCallback(() => {
    // En multijugador la respuesta del cliente no decide nada: el servidor
    // valida la instantánea y emite el resultado o la eliminación para todos.
    if (gameMode === 'multiplayer') {
      if (isGameActive && !effectiveIsPaused) {
        socketService.reportSolvedPiece(pieces);
      }
      return;
    }

    // El cronómetro offline vive aquí (`time`): se pasa para que useGameLogic
    // pueda guardar el mejor tiempo del reto en localStorage (F03).
    const result = onCheckSolution(gameMode === 'offline' ? time : undefined);
    setValidationResult(result);

    if (result.isCorrect) {
      setIsRunning(false);
      if (onPauseChange) {
        onPauseChange(true);
      } else {
        setInternalIsPaused(true);
      }
      setPausedBy('SYSTEM');
      if (onPausedByChange) {
        onPausedByChange('SYSTEM');
      }
    }
  }, [gameMode, isGameActive, effectiveIsPaused, pieces, onCheckSolution, time, onPauseChange, onPausedByChange]);

  // F-mobile: expone esta misma función (no una copia) al botón "Verificar
  // Solución" flotante de móvil, así comparten rama de multijugador y tiempo.
  useEffect(() => {
    onExposeCheckSolution?.(handleCheckSolution);
  }, [handleCheckSolution, onExposeCheckSolution]);

  const handleJoinRoom = () => {
    setShowJoinRoomDialog(true);
  };

  // Pide el ID de sala y, si es válido, pasa al diálogo de nombre de usuario
  const handleJoinRoomSubmit = () => {
    if (joinRoomId.trim()) {
      setShowJoinRoomDialog(false);
      setUsernameError(null);
      setUsernameInput('');
      setUsernameDialogAction('join');
      setShowUsernameDialog(true);
    }
  };

  const handleCreateRoom = () => {
    setUsernameError(null);
    setUsernameInput('');
    setUsernameDialogAction('create');
    setShowUsernameDialog(true);
  };

  // Misma validación que aplica el servidor: 1-32 caracteres tras recortar espacios
  const validateUsername = (raw: string): string | null => {
    const trimmed = raw.trim();
    if (trimmed.length < 1 || trimmed.length > 32) {
      return 'El nombre de usuario debe tener entre 1 y 32 caracteres.';
    }
    return null;
  };

  const handleUsernameDialogCancel = () => {
    setShowUsernameDialog(false);
    setUsernameDialogAction(null);
    setUsernameInput('');
    setUsernameError(null);
  };

  const handleUsernameDialogSubmit = () => {
    const error = validateUsername(usernameInput);
    if (error) {
      setUsernameError(error);
      return;
    }

    const username = usernameInput.trim();
    if (usernameDialogAction === 'join') {
      socketService.joinRoom(joinRoomId.trim(), username);
      setJoinRoomId('');
    } else if (usernameDialogAction === 'create') {
      socketService.createRoom(username);
    }

    setShowUsernameDialog(false);
    setUsernameDialogAction(null);
    setUsernameInput('');
    setUsernameError(null);
  };

  const handleStartGame = () => {
    socketService.startGame();
  };

  // Cierra el diálogo de nombre de usuario con Escape (como el Modal compartido)
  useEffect(() => {
    if (!showUsernameDialog) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowUsernameDialog(false);
        setUsernameDialogAction(null);
        setUsernameInput('');
        setUsernameError(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showUsernameDialog]);

  return (
    <div className="w-full h-full rounded-lg shadow-lg p-4 space-y-6 flex flex-col" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' }}>
      {/* Aviso de error del servidor (p.ej. acción restringida al anfitrión) */}
      {socketErrorMessage && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-lg p-2 text-sm flex items-center justify-between gap-2"
          style={{ backgroundColor: 'var(--button-danger-bg)', color: 'var(--text-on-danger)' }}
        >
          <span>{socketErrorMessage}</span>
          <button
            type="button"
            onClick={() => setSocketErrorMessage(null)}
            aria-label="Cerrar aviso de error"
            className="underline shrink-0"
          >
            Cerrar
          </button>
        </div>
      )}

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
            disabled={gameMode === 'multiplayer' && isGameActive && !esAnfitrion}
            className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm lg:text-lg font-medium flex items-center gap-1 sm:gap-2 transition-all shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{
              backgroundColor: 'var(--button-gray-bg)',
              color: 'var(--text-on-dark)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--button-gray-hover)';
            }}
            onFocus={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--button-gray-hover)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--button-gray-bg)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--button-gray-bg)';
            }}
            aria-label="Reiniciar cronómetro"
            title={(gameMode === 'multiplayer' && isGameActive && !esAnfitrion) ? 'Solo el anfitrión puede reiniciar el cronómetro' : undefined}
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
          onFocus={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--button-success-hover)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--button-success-bg)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--button-success-bg)';
          }}
          aria-label="Verificar solución actual"
          type="button"
        >
          <span aria-hidden="true">✓</span>
          <span>Verificar Solución</span>
        </button>
      </div>

      {/*
        En móvil el objetivo no va aquí, al final de una columna con scroll:
        va arriba del tablero (ver MirrorChallengeGame) y a pantalla completa
        los primeros segundos del reto (ChallengeIntro). Este panel sólo existe
        desde xl, donde cabe al lado del tablero sin quitarle sitio.
      */}
      <div className="hidden xl:block pb-4" style={{ borderBottom: '1px solid var(--border-light)' }}>
        {challenges[currentChallenge] && (
          <ChallengeObjective
            challenge={challenges[currentChallenge]}
            index={currentChallenge}
            total={totalChallenges}
          />
        )}
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
          onFocus={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--button-danger-hover)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--button-danger-bg)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--button-danger-bg)';
          }}
          aria-label="Reiniciar nivel actual"
          type="button"
        >
          <span aria-hidden="true">🔄</span>
          <span>Reiniciar Nivel</span>
        </button>
      </div>


      {gameMode === 'multiplayer' && (
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
                onFocus={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--button-secondary-hover)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--button-secondary-bg)';
                }}
                onBlur={(e) => {
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
                onFocus={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--button-primary-hover)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--button-primary-bg)';
                }}
                onBlur={(e) => {
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
                        <span style={{ color: 'var(--text-primary)' }}>
                          {player.username}
                          {player.id === hostId && (
                            <span className="ml-1 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                              (Anfitrión)
                            </span>
                          )}
                        </span>
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

            if (shouldShowStartButton) {
              return (
                <button
                  onClick={handleStartGame}
                  disabled={!esAnfitrion}
                  title={esAnfitrion ? undefined : 'Solo el anfitrión puede comenzar la partida'}
                  className="w-full py-2 px-4 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2 mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: 'var(--button-success-bg)',
                    color: 'var(--text-on-success)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--button-success-hover)';
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--button-success-hover)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--button-success-bg)';
                  }}
                  onBlur={(e) => {
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
                    onFocus={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--button-gray-hover)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--button-gray-bg)';
                    }}
                    onBlur={(e) => {
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
                    onFocus={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--button-primary-hover)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--button-primary-bg)';
                    }}
                    onBlur={(e) => {
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

          {/* Username Dialog (sustituye a prompt()) */}
          {showUsernameDialog && (
            <div
              className="fixed inset-0 bg-modal-overlay flex items-center justify-center z-50"
              role="dialog"
              aria-modal="true"
              aria-labelledby="username-dialog-title"
            >
              <div className="bg-modal rounded-lg p-4 max-w-sm w-full">
                <h3 id="username-dialog-title" className="text-lg font-bold mb-3">
                  {usernameDialogAction === 'create' ? 'Crear Sala' : 'Unirse a Sala'}
                </h3>
                <div className="mb-3">
                  <label htmlFor="username-input" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de usuario
                  </label>
                  <input
                    id="username-input"
                    type="text"
                    value={usernameInput}
                    onChange={(e) => {
                      setUsernameInput(e.target.value);
                      setUsernameError(null);
                    }}
                    className="w-full px-3 py-2 border border-card rounded-md focus:outline-none focus:ring-2 focus:ring-focus"
                    placeholder="Ingresa tu nombre de usuario"
                    maxLength={32}
                    aria-invalid={usernameError !== null}
                    aria-describedby={usernameError ? 'username-input-error' : undefined}
                  />
                  {usernameError && (
                    <p id="username-input-error" role="alert" className="text-xs mt-1" style={{ color: 'var(--button-danger-bg)' }}>
                      {usernameError}
                    </p>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleUsernameDialogCancel}
                    className="px-4 py-2 rounded-md"
                    style={{
                      backgroundColor: 'var(--button-gray-bg)',
                      color: 'var(--text-on-dark)'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--button-gray-hover)';
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--button-gray-hover)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--button-gray-bg)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--button-gray-bg)';
                    }}
                    aria-label="Cancelar"
                    type="button"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleUsernameDialogSubmit}
                    className="px-4 py-2 rounded-md"
                    style={{
                      backgroundColor: 'var(--button-primary-bg)',
                      color: 'var(--text-on-primary)'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--button-primary-hover)';
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--button-primary-hover)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--button-primary-bg)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--button-primary-bg)';
                    }}
                    aria-label="Confirmar nombre de usuario"
                    type="button"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Multiplayer Section Removed */}
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
