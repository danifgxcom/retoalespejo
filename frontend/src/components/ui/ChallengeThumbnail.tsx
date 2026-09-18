import React, { useRef, useEffect, useMemo } from 'react';
import { Challenge } from '../ChallengeCard';
import { getPiecePartsInWorld, drawColorRegions } from '../GamePiece';
import { useTheme } from '../../contexts/ThemeContext';
import { PieceColors } from '../../utils/piece/PieceColors';
import { GameGeometry, PiecePosition } from '@reto/geometry';

interface ChallengeThumbnailProps {
  challenge: Challenge;
  width?: number;
  height?: number;
  backgroundColor?: string;
  /**
   * Alternative text for screen readers
   */
  alt?: string;
  /**
   * Whether the thumbnail is interactive (clickable)
   */
  interactive?: boolean;
  /**
   * Function to call when the thumbnail is clicked or activated via keyboard
   */
  onClick?: () => void;
  /**
   * Additional ARIA attributes for accessibility
   */
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
}

const ChallengeThumbnail: React.FC<ChallengeThumbnailProps> = ({
  challenge,
  width = 300,
  height = 230,
  backgroundColor,
  alt,
  interactive = false,
  onClick,
  ariaLabel,
  ariaLabelledby,
  ariaDescribedby
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isInteractive = interactive || !!onClick;
  // F21: única fuente de verdad del tema - por contexto, no localStorage.
  const { resolvedClarity, highContrast } = useTheme();
  const isDarkClarity = resolvedClarity === 'dark';
  const thumbnailGeometry = useMemo(() => new GameGeometry({
    width: 700,
    height: 600,
    mirrorLineX: 700,
    pieceSize: 100
  }), []);

  // Handle keyboard events for interactive thumbnails
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (isInteractive && onClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Debug logging disabled to prevent console spam

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw gradient background based on difficulty
    if (backgroundColor) {
      const gradient = ctx.createLinearGradient(0, 0, width, height);

      // Map difficulty to darker blue gradient colors
      const difficultyColors = {
        'Principiante': ['#1E40AF', '#1E3A8A'], // blue-700 to blue-800 
        'Fácil': ['#1E3A8A', '#1E293B'],        // blue-800 to slate-800
        'Intermedio': ['#1E293B', '#0F172A'],   // slate-800 to slate-900
        'Difícil': ['#0F172A', '#020617'],      // slate-900 to slate-950
        'Avanzado': ['#0F172A', '#020617']      // slate-900 to slate-950
      };

      const colors = difficultyColors[challenge.difficulty as keyof typeof difficultyColors] || ['#60A5FA', '#3B82F6'];
      gradient.addColorStop(0, colors[0]);
      gradient.addColorStop(1, colors[1]);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    } else {
      // For thumbnails without custom background, let the canvas CSS handle the background
      // We'll set it via the canvas style instead of drawing over everything
    }

    // Calculate scaling and centering from the real geometry, including reflections.
    const playerPieces = challenge.objective.playerPieces as PiecePosition[];
    if (playerPieces.length === 0) return;

    const padding = 16;
    const mirrorLine = 700;
    const allVertices = playerPieces.flatMap(piece => {
      const vertices = thumbnailGeometry.getPieceVertices(piece);
      const reflectedVertices = vertices.map(([x, y]) => [2 * mirrorLine - x, y] as [number, number]);
      return [...vertices, ...reflectedVertices];
    });

    const minX = Math.min(...allVertices.map(([x]) => x));
    const maxX = Math.max(...allVertices.map(([x]) => x));
    const minY = Math.min(...allVertices.map(([, y]) => y));
    const maxY = Math.max(...allVertices.map(([, y]) => y));
    const contentWidth = Math.max(1, maxX - minX);
    const contentHeight = Math.max(1, maxY - minY);
    const scale = Math.min((width - padding * 2) / contentWidth, (height - padding * 2) / contentHeight);
    const offsetX = (width - contentWidth * scale) / 2 - minX * scale;
    const offsetY = (height - contentHeight * scale) / 2 - minY * scale;

    // Debug logging disabled to prevent console spam
    // Use browser dev tools for debugging if needed

    // Sin marca del eje del espejo: la tarjeta es la figura acabada y dibujar
    // ahí una línea es justo señalar la unión que no debe notarse (las tarjetas
    // originales tampoco la llevan).
    const mirrorX = mirrorLine * scale + offsetX;

    /**
     * La figura se dibuja como UNA silueta con el contorno por regiones de
     * color, igual que las tarjetas originales del juego: la pieza y su reflejo
     * se funden en el espejo y la tarjeta no chiva dónde acaba cada pieza.
     */
    const colors = (face: 'front' | 'back') => PieceColors.getColorsForFace(face, highContrast);
    const toScreen = ([x, y]: [number, number], flip: boolean): [number, number] => {
      const sx = x * scale + offsetX;
      return [flip ? 2 * mirrorX - sx : sx, y * scale + offsetY];
    };

    const byColor = new Map<string, Array<Array<[number, number]>>>();
    playerPieces.forEach(piecePos => {
      const { centerColor, triangleColor } = colors(piecePos.face);
      getPiecePartsInWorld(piecePos, 100).forEach(part => {
        const color = part.kind === 'center' ? centerColor : triangleColor;
        [false, true].forEach(flip => {
          const group = byColor.get(color) ?? [];
          group.push(part.points.map(point => toScreen(point, flip)));
          byColor.set(color, group);
        });
      });
    });

    drawColorRegions(
      ctx,
      [...byColor].map(([color, polygons]) => ({ color, polygons })),
      isDarkClarity ? '#0f172a' : '#1f2937',
      Math.max(0.75, 100 * scale * 0.012)
    );

  }, [challenge, width, height, backgroundColor, resolvedClarity, isDarkClarity, highContrast, thumbnailGeometry]); // Re-render when theme changes

  // Generate a description for screen readers
  const generateDescription = () => {
    const { name, difficulty, objective } = challenge;
    const pieceCount = objective.playerPieces.length;
    return `${name || 'Challenge'} - Difficulty: ${difficulty}. Contains ${pieceCount} pieces to arrange.`;
  };

  // Default alt text if none provided
  const accessibleAlt = alt || generateDescription();

  // Get theme-aware canvas background using consistent theme detection
  const canvasBackgroundColor = backgroundColor ? 'transparent' : (isDarkClarity ? '#1e293b' : '#f8fafc');

  return (
    <div 
      className={`relative inline-block ${isInteractive ? 'cursor-pointer focus-within:outline-none focus-within:ring-2 focus-within:ring-focus focus-within:ring-offset-2 focus-visible:ring-4' : ''}`}
      onClick={isInteractive ? onClick : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      role={isInteractive ? 'button' : 'img'}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={ariaLabel || accessibleAlt}
      aria-labelledby={ariaLabelledby}
      aria-describedby={ariaDescribedby}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded-lg shadow-sm w-full h-auto"
        style={{ 
          // El mapa de bits mantiene su tamaño; la caja se encoge con el panel
          // (imprescindible con zoom, donde el panel es más estrecho).
          maxWidth: `${width}px`,
          imageRendering: 'crisp-edges', 
          border: '1px solid var(--border-light)',
          backgroundColor: canvasBackgroundColor 
        }}
        aria-hidden="true" // Hide canvas from screen readers as we provide alternative text
      />
      {/* Hidden description for screen readers */}
      <span className="sr-only">{accessibleAlt}</span>
    </div>
  );
};

export default ChallengeThumbnail;
