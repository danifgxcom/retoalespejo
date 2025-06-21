import { Piece, drawPiece } from '../components/GamePiece';
import { drawPieceLabel } from '../components/PieceLabel';

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
  drawBackgroundAreas(ctx: CanvasRenderingContext2D): void {
    this.drawGameArea(ctx);
    this.drawMirrorArea(ctx);
    this.drawPieceStorageArea(ctx);
    this.drawObjectiveArea(ctx);
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
   * Draws the piece storage area
   */
  private drawPieceStorageArea(ctx: CanvasRenderingContext2D): void {
    const { gameAreaWidth, gameAreaHeight, bottomAreaHeight } = this.config;
    
    const pieceAreaGradient = ctx.createLinearGradient(0, gameAreaHeight, 0, gameAreaHeight + bottomAreaHeight);
    pieceAreaGradient.addColorStop(0, '#fef7ed');
    pieceAreaGradient.addColorStop(1, '#f3e8ff');
    
    ctx.fillStyle = pieceAreaGradient;
    ctx.fillRect(0, gameAreaHeight, gameAreaWidth, bottomAreaHeight);
  }

  /**
   * Draws the objective area
   */
  private drawObjectiveArea(ctx: CanvasRenderingContext2D): void {
    const { gameAreaWidth, gameAreaHeight, bottomAreaHeight, mirrorLine } = this.config;
    
    const objectiveGradient = ctx.createLinearGradient(mirrorLine, gameAreaHeight, mirrorLine, gameAreaHeight + bottomAreaHeight);
    objectiveGradient.addColorStop(0, '#ffffff');
    objectiveGradient.addColorStop(1, '#f8fafc');
    
    ctx.fillStyle = objectiveGradient;
    ctx.fillRect(mirrorLine, gameAreaHeight, gameAreaWidth, bottomAreaHeight);
  }

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
   * Draws vertical division line in bottom area
   */
  private drawVerticalDivision(ctx: CanvasRenderingContext2D): void {
    const { gameAreaHeight, canvasHeight, mirrorLine } = this.config;
    
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mirrorLine, gameAreaHeight);
    ctx.lineTo(mirrorLine, canvasHeight);
    ctx.stroke();
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
    
    // Available pieces
    this.drawTextWithShadow(ctx, '🧩 PIEZAS DISPONIBLES', 15, gameAreaHeight + 30, '#1e293b');
    
    // Objective
    this.drawTextWithShadow(ctx, '🎯 OBJETIVO', mirrorLine + 15, gameAreaHeight + 30, '#1e293b');

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
  drawGamePieces(ctx: CanvasRenderingContext2D, pieces: Piece[], draggedPiece: Piece | null, debugMode: boolean = false, showLabels: boolean = false): void {
    if (!pieces || pieces.length === 0) return;

    pieces.forEach(piece => {
      if (!piece) return;

      // Debug information for pieces in piece storage area
      if (debugMode && !piece.placed) {
        this.drawPieceDebugInfo(ctx, piece);
      }
      
      // Draw the piece
      drawPiece(ctx, piece, piece.x, piece.y, this.config.pieceSize);
      
      // Visual border for dragged piece
      if (draggedPiece && piece.id === draggedPiece.id) {
        this.drawDraggedPieceBorder(ctx, piece);
      }

      // Draw piece label if requested or if piece is being dragged
      if (showLabels || (draggedPiece && piece.id === draggedPiece.id)) {
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
   * Draws border around dragged piece
   */
  private drawDraggedPieceBorder(ctx: CanvasRenderingContext2D, piece: Piece): void {
    const { pieceSize } = this.config;
    
    ctx.save();
    ctx.strokeStyle = '#00ff00'; // Bright green
    ctx.lineWidth = 4;
    ctx.shadowColor = '#00ff00';
    ctx.shadowBlur = 8;
    
    // Draw border around piece
    const borderSize = pieceSize * 1.7;
    const borderX = piece.x - (borderSize - pieceSize) / 2;
    const borderY = piece.y - (borderSize - pieceSize) / 2;
    ctx.strokeRect(borderX, borderY, borderSize, borderSize);
    
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
        ctx.scale(-1, 1);

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
}