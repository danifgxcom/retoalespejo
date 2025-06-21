import React, { useRef, useState, useEffect } from 'react';
import GameCanvas, { GameCanvasRef } from './components/GameCanvas';
import GameControls from './components/GameControls';
import { ChallengeEditorApp } from './ChallengeEditorApp';
import { ResponsiveTest } from './components/ResponsiveTest';
import { useGameLogic } from './hooks/useGameLogic';
import { useMouseHandlers } from './hooks/useMouseHandlers';

const MirrorChallengeGame: React.FC = () => {
  const canvasRef = useRef<GameCanvasRef>(null);
  const [showChallengeEditor, setShowChallengeEditor] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [showResponsiveTest, setShowResponsiveTest] = useState(false);

  const {
    currentChallenge,
    pieces,
    draggedPiece,
    dragOffset,
    showInstructions,
    challenges,
    isLoading,
    interactingPieceId,
    controlActionPieceId,
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
        <div className="max-w-7xl mx-auto h-full flex flex-col">
          <GameControls
              pieces={pieces}
              showInstructions={showInstructions}
              onToggleInstructions={() => setShowInstructions(!showInstructions)}
              onResetLevel={resetLevel}
              onNextChallenge={nextChallenge}
              onRotatePiece={rotatePiece}
              onRotatePieceCounterClockwise={rotatePieceCounterClockwise}
              onFlipPiece={flipPiece}
              onCheckSolution={checkSolutionWithMirrors}
              onLoadCustomChallenges={loadCustomChallenges}
              onOpenChallengeEditor={() => setShowChallengeEditor(true)}
              isLoading={isLoading}
              debugMode={debugMode}
              onToggleDebugMode={() => setDebugMode(!debugMode)}
          />

          {/* Área de juego */}
          <div className="bg-white rounded shadow p-1 flex-1 flex flex-col min-h-0">
            <div className="flex justify-center items-start flex-1 overflow-hidden pt-4">
              <GameCanvas
                  ref={canvasRef}
                  pieces={pieces}
                  currentChallenge={currentChallenge}
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
                  controlActionPieceId={controlActionPieceId}
              />
            </div>

            {/* Footer integrado */}
            <div className="text-center py-1">
              <p className="text-gray-400 text-xs">
                Basado en "Reto al Espejo" de Educa
              </p>
            </div>
          </div>
          
          {/* Test responsive flotante - solo en modo debug */}
          {debugMode && (
            <div className="absolute top-4 left-4 z-10">
              <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-2 shadow-lg">
                <button 
                  onClick={() => setShowResponsiveTest(true)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  🧪 Test Responsive
                </button>
                <p className="text-xs text-yellow-700 mt-1">Debug mode</p>
              </div>
            </div>
          )}
        </div>
      </div>
  );
};

export default MirrorChallengeGame;
