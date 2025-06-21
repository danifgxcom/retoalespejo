import React, { useRef } from 'react';
import { RotateCcw, SkipForward, HelpCircle, RotateCw, FlipHorizontal, CheckCircle, RefreshCw, Upload, Edit, Camera, Bug } from 'lucide-react';
import { Piece } from './GamePiece';

interface GameControlsProps {
  pieces: Piece[];
  showInstructions: boolean;
  onToggleInstructions: () => void;
  onResetLevel: () => void;
  onNextChallenge: () => void;
  onRotatePiece: (pieceId: number) => void;
  onRotatePieceCounterClockwise: (pieceId: number) => void;
  onFlipPiece: (pieceId: number) => void;
  onCheckSolution?: () => boolean;
  onLoadCustomChallenges?: (file: File) => void;
  onOpenChallengeEditor?: () => void;
  isLoading?: boolean;
  debugMode?: boolean;
  onToggleDebugMode?: () => void;
}

const GameControls: React.FC<GameControlsProps> = ({
  pieces,
  showInstructions,
  onToggleInstructions,
  onResetLevel,
  onNextChallenge,
  onRotatePiece,
  onRotatePieceCounterClockwise,
  onFlipPiece,
  onCheckSolution,
  onLoadCustomChallenges,
  onOpenChallengeEditor,
  isLoading,
  debugMode,
  onToggleDebugMode,
}) => {
  const [solutionMessage, setSolutionMessage] = React.useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCheckSolution = () => {
    if (onCheckSolution) {
      const isCorrect = onCheckSolution();
      setSolutionMessage(isCorrect ? "¡Correcto! Has resuelto el objetivo." : "Aún no coincide con el objetivo.");
      setTimeout(() => setSolutionMessage(null), 3000);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0 && onLoadCustomChallenges) {
      onLoadCustomChallenges(files[0]);
    }
    // Reset the input value so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSnapshotPieces = () => {
    console.log('📸 SNAPSHOT DE POSICIONES ACTUALES:');
    console.log('=====================================');
    
    // Información del canvas y áreas
    console.log('🖼️ INFORMACIÓN DEL CANVAS:');
    console.log('Canvas interno: 1400x1000');
    console.log('Línea del espejo: X=700 (centro horizontal)');
    console.log('Área de juego: (0,0) a (700,600)');
    console.log('Área de espejo: (700,0) a (1400,600)');
    console.log('Área de piezas: (0,600) a (350,1000)');
    console.log('Área de objetivo: (350,600) a (700,1000)');
    console.log('');
    
    // Información de las piezas
    console.log('🧩 PIEZAS EN EL JUEGO:');
    pieces.forEach((piece, index) => {
      const area = piece.y < 600 ? 'JUEGO' : 
                   piece.y >= 600 && piece.x < 350 ? 'PIEZAS' :
                   piece.y >= 600 && piece.x >= 350 ? 'OBJETIVO' : 'DESCONOCIDA';
      
      console.log(`Pieza ${piece.id} (${piece.type}, ${piece.face}): x=${piece.x}, y=${piece.y}, rotation=${piece.rotation}, placed=${piece.placed}, área=${area}`);
    });
    
    console.log('=====================================');
    console.log('📋 COORDENADAS PARA CÓDIGO:');
    console.log(JSON.stringify(pieces.map(p => ({
      x: p.x,
      y: p.y,
      rotation: p.rotation,
      type: p.type,
      face: p.face,
      placed: p.placed
    })), null, 2));
  };
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
              className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg transition-colors shadow-md"
              title="Ayuda e instrucciones"
            >
              <HelpCircle size={24} />
            </button>
            <button 
              onClick={onResetLevel}
              className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-lg transition-colors shadow-md"
              title="Reiniciar nivel"
            >
              <RefreshCw size={24} />
            </button>
            {onCheckSolution && (
              <button 
                onClick={handleCheckSolution}
                className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-lg transition-colors shadow-md"
                title="Verificar solución"
              >
                <CheckCircle size={24} />
              </button>
            )}
            <button 
              onClick={onNextChallenge}
              className="bg-purple-500 hover:bg-purple-600 text-white p-3 rounded-lg transition-colors shadow-md"
              title="Siguiente desafío"
            >
              <SkipForward size={24} />
            </button>
            {onLoadCustomChallenges && (
              <button 
                onClick={handleUploadClick}
                className="bg-amber-500 hover:bg-amber-600 text-white p-3 rounded-lg transition-colors shadow-md"
                title="Cargar retos personalizados"
                disabled={isLoading}
              >
                <Upload size={24} />
              </button>
            )}
            {onOpenChallengeEditor && (
              <button 
                onClick={onOpenChallengeEditor}
                className="bg-indigo-500 hover:bg-indigo-600 text-white p-3 rounded-lg transition-colors shadow-md"
                title="Editor de retos"
              >
                <Edit size={24} />
              </button>
            )}
            <button 
              onClick={handleSnapshotPieces}
              className="bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-lg transition-colors shadow-md"
              title="Snapshot de posiciones actuales"
            >
              <Camera size={24} />
            </button>
            {onToggleDebugMode && (
              <button 
                onClick={onToggleDebugMode}
                className={`${
                  debugMode 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-gray-500 hover:bg-gray-600'
                } text-white p-3 rounded-lg transition-colors shadow-md`}
                title={debugMode ? "Desactivar modo debug" : "Activar modo debug"}
              >
                <Bug size={24} />
              </button>
            )}
            {/* Hidden file input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".json" 
              className="hidden" 
            />
          </div>
        </div>

        {/* Solution Message */}
        {solutionMessage && (
          <div className={`mt-4 p-3 rounded-lg text-center font-semibold ${
            solutionMessage.includes('Correcto') 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
          }`}>
            {solutionMessage}
          </div>
        )}
      </div>

      {/* Piece Controls - elegante y compacto */}
      <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3">
        {pieces.map(piece => (
          <div key={piece.id} className="bg-gradient-to-br from-white to-gray-50 p-3 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="text-sm font-bold mb-2 text-gray-800 text-center flex items-center justify-center">
              <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-lg font-bold mr-2 shadow-lg">
                {piece.id}
              </div>
              <span>Pieza {piece.type}</span>
            </div>
            <div className="grid grid-cols-3 gap-1 mb-2">
              <button
                onClick={() => onRotatePieceCounterClockwise(piece.id)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-2 rounded-lg flex items-center justify-center shadow-md transition-all transform hover:scale-110"
                title="Rotar 45° antihorario"
              >
                <RotateCcw size={20} />
              </button>
              <button
                onClick={() => onFlipPiece(piece.id)}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white p-2 rounded-lg flex items-center justify-center shadow-md transition-all transform hover:scale-110"
                title="Voltear pieza"
              >
                <FlipHorizontal size={20} />
              </button>
              <button
                onClick={() => onRotatePiece(piece.id)}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-2 rounded-lg flex items-center justify-center shadow-md transition-all transform hover:scale-110"
                title="Rotar 45° horario"
              >
                <RotateCw size={20} />
              </button>
            </div>
            <div className="text-xs text-center">
              <span className={`px-2 py-1 rounded-full text-white font-medium ${
                piece.face === 'front' 
                  ? 'bg-green-500' 
                  : 'bg-purple-500'
              }`}>
                Cara {piece.face === 'front' ? 'A' : 'B'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onToggleInstructions}>
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl max-w-4xl max-h-[85vh] overflow-y-auto border border-gray-200" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-2xl mb-2">🪞 Cómo jugar al Reto al Espejo</h3>
                  <p className="text-blue-100 text-sm">Domina la simetría y resuelve los desafíos geométricos</p>
                </div>
                <button
                  onClick={onToggleInstructions}
                  className="text-white hover:text-red-200 text-3xl font-bold transition-colors p-2 hover:bg-white hover:bg-opacity-20 rounded-lg"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-5">
                  <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">🎯</span>
                      <div>
                        <h4 className="font-bold text-green-800 mb-2">Objetivo del Juego</h4>
                        <p className="text-green-700 leading-relaxed">
                          Tu misión es recrear el patrón mostrado en el área "OBJETIVO" utilizando las piezas geométricas 
                          y aprovechando el poder del espejo para completar la figura simétrica.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">🔄</span>
                      <div>
                        <h4 className="font-bold text-blue-800 mb-2">Movimiento de Piezas</h4>
                        <p className="text-blue-700 leading-relaxed">
                          Arrastra las piezas desde el área "PIEZAS DISPONIBLES" (parte inferior izquierda) 
                          hacia el "ÁREA DE JUEGO" (parte superior izquierda). Las piezas se pueden mover libremente 
                          dentro de las áreas permitidas.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded-r-lg">
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">🪞</span>
                      <div>
                        <h4 className="font-bold text-purple-800 mb-2">Magia del Espejo</h4>
                        <p className="text-purple-700 leading-relaxed">
                          Cada pieza que coloques en el área de juego se reflejará automáticamente en el lado derecho 
                          del espejo. Esta reflexión es instantánea y mantiene las propiedades de la pieza original, 
                          creando patrones simétricos perfectos.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-5">
                  <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg">
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">⚙️</span>
                      <div>
                        <h4 className="font-bold text-orange-800 mb-2">Controles de Piezas</h4>
                        <div className="text-orange-700 leading-relaxed space-y-2">
                          <p><strong>🔄 Rotar:</strong> Haz clic en el botón de rotación o clic derecho sobre una pieza 
                          para rotarla 45° en sentido horario. Úsalo para orientar las piezas correctamente.</p>
                          <p><strong>🔀 Voltear:</strong> El botón de voltear cambia la cara de la pieza, 
                          intercambiando los colores (amarillo ↔ rojo). Esencial para conseguir patrones específicos.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">🚫</span>
                      <div>
                        <h4 className="font-bold text-red-800 mb-2">Restricciones</h4>
                        <p className="text-red-700 leading-relaxed">
                          Las piezas no pueden atravesar la línea del espejo ni salirse de las áreas designadas. 
                          Respeta los límites de cada zona para mantener el orden del juego.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">⭐</span>
                      <div>
                        <h4 className="font-bold text-yellow-800 mb-2">Estrategia y Desafíos</h4>
                        <p className="text-yellow-700 leading-relaxed">
                          Cada reto presenta diferentes niveles de dificultad y requiere un número específico de piezas. 
                          Piensa en la simetría, experimenta con rotaciones y combinaciones de colores. 
                          ¡El espejo es tu mejor aliado!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-lg text-center">
                  <p className="text-gray-600 text-sm">
                    💡 <strong>Consejo:</strong> Observa detenidamente el patrón objetivo y planifica tus movimientos. 
                    La simetría del espejo puede sorprenderte con soluciones elegantes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GameControls;
