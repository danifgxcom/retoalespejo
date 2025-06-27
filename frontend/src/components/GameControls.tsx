import React, { useRef } from 'react';
import { RotateCcw, SkipForward, SkipBack, HelpCircle, RotateCw, FlipHorizontal, CheckCircle, RefreshCw, Upload, Edit, Camera, Bug, Grid3x3 } from 'lucide-react';
import { Piece } from './GamePiece';
import { Challenge } from './ChallengeCard';
import { PieceColors } from '../utils/piece/PieceColors';
import { useTheme } from '../contexts/ThemeContext';
import ThemeSwitcher from './accessibility/ThemeSwitcher';

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
  showGrid?: boolean;
  onToggleGrid?: () => void;
  setControlEffect?: (pieceId: number | null) => void;
  compact?: boolean;
  gameMode?: 'offline' | 'multiplayer';
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
  showGrid,
  onToggleGrid,
  setControlEffect,
  compact = false,
  gameMode = 'offline',
}) => {
  const [solutionMessage, setSolutionMessage] = React.useState<string | null>(null);
  const [isCorrectSolution, setIsCorrectSolution] = React.useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme } = useTheme();

  // Get theme-appropriate colors for buttons using CSS variables
  const getButtonColors = () => {
    return {
      primary: { 
        bg: 'var(--button-primary-bg)', 
        hover: 'var(--button-primary-hover)', 
        text: 'var(--text-on-primary)' 
      },
      secondary: { 
        bg: 'var(--button-secondary-bg)', 
        hover: 'var(--button-secondary-hover)', 
        text: 'var(--text-on-secondary)' 
      },
      success: { 
        bg: 'var(--button-success-bg)', 
        hover: 'var(--button-success-hover)', 
        text: 'var(--text-on-success)' 
      },
      danger: { 
        bg: 'var(--button-danger-bg)', 
        hover: 'var(--button-danger-hover)', 
        text: 'var(--text-on-danger)' 
      },
      info: { 
        bg: 'var(--button-info-bg)', 
        hover: 'var(--button-info-hover)', 
        text: 'var(--text-on-info)' 
      },
      gray: { 
        bg: 'var(--button-gray-bg)', 
        hover: 'var(--button-gray-hover)', 
        text: 'var(--text-on-dark)' 
      }
    };
  };

  // Get piece-specific colors for individual piece controls
  const getPieceColors = (pieceId: number) => {
    const identificationColor = PieceColors.getIdentificationColor(pieceId);
    const pieceColors = PieceColors.getColorsForPieceId(pieceId);
    
    return {
      rotate: { 
        bg: identificationColor, 
        hover: shadeColor(identificationColor, -15), 
        text: '#ffffff' 
      },
      flip: { 
        bg: pieceColors.triangleColor, 
        hover: shadeColor(pieceColors.triangleColor, -15), 
        text: '#ffffff' 
      },
      rotateBack: { 
        bg: identificationColor, 
        hover: shadeColor(identificationColor, -15), 
        text: '#ffffff' 
      }
    };
  };

  // Helper function to darken or lighten a color
  const shadeColor = (color: string, percent: number): string => {
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);

    R = Math.floor(R * (100 + percent) / 100);
    G = Math.floor(G * (100 + percent) / 100);
    B = Math.floor(B * (100 + percent) / 100);

    R = R < 255 ? R : 255;
    G = G < 255 ? G : 255;
    B = B < 255 ? B : 255;

    R = R > 0 ? R : 0;
    G = G > 0 ? G : 0;
    B = B > 0 ? B : 0;

    const RR = R.toString(16).length === 1 ? '0' + R.toString(16) : R.toString(16);
    const GG = G.toString(16).length === 1 ? '0' + G.toString(16) : G.toString(16);
    const BB = B.toString(16).length === 1 ? '0' + B.toString(16) : B.toString(16);

    return '#' + RR + GG + BB;
  };

  // We'll get piece-specific colors when needed

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
      <div className="bg-card rounded-xl shadow-lg p-4 border border-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Desafío {currentChallenge + 1} de {challenges.length}
                </h2>
                <div className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                  {challenges[currentChallenge]?.name || 'Cargando...'}
                </div>
              </div>
            </div>

            {/* Multiplayer indicator */}
            <div className="flex items-center">
              <div className="px-3 py-1 rounded-lg text-base font-medium" style={{ backgroundColor: 'var(--button-primary-bg)', color: 'var(--text-on-primary)' }}>
                {gameMode === 'multiplayer' ? 'Multijugador' : 'Modo offline'}
              </div>
            </div>
          </div>

          <div className="flex gap-1 sm:gap-2 lg:gap-3 items-center">
            {onPreviousChallenge && (
              <button 
                onClick={onPreviousChallenge}
                className="px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl transition-all shadow-lg transform hover:scale-105"
                style={{
                  backgroundColor: getButtonColors().primary.bg,
                  color: getButtonColors().primary.text
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = getButtonColors().primary.hover;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = getButtonColors().primary.bg;
                }}
                title="Desafío anterior"
                aria-label="Ir al desafío anterior"
              >
                <SkipBack className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" aria-hidden="true" />
                <span className="hidden sm:inline ml-1 lg:ml-2">Anterior</span>
              </button>
            )}
            {onNextChallenge && (
              <button 
                onClick={onNextChallenge}
                className="px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl transition-all shadow-lg transform hover:scale-105"
                style={{
                  backgroundColor: getButtonColors().danger.bg,
                  color: getButtonColors().danger.text
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = getButtonColors().danger.hover;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = getButtonColors().danger.bg;
                }}
                title="Siguiente desafío"
                aria-label="Ir al siguiente desafío"
              >
                <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" aria-hidden="true" />
                <span className="hidden sm:inline ml-1 lg:ml-2">Siguiente</span>
              </button>
            )}
            {onLoadCustomChallenges && (
              <button 
                onClick={handleUploadClick}
                className="px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl transition-all shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                style={{
                  backgroundColor: getButtonColors().primary.bg,
                  color: getButtonColors().primary.text
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = getButtonColors().primary.hover;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = getButtonColors().primary.bg;
                }}
                title="Cargar retos personalizados"
                aria-label="Cargar retos personalizados"
                disabled={isLoading}
              >
                <Upload className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" aria-hidden="true" />
                <span className="hidden lg:inline ml-2">Cargar</span>
              </button>
            )}
            {onOpenChallengeEditor && (
              <button 
                onClick={onOpenChallengeEditor}
                className="px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl transition-all shadow-lg transform hover:scale-105"
                style={{
                  backgroundColor: getButtonColors().danger.bg,
                  color: getButtonColors().danger.text
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = getButtonColors().danger.hover;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = getButtonColors().danger.bg;
                }}
                title="Editor de retos"
                aria-label="Abrir editor de retos"
              >
                <Edit className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" aria-hidden="true" />
                <span className="hidden lg:inline ml-2">Editor</span>
              </button>
            )}
            {/* Solo mostrar snapshot si debug está activado */}
            {debugMode && (
              <button 
                onClick={handleSnapshotPieces}
                className="px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl transition-all shadow-lg transform hover:scale-105"
                style={{
                  backgroundColor: getButtonColors().info.bg,
                  color: getButtonColors().info.text
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = getButtonColors().info.hover;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = getButtonColors().info.bg;
                }}
                title="Snapshot de posiciones actuales"
                aria-label="Capturar snapshot de posiciones actuales"
              >
                <Camera className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" aria-hidden="true" />
                <span className="hidden lg:inline ml-2">Snapshot</span>
              </button>
            )}
            {onToggleDebugMode && (
              <button 
                onClick={onToggleDebugMode}
                className="px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl transition-all shadow-lg transform hover:scale-105"
                style={{
                  backgroundColor: debugMode ? getButtonColors().danger.bg : getButtonColors().primary.bg,
                  color: debugMode ? getButtonColors().danger.text : getButtonColors().primary.text
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = debugMode ? getButtonColors().danger.hover : getButtonColors().primary.hover;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = debugMode ? getButtonColors().danger.bg : getButtonColors().primary.bg;
                }}
                title={debugMode ? "Desactivar modo debug" : "Activar modo debug"}
                aria-label={debugMode ? "Desactivar modo debug" : "Activar modo debug"}
              >
                <Bug className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" aria-hidden="true" />
                <span className="hidden lg:inline ml-2">{debugMode ? 'Debug' : 'Debug'}</span>
              </button>
            )}
            {/* Grid toggle - solo visible en modo debug */}
            {debugMode && onToggleGrid && (
              <button 
                onClick={onToggleGrid}
                className="px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl transition-all shadow-lg transform hover:scale-105"
                style={{
                  backgroundColor: showGrid ? getButtonColors().warning.bg : getButtonColors().secondary.bg,
                  color: showGrid ? getButtonColors().warning.text : getButtonColors().secondary.text
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = showGrid ? getButtonColors().warning.hover : getButtonColors().secondary.hover;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = showGrid ? getButtonColors().warning.bg : getButtonColors().secondary.bg;
                }}
                title={showGrid ? "Ocultar grid" : "Mostrar grid"}
                aria-label={showGrid ? "Ocultar grid de posicionamiento" : "Mostrar grid de posicionamiento"}
              >
                <Grid3x3 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" aria-hidden="true" />
                <span className="hidden lg:inline ml-2">{showGrid ? 'Grid' : 'Grid'}</span>
              </button>
            )}

            {/* Botón de ayuda */}
            <button 
              onClick={onToggleInstructions}
              className="px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl transition-all shadow-lg transform hover:scale-105"
              style={{
                backgroundColor: getButtonColors().danger.bg,
                color: getButtonColors().danger.text
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = getButtonColors().danger.hover;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = getButtonColors().danger.bg;
              }}
              title="Ayuda e instrucciones"
              aria-label="Mostrar ayuda e instrucciones"
            >
              <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" aria-hidden="true" />
              <span className="hidden lg:inline ml-2">Ayuda</span>
            </button>

            {/* Tema Accesible - Ahora con el mismo estilo que los otros botones */}
            <ThemeSwitcher 
              className="px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl transition-all shadow-lg transform hover:scale-105 text-sm" 
            />

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
      <div className="bg-card rounded-lg shadow-lg p-6 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">🪞 Reto al Espejo</h1>
            <p className="text-lg text-gray-600">Juego de simetría con piezas geométricas</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={onToggleInstructions}
              className="bg-primary-gradient hover:bg-primary-gradient-hover p-3 rounded-xl transition-all transform hover:scale-105 shadow-lg"
              title="Ayuda e instrucciones"
              aria-label="Mostrar ayuda e instrucciones"
            >
              <HelpCircle size={24} aria-hidden="true" />
            </button>
            <button 
              onClick={onResetLevel}
              className="bg-danger-gradient hover:bg-danger-gradient-hover p-3 rounded-xl transition-all transform hover:scale-105 shadow-lg"
              title="Reiniciar nivel"
              aria-label="Reiniciar nivel actual"
            >
              <RefreshCw size={24} aria-hidden="true" />
            </button>
            {onCheckSolution && (
              <button 
                onClick={handleCheckSolution}
                className="bg-success-gradient hover:bg-success-gradient-hover p-3 rounded-xl transition-all transform hover:scale-105 shadow-lg"
                title="Verificar solución"
                aria-label="Verificar solución actual"
              >
                <CheckCircle size={24} aria-hidden="true" />
              </button>
            )}
            <button 
              onClick={onPreviousChallenge}
              className="bg-gray-gradient hover:bg-gray-gradient-hover p-3 rounded-xl transition-all transform hover:scale-105 shadow-lg"
              title="Desafío anterior"
              aria-label="Ir al desafío anterior"
            >
              <SkipBack size={24} aria-hidden="true" />
            </button>
            <button 
              onClick={onNextChallenge}
              className="bg-secondary-gradient hover:bg-secondary-gradient-hover p-3 rounded-xl transition-all transform hover:scale-105 shadow-lg"
              title="Siguiente desafío"
              aria-label="Ir al siguiente desafío"
            >
              <SkipForward size={24} aria-hidden="true" />
            </button>
            {onLoadCustomChallenges && (
              <button 
                onClick={handleUploadClick}
                className="bg-warning-gradient hover:bg-warning-gradient-hover p-3 rounded-xl transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:transform-none"
                title="Cargar retos personalizados"
                aria-label="Cargar retos personalizados"
                disabled={isLoading}
              >
                <Upload size={24} aria-hidden="true" />
              </button>
            )}
            {onOpenChallengeEditor && (
              <button 
                onClick={onOpenChallengeEditor}
                className="bg-info-gradient hover:bg-info-gradient-hover p-3 rounded-xl transition-all transform hover:scale-105 shadow-lg"
                title="Editor de retos"
                aria-label="Abrir editor de retos"
              >
                <Edit className="w-6 h-6" aria-hidden="true" />
              </button>
            )}
            <button 
              onClick={handleSnapshotPieces}
              className="bg-gray-gradient hover:bg-gray-gradient-hover p-3 rounded-xl transition-all transform hover:scale-105 shadow-lg"
              title="Snapshot de posiciones actuales"
              aria-label="Capturar snapshot de posiciones actuales"
            >
              <Camera size={24} aria-hidden="true" />
            </button>
            {onToggleDebugMode && (
              <button 
                onClick={onToggleDebugMode}
                className={`${
                  debugMode 
                    ? 'bg-danger-gradient hover:bg-danger-gradient-hover' 
                    : 'bg-gray-gradient hover:bg-gray-gradient-hover'
                }  p-3 rounded-xl transition-all transform hover:scale-105 shadow-lg`}
                title={debugMode ? "Desactivar modo debug" : "Activar modo debug"}
                aria-label={debugMode ? "Desactivar modo debug" : "Activar modo debug"}
              >
                <Bug size={24} aria-hidden="true" />
              </button>
            )}
            {/* Grid toggle - solo visible en modo debug */}
            {debugMode && onToggleGrid && (
              <button 
                onClick={onToggleGrid}
                className={`${
                  showGrid 
                    ? 'bg-warning-gradient hover:bg-warning-gradient-hover' 
                    : 'bg-gray-gradient hover:bg-gray-gradient-hover'
                }  p-3 rounded-xl transition-all transform hover:scale-105 shadow-lg`}
                title={showGrid ? "Ocultar grid" : "Mostrar grid"}
                aria-label={showGrid ? "Ocultar grid de posicionamiento" : "Mostrar grid de posicionamiento"}
              >
                <Grid3x3 size={24} aria-hidden="true" />
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
          <div 
            key={piece.id} 
            className="p-3 rounded-xl shadow-md border-2 hover:shadow-lg transition-shadow" 
            style={{ 
              backgroundColor: 'var(--card-elevated-bg)', 
              borderColor: getPieceColors(piece.id).rotate.bg,
              color: 'var(--text-primary)'
            }}
          >
            <div 
              className="text-sm font-bold mb-2 text-center flex items-center justify-center" 
              style={{ color: 'var(--text-primary)' }}
            >
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold mr-2 shadow-lg" 
                style={{ 
                  backgroundColor: getPieceColors(piece.id).rotate.bg, 
                  color: getPieceColors(piece.id).rotate.text 
                }}
              >
                {piece.id}
              </div>
              <span style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 'bold' }}>Pieza {piece.type}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {/* Get piece-specific colors */}
              {(() => {
                const pieceButtonColors = getPieceColors(piece.id);
                return (
                  <>
                    <button
                      onMouseDown={() => {
                        setControlEffect?.(piece.id);
                        setTimeout(() => onRotatePieceCounterClockwise(piece.id, true), 10);
                      }}
                      className="p-2.5 rounded-lg flex items-center justify-center shadow-lg transition-all transform hover:scale-110 active:scale-95"
                      style={{
                        backgroundColor: pieceButtonColors.rotateBack.bg,
                        color: pieceButtonColors.rotateBack.text
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = pieceButtonColors.rotateBack.hover;
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = pieceButtonColors.rotateBack.bg;
                      }}
                      title="Rotar 45° antihorario"
                      aria-label={`Rotar pieza ${piece.id} 45 grados antihorario`}
                    >
                      <RotateCcw size={18} aria-hidden="true" />
                    </button>
                    <button
                      onMouseDown={() => {
                        setControlEffect?.(piece.id);
                        setTimeout(() => onFlipPiece(piece.id, true), 10);
                      }}
                      className="p-2.5 rounded-lg flex items-center justify-center shadow-lg transition-all transform hover:scale-110 active:scale-95"
                      style={{
                        backgroundColor: pieceButtonColors.flip.bg,
                        color: pieceButtonColors.flip.text
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = pieceButtonColors.flip.hover;
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = pieceButtonColors.flip.bg;
                      }}
                      title="Voltear pieza"
                      aria-label={`Voltear pieza ${piece.id}`}
                    >
                      <FlipHorizontal size={18} aria-hidden="true" />
                    </button>
                    <button
                      onMouseDown={() => {
                        setControlEffect?.(piece.id);
                        setTimeout(() => onRotatePiece(piece.id, true), 10);
                      }}
                      className="p-2.5 rounded-lg flex items-center justify-center shadow-lg transition-all transform hover:scale-110 active:scale-95"
                      style={{
                        backgroundColor: pieceButtonColors.rotate.bg,
                        color: pieceButtonColors.rotate.text
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = pieceButtonColors.rotate.hover;
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = pieceButtonColors.rotate.bg;
                      }}
                      title="Rotar 45° horario"
                      aria-label={`Rotar pieza ${piece.id} 45 grados horario`}
                    >
                      <RotateCw size={18} aria-hidden="true" />
                    </button>
                  </>
                );
              })()}
            </div>
            <div className="text-sm text-center">
              <span className={`px-3 py-1.5 rounded-full font-semibold shadow-md text-base ${
                piece.face === 'front' 
                  ? 'bg-success-gradient' 
                  : 'bg-secondary-gradient'
              }`}
              style={{
                color: piece.face === 'front' ? 'var(--text-on-success)' : 'var(--text-on-secondary)'
              }}>
                Cara {piece.face === 'front' ? 'A' : 'B'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-modal-overlay flex items-center justify-center z-50 p-4" onClick={onToggleInstructions}>
          <div className="bg-modal rounded-2xl shadow-2xl max-w-4xl max-h-[85vh] overflow-y-auto border border-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-modal-header  p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-2xl mb-2">🪞 Cómo jugar al Reto al Espejo</h3>
                  <p className="text-blue-100 text-sm">Domina la simetría y resuelve los desafíos geométricos</p>
                </div>
                <button
                  onClick={onToggleInstructions}
                  className=" hover:text-red-200 text-3xl font-bold transition-colors p-2 hover:bg-white hover:bg-opacity-20 rounded-lg"
                  aria-label="Cerrar instrucciones"
                >
                  <span aria-hidden="true">×</span>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-5">
                  <div className="bg-success-50 border-l-4 border-success-400 p-4 rounded-r-lg">
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">🎯</span>
                      <div>
                        <h4 className="font-bold text-success-800 mb-2">Objetivo del Juego</h4>
                        <p className="text-success-700 leading-relaxed">
                          Tu misión es recrear el patrón mostrado en el área &quot;OBJETIVO&quot; utilizando las piezas geométricas 
                          y aprovechando el poder del espejo para completar la figura simétrica.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary-50 border-l-4 border-primary-400 p-4 rounded-r-lg">
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">🔄</span>
                      <div>
                        <h4 className="font-bold text-primary-800 mb-2">Movimiento de Piezas</h4>
                        <p className="text-primary-700 leading-relaxed">
                          Arrastra las piezas desde el área &quot;PIEZAS DISPONIBLES&quot; (parte inferior izquierda) 
                          hacia el &quot;ÁREA DE JUEGO&quot; (parte superior izquierda). Las piezas se pueden mover libremente 
                          dentro de las áreas permitidas.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-secondary-50 border-l-4 border-secondary-400 p-4 rounded-r-lg">
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">🪞</span>
                      <div>
                        <h4 className="font-bold text-secondary-800 mb-2">Magia del Espejo</h4>
                        <p className="text-secondary-700 leading-relaxed">
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
                  <div className="bg-warning-50 border-l-4 border-warning-400 p-4 rounded-r-lg">
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">⚙️</span>
                      <div>
                        <h4 className="font-bold text-warning-800 mb-2">Controles de Piezas</h4>
                        <div className="text-warning-700 leading-relaxed space-y-2">
                          <p><strong>🔄 Rotar:</strong> Haz clic en el botón de rotación o clic derecho sobre una pieza 
                          para rotarla 45° en sentido horario. Úsalo para orientar las piezas correctamente.</p>
                          <p><strong>🔀 Voltear:</strong> El botón de voltear cambia la cara de la pieza, 
                          intercambiando los colores (amarillo ↔ rojo). Esencial para conseguir patrones específicos.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-danger-50 border-l-4 border-danger-400 p-4 rounded-r-lg">
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">🚫</span>
                      <div>
                        <h4 className="font-bold text-danger-800 mb-2">Restricciones</h4>
                        <p className="text-danger-700 leading-relaxed">
                          Las piezas no pueden atravesar la línea del espejo ni salirse de las áreas designadas. 
                          Respeta los límites de cada zona para mantener el orden del juego.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-warning-50 border-l-4 border-warning-400 p-4 rounded-r-lg">
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">⭐</span>
                      <div>
                        <h4 className="font-bold text-warning-800 mb-2">Estrategia y Desafíos</h4>
                        <p className="text-warning-700 leading-relaxed">
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
                <div className="bg-primary-50 p-4 rounded-lg text-center">
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

      {/* Validation Message in Piece Storage Area */}
      {solutionMessage && (
        <div className="fixed bottom-6 left-6 max-w-sm z-50 pointer-events-none">
          <div className={`
            p-4 rounded-xl shadow-xl transform transition-all duration-300 backdrop-blur-sm
            ${isCorrectSolution 
              ? 'bg-success-gradient border-2 border-green-400' 
              : 'bg-danger-gradient border-2 border-red-400'
            }
          `}>
            <div className="flex items-center">
              <div className="text-2xl mr-3 flex-shrink-0">
                {isCorrectSolution ? '🎉' : '⚠️'}
              </div>
              <p className="text-white font-semibold text-sm leading-relaxed">
                {solutionMessage}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GameControls;
