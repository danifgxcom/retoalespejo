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
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 p-2">
      <div className="max-w-7xl mx-auto">
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
        <div className="bg-white rounded-lg shadow-lg p-2">
          <div className="flex justify-center">
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

        </div>

        {/* Footer muy compacto */}
        <div className="bg-white rounded shadow p-1 mt-1 text-center">
          <p className="text-gray-500 text-xs">
            Basado en "Reto al Espejo" de Educa
          </p>
        </div>
      </div>
    </div>
  );
};

export default MirrorChallengeGame;
