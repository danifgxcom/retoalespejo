import React, { useRef } from 'react';
import GameCanvas, { GameCanvasRef } from './components/GameCanvas';
import ChallengeCard from './components/ChallengeCard';
import GameControls from './components/GameControls';
import { useGameLogic } from './hooks/useGameLogic';
import { useMouseHandlers } from './hooks/useMouseHandlers';

const MirrorChallengeGame: React.FC = () => {
  const canvasRef = useRef<GameCanvasRef>(null);

  const {
    currentChallenge,
    pieces,
    draggedPiece,
    dragOffset,
    showInstructions,
    challenges,
    setPieces,
    setDraggedPiece,
    setDragOffset,
    setShowInstructions,
    rotatePiece,
    flipPiece,
    resetLevel,
    nextChallenge,
    isPieceHit,
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
  });

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
              onFlipPiece={flipPiece}
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