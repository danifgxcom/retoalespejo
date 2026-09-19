import React, { useRef, useState, useEffect, useCallback } from 'react';
import { RotateCw, X } from './components/ui/AtelierIcons';
import GameCanvas, { GameCanvasRef } from './components/GameCanvas';
import GameControls from './components/GameControls';
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import StartupMenu from './components/StartupMenu';
import ChallengeWinOverlay from './components/ChallengeWinOverlay';
import TutorialOverlay from './components/TutorialOverlay';
import { ChallengeIntro } from './components/ChallengeObjective';
import MobileHud from './components/MobileHud';
import { ResponsiveTest } from './components/ResponsiveTest';
import { useGameLogic } from './hooks/useGameLogic';
import { usePointerHandlers } from './hooks/usePointerHandlers';
import socketService, { Player } from './services/SocketService';
import { GAME_NAME } from './branding';
import SkipLink from './components/accessibility/SkipLink';
import MobileGameActions from './components/MobileGameActions';
import { CANVAS_CONSTANTS } from './utils/canvas/CanvasConstants';
import { MirrorMark, SymmetryArt } from './components/Identity';
import { SoundControl } from './components/SoundControl';
import { sound } from './services/SoundService';
import Modal from './components/ui/Modal';
import { CampaignAtlas } from './components/CampaignAtlas';
import FreePlayLibrary from './components/FreePlayLibrary';

const ChallengeEditorApp = import.meta.env.DEV
  ? React.lazy(async () => ({ default: (await import('./ChallengeEditorApp')).ChallengeEditorApp }))
  : null;

const MirrorChallengeGame: React.FC = () => {
  const canvasRef = useRef<GameCanvasRef>(null);
  const [showFreeLibrary, setShowFreeLibrary] = useState(false);
  const [completedStudy, setCompletedStudy] = useState<{ time?: number } | null>(null);
  const [showChallengeEditor, setShowChallengeEditor] = useState(false);
  // F10: id de la pieza señalada por la última validación fallida (si la
  // hubo), para resaltarla en el lienzo. Se limpia en cuanto el jugador
  // vuelve a tocar las piezas (ver el useEffect sobre `pieces` más abajo).
  const [highlightedPieceId, setHighlightedPieceId] = useState<number | null>(null);
  const [selectedPieceId, setSelectedPieceId] = useState<number | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  // F-mobile: espejo de sólo lectura del cronómetro que vive en RightSidebar,
  // para el badge compacto de la cabecera en móvil (ver GameControls).
  const [mobileTimer, setMobileTimer] = useState({ text: '00:00', isPaused: true });
  // F-mobile: aviso descartable para sugerir horizontal en pantallas
  // estrechas en vertical (el tablero es 1.4:1, encaja mejor girado). Sólo
  // CSS decide cuándo se ve (`max-[640px]:portrait:flex`); no bloquea nada.
  const [showRotateHint, setShowRotateHint] = useState(true);
  // F-mobile: la barra de acciones flotante en móvil reutiliza la MISMA
  // función "Verificar Solución" que RightSidebar (con su rama de
  // multijugador y el tiempo transcurrido correcto) en vez de una copia.
  const mobileCheckSolutionRef = useRef<() => void>(() => {});
  // Identidad estable: si esta prop cambiase en cada render, el useEffect de
  // RightSidebar que la llama volvería a dispararse en bucle (setMobileTimer
  // -> nuevo render -> nueva función -> nuevo disparo...).
  const handleMobileTimerChange = useCallback((text: string, isPaused: boolean) => {
    setMobileTimer(prev => (prev.text === text && prev.isPaused === isPaused) ? prev : { text, isPaused });
  }, []);
  const handleExposeMobileCheckSolution = useCallback((fn: () => void) => {
    mobileCheckSolutionRef.current = fn;
  }, []);
  const [showResponsiveTest, setShowResponsiveTest] = useState(false);
  const [showStartupMenu, setShowStartupMenu] = useState(true);
  const [gameMode, setGameMode] = useState<'offline' | 'multiplayer'>('offline');
  const [connectedPlayers, setConnectedPlayers] = useState<Player[]>([]);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isGamePaused, setIsGamePaused] = useState(true); // Start paused by default
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
    playMode,
    sessionRevision,
    startCampaign,
    startFreePlay,
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
    showGrid,
    setControlEffect,
    setCurrentChallenge,
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
    canGoToPreviousChallenge,
    canGoToNextChallenge,
    isLastChallenge,
    isPieceHit,
    checkSolutionWithMirrors,
    loadCustomChallenges,
    toggleGrid,
    geometry,
    pushHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    initializeResponsiveSystem
  } = useGameLogic();

  const {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handlePointerLeave,
    handleContextMenu,
  } = usePointerHandlers({
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
    pushHistory,
  });

  const handleCanvasPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current?.getCanvas();
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) * (CANVAS_CONSTANTS.CANVAS_WIDTH / rect.width);
      const y = (event.clientY - rect.top) * (CANVAS_CONSTANTS.CANVAS_HEIGHT / rect.height);
      const piece = pieces.slice().reverse().find(candidate => isPieceHit(candidate, x, y));
      if (piece) setSelectedPieceId(piece.id);
    }
    handlePointerDown(event);
  };

  // F13: Ctrl+Z / Ctrl+Y (también Cmd en macOS) deshacen/rehacen la última
  // acción sobre las piezas, sin importar qué elemento tenga el foco -
  // salvo que sea un campo de texto, donde debe ganar el undo nativo.
  useEffect(() => {
    const handleUndoRedoShortcut = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;

      const target = e.target as HTMLElement | null;
      const isTextInput = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable;
      if (isTextInput) return;

      if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        undo();
      } else if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleUndoRedoShortcut);
    return () => window.removeEventListener('keydown', handleUndoRedoShortcut);
  }, [undo, redo]);

  // Inicializar sistema responsive cuando el canvas esté disponible
  useEffect(() => {
    const canvas = canvasRef.current?.getCanvas();
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      // Debug logging disabled to prevent console spam
      initializeResponsiveSystem(rect.width, rect.height);
      // Debug logging disabled to prevent console spam
    }
  }, [canvasRef, initializeResponsiveSystem]);

  // Actualizar sistema responsive cuando cambie el tamaño de ventana
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current?.getCanvas();
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        initializeResponsiveSystem(rect.width, rect.height);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [canvasRef, initializeResponsiveSystem]);

  // Startup menu handlers
  const handleStartOffline = () => {
    void sound.unlock().then(() => sound.play('transition'));
    setGameMode('offline');
    setShowStartupMenu(false);
    setIsGameActive(true);
    setGamePhase('playing');
    setIsGamePaused(false);
    setPausedBy(null);
    setChallengeWinner(null);

    // Disconnect from server if connected
    if (socketService.isConnected()) {
      socketService.disconnect();
    }
  };

  const handleCheckSolution = (elapsedSeconds?: number) => {
    const result = checkSolutionWithMirrors(elapsedSeconds);
    sound.play(result.isCorrect ? 'success' : 'error');

    // F10: resalta en el lienzo la pieza que señala explainMismatch, si la hay.
    const mismatchedPiece = result.pieceIndex !== undefined ? pieces[result.pieceIndex] : undefined;
    setHighlightedPieceId(result.isCorrect ? null : mismatchedPiece?.id ?? null);

    if (result.isCorrect) {
      setCompletedStudy({ time: elapsedSeconds });
      setIsGamePaused(true);
      setPausedBy('SYSTEM');
    }

    return result;
  };

  // El resaltado deja de tener sentido en cuanto el jugador vuelve a tocar
  // las piezas (arrastrar, girar, voltear...): así no queda "pegado" a una
  // pieza que ya se movió.
  useEffect(() => {
    setHighlightedPieceId(null);
  }, [pieces]);

  const handleStartMultiplayer = () => {
    startCampaign(0);
    socketService.disconnect();
    setRoomId(null);
    setConnectedPlayers([]);
    setIsGameActive(false);
    setIsGamePaused(true);
    setGamePhase('waiting');
    setChallengeWinner(null);
    setShowSolution(false);
    setCompletedStudy(null);
    void sound.unlock().then(() => sound.play('transition'));
    setGameMode('multiplayer');
    setShowStartupMenu(false);

    // Connect to server
    socketService.connect();
    socketService.socketInstance?.on('disconnect', () => {
      setRoomId(null);
      setConnectedPlayers([]);
      setIsGameActive(false);
      setIsGamePaused(true);
      setGamePhase('waiting');
      setChallengeWinner(null);
      setShowSolution(false);
    });

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
    socketService.socketInstance?.off('playersReadyUpdate');

    // Set up event listeners
    socketService.onPlayerJoined((data) => {
      setConnectedPlayers(data.players);
      setRoomId(socketService.getRoomId());
    });

    socketService.onPlayerLeft((data) => {
      setConnectedPlayers(prev => prev.filter(player => player.id !== data.playerId));
    });

    socketService.onRoomHistory((data) => {
      if (Number.isInteger(data.currentChallengeIndex)) setCurrentChallenge(data.currentChallengeIndex!);
      if (data.gameState) {
        setIsGameActive(data.gameState.isActive || false);
        setIsGamePaused(data.gameState.isPaused ?? true); // `|| true` forzaba pausa SIEMPRE
        setShowSolution(data.gameState.showSolution || false);
        setGamePhase(data.gameState.phase);
      }
    });

    // Listen for game started event
    socketService.onGameStarted((data) => {
      if (data.gameState) {
        setIsGameActive(data.gameState.isActive || false);
        setIsGamePaused(data.gameState.isPaused ?? true);
        setShowSolution(data.gameState.showSolution || false);
        setGamePhase(data.gameState.phase);
      }
    });

    // Listen for timer commands
    socketService.onTimerCommand((data) => {
      switch (data.command) {
        case 'pause':
          setIsGamePaused(true);
          setPausedBy(data.pausedBy || null);
          break;
        case 'resume':
          setIsGamePaused(false);
          setPausedBy(null);
          break;
        case 'reset':
          setIsGamePaused(true);
          setPausedBy(null);
          break;
      }
    });

    // Listen for last player standing event
    socketService.onLastPlayerStanding((data) => {
      setShowSolution(data.showSolution);
      setChallengeWinner({
        id: data.playerId,
        username: data.username,
        completionTime: data.completionTime || 0
      });
    });

    // Listen for countdown event
    socketService.onCountdown((data) => {
      setGamePhase('countdown');
      setCountdownValue(data.value);
      setChallengeWinner(null); // Clear winner overlay when countdown starts
      setShowSolution(false);
    });

    // Listen for phase changed event
    socketService.onPhaseChanged((data) => {
      setGamePhase(data.phase as 'waiting' | 'countdown' | 'playing');
      if (data.gameState) {
        setIsGameActive(data.gameState.isActive || false);
        setIsGamePaused(data.gameState.isPaused || false);
      }

      // Reset pieces when game starts playing
      if (data.phase === 'playing') {
        if (Number.isInteger(data.currentChallengeIndex)) {
          setCurrentChallenge(data.currentChallengeIndex as number);
        } else {
          resetLevel();
        }
      } else if (data.phase === 'countdown') {
        setChallengeWinner(null);
        setShowSolution(false);
      }
    });

    // Listen for challenge solved event
    socketService.onChallengeSolved((data) => {
      setChallengeWinner({
        id: data.playerId,
        username: data.username,
        completionTime: data.completionTime || 0
      });
    });

    // Listen for players ready updates
    // onPlayersReadyUpdate: sin uso en la interfaz por ahora.
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
      <>
      <StartupMenu
        onStartOffline={() => { startCampaign(); handleStartOffline(); }}
        onStartMultiplayer={handleStartMultiplayer}
        isMultiplayerEnabled={MULTIPLAYER_ENABLED}
        onSelectChallenge={(index) => { startCampaign(index); handleStartOffline(); }}
        onFreePlay={() => setShowFreeLibrary(true)}
      />
      <FreePlayLibrary open={showFreeLibrary} onClose={() => setShowFreeLibrary(false)} onSelect={(deck, index) => { startFreePlay(deck, index); setShowFreeLibrary(false); handleStartOffline(); }} />
      </>
    );
  }

  if (import.meta.env.DEV && showChallengeEditor && ChallengeEditorApp) {
    return (
      <React.Suspense fallback={null}>
        <ChallengeEditorApp onClose={() => setShowChallengeEditor(false)} />
      </React.Suspense>
    );
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

  const isMultiplayerLobby = gameMode === 'multiplayer' && !isGameActive && gamePhase === 'waiting';
  const leaveMultiplayer = () => { socketService.disconnect(); setRoomId(null); setConnectedPlayers([]); setIsGameActive(false); setGamePhase('waiting'); setShowStartupMenu(true); };

  return (
    <div
      className={`game-shell ${isMultiplayerLobby ? 'is-lobby' : ''} min-h-[100dvh] overflow-y-auto xl:h-[100dvh] xl:overflow-hidden`}
      style={{ 
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}
    >
      <SkipLink />
      <header className="game-brandbar">
        <button className="wordmark" aria-label="Volver al inicio" onClick={() => { socketService.disconnect(); setShowStartupMenu(true); }}>
          <MirrorMark /><span>{GAME_NAME}<small>GABINETE DE SIMETRÍA</small></span>
        </button>
        {gameMode === 'offline' && (playMode === 'free'
          ? <button className="text-link session-collection" onClick={() => setShowFreeLibrary(true)}>Elegir tarjeta</button>
          : <CampaignAtlas className="session-collection" onSelect={setCurrentChallenge} />)}
        <SoundControl />
      </header>
      {/*
        Sólo se muestra en vertical Y en pantallas estrechas (móvil, no la
        tablet de 768px): el tablero es 1.4:1, así que girar el aparato es
        literalmente la forma en que encaja mejor. Descartable, no bloquea.
      */}
      {showRotateHint && !isMultiplayerLobby && (
        <div
          className="hidden max-[640px]:portrait:flex items-center gap-2 rounded-xl border px-3 py-1.5 mb-2 text-xs"
          style={{ backgroundColor: 'var(--card-elevated-bg)', borderColor: 'var(--border-medium)', color: 'var(--text-secondary)' }}
        >
          <RotateCw className="h-4 w-4 shrink-0" aria-hidden="true" style={{ color: 'var(--text-primary)' }} />
          <p className="flex-1 leading-snug">
            Gira el dispositivo: en horizontal el tablero encaja mejor en la pantalla.
          </p>
          <button
            type="button"
            onClick={() => setShowRotateHint(false)}
            className="grid shrink-0 place-items-center min-h-11 min-w-11 rounded-lg transition hover:brightness-110"
            style={{ color: 'var(--text-tertiary)' }}
            aria-label="Descartar sugerencia de girar el dispositivo"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}
      {/*
        xl:h-full: sin esto `main` no tiene altura definida (crece con su
        contenido) y el `xl:h-full` de la rejilla de abajo no tiene nada
        contra lo que resolverse (porcentaje sobre altura auto = auto). El
        resultado era que el lienzo se calculaba más alto de lo que cabía y
        el contenedor raíz (xl:overflow-hidden) lo recortaba en vez de
        encogerlo.
      */}
      <main id="main" className="xl:h-full">
        <h1 className="sr-only">{GAME_NAME}</h1>
        {/*
          Rejilla fluida: las columnas laterales se encogen con clamp() y la
          central nunca baja de 0 (minmax(0,1fr)), así el lienzo conserva el
          espacio aunque el navegador esté con zoom. Por debajo de xl la rejilla
          se apila y la página hace scroll en vez de recortar contenido.
        */}
        <div className={isMultiplayerLobby ? 'lobby-layout' : 'w-full grid gap-2 xl:h-full xl:grid-rows-[minmax(0,1fr)] xl:grid-cols-[clamp(10rem,16vw,18rem)_minmax(0,1fr)_clamp(12rem,20vw,22rem)]'}>
        {/* Left Sidebar - Wider for better usability */}
        {!isMultiplayerLobby && <div className="min-w-0 min-h-0 max-h-[60dvh] xl:max-h-none xl:h-full overflow-y-auto">
          <LeftSidebar
            pieces={pieces}
            challenges={challenges}
            currentChallenge={currentChallenge}
            onRotatePiece={rotatePiece}
            onRotatePieceCounterClockwise={rotatePieceCounterClockwise}
            onFlipPiece={flipPiece}
            setControlEffect={setControlEffect}
          />
        </div>}

        {/* Main Game Area - Only shrinks after sidebars reach minimum */}
        {/*
          Por debajo de xl ya no se fuerza una altura (antes h-[85dvh]/30rem):
          con el lienzo de vuelta a proporción 1.4 fija, forzar altura sólo
          dejaría hueco vacío entre el lienzo y la barra flotante. Se deja que
          el bloque mida lo que necesita (cabecera + lienzo + acciones +
          pie) y lo que sobra pasa, sin pelea, al contenido secundario
          (inventario, panel de sala) bajo scroll de página.
        */}
        {!isMultiplayerLobby && <div className="order-first xl:order-none flex flex-col min-w-0 xl:h-full xl:min-h-0 relative">
          {/* Top Navigation */}
          <div className="mb-2 shrink-0">
            <GameControls
              pieces={pieces}
              challenges={challenges}
              currentChallenge={currentChallenge}
              showInstructions={showInstructions}
              onToggleInstructions={() => setShowInstructions(!showInstructions)}
              onResetLevel={resetLevel}
              onNextChallenge={gameMode === 'multiplayer' ? undefined : nextChallenge}
              onPreviousChallenge={gameMode === 'multiplayer' ? undefined : previousChallenge}
              canGoToPreviousChallenge={canGoToPreviousChallenge}
              canGoToNextChallenge={canGoToNextChallenge}
              isLastChallenge={isLastChallenge}
              onRotatePiece={rotatePiece}
              onRotatePieceCounterClockwise={rotatePieceCounterClockwise}
              onFlipPiece={flipPiece}
              onCheckSolution={gameMode === 'multiplayer' ? undefined : handleCheckSolution}
              onLoadCustomChallenges={import.meta.env.DEV ? loadCustomChallenges : undefined}
              onOpenChallengeEditor={import.meta.env.DEV ? () => setShowChallengeEditor(true) : undefined}
              isLoading={isLoading}
              debugMode={import.meta.env.DEV && debugMode}
              onToggleDebugMode={import.meta.env.DEV ? () => setDebugMode(!debugMode) : undefined}
              showGrid={import.meta.env.DEV && showGrid}
              onToggleGrid={import.meta.env.DEV ? toggleGrid : undefined}
              setControlEffect={setControlEffect}
              onUndo={gameMode === 'multiplayer' ? undefined : undo}
              onRedo={gameMode === 'multiplayer' ? undefined : redo}
              canUndo={canUndo}
              canRedo={canRedo}
              compact={true}
              freePlay={playMode === 'free'}
              gameMode={gameMode}
              /* El cronómetro de móvil vive en el HUD flotante (MobileHud):
                 aquí sería el mismo dato dos veces en la misma pantalla. */
            />
          </div>

          {/* Game Canvas */}
          {challenges[currentChallenge] && (
            <MobileHud challenge={challenges[currentChallenge]} index={currentChallenge} total={challenges.length}
              timerText={mobileTimer.text} timerPaused={mobileTimer.isPaused}
              onCheckSolution={gameMode === 'offline' ? () => mobileCheckSolutionRef.current() : undefined} />
          )}
          <div className="board-panel bg-card border border-card rounded-2xl shadow-lg p-2 flex-1 flex flex-col min-h-0 relative">
            <div className="board-strip"><span>02 / TU COMPOSICIÓN</span><span>SU REFLEJO / 1 : 1</span></div>
            {/*
              Por debajo de xl el tutorial es una banda propia EN EL FLUJO
              (ver TutorialOverlay), fuera del lienzo: en un tablero de
              ~250px de alto una tarjeta superpuesta tapa la única pieza del
              reto. Desde xl vuelve a ser la tarjeta de esquina de siempre,
              posicionada contra este mismo contenedor (position:relative),
              con el offset left-2/top-2 cayendo donde caía antes.
            */}
            <TutorialOverlay
              pieces={pieces}
              currentChallenge={currentChallenge}
              challenges={challenges}
              geometry={geometry}
            />
            {/*
              Por debajo de xl, aspect-[1.4] fija la altura de esta caja a
              partir de su ancho (proporción real del lienzo, 1400x1000): así
              GameCanvas mide un contenedor que YA tiene la proporción
              correcta. En xl se vuelve al ajuste flexible original
              (letterbox por JS). Ya no contiene overlays: por debajo de xl
              nada se superpone al lienzo (tutorial y acciones son bandas
              propias, fuera de esta caja).
            */}
            <div className="relative flex justify-center items-center w-full aspect-[1.4] xl:w-auto xl:aspect-auto xl:flex-1 xl:min-h-0 overflow-hidden">
              <GameCanvas
                ref={canvasRef}
                pieces={gameMode === 'multiplayer' && gamePhase !== 'playing' ? [] : pieces}
                currentChallenge={gameMode === 'multiplayer' && gamePhase !== 'playing' ? -1 : currentChallenge}
                challenges={challenges}
                onPointerDown={handleCanvasPointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={(event) => { if (draggedPiece) sound.play('move'); handlePointerUp(event); }}
                onPointerCancel={handlePointerCancel}
                onPointerLeave={handlePointerLeave}
                onContextMenu={handleContextMenu}
                geometry={geometry}
                debugMode={debugMode}
                showGrid={showGrid}
                draggedPiece={draggedPiece}
                interactingPieceId={interactingPieceId}
                temporaryDraggedPieceId={temporaryDraggedPieceId}
                animatingPieceId={animatingPieceId}
                highlightedPieceId={highlightedPieceId}
                setPieces={setPieces}
                onRotatePiece={rotatePiece}
                onRotatePieceCounterClockwise={rotatePieceCounterClockwise}
                onFlipPiece={flipPiece}
                onSelectedPieceChange={setSelectedPieceId}
                pushHistory={pushHistory}
              />
              {/* Sólo xl+: en xl TutorialOverlay se auto-posiciona absolute
                  sobre este wrapper (misma jerarquía relative que antes). */}
            </div>
            {/*
              Barra de acciones móvil: banda fija DEBAJO del lienzo, nunca
              superpuesta (xl:hidden - en escritorio no existe, ahí se usan
              los controles de RightSidebar/GameControls).
            */}
            <MobileGameActions
              selectedPieceId={selectedPieceId}
              onRotateClockwise={rotatePiece}
              onRotateCounterClockwise={rotatePieceCounterClockwise}
              onFlip={flipPiece}
            />

            {/* Footer */}
            <div className="text-center pt-1">
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                MUEVE UNA MITAD · DESCUBRE EL TODO
              </p>
            </div>
          </div>

          {/* FULL SCREEN OVERLAYS - Cover entire main game area */}

          {/* Countdown overlay for multiplayer mode */}
          {gameMode === 'multiplayer' && gamePhase === 'countdown' && (
            <div 
              className="absolute inset-0 bg-black flex flex-col items-center justify-center z-50"
              role="dialog"
              aria-modal="true"
              aria-labelledby="countdown-title"
              aria-describedby="countdown-description"
            >
              {/* Challenge number background - decorative only */}
              <div className="absolute inset-0 flex items-center justify-center opacity-10" aria-hidden="true">
                <div className="text-[40dvh] font-bold text-white select-none">
                  {currentChallenge + 1}
                </div>
              </div>

              {/* Multiple random positioned challenge numbers - decorative only */}
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="absolute text-6xl font-bold text-white opacity-20 select-none"
                  style={{
                    left: `${20 + (i * 30)}%`,
                    top: `${15 + (i * 25)}%`,
                    transform: `rotate(${-15 + (i * 15)}deg)`
                  }}
                  aria-hidden="true"
                >
                  RETO {currentChallenge + 1}
                </div>
              ))}

              <div className="text-center relative z-10">
                <div 
                  id="countdown-title"
                  className={`font-bold text-white mb-4 animate-pulse ${typeof countdownValue === 'string' ? 'text-3xl md:text-4xl leading-tight px-4' : 'text-9xl'}`}
                  aria-live="assertive"
                >
                  {countdownValue}
                </div>
                <p className="text-2xl text-white">
                  {typeof countdownValue === 'string' ? '' : 'Preparándose...'}
                </p>
                <p 
                  id="countdown-description"
                  className="text-lg text-white/70 mt-2"
                >
                  Reto {currentChallenge + 1} de {challenges.length}
                </p>
              </div>
            </div>
          )}

          {/* Waiting room overlay for multiplayer mode */}
          {gameMode === 'multiplayer' && gamePhase === 'waiting' && isGameActive && (
            <div 
              className="absolute inset-0 bg-blue-600 flex flex-col items-center justify-center z-40"
              role="dialog"
              aria-modal="true"
              aria-labelledby="waiting-room-title"
              aria-describedby="waiting-room-description"
            >
              <div className="bg-white rounded-lg p-8 max-w-lg text-center shadow-xl">
                <h2 id="waiting-room-title" className="text-3xl font-bold text-gray-800 mb-6"> Sala de Espera</h2>
                <p id="waiting-room-description" className="text-gray-600 mb-6 text-lg">
                  Esperando a que todos los jugadores estén listos para comenzar el desafío.
                </p>
                <div className="space-y-2" role="list" aria-label="Jugadores conectados">
                  {connectedPlayers.map((player) => (
                    <div 
                      key={player.id} 
                      className="flex items-center justify-center gap-2 text-lg"
                      role="listitem"
                    >
                      <span className="w-3 h-3 rounded-full bg-green-500" aria-hidden="true"></span>
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
            return shouldShowPauseOverlay && (
              <div 
                className="absolute inset-0 bg-black flex flex-col items-center justify-center z-30"
                role="dialog"
                aria-modal="true"
                aria-labelledby="pause-title"
                aria-describedby="pause-description"
              >
                <div className="bg-white rounded-lg p-6 max-w-md text-center shadow-xl">
                  <h2 id="pause-title" className="text-2xl font-bold text-gray-800 mb-4">Ⅱ Juego en Pausa</h2>
                  <p id="pause-description" className="text-gray-600 mb-4">
                    {pausedBy 
                      ? `Partida pausada por ${pausedBy}`
                      : 'El juego está pausado. Espera a que se reanude para continuar jugando.'
                    }
                  </p>
                  <div role="region" aria-label="Información adicional">
                    <p className="text-gray-500 text-sm mb-2">
                       Juego bloqueado para evitar trampas
                    </p>
                    <p className="text-gray-600 text-xs">
                      Nadie puede ver ni interactuar con el juego hasta reanudar
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Solution Overlay when only one player remains */}
          {gameMode === 'multiplayer' && showSolution && (
            <div 
              className="absolute inset-0 bg-green-600 flex flex-col items-center justify-center z-30"
              role="dialog"
              aria-modal="true"
              aria-labelledby="solution-title"
              aria-describedby="solution-description"
            >
              <div className="bg-white rounded-lg p-6 max-w-md text-center shadow-xl">
                <h2 id="solution-title" className="text-2xl font-bold text-green-600 mb-4"> ¡Solución!</h2>
                <div id="solution-description">
                  <p className="text-gray-600 mb-4">
                    Eres el último jugador activo. ¡Has ganado un punto!
                  </p>
                  <p className="text-gray-600 mb-4">
                    La ronda ha terminado. Cuando todos estén listos, comenzará el siguiente reto.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>}

        {/* Right Sidebar stays mounted through waiting/countdown/playing. */}
        <div className={isMultiplayerLobby ? 'lobby-container' : 'min-w-0 min-h-0 max-h-[70dvh] xl:max-h-none xl:h-full overflow-y-auto'}>
          <RightSidebar
            lobbyMode={isMultiplayerLobby}
            onLeaveMultiplayer={leaveMultiplayer}
            key={`session-${sessionRevision}`}
            currentChallenge={currentChallenge}
            totalChallenges={challenges.length}
            challenges={challenges}
            pieces={pieces}
            onResetLevel={resetLevel}
            onCheckSolution={handleCheckSolution}
            isMultiplayerEnabled={MULTIPLAYER_ENABLED}
            gameMode={gameMode}
            connectedPlayers={connectedPlayers}
            roomId={roomId}
            isGameActive={isGameActive}
            isPaused={isGamePaused}
            onPauseChange={setIsGamePaused}
            onPausedByChange={setPausedBy}
            onTimerChange={handleMobileTimerChange}
            onExposeCheckSolution={handleExposeMobileCheckSolution}
          />
        </div>
        </div>
      </main>

      {/* Debug Tools (floating) */}
      {import.meta.env.DEV && debugMode && (
        <div 
          className="absolute top-4 left-4 z-10"
          role="region"
          aria-labelledby="debug-tools-title"
        >
          <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-3 shadow-lg">
            <h3 id="debug-tools-title" className="sr-only">Herramientas de depuración</h3>
            <div className="flex flex-wrap gap-2 mb-2" role="toolbar" aria-label="Herramientas principales">
              <button 
                onClick={() => setShowResponsiveTest(true)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm transition-colors"
                aria-label="Probar diseño responsivo"
                type="button"
              >
                <span aria-hidden="true"></span> Test Responsive
              </button>
            </div>
            <p className="text-xs text-yellow-700">Modo depuración: muestra etiquetas y contornos sobre las piezas.</p>
          </div>
        </div>
      )}

      {/*
        Presentación del reto antes del tablero en móvil. En multijugador no,
        porque ahí la cuenta atrás del servidor ya cumple ese papel y el
        arranque de la partida no lo manda el reloj de este cliente.
      */}
      <FreePlayLibrary open={showFreeLibrary} onClose={() => setShowFreeLibrary(false)} onSelect={(deck, index) => { startFreePlay(deck, index); setShowFreeLibrary(false); setCompletedStudy(null); setIsGamePaused(false); setPausedBy(null); }} />
      <Modal isOpen={completedStudy !== null} onClose={() => setCompletedStudy(null)} title={playMode === 'free' ? 'Tarjeta resuelta · Juego libre' : isLastChallenge ? 'Colección completada' : 'Estudio completado'}>
        <div className="success-sheet">
          <SymmetryArt />
          <p className="eyebrow">RETO {String(currentChallenge + 1).padStart(2, '0')} / {String(challenges.length).padStart(2, '0')}</p>
          <h2>{isLastChallenge && playMode !== 'free' ? 'Una nueva forma de mirar.' : 'Las dos mitades encajan.'}</h2>
          <p>{isLastChallenge && playMode !== 'free' ? 'Has completado todos los estudios de simetría. Puedes volver a explorarlos a tu ritmo.' : challenges[currentChallenge]?.name}</p>
          {completedStudy?.time !== undefined && <span className="result-time">{Math.floor(completedStudy.time / 60).toString().padStart(2, '0')}:{Math.floor(completedStudy.time % 60).toString().padStart(2, '0')}</span>}
          <button className="brand-button" onClick={() => { setCompletedStudy(null); if (playMode === 'free') setShowFreeLibrary(true); else if (isLastChallenge) setShowStartupMenu(true); else { nextChallenge(); sound.play('transition'); } }}>{playMode === 'free' ? 'Elegir otra tarjeta' : isLastChallenge ? 'Volver al gabinete' : 'Descubrir el siguiente reto'} ↗</button>
          <button className="text-link" onClick={() => setCompletedStudy(null)}>Contemplar la figura</button>
        </div>
      </Modal>

      {gameMode === 'offline' && challenges[currentChallenge] && (
        <ChallengeIntro
          challenge={challenges[currentChallenge]}
          index={currentChallenge}
          total={challenges.length}
        />
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
            // Debug logging disabled to prevent console spam
            socketService.playerReady();
          }}
          onClose={() => setChallengeWinner(null)}
        />
      )}
    </div>
  );
};

export default MirrorChallengeGame;
