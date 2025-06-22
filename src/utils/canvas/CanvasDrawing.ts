import { CANVAS_CONSTANTS } from './CanvasConstants';
import { CanvasGradients } from './CanvasGradients';

/**
 * Utility functions for common canvas drawing operations
 */

export class CanvasDrawing {
  /**
   * Draws the standard background areas
   */
  static drawBackgroundAreas(ctx: CanvasRenderingContext2D): void {
    const { 
      GAME_AREA_WIDTH, 
      GAME_AREA_HEIGHT, 
      BOTTOM_AREA_HEIGHT, 
      MIRROR_LINE 
    } = CANVAS_CONSTANTS;

    // Game area
    ctx.fillStyle = CanvasGradients.createGameAreaGradient(ctx);
    ctx.fillRect(0, 0, GAME_AREA_WIDTH, GAME_AREA_HEIGHT);

    // Mirror area
    ctx.fillStyle = CanvasGradients.createMirrorAreaGradient(ctx);
    ctx.fillRect(MIRROR_LINE, 0, GAME_AREA_WIDTH, GAME_AREA_HEIGHT);

    // Mirror gloss effect
    ctx.fillStyle = CanvasGradients.createMirrorGlossGradient(ctx);
    ctx.fillRect(MIRROR_LINE, 0, GAME_AREA_WIDTH, GAME_AREA_HEIGHT);

    // Piece storage area
    ctx.fillStyle = CanvasGradients.createPieceAreaGradient(ctx);
    ctx.fillRect(0, GAME_AREA_HEIGHT, GAME_AREA_WIDTH, BOTTOM_AREA_HEIGHT);

    // Objective area
    ctx.fillStyle = CanvasGradients.createObjectiveAreaGradient(ctx);
    ctx.fillRect(MIRROR_LINE, GAME_AREA_HEIGHT, GAME_AREA_WIDTH, BOTTOM_AREA_HEIGHT);
  }

  /**
   * Draws the mirror line with standard styling
   */
  static drawMirrorLine(ctx: CanvasRenderingContext2D): void {
    const { 
      MIRROR_LINE, 
      GAME_AREA_HEIGHT,
      COLORS: { 
        MIRROR_LINE_COLOR, 
        MIRROR_LINE_WIDTH, 
        MIRROR_LINE_DASH 
      }
    } = CANVAS_CONSTANTS;

    ctx.save();
    ctx.strokeStyle = MIRROR_LINE_COLOR;
    ctx.lineWidth = MIRROR_LINE_WIDTH;
    ctx.setLineDash(MIRROR_LINE_DASH);
    ctx.lineDashOffset = 0;
    ctx.shadowColor = MIRROR_LINE_COLOR;
    ctx.shadowBlur = 8;
    
    ctx.beginPath();
    ctx.moveTo(MIRROR_LINE, 0);
    ctx.lineTo(MIRROR_LINE, GAME_AREA_HEIGHT);
    ctx.stroke();
    
    ctx.restore();
  }

  /**
   * Draws area borders with standard styling
   */
  static drawAreaBorders(ctx: CanvasRenderingContext2D): void {
    const { 
      GAME_AREA_WIDTH, 
      GAME_AREA_HEIGHT, 
      BOTTOM_AREA_HEIGHT, 
      MIRROR_LINE,
      CANVAS_WIDTH,
      COLORS: { BORDER_COLOR, BORDER_WIDTH }
    } = CANVAS_CONSTANTS;

    ctx.save();
    ctx.strokeStyle = BORDER_COLOR;
    ctx.lineWidth = BORDER_WIDTH;
    
    // Game area border
    ctx.strokeRect(0, 0, GAME_AREA_WIDTH, GAME_AREA_HEIGHT);
    // Mirror area border
    ctx.strokeRect(MIRROR_LINE, 0, GAME_AREA_WIDTH, GAME_AREA_HEIGHT);
    // Bottom area border
    ctx.strokeRect(0, GAME_AREA_HEIGHT, CANVAS_WIDTH, BOTTOM_AREA_HEIGHT);
    
    ctx.restore();
  }

  /**
   * Draws area labels for debug mode
   */
  static drawAreaLabels(ctx: CanvasRenderingContext2D): void {
    const { MIRROR_LINE, GAME_AREA_HEIGHT } = CANVAS_CONSTANTS;

    ctx.save();
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'left';

    ctx.fillText('🎯 ÁREA DE JUEGO', 20, 35);
    ctx.fillText('🪞 ÁREA DEL ESPEJO', MIRROR_LINE + 20, 35);
    ctx.fillText('🧩 PIEZAS DISPONIBLES', 20, GAME_AREA_HEIGHT + 35);
    
    ctx.restore();
  }

  /**
   * Calculates mirror reflection X coordinate
   */
  static calculateMirrorReflectionX(pieceX: number): number {
    return 2 * CANVAS_CONSTANTS.MIRROR_LINE - pieceX - CANVAS_CONSTANTS.PIECE_SIZE;
  }

  /**
   * Creates standard canvas frame styling
   */
  static getCanvasFrameStyle(): React.CSSProperties {
    const { COLORS: { FRAME_BORDER, FRAME_ACCENT } } = CANVAS_CONSTANTS;

    return {
      maxWidth: '100%',
      height: 'auto',
      border: `15px solid ${FRAME_BORDER}`,
      borderRadius: '8px',
      boxShadow: `
        inset 0 0 0 6px ${FRAME_ACCENT},
        inset 0 0 0 10px ${FRAME_BORDER},
        0 8px 25px rgba(0, 0, 0, 0.3),
        0 0 15px rgba(212, 175, 55, 0.2)
      `
    };
  }
}