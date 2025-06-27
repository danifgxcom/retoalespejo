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
    
    // Get colors from theme variables
    const styles = getComputedStyle(document.body);
    const canvasBg = styles.getPropertyValue('--canvas-bg-light').trim() || '#f8fafc';
    const cardBg = styles.getPropertyValue('--card-bg').trim() || '#ffffff';
    const bgSecondary = styles.getPropertyValue('--bg-secondary').trim() || '#e2e8f0';
    
    gradient.addColorStop(0, cardBg);
    gradient.addColorStop(0.6, canvasBg);
    gradient.addColorStop(1, bgSecondary);
    
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
    
    // Get colors from theme variables
    const styles = getComputedStyle(document.body);
    const canvasBg = styles.getPropertyValue('--canvas-bg-light').trim() || '#f8fafc';
    const cardBg = styles.getPropertyValue('--card-bg').trim() || '#ffffff';
    const bgSecondary = styles.getPropertyValue('--bg-secondary').trim() || '#e2e8f0';
    const bgTertiary = styles.getPropertyValue('--bg-tertiary').trim() || '#d6eaf8';
    
    gradient.addColorStop(0, bgTertiary);
    gradient.addColorStop(0.2, bgSecondary);
    gradient.addColorStop(0.5, cardBg);
    gradient.addColorStop(0.8, bgSecondary);
    gradient.addColorStop(1, bgTertiary);
    
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
    
    // Get colors from theme variables
    const styles = getComputedStyle(document.body);
    const bgSecondary = styles.getPropertyValue('--bg-secondary').trim() || '#f8fafc';
    const bgTertiary = styles.getPropertyValue('--bg-tertiary').trim() || '#e2e8f0';
    
    gradient.addColorStop(0, bgSecondary);
    gradient.addColorStop(1, bgTertiary);
    
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
    
    // Get colors from theme variables
    const styles = getComputedStyle(document.body);
    const cardBg = styles.getPropertyValue('--card-bg').trim() || '#ffffff';
    const canvasBg = styles.getPropertyValue('--canvas-bg-light').trim() || '#f8fafc';
    
    gradient.addColorStop(0, cardBg);
    gradient.addColorStop(1, canvasBg);
    
    return gradient;
  }
}