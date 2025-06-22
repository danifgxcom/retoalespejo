import { CANVAS_CONSTANTS } from './CanvasConstants';

/**
 * Utility functions for creating consistent gradients across canvas components
 */

export class CanvasGradients {
  /**
   * Creates the standard game area gradient
   */
  static createGameAreaGradient(ctx: CanvasRenderingContext2D): CanvasGradient {
    const { GAME_AREA_WIDTH, GAME_AREA_HEIGHT } = CANVAS_CONSTANTS;
    
    const gradient = ctx.createRadialGradient(
      GAME_AREA_WIDTH / 2, GAME_AREA_HEIGHT / 2, 0,
      GAME_AREA_WIDTH / 2, GAME_AREA_HEIGHT / 2, GAME_AREA_WIDTH
    );
    
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.6, '#f8fafc');
    gradient.addColorStop(1, '#e2e8f0');
    
    return gradient;
  }

  /**
   * Creates the standard mirror area gradient
   */
  static createMirrorAreaGradient(ctx: CanvasRenderingContext2D): CanvasGradient {
    const { MIRROR_LINE, GAME_AREA_WIDTH } = CANVAS_CONSTANTS;
    
    const gradient = ctx.createLinearGradient(
      MIRROR_LINE, 0, 
      MIRROR_LINE + GAME_AREA_WIDTH, 0
    );
    
    gradient.addColorStop(0, '#e8f4f8');
    gradient.addColorStop(0.2, '#f1f8fc');
    gradient.addColorStop(0.5, '#ffffff');
    gradient.addColorStop(0.8, '#f1f8fc');
    gradient.addColorStop(1, '#d6eaf8');
    
    return gradient;
  }

  /**
   * Creates the mirror gloss effect gradient
   */
  static createMirrorGlossGradient(ctx: CanvasRenderingContext2D): CanvasGradient {
    const { MIRROR_LINE, GAME_AREA_WIDTH } = CANVAS_CONSTANTS;
    
    const gradient = ctx.createLinearGradient(
      MIRROR_LINE, 0, 
      MIRROR_LINE + GAME_AREA_WIDTH, 0
    );
    
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
    
    return gradient;
  }

  /**
   * Creates the piece storage area gradient
   */
  static createPieceAreaGradient(ctx: CanvasRenderingContext2D): CanvasGradient {
    const { GAME_AREA_HEIGHT, BOTTOM_AREA_HEIGHT } = CANVAS_CONSTANTS;
    
    const gradient = ctx.createLinearGradient(
      0, GAME_AREA_HEIGHT, 
      0, GAME_AREA_HEIGHT + BOTTOM_AREA_HEIGHT
    );
    
    gradient.addColorStop(0, '#fef7ed');
    gradient.addColorStop(1, '#f3e8ff');
    
    return gradient;
  }

  /**
   * Creates the objective area gradient
   */
  static createObjectiveAreaGradient(ctx: CanvasRenderingContext2D): CanvasGradient {
    const { MIRROR_LINE, GAME_AREA_HEIGHT, BOTTOM_AREA_HEIGHT } = CANVAS_CONSTANTS;
    
    const gradient = ctx.createLinearGradient(
      MIRROR_LINE, GAME_AREA_HEIGHT, 
      MIRROR_LINE, GAME_AREA_HEIGHT + BOTTOM_AREA_HEIGHT
    );
    
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#f8fafc');
    
    return gradient;
  }
}