import React from 'react';
import { RotateCcw, SkipForward, HelpCircle, RotateCw, RefreshCw } from 'lucide-react';
import { Piece } from './GamePiece';

interface GameControlsProps {
  pieces: Piece[];
  showInstructions: boolean;
  onToggleInstructions: () => void;
  onResetLevel: () => void;
  onNextChallenge: () => void;
  onRotatePiece: (pieceId: number) => void;
  onFlipPiece: (pieceId: number) => void;
}

const GameControls: React.FC<GameControlsProps> = ({
  pieces,
  showInstructions,
  onToggleInstructions,
  onResetLevel,
  onNextChallenge,
  onRotatePiece,
  onFlipPiece,
}) => {
  return (
    <>
      {/* Header Controls */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">🪞 Reto al Espejo</h1>
            <p className="text-gray-600">Juego de simetría con piezas geométricas</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={onToggleInstructions}
              className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg transition-colors"
            >
              <HelpCircle size={20} />
            </button>
            <button 
              onClick={onResetLevel}
              className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-lg transition-colors"
            >
              <RotateCcw size={20} />
            </button>
            <button 
              onClick={onNextChallenge}
              className="bg-purple-500 hover:bg-purple-600 text-white p-3 rounded-lg transition-colors"
            >
              <SkipForward size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Piece Controls - compact layout */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
        {pieces.map(piece => (
          <div key={piece.id} className="bg-gray-50 p-2 rounded-lg text-center border">
            <div className="text-sm font-semibold mb-1 text-gray-700">
              Pieza {piece.id} (Tipo {piece.type})
            </div>
            <div className="flex gap-1 mb-1">
              <button
                onClick={() => onRotatePiece(piece.id)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs flex items-center justify-center gap-1 flex-1"
              >
                <RotateCw size={12} /> Rotar
              </button>
              <button
                onClick={() => onFlipPiece(piece.id)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded text-xs flex items-center justify-center gap-1 flex-1"
              >
                <RefreshCw size={12} /> Voltear
              </button>
            </div>
            <div className="text-xs text-gray-500">
              Cara: {piece.face === 'front' ? 'A' : 'B'}
            </div>
          </div>
        ))}
      </div>

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onToggleInstructions}>
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl max-h-[80vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800 text-xl">📝 Cómo jugar al Reto al Espejo</h3>
              <button
                onClick={onToggleInstructions}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="text-gray-700 space-y-4">
              <div>
                <p><strong>🎯 Objetivo:</strong> Forma el patrón mostrado en el área "OBJETIVO" usando las piezas y sus reflejos en el espejo.</p>
              </div>
              <div>
                <p><strong>🔄 Movimiento:</strong> Arrastra las piezas desde el área "PIEZAS DISPONIBLES" (abajo izquierda) al área "ÁREA DE JUEGO" (arriba izquierda).</p>
              </div>
              <div>
                <p><strong>🪞 Espejo:</strong> Cada pieza colocada en el área de juego se refleja automáticamente en el lado derecho del espejo.</p>
              </div>
              <div>
                <p><strong>🔄 Rotación:</strong> Usa los botones "Rotar" o haz clic derecho en una pieza para rotarla 90° en sentido horario.</p>
              </div>
              <div>
                <p><strong>🔀 Voltear:</strong> Usa el botón "Voltear" para cambiar la cara de la pieza (los colores se intercambian: amarillo ↔ rojo).</p>
              </div>
              <div>
                <p><strong>🚫 Restricciones:</strong> Las piezas no pueden cruzar la línea del espejo ni salirse de las áreas designadas.</p>
              </div>
              <div>
                <p><strong>⭐ Desafíos:</strong> Cada reto tiene diferente dificultad y número de piezas requeridas. ¡Usa la simetría del espejo a tu favor!</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GameControls;
