import React, { useRef, useEffect } from 'react';
import { Challenge } from '../ChallengeCard';
import { drawPiece, Piece } from '../GamePiece';
import { useTheme } from '../../contexts/ThemeContext';
import { PieceColors } from '../../utils/piece/PieceColors';

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
  const { theme } = useTheme(); // Get current theme to force re-render on theme change

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

    // Use consistent theme detection - prioritize context over localStorage
    const isAccessibleTheme = theme === 'accessible';
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

    // Calculate scaling and centering
    const playerPieces = challenge.objective.playerPieces;
    if (playerPieces.length === 0) return;

    // Área FIJA para TODAS las miniaturas - mismo crop y escala
    const totalWidth = 1400;   // Juego (700) + Espejo (700)
    const standardHeight = 600; // Altura fija

    // Escala FIJA para todas con zoom del 50%
    const padding = 16;
    const baseScale = Math.min((width - padding * 2) / totalWidth, (height - padding * 2) / standardHeight);
    const scale = baseScale * 1.5; // Aplicar zoom del 50%

    // Centrado FIJO
    const scaledWidth = totalWidth * scale;
    const scaledHeight = standardHeight * scale;
    const offsetX = (width - scaledWidth) / 2;
    const offsetY = (height - scaledHeight) / 2;

    // Debug logging disabled to prevent console spam
    // Use browser dev tools for debugging if needed

    // Draw original pieces
    playerPieces.forEach((piecePos, index) => {
      const x = piecePos.x * scale + offsetX;
      const y = piecePos.y * scale + offsetY;
      const size = 100 * scale;

      // Use the same color system as other components
      const colors = PieceColors.getColorsForFace(piecePos.face);
      const centerColor = colors.centerColor;
      const triangleColor = colors.triangleColor;

      const displayPiece = {
        id: 999,
        type: piecePos.type,
        face: piecePos.face,
        centerColor,
        triangleColor,
        x: 0,
        y: 0,
        rotation: piecePos.rotation,
        placed: true
      };

      drawPiece(ctx, displayPiece, x, y, size);
    });


    // Draw reflected pieces

    playerPieces.forEach((piecePos, index) => {
      const mirrorLine = 700;
      const reflectedX = 2 * mirrorLine - piecePos.x - 100;
      const x = reflectedX * scale + offsetX;
      const y = piecePos.y * scale + offsetY;
      const size = 100 * scale;

      // Use the same color system as other components
      const colors = PieceColors.getColorsForFace(piecePos.face);
      const centerColor = colors.centerColor;
      const triangleColor = colors.triangleColor;

      const reflectedPiece = {
        id: 998,
        type: piecePos.type,
        face: piecePos.face,
        centerColor,
        triangleColor,
        x: 0,
        y: 0,
        rotation: piecePos.rotation,
        placed: true
      };

      // Draw reflected piece with horizontal flip
      ctx.save();
      ctx.translate(x + size/2, y + size/2);
      ctx.scale(-1, 1);
      ctx.translate(-size/2, -size/2);
      drawPiece(ctx, reflectedPiece, 0, 0, size);
      ctx.restore();
    });


  }, [challenge, width, height, backgroundColor, theme]); // Include theme to force re-render on theme change

  // Generate a description for screen readers
  const generateDescription = () => {
    const { title, difficulty, objective } = challenge;
    const pieceCount = objective.playerPieces.length;
    return `${title || 'Challenge'} - Difficulty: ${difficulty}. Contains ${pieceCount} pieces to arrange.`;
  };

  // Default alt text if none provided
  const accessibleAlt = alt || generateDescription();

  // Get theme-aware canvas background using consistent theme detection
  const isAccessibleTheme = theme === 'accessible';
  const canvasBackgroundColor = backgroundColor ? 'transparent' : (isAccessibleTheme ? '#1e293b' : '#f8fafc');

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
        className="rounded-lg shadow-sm"
        style={{ 
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
