import React, { useRef, useState } from 'react';
import GameCanvas, { GameCanvasRef } from './components/GameCanvas';
import GameControls from './components/GameControls';
import { ChallengeEditorApp } from './ChallengeEditorApp';
import { useGameLogic } from './hooks/useGameLogic';
import { useMouseHandlers } from './hooks/useMouseHandlers';

const MirrorChallengeGame: React.FC = () => {
  const canvasRef = useRef<GameCanvasRef>(null);
  const [showChallengeEditor, setShowChallengeEditor] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  const {
    currentChallenge,
    pieces,
    draggedPiece,
    dragOffset,
    showInstructions,
    challenges,
    isLoading,
    setPieces,
    setDraggedPiece,
    setDragOffset,
    setShowInstructions,
    rotatePiece,
    rotatePieceCounterClockwise,
    flipPiece,
    resetLevel,
    nextChallenge,
    isPieceHit,
    checkSolutionWithMirrors,
    loadCustomChallenges,
    geometry,
  } = useGameLogic();

  const {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
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
  });

  if (showChallengeEditor) {
    return <ChallengeEditorApp onClose={() => setShowChallengeEditor(false)} />;
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
                  onContextMenu={handleContextMenu}
                  geometry={geometry}
                  debugMode={debugMode}
              />
            </div>

            {/* Footer integrado */}
            <div className="text-center py-1">
              <p className="text-gray-400 text-xs">
                Basado en "Reto al Espejo" de Educa
              </p>
            </div>
          </div>
        </div>
      </div>
  );
};

export default MirrorChallengeGame;
