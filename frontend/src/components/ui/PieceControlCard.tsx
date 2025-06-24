import React from 'react';
import { RotateCcw, RotateCw, FlipHorizontal } from 'lucide-react';
import Card from './Card';
import Button from './Button';
import StatusBadge from './StatusBadge';
import { Piece } from '../GamePiece';

interface PieceControlCardProps {
  piece: Piece;
  onRotateCounterClockwise: (pieceId: number) => void;
  onFlip: (pieceId: number) => void;
  onRotate: (pieceId: number) => void;
  setControlEffect?: (pieceId: number | null) => void;
}

const PieceControlCard: React.FC<PieceControlCardProps> = ({
  piece,
  onRotateCounterClockwise,
  onFlip,
  onRotate,
  setControlEffect
}) => {
  const handleAction = (action: () => void, pieceId: number) => {
    setControlEffect?.(pieceId);
    setTimeout(() => action(), 10);
  };

  return (
    <Card variant="elevated" padding="sm" hover>
      <div className="text-sm font-bold mb-2 text-gray-800 text-center flex items-center justify-center">
        <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-lg font-bold mr-2 shadow-lg">
          {piece.id}
        </div>
        <span>Pieza {piece.type}</span>
      </div>
      
      <div className="grid grid-cols-3 gap-2 mb-3">
        <Button
          onMouseDown={() => handleAction(() => onRotateCounterClockwise(piece.id), piece.id)}
          variant="primary"
          size="sm"
          icon={RotateCcw}
          iconSize={18}
          title="Rotar 45° antihorario"
        />
        
        <Button
          onMouseDown={() => handleAction(() => onFlip(piece.id), piece.id)}
          variant="secondary"
          size="sm"
          icon={FlipHorizontal}
          iconSize={18}
          title="Voltear pieza"
        />
        
        <Button
          onMouseDown={() => handleAction(() => onRotate(piece.id), piece.id)}
          variant="success"
          size="sm"
          icon={RotateCw}
          iconSize={18}
          title="Rotar 45° horario"
        />
      </div>
      
      <div className="text-xs text-center">
        <StatusBadge status={piece.face === 'front' ? 'front' : 'back'} size="sm">
          Cara {piece.face === 'front' ? 'A' : 'B'}
        </StatusBadge>
      </div>
    </Card>
  );
};

export default PieceControlCard;