import React, { useState, useEffect } from 'react';
import { Clock, Users, User, Play, Pause, RotateCcw, Link } from 'lucide-react';
import ValidationFeedback from './ValidationFeedback';
import { Player } from '../services/SocketService';
import socketService from '../services/SocketService';

interface RightSidebarProps {
  currentChallenge: number;
  totalChallenges: number;
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

  return (
    <div className="w-full h-full bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4 space-y-6 flex flex-col">
      {/* Timer Section - Redesigned */}
      <div className="text-center border-b pb-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-full">
            <Clock size={28} className="text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">Cronómetro</h3>
        </div>

        {/* Large, beautiful timer display */}
        <div className="relative mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 shadow-inner">
            <div className="text-5xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              {formatTime(time)}
            </div>
            <div className="text-sm text-gray-600 mt-2">
              {effectiveIsPaused ? '⏸️ Pausado' : '⏱️ En curso'}
            </div>
          </div>
        </div>

        {/* Timer controls - bigger buttons */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={handlePauseResume}
            className={`px-6 py-3 rounded-xl text-lg font-medium flex items-center gap-2 transition-all shadow-lg transform hover:scale-105 ${
              effectiveIsPaused 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white' 
                : 'bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white'
            }`}
          >
            {effectiveIsPaused ? <Play size={20} /> : <Pause size={20} />}
            {effectiveIsPaused ? 'Reanudar' : 'Pausar'}
          </button>

          <button
            onClick={handleResetTimer}
            className="px-6 py-3 bg-gradient-to-r from-gray-500 to-slate-600 hover:from-gray-600 hover:to-slate-700 text-white rounded-xl text-lg font-medium flex items-center gap-2 transition-all shadow-lg transform hover:scale-105"
          >
            <RotateCcw size={20} />
            Reset
          </button>
        </div>
      </div>

      {/* Game Actions - Separated for safety */}
      <div className="space-y-6">
        {/* Primary Action - Verify Solution */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-green-800 mb-2 text-center">Verificar Progreso</h4>
          <button
            onClick={handleCheckSolution}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg transform hover:scale-105 text-lg flex items-center justify-center gap-3"
          >
            <div className="p-1 bg-white/20 rounded-full">
              ✓
            </div>
            Verificar Solución
          </button>
        </div>

        {/* Secondary Action - Reset Level */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-orange-800 mb-2 text-center">⚠️ Reiniciar Progreso</h4>
          <button
            onClick={handleResetLevel}
            className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg transform hover:scale-105 text-lg flex items-center justify-center gap-3"
          >
            <div className="p-1 bg-white/20 rounded-full">
              🔄
            </div>
            Reiniciar Nivel
          </button>
          <p className="text-xs text-orange-600 mt-2 text-center">Se perderá el progreso actual</p>
        </div>
      </div>


      {/* Multiplayer Section (Feature Flag) */}
      {isMultiplayerEnabled && gameMode === 'multiplayer' && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Users size={20} className="text-purple-600" />
            <h3 className="font-bold text-gray-800">Multijugador</h3>
          </div>

          {!roomId && (
            <div className="space-y-2 mb-3">
              <button 
                onClick={handleCreateRoom}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Play size={16} />
                Crear Sala
              </button>
              <button 
                onClick={handleJoinRoom}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Link size={16} />
                Unirse a Sala
              </button>
            </div>
          )}

          {roomId && (
            <div className="bg-purple-100 p-2 rounded-lg mb-3">
              <p className="text-xs text-black font-medium text-center">
                Sala: {roomId}
              </p>
            </div>
          )}

          {/* Current Winner Display (if game is active) */}
          {isGameActive && currentWinner && (
            <div className="bg-yellow-100 p-2 rounded-lg mb-3">
              <p className="text-xs text-center font-medium">
                <span className="text-gray-700">Ganando: </span>
                <span className="text-yellow-700 font-bold">
                  {connectedPlayers.find(p => p.id === currentWinner)?.username || 'Desconocido'}
                </span>
              </p>
            </div>
          )}

          {/* Players List with Scores */}
          <div className="bg-white rounded-lg border border-gray-200 p-2 mb-3">
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
              <Users size={14} />
              Jugadores Conectados
            </h4>

            <div className="max-h-32 overflow-y-auto">
              {connectedPlayers.length > 0 ? (
                <ul className="space-y-1">
                  {connectedPlayers.map((player) => (
                    <li key={player.id} className="flex items-center justify-between gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        <span className="text-gray-800">{player.username}</span>
                      </div>
                      {isGameActive && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium">
                          {scores[player.id] || 0}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-500 text-center">No hay jugadores conectados</p>
              )}
            </div>

            <div className="text-xs text-gray-600 text-center mt-2">
              <div className="flex items-center justify-center gap-1">
                <User size={12} />
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
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2 mb-3"
                >
                  <Play size={16} />
                  Comenzar Partida
                </button>
              );
            }
            
            if (shouldShowActiveIndicator) {
              return (
                <div className="w-full bg-blue-100 border border-blue-300 text-blue-800 py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  Partida en Curso
                </div>
              );
            }
            
            return null;
          })()}

          {/* Join Room Dialog */}
          {showJoinRoomDialog && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-4 max-w-sm w-full">
                <h3 className="text-lg font-bold mb-3">Unirse a una Sala</h3>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID de la Sala
                  </label>
                  <input
                    type="text"
                    value={joinRoomId}
                    onChange={(e) => setJoinRoomId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ingresa el ID de la sala"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowJoinRoomDialog(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleJoinRoomSubmit}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Unirse
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Multiplayer Section (Feature Flag) - Offline Mode */}
      {isMultiplayerEnabled && gameMode === 'offline' && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Users size={20} className="text-purple-600" />
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
            <Users size={20} className="mx-auto mb-2 opacity-50" />
            <p className="text-xs">Modo multijugador</p>
            <p className="text-xs">próximamente</p>
          </div>
        </div>
      )}

      {/* Reset Voting Modal */}
      {showResetVoting && resetVoteData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4 text-center">🔄 Solicitud de Reinicio</h3>
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
                  className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium"
                >
                  ✓ Aceptar
                </button>
                <button
                  onClick={() => socketService.voteResetChallenge(false)}
                  className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium"
                >
                  ✗ Rechazar
                </button>
              </div>
            )}
            <button
              onClick={() => setShowResetVoting(false)}
              className="w-full mt-3 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-sm"
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
