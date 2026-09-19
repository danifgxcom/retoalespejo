import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Users, Play, Pause, RotateCcw } from './ui/AtelierIcons';
import ValidationFeedback from './ValidationFeedback';
import MultiplayerLobby from './MultiplayerLobby';
import { Player } from '../services/SocketService';
import socketService from '../services/SocketService';
import ChallengeObjective from './ChallengeObjective';
import { Challenge } from './ChallengeCard';
import type { Piece } from '@reto/geometry';

interface RightSidebarProps {
  lobbyMode?: boolean;
  onLeaveMultiplayer?: () => void;
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
  lobbyMode = false,
  onLeaveMultiplayer = () => {},
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
  useEffect(() => { setValidationResult(null); }, [currentChallenge]);
  // Anfitrión de la sala y errores del servidor (acciones no autorizadas)
  const [hostId, setHostId] = useState<string | null>(null);
  const [socketErrorMessage, setSocketErrorMessage] = useState<string | null>(null);
  const esAnfitrion = hostId !== null && hostId === socketService.getSocketId();

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
      const subscriptions: Array<(() => void) | void> = [];
      // El estado de partida (sala, fase y overlays) también lo escucha el
      // componente raíz. No eliminar listeners por nombre: Socket.io borraría
      // los del raíz y el tablero dejaría de reflejar al servidor.
      // Game started event
      subscriptions.push(socketService.onGameStarted((data) => {
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
      }));

      // El marcador ya no llega por 'scoreUpdated' (el servidor eliminó ese
      // evento). Los marcadores y el ganador se actualizan desde
      // 'challengeSolved' y 'lastPlayerStanding', más abajo.

      // Anfitrión: se asigna al primer jugador de la sala y solo él puede
      // arrancar la partida o reiniciar el cronómetro.
      subscriptions.push(socketService.onPlayerJoined((data) => {
        setHostId(data.hostId);
      }));

      subscriptions.push(socketService.onRoomHistory((data) => {
        setHostId(data.hostId);
        if (data.gameState) {
          setTime(data.gameState.timer || 0);
          setScores(data.gameState.scores || {});
          setCurrentWinner(data.gameState.winner || null);
          setIsRunning(data.gameState.isActive);
          if (onPauseChange) onPauseChange(data.gameState.isPaused);
          else setInternalIsPaused(data.gameState.isPaused);
        }
      }));

      subscriptions.push(socketService.onHostChanged((data) => {
        setHostId(data.hostId);
      }));

      // El servidor rechaza acciones no autorizadas (p.ej. no ser anfitrión)
      // con un evento 'error' que hay que mostrar al usuario.
      subscriptions.push(socketService.onError((data) => {
        setSocketErrorMessage(data.message);
      }));

      // Timer state changed event
      subscriptions.push(socketService.onTimerStateChanged((data) => {
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
      }));

      // Timer reset event
      subscriptions.push(socketService.onTimerReset((data) => {
        setTime(data.time);
        setPausedBy(null);
        if (onPausedByChange) {
          onPausedByChange(null);
        }
      }));

      // Timer update event
      subscriptions.push(socketService.onTimerUpdate((data) => {
        // Ensure timer value is valid
        const timerValue = Number.isFinite(data.time) ? data.time : 0;
        setTime(timerValue);
      }));

      // Challenge solved event
      subscriptions.push(socketService.onChallengeSolved((data) => {
        setScores(data.scores);
        setCurrentWinner(data.winner);
        // Show notification
        setValidationResult({
          isCorrect: true,
          message: `¡${data.username} ha resuelto el desafío y gana un punto!`
        });
      }));

      // Player eliminated event
      subscriptions.push(socketService.onPlayerEliminated((data) => {
        // Show different messages based on whether it's the current player
        setValidationResult({
          isCorrect: false,
          message: data.message
        });
      }));

      // Last player standing event
      subscriptions.push(socketService.onLastPlayerStanding((data) => {
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
      }));

      // Reset vote events
      subscriptions.push(socketService.onResetVoteUpdate((data) => {
        setResetVoteData(data);
        setShowResetVoting(true);

        // Auto-hide after 5 seconds if all votes aren't received
        setTimeout(() => {
          if (data.needsVotes > 0) {
            setShowResetVoting(false);
          }
        }, 5000);
      }));

      subscriptions.push(socketService.onChallengeReset(() => {
        setResetVoteData(null);
        setShowResetVoting(false);
        // No mostramos mensaje local, viene del servidor como gameNotification
      }));

      // New timer system
      subscriptions.push(socketService.onStartTimer((data) => {
        setTime(data.startTime);
        setIsRunning(true);
        if (onPauseChange) {
          onPauseChange(false);
        } else {
          setInternalIsPaused(false);
        }
      }));

      subscriptions.push(socketService.onTimerCommand((data) => {
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
      }));

      // Listen for synchronized game notifications
      subscriptions.push(socketService.onGameNotification((data) => {
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
      }));
      return () => subscriptions.forEach(unsubscribe => unsubscribe?.());
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

  if (lobbyMode) return <MultiplayerLobby roomId={roomId} players={connectedPlayers} hostId={hostId} error={socketErrorMessage} onClearError={() => setSocketErrorMessage(null)} onExit={onLeaveMultiplayer} />;

  return (
    <div className="session-panel w-full h-full rounded-lg shadow-lg p-4 space-y-6 flex flex-col" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' }}>
      <p className="panel-eyebrow">03 / REGISTRO DEL RETO</p>
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
              <span aria-hidden="true">{effectiveIsPaused ? 'Ⅱ' : ''}</span> {effectiveIsPaused ? 'Pausado' : 'En curso'}
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
            <span className="sm:hidden" aria-hidden="true">{effectiveIsPaused ? '▷' : 'Ⅱ'}</span>
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
            <span className="sm:hidden" aria-hidden="true">↻</span>
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
          <span aria-hidden="true">↻</span>
          <span>Reiniciar Nivel</span>
        </button>
      </div>


      {gameMode === 'multiplayer' && roomId && (
        <section className="match-roster" aria-label="Sala y jugadores">
          <h3>Vuestra mesa</h3><p className="match-room-code">{roomId}</p>
          <ul>{connectedPlayers.map(player => <li key={player.id}><span>{player.username}{player.id === hostId ? ' · Anfitrión' : ''}</span><span>{scores[player.id] || 0} pt</span></li>)}</ul>
          {currentWinner && <p>Último acierto: {connectedPlayers.find(p => p.id === currentWinner)?.username}</p>}
          <button className="text-link" onClick={onLeaveMultiplayer}>Salir de la sala</button>
        </section>
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
            <h3 id="reset-vote-title" className="text-xl font-bold mb-4 text-center">↻ Solicitud de Reinicio</h3>
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
