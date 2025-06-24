import React from 'react';
import { Piece } from './GamePiece';

interface PieceInventoryItemProps {
  piece: Piece;
  onDragStart?: (piece: Piece) => void;
}

const PieceInventoryItem: React.FC<PieceInventoryItemProps> = ({ 
  piece, 
  onDragStart 
}) => {
  const getCenterColor = () => {
    return piece.face === 'front' ? '#FFD700' : '#FF4444';
  };

  const getTriangleColor = () => {
    return piece.face === 'front' ? '#FF4444' : '#FFD700';
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify(piece));
    e.dataTransfer.effectAllowed = 'move';
    if (onDragStart) {
      onDragStart(piece);
    }
  };

  return (
    <div 
      className="relative bg-gray-50 rounded-lg p-3 border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={handleDragStart}
    >
      {/* Piece Visual Preview */}
      <div className="flex items-center justify-center mb-2">
        <svg width="60" height="60" viewBox="0 0 60 60" className="drop-shadow-sm">
          {/* Central Square */}
          <rect 
            x="20" 
            y="20" 
            width="20" 
            height="20" 
            fill={getCenterColor()} 
            stroke="#333" 
            strokeWidth="1"
          />
          
          {/* Top Triangle */}
          <polygon 
            points="20,20 40,20 30,10" 
            fill={getTriangleColor()} 
            stroke="#333" 
            strokeWidth="1"
          />
          
          {/* Right Triangle */}
          <polygon 
            points="40,20 40,40 50,30" 
            fill={getTriangleColor()} 
            stroke="#333" 
            strokeWidth="1"
          />
          
          {/* Bottom Triangle */}
          <polygon 
            points="20,40 40,40 30,50" 
            fill={getTriangleColor()} 
            stroke="#333" 
            strokeWidth="1"
          />
        </svg>
      </div>

      {/* Piece Info */}
      <div className="text-center">
        <div className="font-medium text-sm text-gray-700 mb-1">
          Pieza {piece.id} ({piece.type})
        </div>
        <div className="text-xs text-gray-500">
          Cara {piece.face === 'front' ? 'A' : 'B'}
        </div>
      </div>

      {/* Drag Hint */}
      <div className="absolute top-1 right-1 text-gray-400 text-xs">
        ⋮⋮
      </div>
    </div>
  );
};

export default PieceInventoryItem;