import React, { useRef } from 'react';
import { RotateCcw, SkipForward, SkipBack, HelpCircle, RotateCw, FlipHorizontal, CheckCircle, RefreshCw, Upload, Edit, Camera, Bug } from 'lucide-react';
import { Piece } from './GamePiece';
import { Challenge } from './ChallengeCard';

interface GameControlsProps {
  pieces: Piece[];
  challenges: Challenge[];
  currentChallenge: number;
  showInstructions: boolean;
  onToggleInstructions: () => void;
  onResetLevel: () => void;
  onNextChallenge: () => void;
  onPreviousChallenge: () => void;
  onRotatePiece: (pieceId: number) => void;
  onRotatePieceCounterClockwise: (pieceId: number) => void;
  onFlipPiece: (pieceId: number) => void;
  onCheckSolution?: () => { isCorrect: boolean; message: string };
  onLoadCustomChallenges?: (file: File) => void;
  onOpenChallengeEditor?: () => void;
  isLoading?: boolean;
  debugMode?: boolean;
  onToggleDebugMode?: () => void;
  setControlEffect?: (pieceId: number | null) => void;
  compact?: boolean;
}

const GameControls: React.FC<GameControlsProps> = ({
  pieces,
  challenges,
  currentChallenge,
  showInstructions,
  onToggleInstructions,
  onResetLevel,
  onNextChallenge,
  onPreviousChallenge,
  onRotatePiece,
  onRotatePieceCounterClockwise,
  onFlipPiece,
  onCheckSolution,
  onLoadCustomChallenges,
  onOpenChallengeEditor,
  isLoading,
  debugMode,
  onToggleDebugMode,
  setControlEffect,
  compact = false,
}) => {
  const [solutionMessage, setSolutionMessage] = React.useState<string | null>(null);
  const [isCorrectSolution, setIsCorrectSolution] = React.useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCheckSolution = () => {
    if (onCheckSolution) {
      const result = onCheckSolution();
      console.log('🎯 Resultado de validación:', result);
      setSolutionMessage(result.message);
      // Guardar el resultado para el styling
      setIsCorrectSolution(result.isCorrect);
      setTimeout(() => {
        setSolutionMessage(null);
        setIsCorrectSolution(null);
      }, 3000);
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

    // Activar debug para renderizado de piezas
    (window as any).debugPieceRendering = true;

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

      console.log(`Pieza ${piece.id} (${piece.type}, ${piece.face}): x=${piece.x}, y=${piece.y}, rotation=${piece.rotation}, placed=${piece.placed}, área=${area}, CENTER=${piece.centerColor}, TRIANGLE=${piece.triangleColor}`);
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

    console.log('');
    console.log('🎯 DESAFÍO ACTUAL:');
    if (challenges[currentChallenge]) {
      const challenge = challenges[currentChallenge];
      console.log(`ID: ${challenge.id}, Piezas necesarias: ${challenge.piecesNeeded}`);
      console.log('Piezas objetivo del jugador:');
      challenge.objective.playerPieces.forEach((piece, i) => {
        console.log(`  ${i+1}. Tipo ${piece.type}, cara ${piece.face}, pos (${piece.x.toFixed(1)}, ${piece.y.toFixed(1)}), rot ${piece.rotation}°`);
      });
    }

    console.log('');
    console.log('🔍 ANÁLISIS DE GAPS EN TARJETA DE RETO:');
    console.log('Buscando gaps entre piezas y sus reflejos en el espejo...');
    console.log('Revisa la consola para ver información detallada sobre las piezas y sus reflejos.');
    console.log('Busca líneas que indiquen "Gap between pieces" para identificar posibles problemas.');

    // Desactivar debug después de 5 segundos
    setTimeout(() => {
      (window as any).debugPieceRendering = false;
      console.log('✅ DEBUG SNAPSHOT COMPLETE - Análisis finalizado, modo debug desactivado');
    }, 5000);
  };
  if (compact) {
    return (
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg text-white font-bold text-lg">
                {currentChallenge + 1}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Desafío {currentChallenge + 1} de {challenges.length}
                </h2>
                <div className="text-sm text-gray-600">
                  {challenges[currentChallenge]?.name || 'Cargando...'}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 items-center">
            <button 
              onClick={onPreviousChallenge}
              className="bg-gradient-to-r from-gray-500 to-slate-600 hover:from-gray-600 hover:to-slate-700 text-white px-4 py-3 rounded-xl transition-all shadow-lg transform hover:scale-105"
              title="Desafío anterior"
            >
              <SkipBack size={24} />
            </button>
            <button 
              onClick={onNextChallenge}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-4 py-3 rounded-xl transition-all shadow-lg transform hover:scale-105"
              title="Siguiente desafío"
            >
              <SkipForward size={24} />
            </button>
            <button 
              onClick={onToggleInstructions}
              className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white px-4 py-3 rounded-xl transition-all shadow-lg transform hover:scale-105"
              title="Ayuda e instrucciones"
            >
              <HelpCircle size={24} />
            </button>
            {onLoadCustomChallenges && (
              <button 
                onClick={handleUploadClick}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-4 py-3 rounded-xl transition-all shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                title="Cargar retos personalizados"
                disabled={isLoading}
              >
                <Upload size={24} />
              </button>
            )}
            {onOpenChallengeEditor && (
              <button 
                onClick={onOpenChallengeEditor}
                className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white px-4 py-3 rounded-xl transition-all shadow-lg transform hover:scale-105"
                title="Editor de retos"
              >
                <Edit size={24} />
              </button>
            )}
            <button 
              onClick={handleSnapshotPieces}
              className="bg-gradient-to-r from-slate-500 to-gray-600 hover:from-slate-600 hover:to-gray-700 text-white px-4 py-3 rounded-xl transition-all shadow-lg transform hover:scale-105"
              title="Snapshot de posiciones actuales"
            >
              <Camera size={24} />
            </button>
            {onToggleDebugMode && (
              <button 
                onClick={onToggleDebugMode}
                className={`${
                  debugMode 
                    ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700' 
                    : 'bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600'
                } text-white px-4 py-3 rounded-xl transition-all shadow-lg transform hover:scale-105`}
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
      </div>
    );
  }

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
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-3 rounded-xl transition-all transform hover:scale-105 shadow-lg"
              title="Ayuda e instrucciones"
            >
              <HelpCircle size={24} />
            </button>
            <button 
              onClick={onResetLevel}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white p-3 rounded-xl transition-all transform hover:scale-105 shadow-lg"
              title="Reiniciar nivel"
            >
              <RefreshCw size={24} />
            </button>
            {onCheckSolution && (
              <button 
                onClick={handleCheckSolution}
                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white p-3 rounded-xl transition-all transform hover:scale-105 shadow-lg"
                title="Verificar solución"
              >
                <CheckCircle size={24} />
              </button>
            )}
            <button 
              onClick={onPreviousChallenge}
              className="bg-gradient-to-r from-gray-500 to-slate-600 hover:from-gray-600 hover:to-slate-700 text-white p-3 rounded-xl transition-all transform hover:scale-105 shadow-lg"
              title="Desafío anterior"
            >
              <SkipBack size={24} />
            </button>
            <button 
              onClick={onNextChallenge}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white p-3 rounded-xl transition-all transform hover:scale-105 shadow-lg"
              title="Siguiente desafío"
            >
              <SkipForward size={24} />
            </button>
            {onLoadCustomChallenges && (
              <button 
                onClick={handleUploadClick}
                className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white p-3 rounded-xl transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:transform-none"
                title="Cargar retos personalizados"
                disabled={isLoading}
              >
                <Upload size={24} />
              </button>
            )}
            {onOpenChallengeEditor && (
              <button 
                onClick={onOpenChallengeEditor}
                className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white p-3 rounded-xl transition-all transform hover:scale-105 shadow-lg"
                title="Editor de retos"
              >
                <Edit size={24} />
              </button>
            )}
            <button 
              onClick={handleSnapshotPieces}
              className="bg-gradient-to-r from-slate-500 to-gray-600 hover:from-slate-600 hover:to-gray-700 text-white p-3 rounded-xl transition-all transform hover:scale-105 shadow-lg"
              title="Snapshot de posiciones actuales"
            >
              <Camera size={24} />
            </button>
            {onToggleDebugMode && (
              <button 
                onClick={onToggleDebugMode}
                className={`${
                  debugMode 
                    ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700' 
                    : 'bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600'
                } text-white p-3 rounded-xl transition-all transform hover:scale-105 shadow-lg`}
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
            <div className="grid grid-cols-3 gap-2 mb-3">
              <button
                onMouseDown={() => {
                  console.log(`🖱️ MOUSE DOWN - Rotate CCW piece ${piece.id}`);
                  setControlEffect?.(piece.id);
                  setTimeout(() => onRotatePieceCounterClockwise(piece.id, true), 10);
                }}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white p-2.5 rounded-lg flex items-center justify-center shadow-lg transition-all transform hover:scale-110 active:scale-95"
                title="Rotar 45° antihorario"
              >
                <RotateCcw size={18} />
              </button>
              <button
                onMouseDown={() => {
                  console.log(`🖱️ MOUSE DOWN - Flip piece ${piece.id}`);
                  setControlEffect?.(piece.id);
                  setTimeout(() => onFlipPiece(piece.id, true), 10);
                }}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white p-2.5 rounded-lg flex items-center justify-center shadow-lg transition-all transform hover:scale-110 active:scale-95"
                title="Voltear pieza"
              >
                <FlipHorizontal size={18} />
              </button>
              <button
                onMouseDown={() => {
                  console.log(`🖱️ MOUSE DOWN - Rotate piece ${piece.id}`);
                  setControlEffect?.(piece.id);
                  setTimeout(() => onRotatePiece(piece.id, true), 10);
                }}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white p-2.5 rounded-lg flex items-center justify-center shadow-lg transition-all transform hover:scale-110 active:scale-95"
                title="Rotar 45° horario"
              >
                <RotateCw size={18} />
              </button>
            </div>
            <div className="text-xs text-center">
              <span className={`px-3 py-1.5 rounded-full text-white font-semibold shadow-md ${
                piece.face === 'front' 
                  ? 'bg-gradient-to-r from-emerald-400 to-green-500' 
                  : 'bg-gradient-to-r from-purple-400 to-pink-500'
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
                          Tu misión es recrear el patrón mostrado en el área &quot;OBJETIVO&quot; utilizando las piezas geométricas 
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
                          Arrastra las piezas desde el área &quot;PIEZAS DISPONIBLES&quot; (parte inferior izquierda) 
                          hacia el &quot;ÁREA DE JUEGO&quot; (parte superior izquierda). Las piezas se pueden mover libremente 
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

      {/* Overlay Message */}
      {solutionMessage && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
          <div className={`
            max-w-md mx-4 p-6 rounded-2xl shadow-2xl transform transition-all duration-300 
            ${isCorrectSolution 
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
              : 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
            }
          `}>
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl mb-2">
                  {isCorrectSolution ? '🎉' : '⚠️'}
                </div>
                <p className="text-lg font-semibold leading-relaxed">
                  {solutionMessage}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GameControls;
