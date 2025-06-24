import React, { useRef, useState, useEffect } from 'react';
import GameCanvas, { GameCanvasRef } from './components/GameCanvas';
import GameControls from './components/GameControls';
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import StartupMenu from './components/StartupMenu';
import ChallengeWinOverlay from './components/ChallengeWinOverlay';
import { ChallengeEditorApp } from './ChallengeEditorApp';
import { ResponsiveTest } from './components/ResponsiveTest';
import { useGameLogic } from './hooks/useGameLogic';
import { useMouseHandlers } from './hooks/useMouseHandlers';
import socketService, { Player } from './services/SocketService';

const MirrorChallengeGame: React.FC = () => {
  const canvasRef = useRef<GameCanvasRef>(null);
  const [showChallengeEditor, setShowChallengeEditor] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [showResponsiveTest, setShowResponsiveTest] = useState(false);
  const [showStartupMenu, setShowStartupMenu] = useState(true);
  const [gameMode, setGameMode] = useState<'offline' | 'multiplayer'>('offline');
  const [connectedPlayers, setConnectedPlayers] = useState<Player[]>([]);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isGamePaused, setIsGamePaused] = useState(false); // Start unpaused for multiplayer
  const [showSolution, setShowSolution] = useState(false);
  const [isGameActive, setIsGameActive] = useState(false);
  const [pausedBy, setPausedBy] = useState<string | null>(null);
  const [gamePhase, setGamePhase] = useState<'waiting' | 'countdown' | 'playing'>('waiting');
  const [countdownValue, setCountdownValue] = useState<number | string>(3);
  const [challengeWinner, setChallengeWinner] = useState<{
    id: string;
    username: string;
    completionTime: number;
  } | null>(null);

  // Feature flags
  const MULTIPLAYER_ENABLED = true;

  const {
    currentChallenge,
    pieces,
    draggedPiece,
    dragOffset,
    showInstructions,
    challenges,
    isLoading,
    interactingPieceId,
    temporaryDraggedPieceId,
    animatingPieceId,
    setControlEffect,
    setPieces,
    setDraggedPiece,
    setDragOffset,
    setShowInstructions,
    setInteractingPieceId,
    rotatePiece,
    rotatePieceCounterClockwise,
    flipPiece,
    resetLevel,
    nextChallenge,
    previousChallenge,
    isPieceHit,
    checkSolutionWithMirrors,
    loadCustomChallenges,
    geometry,
    initializeResponsiveSystem,
    responsiveCanvas
  } = useGameLogic();

  const {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleContextMenu,
  } = useMouseHandlers({
    pieces,
    draggedPiece,
    dragOffset,
    setPieces,
    setDraggedPiece,
    setDragOffset,
    isPieceHit,
    canvasRef,
    rotatePiece,
    geometry,
    setInteractingPieceId,
  });

  // Inicializar sistema responsive cuando el canvas esté disponible
  useEffect(() => {
    const canvas = canvasRef.current?.getCanvas();
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      console.log(`🎯 Canvas dimensions: actual=${canvas.width}x${canvas.height}, displayed=${Math.round(rect.width)}x${Math.round(rect.height)}`);
      initializeResponsiveSystem(rect.width, rect.height);
      console.log(`🎯 Responsive system initialized: ${Math.round(rect.width)}x${Math.round(rect.height)}`);
    }
  }, [canvasRef, initializeResponsiveSystem]);

  // Actualizar sistema responsive cuando cambie el tamaño de ventana
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current?.getCanvas();
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        initializeResponsiveSystem(rect.width, rect.height);
        console.log(`🔄 Responsive system updated: ${Math.round(rect.width)}x${Math.round(rect.height)}`);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [canvasRef, initializeResponsiveSystem]);

  // Startup menu handlers
  const handleStartOffline = () => {
    setGameMode('offline');
    setShowStartupMenu(false);

    // Disconnect from server if connected
    if (socketService.isConnected()) {
      socketService.disconnect();
    }
  };

  const handleStartMultiplayer = () => {
    setGameMode('multiplayer');
    setShowStartupMenu(false);

    // Connect to server
    socketService.connect();

    // Clear existing listeners to prevent duplicates
    socketService.socketInstance?.off('playerJoined');
    socketService.socketInstance?.off('playerLeft');
    socketService.socketInstance?.off('roomHistory');
    socketService.socketInstance?.off('gameStarted');
    socketService.socketInstance?.off('timerStateChanged');
    socketService.socketInstance?.off('timerCommand');
    socketService.socketInstance?.off('lastPlayerStanding');
    socketService.socketInstance?.off('countdown');
    socketService.socketInstance?.off('phaseChanged');
    socketService.socketInstance?.off('challengeSolved');
    socketService.socketInstance?.off('nextChallengeReady');

    // Set up event listeners
    socketService.onPlayerJoined((data) => {
      console.log('Player joined:', data);
      setConnectedPlayers(data.players);
      // Update room ID if not already set
      if (!roomId) {
        setRoomId(socketService.getRoomId());
      }
    });

    socketService.onPlayerLeft((data) => {
      console.log('Player left:', data);
      setConnectedPlayers(prev => prev.filter(player => player.id !== data.playerId));
    });

    socketService.onRoomHistory((data) => {
      console.log('Room history:', data);
      if (data.gameState) {
        setIsGameActive(data.gameState.isActive || false);
        setIsGamePaused(data.gameState.isPaused || true);
        setShowSolution(data.gameState.showSolution || false);
      }
    });

    // Listen for game started event
    socketService.onGameStarted((data) => {
      console.log('📥 Game started event received:', data);
      if (data.gameState) {
        console.log('🔄 Setting isGameActive to:', data.gameState.isActive);
        setIsGameActive(data.gameState.isActive || false);
        setIsGamePaused(data.gameState.isPaused || false);
        setShowSolution(data.gameState.showSolution || false);
      }
    });

    // Listen for timer commands
    socketService.onTimerCommand((data) => {
      console.log('📥 Main game timer command:', data);
      switch (data.command) {
        case 'pause':
          console.log('🔄 Main game processing pause - setting isGamePaused to true');
          setIsGamePaused(true);
          setPausedBy(data.pausedBy || null);
          break;
        case 'resume':
          console.log('🔄 Main game processing resume - setting isGamePaused to false');
          setIsGamePaused(false);
          setPausedBy(null);
          break;
        case 'reset':
          console.log('🔄 Main game processing reset - setting isGamePaused to true');
          setIsGamePaused(true);
          setPausedBy(null);
          break;
      }
    });

    // Listen for last player standing event
    socketService.onLastPlayerStanding((data) => {
      setShowSolution(data.showSolution);
    });

    // Listen for countdown event
    socketService.onCountdown((data) => {
      setGamePhase('countdown');
      setCountdownValue(data.value);
    });

    // Listen for phase changed event
    socketService.onPhaseChanged((data) => {
      console.log('📥 Phase changed:', data);
      setGamePhase(data.phase as 'waiting' | 'countdown' | 'playing');
      if (data.gameState) {
        console.log('🔄 Setting isGameActive to:', data.gameState.isActive);
        setIsGameActive(data.gameState.isActive || false);
        setIsGamePaused(data.gameState.isPaused || false);
      }
      
      // Reset pieces when game starts playing
      if (data.phase === 'playing') {
        resetLevel();
      }
    });

    // Listen for challenge solved event
    socketService.onChallengeSolved((data) => {
      console.log('📥 Challenge solved event:', data);
      setChallengeWinner({
        id: data.playerId,
        username: data.username,
        completionTime: data.completionTime || 0
      });
    });

    // Listen for next challenge ready event
    socketService.onNextChallengeReady((data) => {
      console.log('📥 Next challenge ready:', data);
      setChallengeWinner(null); // Clear the winner overlay
      nextChallenge(); // Go to next challenge
    });
  };

  // Cleanup socket listeners on unmount or mode change
  useEffect(() => {
    return () => {
      if (gameMode === 'multiplayer') {
        // Clean up listeners when component unmounts
        socketService.socketInstance?.off('playerJoined');
        socketService.socketInstance?.off('playerLeft');
        socketService.socketInstance?.off('roomHistory');
        socketService.socketInstance?.off('gameStarted');
        socketService.socketInstance?.off('timerStateChanged');
        socketService.socketInstance?.off('timerCommand');
        socketService.socketInstance?.off('lastPlayerStanding');
        socketService.socketInstance?.off('countdown');
        socketService.socketInstance?.off('phaseChanged');
        socketService.socketInstance?.off('challengeSolved');
        socketService.socketInstance?.off('nextChallengeReady');
      }
    };
  }, [gameMode]);

  // Show startup menu first
  if (showStartupMenu && !MULTIPLAYER_ENABLED) {
    // When multiplayer is disabled, auto-start in offline mode
    setTimeout(() => handleStartOffline(), 0);
  }

  if (showStartupMenu && MULTIPLAYER_ENABLED) {
    return (
      <StartupMenu
        onStartOffline={handleStartOffline}
        onStartMultiplayer={handleStartMultiplayer}
        isMultiplayerEnabled={MULTIPLAYER_ENABLED}
      />
    );
  }

  if (showChallengeEditor) {
    return <ChallengeEditorApp onClose={() => setShowChallengeEditor(false)} />;
  }

  if (showResponsiveTest) {
    return (
      <div className="p-4">
        <button 
          onClick={() => setShowResponsiveTest(false)}
          className="mb-4 bg-blue-500 text-white px-4 py-2 rounded"
        >
          Volver al juego
        </button>
        <ResponsiveTest />
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 p-1">
      <div className="w-full h-full flex gap-1 sm:gap-2">
        {/* Left Sidebar - Piece Controls - Responsive width */}
        <div className="w-48 sm:w-56 md:w-64 lg:w-72 xl:w-80 flex-shrink-0">
          <LeftSidebar
            pieces={pieces}
            challenges={challenges}
            currentChallenge={currentChallenge}
            onRotatePiece={rotatePiece}
            onRotatePieceCounterClockwise={rotatePieceCounterClockwise}
            onFlipPiece={flipPiece}
            setControlEffect={setControlEffect}
          />
        </div>

        {/* Main Game Area - Takes all remaining width */}
        <div className="flex-1 flex flex-col min-w-0 max-w-none relative">
          {/* Top Navigation */}
          <div className="mb-1 sm:mb-2">
            <GameControls
              pieces={pieces}
              challenges={challenges}
              currentChallenge={currentChallenge}
              showInstructions={showInstructions}
              onToggleInstructions={() => setShowInstructions(!showInstructions)}
              onResetLevel={resetLevel}
              onNextChallenge={nextChallenge}
              onPreviousChallenge={previousChallenge}
              onRotatePiece={rotatePiece}
              onRotatePieceCounterClockwise={rotatePieceCounterClockwise}
              onFlipPiece={flipPiece}
              onCheckSolution={checkSolutionWithMirrors}
              onLoadCustomChallenges={loadCustomChallenges}
              onOpenChallengeEditor={() => setShowChallengeEditor(true)}
              isLoading={isLoading}
              debugMode={debugMode}
              onToggleDebugMode={() => setDebugMode(!debugMode)}
              setControlEffect={setControlEffect}
              compact={true}
            />
          </div>

          {/* Game Canvas */}
          <div className="bg-white rounded-lg shadow-lg p-1 sm:p-2 flex-1 flex flex-col min-h-0 relative">
            <div className="flex justify-center items-start flex-1 overflow-hidden">
              <GameCanvas
                ref={canvasRef}
                pieces={gameMode === 'multiplayer' && gamePhase !== 'playing' ? [] : pieces}
                currentChallenge={gameMode === 'multiplayer' && gamePhase !== 'playing' ? -1 : currentChallenge}
                challenges={challenges}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onContextMenu={handleContextMenu}
                geometry={geometry}
                debugMode={debugMode}
                draggedPiece={draggedPiece}
                interactingPieceId={interactingPieceId}
                temporaryDraggedPieceId={temporaryDraggedPieceId}
                animatingPieceId={animatingPieceId}
              />

            </div>

            {/* Footer */}
            <div className="text-center py-1">
              <p className="text-gray-400 text-xs">
                Basado en &quot;Reto al Espejo&quot; de Educa
              </p>
            </div>
          </div>

          {/* FULL SCREEN OVERLAYS - Cover entire main game area */}
          
          {/* Countdown overlay for multiplayer mode */}
          {gameMode === 'multiplayer' && gamePhase === 'countdown' && (
            <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-50">
              <div className="text-center">
                <div className="text-9xl font-bold text-white mb-4 animate-pulse">
                  {countdownValue}
                </div>
                <p className="text-2xl text-white">
                  {typeof countdownValue === 'string' ? '' : 'Preparándose...'}
                </p>
              </div>
            </div>
          )}

          {/* Waiting room overlay for multiplayer mode */}
          {gameMode === 'multiplayer' && gamePhase === 'waiting' && isGameActive && (
            <div className="absolute inset-0 bg-blue-600 flex flex-col items-center justify-center z-40">
              <div className="bg-white rounded-lg p-8 max-w-lg text-center shadow-xl">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">🎮 Sala de Espera</h2>
                <p className="text-gray-600 mb-6 text-lg">
                  Esperando a que todos los jugadores estén listos para comenzar el desafío.
                </p>
                <div className="space-y-2">
                  {connectedPlayers.map((player) => (
                    <div key={player.id} className="flex items-center justify-center gap-2 text-lg">
                      <span className="w-3 h-3 rounded-full bg-green-500"></span>
                      <span className="text-gray-800">{player.username}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Canvas Cover when game is paused in multiplayer mode */}
          {(() => {
            const shouldShowPauseOverlay = gameMode === 'multiplayer' && isGameActive && gamePhase === 'playing' && isGamePaused;
            console.log('🎭 Pause overlay check:', { 
              gameMode, 
              isGameActive, 
              gamePhase, 
              isGamePaused, 
              pausedBy,
              shouldShowPauseOverlay 
            });
            return shouldShowPauseOverlay && (
              <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-30">
                <div className="bg-white rounded-lg p-6 max-w-md text-center shadow-xl">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">⏸️ Juego en Pausa</h2>
                  <p className="text-gray-600 mb-4">
                    {pausedBy 
                      ? `Partida pausada por ${pausedBy}`
                      : 'El juego está pausado. Espera a que se reanude para continuar jugando.'
                    }
                  </p>
                  <p className="text-gray-500 text-sm mb-2">
                    ⛔ Juego bloqueado para evitar trampas
                  </p>
                  <p className="text-gray-400 text-xs">
                    Nadie puede ver ni interactuar con el juego hasta reanudar
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Solution Overlay when only one player remains */}
          {gameMode === 'multiplayer' && showSolution && (
            <div className="absolute inset-0 bg-green-600 flex flex-col items-center justify-center z-30">
              <div className="bg-white rounded-lg p-6 max-w-md text-center shadow-xl">
                <h2 className="text-2xl font-bold text-green-600 mb-4">🏆 ¡Solución!</h2>
                <p className="text-gray-600 mb-4">
                  Eres el último jugador activo. ¡Has ganado un punto!
                </p>
                <p className="text-gray-600 mb-4">
                  La solución del desafío se muestra en el tablero.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Right Sidebar - Timer & Multiplayer - Responsive width */}
        <div className="w-48 sm:w-56 md:w-64 lg:w-72 xl:w-80 flex-shrink-0">
          <RightSidebar
            currentChallenge={currentChallenge}
            totalChallenges={challenges.length}
            onResetLevel={resetLevel}
            onCheckSolution={checkSolutionWithMirrors}
            isMultiplayerEnabled={MULTIPLAYER_ENABLED}
            gameMode={gameMode}
            connectedPlayers={connectedPlayers}
            roomId={roomId}
            isGameActive={isGameActive}
            isPaused={gameMode === 'multiplayer' ? isGamePaused : true}
            onPauseChange={setIsGamePaused}
            onPausedByChange={setPausedBy}
          />
        </div>
      </div>

      {/* Debug Tools (floating) */}
      {debugMode && (
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-3 shadow-lg">
            <div className="flex flex-wrap gap-2 mb-2">
              <button 
                onClick={() => setShowResponsiveTest(true)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                🧪 Test Responsive
              </button>
              <button 
                onClick={() => {
                  console.log('📸 GLOBAL SNAPSHOT:');
                  console.log('Game State:', { gameMode, isGameActive, gamePhase, isGamePaused, currentChallenge });
                  console.log('Pieces:', pieces);
                  console.log('Connected Players:', connectedPlayers);
                  console.log('Room ID:', roomId);
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                📸 Global Snapshot
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              <button 
                onClick={() => {
                  console.log('🎮 GAME AREA SNAPSHOT:');
                  const placedPieces = pieces.filter(piece => piece.placed && piece.y < 600);
                  console.log('Placed Pieces:', placedPieces);
                  console.log('Mirror Pieces:', placedPieces.map(p => ({
                    ...p,
                    x: 700 - p.x,
                    mirrored: true
                  })));
                  console.log('Geometry State:', geometry);
                }}
                className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs transition-colors"
              >
                🎯 Game Area
              </button>
              <button 
                onClick={() => {
                  console.log('📦 STORAGE AREA SNAPSHOT:');
                  const storagePieces = pieces.filter(piece => !piece.placed || piece.y >= 600);
                  console.log('Storage Pieces:', storagePieces);
                }}
                className="bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded text-xs transition-colors"
              >
                📦 Storage
              </button>
              <button 
                onClick={() => {
                  console.log('🏆 CHALLENGE SNAPSHOT:');
                  console.log('Current Challenge:', challenges[currentChallenge]);
                  console.log('Challenge Index:', currentChallenge);
                  console.log('Total Challenges:', challenges.length);
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded text-xs transition-colors"
              >
                🏆 Challenge
              </button>
            </div>
            <p className="text-xs text-yellow-700">Debug mode - Click buttons for console logs</p>
          </div>
        </div>
      )}

      {/* Challenge Win Overlay */}
      {gameMode === 'multiplayer' && challengeWinner && (
        <ChallengeWinOverlay
          winner={{
            id: challengeWinner.id,
            username: challengeWinner.username
          }}
          completionTime={challengeWinner.completionTime}
          isCurrentPlayer={challengeWinner.id === socketService.socketInstance?.id}
          onNextChallenge={() => {
            console.log('🎯 Requesting next challenge...');
            socketService.nextChallenge();
          }}
          onClose={() => setChallengeWinner(null)}
        />
      )}
    </div>
  );
};

export default MirrorChallengeGame;
