import { Piece, drawPiece } from '../components/GamePiece';
import { drawPieceLabel } from '../components/PieceLabel';
import { PieceColors } from '../utils/piece/PieceColors';

export interface GameAreaRenderConfig {
  gameAreaWidth: number;
  gameAreaHeight: number;
  bottomAreaHeight: number;
  mirrorLine: number;
  canvasWidth: number;
  canvasHeight: number;
  pieceSize: number;
}

export class GameAreaRenderer {
  private config: GameAreaRenderConfig;

  constructor(config: GameAreaRenderConfig) {
    this.config = config;
  }

  /**
   * Draws all background areas with gradients and effects
   */
  drawBackgroundAreas(ctx: CanvasRenderingContext2D, showGrid: boolean = false): void {
    this.drawGameArea(ctx);
    this.drawMirrorArea(ctx);
    this.drawPieceStorageArea(ctx);
    // Removed drawObjectiveArea - storage now spans full width
    
    // Draw grid overlay if enabled
    if (showGrid) {
      this.drawGrid(ctx);
    }
  }

  /**
   * Draws the main game area with elegant gradient
   */
  private drawGameArea(ctx: CanvasRenderingContext2D): void {
    const { gameAreaWidth, gameAreaHeight } = this.config;

    const gameGradient = ctx.createRadialGradient(
      gameAreaWidth / 2, gameAreaHeight / 2, 0, 
      gameAreaWidth / 2, gameAreaHeight / 2, gameAreaWidth
    );
    gameGradient.addColorStop(0, '#ffffff');
    gameGradient.addColorStop(0.6, '#f8fafc');
    gameGradient.addColorStop(1, '#e2e8f0');

    ctx.fillStyle = gameGradient;
    ctx.fillRect(0, 0, gameAreaWidth, gameAreaHeight);
  }

  /**
   * Draws the mirror area with metallic effect
   */
  private drawMirrorArea(ctx: CanvasRenderingContext2D): void {
    const { gameAreaWidth, gameAreaHeight, mirrorLine } = this.config;

    // Metallic gradient
    const mirrorGradient = ctx.createLinearGradient(mirrorLine, 0, mirrorLine + gameAreaWidth, 0);
    mirrorGradient.addColorStop(0, '#e8f4f8');
    mirrorGradient.addColorStop(0.2, '#f1f8fc');
    mirrorGradient.addColorStop(0.5, '#ffffff');
    mirrorGradient.addColorStop(0.8, '#f1f8fc');
    mirrorGradient.addColorStop(1, '#d6eaf8');

    ctx.fillStyle = mirrorGradient;
    ctx.fillRect(mirrorLine, 0, gameAreaWidth, gameAreaHeight);

    // Gloss effect
    const gloss = ctx.createLinearGradient(mirrorLine, 0, mirrorLine + gameAreaWidth, 0);
    gloss.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    gloss.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
    gloss.addColorStop(1, 'rgba(255, 255, 255, 0.1)');

    ctx.fillStyle = gloss;
    ctx.fillRect(mirrorLine, 0, gameAreaWidth, gameAreaHeight);
  }

  /**
   * Draws the piece storage area - now spans full canvas width
   */
  private drawPieceStorageArea(ctx: CanvasRenderingContext2D): void {
    const { canvasWidth, gameAreaHeight, bottomAreaHeight } = this.config;

    const pieceAreaGradient = ctx.createLinearGradient(0, gameAreaHeight, 0, gameAreaHeight + bottomAreaHeight);
    pieceAreaGradient.addColorStop(0, '#fef7ed');
    pieceAreaGradient.addColorStop(1, '#f3e8ff');

    ctx.fillStyle = pieceAreaGradient;
    // Now covers full canvas width instead of just gameAreaWidth
    ctx.fillRect(0, gameAreaHeight, canvasWidth, bottomAreaHeight);
  }

  // Objective area removed - storage now spans full width

  /**
   * Draws mirror line and frame divisions
   */
  drawMirrorFrameAndDivisions(ctx: CanvasRenderingContext2D): void {
    const { gameAreaHeight, mirrorLine, canvasWidth } = this.config;

    this.drawMirrorLine(ctx);
    this.drawHorizontalDivision(ctx);
    this.drawVerticalDivision(ctx);
  }

  /**
   * Draws the main mirror line with brilliant effect
   */
  private drawMirrorLine(ctx: CanvasRenderingContext2D): void {
    const { gameAreaHeight, mirrorLine } = this.config;

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.setLineDash([15, 10]);
    ctx.lineDashOffset = 0;
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(mirrorLine, 0);
    ctx.lineTo(mirrorLine, gameAreaHeight);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
  }

  /**
   * Draws horizontal division line
   */
  private drawHorizontalDivision(ctx: CanvasRenderingContext2D): void {
    const { gameAreaHeight, canvasWidth } = this.config;

    ctx.strokeStyle = '#8b7355';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, gameAreaHeight);
    ctx.lineTo(canvasWidth, gameAreaHeight);
    ctx.stroke();

    // Subtle shadow under division
    const shadowGradient = ctx.createLinearGradient(0, gameAreaHeight, 0, gameAreaHeight + 15);
    shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
    shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = shadowGradient;
    ctx.fillRect(0, gameAreaHeight, canvasWidth, 15);
  }

  /**
   * Draws vertical division line in bottom area - removed since storage spans full width
   */
  private drawVerticalDivision(ctx: CanvasRenderingContext2D): void {
    // No longer drawing vertical division in storage area
    // Storage now spans the full width of both lower quadrants
  }

  /**
   * Draws area labels (only in debug mode)
   */
  drawAreaLabels(ctx: CanvasRenderingContext2D): void {
    const { gameAreaHeight, mirrorLine } = this.config;

    ctx.font = 'bold 18px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';

    // Game area
    this.drawTextWithShadow(ctx, '🎮 ÁREA DE JUEGO', 15, 30, '#1e293b');

    // Mirror
    this.drawTextWithShadow(ctx, '🪞 ESPEJO', mirrorLine + 15, 30, '#1e293b');

    // Storage area (spans full width)
    this.drawTextWithShadow(ctx, '🧩 ALMACÉN DE PIEZAS', 15, gameAreaHeight + 30, '#1e293b');

    // Descriptive subtitles
    ctx.font = '13px "Segoe UI", sans-serif';
    this.drawTextWithShadow(ctx, 'Arrastra aquí tus piezas', 15, 50, '#64748b');
    this.drawTextWithShadow(ctx, 'Reflejo automático', mirrorLine + 15, 50, '#64748b');
    this.drawTextWithShadow(ctx, 'Haz clic para rotar/voltear', 15, gameAreaHeight + 50, '#64748b');
    this.drawTextWithShadow(ctx, 'Patrón a conseguir', mirrorLine + 15, gameAreaHeight + 50, '#64748b');
  }

  /**
   * Helper to draw text with shadow effect
   */
  private drawTextWithShadow(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string): void {
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillText(text, x + 1, y + 1);

    // Main text
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }

  /**
   * Draws debug information for the game area
   */
  drawDebugInfo(ctx: CanvasRenderingContext2D): void {
    const { gameAreaWidth, gameAreaHeight, bottomAreaHeight } = this.config;

    // Debug boundaries for piece storage area
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.strokeRect(0, gameAreaHeight, gameAreaWidth, bottomAreaHeight);
    ctx.setLineDash([]);

    // Left quadrant boundaries (piece area)
    ctx.strokeStyle = 'green';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(0, gameAreaHeight, gameAreaWidth/2, bottomAreaHeight);
    ctx.setLineDash([]);

    // Right quadrant boundaries (objective area)
    ctx.strokeStyle = 'orange';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(gameAreaWidth/2, gameAreaHeight, gameAreaWidth/2, bottomAreaHeight);
    ctx.setLineDash([]);

    // Debug labels
    ctx.fillStyle = 'blue';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('ÁREA PIEZAS: (0,600) a (700,1000)', 10, gameAreaHeight + 70);

    ctx.fillStyle = 'green';
    ctx.fillText('CUADRANTE PIEZAS: (0,600) a (350,1000)', 10, gameAreaHeight + 90);

    ctx.fillStyle = 'orange';
    ctx.fillText('CUADRANTE OBJETIVO: (350,600) a (700,1000)', 10, gameAreaHeight + 110);
  }

  /**
   * Draws interactive game pieces
   */
  drawGamePieces(ctx: CanvasRenderingContext2D, pieces: Piece[], draggedPiece: Piece | null, debugMode: boolean = false, showLabels: boolean = false, interactingPieceId?: number | null, temporaryDraggedPieceId?: number | null, animatingPieceId?: number | null): void {
    if (!pieces || pieces.length === 0) return;

    // Removed all console.log statements for better performance during piece movement

    pieces.forEach(piece => {
      if (!piece) return;

      // Debug information for pieces in piece storage area
      if (debugMode && !piece.placed) {
        this.drawPieceDebugInfo(ctx, piece);
      }

      // Draw the piece
      drawPiece(ctx, piece, piece.x, piece.y, this.config.pieceSize);

      // Visual border for dragged piece (real drag or temporary from controls)
      const isDraggedPiece = (draggedPiece && piece.id === draggedPiece.id) ||
                            (temporaryDraggedPieceId !== null && piece.id === temporaryDraggedPieceId);

      // Visual effect for animating piece (solo si NO está siendo controlado manualmente)
      const isAnimatingPiece = animatingPieceId !== null && piece.id === animatingPieceId && !isDraggedPiece;

      // Removed debug logging for performance

      if (isDraggedPiece) {
        this.drawDraggedPieceBorder(ctx, piece);
      }

      if (isAnimatingPiece) {
        this.drawAnimatingPieceEffect(ctx, piece);
      }

      // Draw piece label si: debug mode O si se está arrastrando (real o temporal)
      const shouldShowLabel = showLabels || isDraggedPiece;

      if (shouldShowLabel) {
        drawPieceLabel(ctx, piece.id, piece.x, piece.y, this.config.pieceSize);
      }
    });

  }

  /**
   * Draws debug information for a piece
   */
  private drawPieceDebugInfo(ctx: CanvasRenderingContext2D, piece: Piece): void {
    const { pieceSize } = this.config;

    // Draw actual piece area (including extensions)
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    const realSize = pieceSize * 1.6;
    const realX = piece.x - (realSize - pieceSize) / 2;
    const realY = piece.y - (realSize - pieceSize) / 2;
    ctx.strokeRect(realX, realY, realSize, realSize);

    // Write coordinates and rotation
    ctx.fillStyle = 'red';
    ctx.font = '12px Arial';
    ctx.fillText(`(${Math.round(piece.x)}, ${Math.round(piece.y)})`, piece.x, piece.y - 5);
    ctx.fillText(`R:${piece.rotation}°`, piece.x, piece.y + realSize + 15);
  }

  /**
   * Draws effect around animating piece
   */
  private drawAnimatingPieceEffect(ctx: CanvasRenderingContext2D, piece: Piece): void {
    const { pieceSize } = this.config;

    ctx.save();
    ctx.strokeStyle = '#3b82f6'; // Blue color for animation
    ctx.lineWidth = 3;
    ctx.shadowColor = '#3b82f6';
    ctx.shadowBlur = 6;

    // Draw subtle border around piece
    const borderSize = pieceSize * 1.5;
    const borderX = piece.x - (borderSize - pieceSize) / 2;
    const borderY = piece.y - (borderSize - pieceSize) / 2;
    ctx.strokeRect(borderX, borderY, borderSize, borderSize);

    ctx.restore();
  }

  /**
   * Draws border around dragged piece using the piece's identification color
   */
  private drawDraggedPieceBorder(ctx: CanvasRenderingContext2D, piece: Piece): void {
    const { pieceSize } = this.config;

    ctx.save();
    
    // Use the piece's identification color for the border
    const identificationColor = PieceColors.getIdentificationColor(piece.id);
    
    // Draw the actual piece outline instead of a square
    this.drawPieceOutline(ctx, piece, identificationColor);

    ctx.restore();
  }

  /**
   * Draws the actual outline of a piece following its geometric shape
   */
  private drawPieceOutline(ctx: CanvasRenderingContext2D, piece: Piece, color: string): void {
    const { pieceSize } = this.config;
    const size = pieceSize;
    
    ctx.save();
    ctx.translate(piece.x + size/2, piece.y + size/2);
    ctx.rotate((piece.rotation * Math.PI) / 180);

    // If it's piece type B, apply horizontal mirror
    if (piece.type === 'B') {
      ctx.scale(-1, 1);
    }

    const unit = size * 1.28;
    const coord = (x: number, y: number): [number, number] => [x * unit, -y * unit];

    // Set outline style
    ctx.strokeStyle = color;
    ctx.lineWidth = 6; // Thick outline
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.fillStyle = 'transparent';

    // Draw the complete piece outline as one continuous path
    ctx.beginPath();
    
    // Start from bottom-left corner
    ctx.moveTo(...coord(0, 0));
    
    // Left triangle bottom edge
    ctx.lineTo(...coord(1, 0));
    
    // Square bottom edge
    ctx.lineTo(...coord(2, 0));
    
    // Right triangle to its point
    ctx.lineTo(...coord(2.5, 0.5));
    
    // Right triangle top edge
    ctx.lineTo(...coord(2, 1));
    
    // Top triangle right edge
    ctx.lineTo(...coord(1.5, 1.5));
    
    // Top triangle left edge
    ctx.lineTo(...coord(1, 1));
    
    // Left triangle left edge back to start
    ctx.lineTo(...coord(0, 0));
    
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Draws mirror reflections of pieces with realistic effect
   */
  drawMirrorReflections(ctx: CanvasRenderingContext2D, pieces: Piece[]): void {
    const { gameAreaHeight, mirrorLine, gameAreaWidth, pieceSize } = this.config;

    ctx.save();

    // Clip to mirror area
    ctx.beginPath();
    ctx.rect(mirrorLine, 0, gameAreaWidth, gameAreaHeight);
    ctx.clip();

    if (!pieces || pieces.length === 0) {
      ctx.restore();
      return;
    }

    pieces.forEach(piece => {
      if (!piece) return;

      // Only reflect pieces in game area or entering from below
      const entryMargin = 60;
      const pieceBottomWithMargin = piece.y + pieceSize + entryMargin;
      const isEnteringFromBelow = pieceBottomWithMargin > gameAreaHeight;
      const isInsideGameArea = piece.y < gameAreaHeight;

      if (isEnteringFromBelow || isInsideGameArea) {
        ctx.save();

        // Reflection transformation
        const reflectedX = 2 * mirrorLine - piece.x - pieceSize;
        ctx.translate(reflectedX + pieceSize, piece.y);
        
        // Only apply horizontal flip for type A pieces
        // Type B pieces already have internal flip, so double flip would be incorrect
        if (piece.type === 'A') {
          ctx.scale(-1, 1);
        }

        // Create piece with slight transparency for mirror effect
        const mirrorPiece = { 
          ...piece, 
          centerColor: piece.centerColor + 'E6', // 90% opacity
          triangleColor: piece.triangleColor + 'E6'
        };

        drawPiece(ctx, mirrorPiece, 0, 0, pieceSize);
        ctx.restore();
      }
    });


    // Add mirror distortion effect
    const distortionGradient = ctx.createLinearGradient(mirrorLine, 0, mirrorLine + gameAreaWidth, 0);
    distortionGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    distortionGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.05)');
    distortionGradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.05)');
    distortionGradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');

    ctx.fillStyle = distortionGradient;
    ctx.fillRect(mirrorLine, 0, gameAreaWidth, gameAreaHeight);

    ctx.restore();
  }

  /**
   * Draws a grid overlay to show snap positions
   */
  private drawGrid(ctx: CanvasRenderingContext2D): void {
    const { gameAreaWidth, gameAreaHeight } = this.config;
    const gridSize = 10; // Updated to match GRID_SIZE in useMouseHandlers
    
    ctx.save();
    
    // Draw main grid lines (every 10px)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 1;
    
    // Draw vertical lines
    for (let x = 0; x <= gameAreaWidth; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, gameAreaHeight);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= gameAreaHeight; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(gameAreaWidth, y);
      ctx.stroke();
    }
    
    // Draw fine grid lines for rotated pieces (every 5px, more subtle)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 0.5;
    
    const fineGridSize = gridSize / 2;
    
    // Draw fine vertical lines
    for (let x = fineGridSize; x <= gameAreaWidth; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, gameAreaHeight);
      ctx.stroke();
    }
    
    // Draw fine horizontal lines
    for (let y = fineGridSize; y <= gameAreaHeight; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(gameAreaWidth, y);
      ctx.stroke();
    }
    
    ctx.restore();
  }
}
