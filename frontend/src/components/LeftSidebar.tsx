import React from 'react';
import { Piece } from './GamePiece';
import { Challenge } from './ChallengeCard';
import { RotateCw, RotateCcw, FlipVertical, Package } from 'lucide-react';
import PieceInventoryItem from './PieceInventoryItem';
import { VisuallyHidden } from '../components/accessibility';
import { PieceColors } from '../utils/piece/PieceColors';

interface LeftSidebarProps {
  pieces: Piece[];
  challenges: Challenge[];
  currentChallenge: number;
  onRotatePiece: (pieceId: number, fromControl?: boolean) => void;
  onRotatePieceCounterClockwise: (pieceId: number, fromControl?: boolean) => void;
  onFlipPiece: (pieceId: number, fromControl?: boolean) => void;
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
  // Sort placed pieces by the time they were placed (newest at the bottom)
  // We'll use the piece ID as a proxy for placement time since higher IDs are likely placed later
  const placedPieces = pieces
    .filter(piece => piece.placed)
    .sort((a, b) => a.id - b.id);

  return (
    <div 
      className="w-full h-full rounded-lg shadow-lg p-2 sm:p-3 space-y-2 sm:space-y-3 flex flex-col"
      style={{
        backgroundColor: 'var(--card-bg)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-light)'
      }}
      role="region"
      aria-labelledby="piece-controls-heading"
    >
      <div className="text-center pb-2" style={{ borderBottom: '1px solid var(--border-light)' }}>
        <h3 id="piece-controls-heading" className="font-bold text-lg sm:text-xl" style={{ color: 'var(--text-primary)' }}>Controles de Piezas</h3>
      </div>

      <div className="flex-1 overflow-y-auto" role="region" aria-label="Lista de controles de piezas">
        {placedPieces.length === 0 ? (
          <div className="text-center text-sm py-8" style={{ color: 'var(--text-tertiary)' }} role="status" aria-live="polite">
            <p>Coloca piezas en el área de juego</p>
            <p>para ver los controles aquí</p>
          </div>
        ) : (
          <div className="space-y-3">
            {placedPieces.map((piece) => {
              const identificationColor = PieceColors.getIdentificationColor(piece.id);
              return (
            <div key={piece.id} className="rounded-lg p-3" 
                 style={{ 
                   backgroundColor: 'var(--bg-secondary)', 
                   border: `6px solid ${identificationColor}`,
                   boxShadow: `0 0 16px ${identificationColor}66, inset 0 0 0 2px ${identificationColor}33`
                 }}
                 role="group" aria-label={`Información y controles de Pieza ${piece.id}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg"
                       style={{ 
                         backgroundColor: identificationColor,
                         color: '#ffffff'
                       }}
                       aria-hidden="true">
                    {piece.id}
                  </div>
                  <h4 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                    Pieza {piece.type}
                  </h4>
                </div>
                <span className="text-xs px-2 py-1 rounded" 
                      style={{ 
                        backgroundColor: 'var(--bg-tertiary)', 
                        color: 'var(--text-secondary)' 
                      }}
                      aria-label={`Cara actual: ${piece.face === 'front' ? 'A' : 'B'}`}>
                  {piece.face === 'front' ? 'Cara A' : 'Cara B'}
                </span>
              </div>

              <div className="flex gap-1" role="group" aria-label={`Controles para Pieza ${piece.id}`}>
                <button
                  onClick={() => {
                    onRotatePieceCounterClockwise(piece.id, true);
                    setControlEffect(piece.id);
                  }}
                  className="flex-1 px-1 sm:px-2 lg:px-3 py-1 sm:py-2 rounded text-xs sm:text-sm flex items-center justify-center gap-1 transition-colors"
                  style={{
                    backgroundColor: 'var(--button-primary-bg)',
                    color: 'var(--text-on-primary)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--button-primary-hover)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--button-primary-bg)';
                  }}
                  title="Rotar a la izquierda"
                  aria-label={`Rotar pieza ${piece.id} a la izquierda`}
                  type="button"
                >
                  <RotateCcw size={14} className="sm:w-4 sm:h-4 lg:w-5 lg:h-5" aria-hidden="true" />
                  <VisuallyHidden>Rotar a la izquierda</VisuallyHidden>
                </button>

                <button
                  onClick={() => {
                    onRotatePiece(piece.id, true);
                    setControlEffect(piece.id);
                  }}
                  className="flex-1 px-1 sm:px-2 lg:px-3 py-1 sm:py-2 rounded text-xs sm:text-sm flex items-center justify-center gap-1 transition-colors"
                  style={{
                    backgroundColor: 'var(--button-primary-bg)',
                    color: 'var(--text-on-primary)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--button-primary-hover)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--button-primary-bg)';
                  }}
                  title="Rotar a la derecha"
                  aria-label={`Rotar pieza ${piece.id} a la derecha`}
                  type="button"
                >
                  <RotateCw size={14} className="sm:w-4 sm:h-4 lg:w-5 lg:h-5" aria-hidden="true" />
                  <VisuallyHidden>Rotar a la derecha</VisuallyHidden>
                </button>

                <button
                  onClick={() => {
                    onFlipPiece(piece.id, true);
                    setControlEffect(piece.id);
                  }}
                  className="flex-1 px-1 sm:px-2 lg:px-3 py-1 sm:py-2 rounded text-xs sm:text-sm flex items-center justify-center gap-1 transition-colors"
                  style={{
                    backgroundColor: 'var(--button-success-bg)',
                    color: 'var(--text-on-success)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--button-success-hover)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--button-success-bg)';
                  }}
                  title="Voltear pieza"
                  aria-label={`Voltear pieza ${piece.id}`}
                  type="button"
                >
                  <FlipVertical size={14} className="sm:w-4 sm:h-4 lg:w-5 lg:h-5" aria-hidden="true" />
                  <VisuallyHidden>Voltear pieza</VisuallyHidden>
                </button>
              </div>

              <div className="mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }} aria-label="Detalles de posición">
                <div className="flex justify-between">
                  <span aria-label={`Rotación: ${piece.rotation} grados`}>Rotación: {piece.rotation}°</span>
                  <span aria-label={`Posición: X ${Math.round(piece.x)}, Y ${Math.round(piece.y)}`}>Pos: ({Math.round(piece.x)}, {Math.round(piece.y)})</span>
                </div>
              </div>
            </div>
          );
          })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeftSidebar;
