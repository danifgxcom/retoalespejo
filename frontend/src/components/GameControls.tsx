import React, { useRef } from 'react';
import { RotateCcw, SkipForward, SkipBack, HelpCircle, RotateCw, FlipHorizontal, CheckCircle, RefreshCw, Upload, Edit, Camera, Bug, Grid3x3, Undo2, Redo2, Clock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Piece } from './GamePiece';
import { Challenge } from './ChallengeCard';
import { PieceColors } from '../utils/piece/PieceColors';
import ThemeSwitcher from './accessibility/ThemeSwitcher';
import { GAME_NAME } from '../branding';
import { useTheme } from '../contexts/ThemeContext';
import Modal from './ui/Modal';

type ToolButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'gray';

const TOOL_BUTTON_TEXT: Record<ToolButtonVariant, string> = {
  primary: 'var(--text-on-primary)',
  secondary: 'var(--text-on-secondary)',
  success: 'var(--text-on-success)',
  warning: 'var(--text-on-warning)',
  danger: 'var(--text-on-danger)',
  info: 'var(--text-on-info)',
  gray: 'var(--text-on-dark)',
};

interface ToolButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  variant?: ToolButtonVariant;
  /** A partir de qué anchura se ve el texto; debajo queda sólo el icono. */
  labelFrom?: 'sm' | 'lg' | '2xl' | '1700';
}

/**
 * '1700' es un breakpoint a medida (Tailwind sólo trae hasta 2xl=1536): la
 * barra compacta comparte fila con el bloque de identidad (22rem mínimos) y,
 * con 1600px de ancho de ventana, siete controles con etiqueta no caben aunque
 * 1600 ya sea "2xl". Sin esto la botonera vuelve a saltar a una segunda fila
 * en 1600×900 (ver medición en la tarea de altura de cabecera).
 */
const LABEL_VISIBILITY: Record<'sm' | 'lg' | '2xl' | '1700', string> = {
  sm: 'hidden sm:inline',
  lg: 'hidden lg:inline',
  '2xl': 'hidden 2xl:inline',
  '1700': 'hidden min-[1700px]:inline',
};

/**
 * Botón de la barra de herramientas. El color sale de las variables de tema y
 * el estado hover/activo del propio CSS, así que no hace falta repetir
 * manejadores de ratón y foco en cada botón.
 */
const ToolButton: React.FC<ToolButtonProps> = ({ icon: Icon, label, variant = 'primary', labelFrom = '2xl', className = '', ...buttonProps }) => (
  <button
    type="button"
    className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold shadow-sm transition hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100 ${className}`}
    style={{ backgroundColor: `var(--button-${variant}-bg)`, color: TOOL_BUTTON_TEXT[variant] }}
    {...buttonProps}
  >
    <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
    <span className={LABEL_VISIBILITY[labelFrom]}>{label}</span>
  </button>
);

interface GameControlsProps {
  pieces: Piece[];
  challenges: Challenge[];
  currentChallenge: number;
  showInstructions: boolean;
  onToggleInstructions: () => void;
  onResetLevel: () => void;
  onNextChallenge?: () => void;
  onPreviousChallenge?: () => void;
  canGoToPreviousChallenge?: boolean;
  canGoToNextChallenge?: boolean;
  isLastChallenge?: boolean;
  onRotatePiece: (pieceId: number, fromControl?: boolean) => void;
  onRotatePieceCounterClockwise: (pieceId: number, fromControl?: boolean) => void;
  onFlipPiece: (pieceId: number, fromControl?: boolean) => void;
  onCheckSolution?: () => { isCorrect: boolean; message: string };
  onLoadCustomChallenges?: (file: File) => void;
  onOpenChallengeEditor?: () => void;
  isLoading?: boolean;
  debugMode?: boolean;
  onToggleDebugMode?: () => void;
  showGrid?: boolean;
  onToggleGrid?: () => void;
  setControlEffect?: (pieceId: number | null) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  compact?: boolean;
  gameMode?: 'offline' | 'multiplayer';
  /** F-mobile: cronómetro ya formateado ("MM:SS"), embebido en la cabecera
   *  compacta sólo por debajo de xl (en xl el cronómetro grande de
   *  RightSidebar ya es visible sin scroll). */
  mobileTimerText?: string;
  mobileTimerPaused?: boolean;
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
  canGoToPreviousChallenge = true,
  canGoToNextChallenge = true,
  isLastChallenge = false,
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
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  compact = false,
  gameMode = 'offline',
  mobileTimerText,
  mobileTimerPaused,
}) => {
  const [solutionMessage, setSolutionMessage] = React.useState<string | null>(null);
  const [isCorrectSolution, setIsCorrectSolution] = React.useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { highContrast } = useTheme();

  // Get piece-specific colors for individual piece controls
  const getPieceColors = (pieceId: number) => {
    const identificationColor = PieceColors.getIdentificationColor(pieceId, highContrast);
    const pieceColors = PieceColors.getColorsForPieceId(pieceId, highContrast);
    
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
    // Debug logging disabled to prevent console spam
    // Use browser dev tools for debugging if needed
    
    // Activate debug rendering without console spam
    window.debugPieceRendering = true;

    // Disable debug after 5 seconds
    setTimeout(() => {
      window.debugPieceRendering = false;
    }, 5000);
  };
  if (compact) {
    const challengeName = challenges[currentChallenge]?.name || 'Cargando...';

    return (
      <div className="bg-card rounded-2xl shadow-lg px-3 py-2.5 border border-card">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {/*
            La identidad conserva espacio para el nombre completo. La botonera
            puede repartirse en más de una fila cuando muestra sus etiquetas.
          */}
          <div className="flex flex-1 items-center gap-3 min-w-[22rem]">
            <span
              className="grid place-items-center w-11 h-11 shrink-0 rounded-2xl text-lg font-black tabular-nums shadow-sm"
              style={{ backgroundColor: 'var(--button-primary-bg)', color: 'var(--text-on-primary)' }}
              aria-hidden="true"
            >
              {currentChallenge + 1}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-bold leading-tight truncate" style={{ color: 'var(--text-primary)' }}>
                {challengeName}
              </h2>
              <p className="flex flex-wrap items-center gap-2 text-xs leading-tight" style={{ color: 'var(--text-secondary)' }}>
                <span className="whitespace-nowrap">Desafío {currentChallenge + 1} de {challenges.length}</span>
                <span
                  className="whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                >
                  {gameMode === 'multiplayer' ? 'Multijugador' : 'Modo offline'}
                </span>
                {mobileTimerText && (
                  <span
                    className="xl:hidden inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums"
                    style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                    aria-label={`Cronómetro: ${mobileTimerText}${mobileTimerPaused ? ', pausado' : ''}`}
                  >
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    {mobileTimerText}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Botonera: envuelve en varias filas antes que desbordar el panel */}
          <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2" role="toolbar" aria-label="Controles del desafío">
            {onUndo && (
              <ToolButton
                icon={Undo2}
                label="Deshacer"
                labelFrom="1700"
                variant="gray"
                onClick={onUndo}
                disabled={!canUndo}
                title={canUndo ? 'Deshacer última acción (Ctrl+Z)' : 'No hay nada que deshacer'}
                aria-label="Deshacer última acción"
              />
            )}
            {onRedo && (
              <ToolButton
                icon={Redo2}
                label="Rehacer"
                labelFrom="1700"
                variant="gray"
                onClick={onRedo}
                disabled={!canRedo}
                title={canRedo ? 'Rehacer última acción (Ctrl+Y)' : 'No hay nada que rehacer'}
                aria-label="Rehacer última acción"
              />
            )}
            {onPreviousChallenge && (
              <ToolButton
                icon={SkipBack}
                label="Anterior"
                labelFrom="1700"
                variant="gray"
                onClick={onPreviousChallenge}
                disabled={!canGoToPreviousChallenge}
                title={canGoToPreviousChallenge ? 'Desafío anterior' : 'Ya estás en el primer desafío'}
                aria-label="Ir al desafío anterior"
              />
            )}
            {onNextChallenge && (
              <ToolButton
                icon={SkipForward}
                label={isLastChallenge ? 'Fin de la campaña' : 'Siguiente'}
                labelFrom="1700"
                variant="primary"
                onClick={onNextChallenge}
                disabled={!canGoToNextChallenge}
                title={
                  isLastChallenge
                    ? 'Has llegado al último desafío de la campaña'
                    : canGoToNextChallenge
                      ? 'Siguiente desafío'
                      : 'Completa el desafío actual para desbloquear el siguiente'
                }
                aria-label={isLastChallenge ? 'Último desafío de la campaña' : 'Ir al siguiente desafío'}
              />
            )}
            {import.meta.env.DEV && <>
              {onLoadCustomChallenges && (
                <ToolButton
                  icon={Upload}
                  label="Cargar"
                  variant="secondary"
                  onClick={handleUploadClick}
                  disabled={isLoading}
                  title="Cargar retos personalizados"
                  aria-label="Cargar retos personalizados"
                />
              )}
              {onOpenChallengeEditor && (
                <ToolButton
                  icon={Edit}
                  label="Editor"
                  variant="secondary"
                  onClick={onOpenChallengeEditor}
                  title="Editor de retos"
                  aria-label="Abrir editor de retos"
                />
              )}
              {debugMode && (
                <ToolButton
                  icon={Camera}
                  label="Snapshot"
                  variant="info"
                  onClick={handleSnapshotPieces}
                  title="Snapshot de posiciones actuales"
                  aria-label="Capturar snapshot de posiciones actuales"
                />
              )}
              {onToggleDebugMode && (
                <ToolButton
                  icon={Bug}
                  label="Debug"
                  variant={debugMode ? 'danger' : 'gray'}
                  onClick={onToggleDebugMode}
                  aria-pressed={debugMode}
                  title={debugMode ? 'Desactivar modo debug' : 'Activar modo debug'}
                  aria-label={debugMode ? 'Desactivar modo debug' : 'Activar modo debug'}
                />
              )}
              {debugMode && onToggleGrid && (
                <ToolButton
                  icon={Grid3x3}
                  label="Grid"
                  variant={showGrid ? 'warning' : 'gray'}
                  onClick={onToggleGrid}
                  aria-pressed={showGrid}
                  title={showGrid ? 'Ocultar grid' : 'Mostrar grid'}
                  aria-label={showGrid ? 'Ocultar grid de posicionamiento' : 'Mostrar grid de posicionamiento'}
                />
              )}
            </>}
            <ToolButton
              icon={HelpCircle}
              label="Ayuda"
              variant="info"
              onClick={onToggleInstructions}
              title="Ayuda e instrucciones"
              aria-label="Mostrar ayuda e instrucciones"
            />

            <ThemeSwitcher className="px-3 py-2 text-sm" />

            {import.meta.env.DEV && (
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
              />
            )}
          </div>
        </div>

        {/* F08: modal de ayuda con Modal.tsx (gestiona Escape, foco y su devolución) */}
        <Modal
          isOpen={showInstructions}
          onClose={onToggleInstructions}
          title={`Cómo jugar a ${GAME_NAME}`}
          subtitle="Domina la simetría y resuelve los desafíos geométricos"
          maxWidth="4xl"
        >
          <div className="grid gap-4 text-sm sm:grid-cols-2" style={{ color: 'var(--text-secondary)' }}>
            <p><strong style={{ color: 'var(--text-primary)' }}>🎯 Objetivo:</strong> recrea el patrón del reto usando las piezas y el reflejo del espejo.</p>
            <p><strong style={{ color: 'var(--text-primary)' }}>🔄 Mover piezas:</strong> arrastra las piezas desde &quot;Piezas disponibles&quot; hasta el área de juego.</p>
            <p><strong style={{ color: 'var(--text-primary)' }}>🪞 El espejo:</strong> cada pieza colocada se refleja automáticamente al otro lado.</p>
            <p><strong style={{ color: 'var(--text-primary)' }}>⚙️ Controles:</strong> gira o voltea la cara de cada pieza con sus botones o con el teclado.</p>
            <p className="sm:col-span-2"><strong style={{ color: 'var(--text-primary)' }}>🚫 Restricciones:</strong> las piezas no pueden atravesar el espejo ni salir de su área.</p>
          </div>

          <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--border-light)' }}>
            <p className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>⌨️ Atajos de teclado en el área de juego</p>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm md:grid-cols-3" style={{ color: 'var(--text-secondary)' }}>
              <li><strong>Tab</strong> / <strong>Mayús+Tab</strong>: elegir pieza</li>
              <li><strong>Flechas</strong>: mover la pieza</li>
              <li><strong>Mayús+Flechas</strong>: mover 1px</li>
              <li><strong>R</strong> / <strong>Mayús+R</strong>: girar</li>
              <li><strong>F</strong>: voltear cara</li>
              <li><strong>Espacio</strong> / <strong>Enter</strong>: seleccionar o soltar</li>
              <li><strong>Escape</strong>: salir del área de juego</li>
            </ul>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <>
      {/* Header Controls */}
      <div className="bg-card rounded-lg shadow-lg p-6 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">🪞 {GAME_NAME}</h1>
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
              disabled={!canGoToPreviousChallenge}
              className={`bg-gray-gradient p-3 rounded-xl transition-all shadow-lg ${canGoToPreviousChallenge ? 'hover:bg-gray-gradient-hover transform hover:scale-105' : 'opacity-40 cursor-not-allowed'}`}
              title={canGoToPreviousChallenge ? "Desafío anterior" : "Ya estás en el primer desafío"}
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
            {import.meta.env.DEV && <>
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
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".json" 
                className="hidden" 
              />
            </>}
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
                      onFocus={(e) => {
                        e.currentTarget.style.backgroundColor = pieceButtonColors.rotateBack.hover;
                      }}
                      onBlur={(e) => {
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
                      onFocus={(e) => {
                        e.currentTarget.style.backgroundColor = pieceButtonColors.flip.hover;
                      }}
                      onBlur={(e) => {
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
                      onFocus={(e) => {
                        e.currentTarget.style.backgroundColor = pieceButtonColors.rotate.hover;
                      }}
                      onBlur={(e) => {
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
        <div
          className="fixed inset-0 bg-modal-overlay flex items-center justify-center z-50 p-4"
          onClick={onToggleInstructions}
          role="presentation"
        >
          <div
            className="bg-modal rounded-2xl shadow-2xl max-w-4xl max-h-[85vh] overflow-y-auto border border-modal"
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            {/* Header */}
            <div className="bg-modal-header  p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-2xl mb-2">🪞 Cómo jugar a {GAME_NAME}</h3>
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
