import React from 'react';
import { Piece } from './GamePiece';
import { Challenge } from './ChallengeCard';
import { RotateCw, RotateCcw, FlipVertical, Package } from 'lucide-react';
import PieceInventoryItem from './PieceInventoryItem';

interface LeftSidebarProps {
  pieces: Piece[];
  challenges: Challenge[];
  currentChallenge: number;
  onRotatePiece: (pieceId: number) => void;
  onRotatePieceCounterClockwise: (pieceId: number) => void;
  onFlipPiece: (pieceId: number) => void;
  setControlEffect: (pieceId: number | null) => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({
  pieces,
  challenges,
  currentChallenge,
  onRotatePiece,
  onRotatePieceCounterClockwise,
  onFlipPiece,
  setControlEffect
}) => {
  const placedPieces = pieces.filter(piece => piece.placed);

  return (
    <div className="w-full h-full bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-2 sm:p-3 space-y-2 sm:space-y-3 flex flex-col">
      <div className="text-center border-b pb-2">
        <h3 className="font-bold text-gray-800 text-sm sm:text-base">Controles de Piezas</h3>
        <p className="text-xs text-gray-600 hidden sm:block">
          {challenges[currentChallenge]?.name || 'Cargando...'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {placedPieces.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            <p>Coloca piezas en el área de juego</p>
            <p>para ver los controles aquí</p>
          </div>
        ) : (
          <div className="space-y-3">
            {placedPieces.map((piece) => (
            <div key={piece.id} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm text-gray-700">
                  Pieza {piece.id} ({piece.type})
                </span>
                <span className="text-xs px-2 py-1 bg-gray-200 rounded">
                  {piece.face === 'front' ? 'Cara A' : 'Cara B'}
                </span>
              </div>
              
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    onRotatePieceCounterClockwise(piece.id);
                    setControlEffect(piece.id);
                  }}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-1 transition-colors"
                  title="Rotar a la izquierda"
                >
                  <RotateCcw size={18} />
                </button>
                
                <button
                  onClick={() => {
                    onRotatePiece(piece.id);
                    setControlEffect(piece.id);
                  }}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-1 transition-colors"
                  title="Rotar a la derecha"
                >
                  <RotateCw size={18} />
                </button>
                
                <button
                  onClick={() => {
                    onFlipPiece(piece.id);
                    setControlEffect(piece.id);
                  }}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-1 transition-colors"
                  title="Voltear pieza"
                >
                  <FlipVertical size={18} />
                </button>
              </div>
              
              <div className="mt-2 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Rotación: {piece.rotation}°</span>
                  <span>Pos: ({Math.round(piece.x)}, {Math.round(piece.y)})</span>
                </div>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeftSidebar;